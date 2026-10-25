const fs = require('fs').promises;
const path = require('node:path'); 

const sharp = require("sharp");

import {imageDimensionsFromData} from 'image-dimensions';

import { MapStatus, GeoStatus } from '@utils/enums';

import { uploadToS3Bucket } from './s3handler';
import { buildTilePyramid } from './tiler';
import { warpToTiles } from './geowarp';

export const saveSizeReducedCopy = async (pathToImage) => {
    try {
        const pathForCopiedImage = pathToImage.replace('.jpg', '_reduced.jpg').replace('.jpeg', '_reduced.jpeg').replace('.png', '_reduced.png');
        const stats = await fs.stat(pathToImage);
        const sizeInBytes = stats.size;

        // reduce only when size is more than 8mb
        if (sizeInBytes / 1000000 > 8) {
            console.log('file size exceeds 8mb, reducing...');
            const scaleByHalf = await sharp(pathToImage)
            .metadata()
            .then(({ width }) => sharp(pathToImage)
                .resize(Math.round(width * 0.5))
                .toFile(pathForCopiedImage)
                .then(() => {
                    console.log(`file reduced to ${Math.round(width * 0.5)}px`);
                    return pathForCopiedImage;
                })
            );
        } 
        else {
            // anyways we need a local copy
            await fs.copyFile(pathToImage, pathForCopiedImage);
        }
        return pathForCopiedImage;
    } catch (error) {
        console.log(error)
        throw error;
    }
}

export const uploadReducedImage = async (localFilePath) => {
    const data = await fs.readFile(localFilePath)

    var base64data = new Buffer(data, 'binary');

    let contentType = 'image/png';
    if (localFilePath.includes('jpg') || localFilePath.includes('jpeg')) {
        contentType = 'image/jpg';
    }

    const s3Filename = localFilePath.substring(localFilePath.lastIndexOf('/') + 1);
    const s3ParentFolder = s3Filename.substring(0, s3Filename.lastIndexOf('_'));
    const s3CompletePath = `${s3ParentFolder}/${s3Filename}`;

    console.log('uploading (reduced) image copy to S3 for georef overlay later as : ' + s3CompletePath);

    await uploadToS3Bucket(base64data, s3CompletePath, process.env.AWS_S3_TILES_BUCKET, contentType);
}

export const saveImageLocally = async (file, mapId)  => {

    const data = Buffer.from(await file.arrayBuffer())

    //const stream = Readable.from(data);
    const imageDimensions = imageDimensionsFromData(data);
    console.log('imageDimensions', imageDimensions);

    const uploadFilePathRoot = path.join(process.cwd(), "public/uploads/");
    // Check if the directory exists

    try {
        await fs.stat(uploadFilePathRoot);
    } catch (error) {
        console.log(error);
        await fs.mkdir(uploadFilePathRoot);
        console.log(`Directory '${uploadFilePathRoot}' created.`);
    }

    //creating temp local file path
    let filename =  file.name.replaceAll(" ", "_");
    const extension = filename.substring(filename.lastIndexOf('.') + 1);
    filename = filename.substring(0, filename.lastIndexOf('.'));
    const tempFilename = `${filename}-${Date.now()}.${extension}`
    const uploadFilePath = uploadFilePathRoot + tempFilename;
    console.log('uploadFilePath : ' + uploadFilePath);
    console.log('tempFilename : ' + tempFilename);
    console.log('URL : ' + process.env.HOST_BASE_URL_LOCAL + '/api/map/' + mapId);

    const input = JSON.stringify({
        fileId: tempFilename,
        width: imageDimensions.width,
        height: imageDimensions.height
    });

    console.log('input : ', JSON.parse(input));

    const response = await fetch(process.env.HOST_BASE_URL_LOCAL + '/api/map/' + mapId, {
        method: 'PATCH',
        body: input
      })

    console.log('response : ' + response);

    try {
        await fs.writeFile(uploadFilePath, data);
        console.log("image saved successfully");
        return uploadFilePath;
    } catch (error) {
        console.log(error)
    }

    return null;
}

// Builds the tile pyramid locally and uploads it to R2, then flips the map to Ready.
// Replaces the old python3 gdal2tiles.py spawn + the 4s/5s poll loop in s3handler.jsx:
// tiling and upload happen sequentially right here, so the map goes Ready as soon as
// it is actually done instead of waiting for the next poll tick.
export const createTilesFromImage = async (filename, mapId, maxZoomLevel) => {

    const setStatus = async (status) => {
        await fetch(process.env.HOST_BASE_URL_LOCAL + '/api/map/' + mapId, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        })
    }

    await setStatus(MapStatus.Tiling)

    const fileBase = filename.substring(0, filename.lastIndexOf('.'));
    const tilesDir = fileBase + '/tiles';

    try {
        console.log(`[Tiling] Building tile pyramid for ${filename}, maxZoom ${maxZoomLevel}`);

        const tileCount = await buildTilePyramid(filename, tilesDir, maxZoomLevel);
        console.log(`[Tiling] Wrote ${tileCount} tiles to ${tilesDir}`);

        await setStatus(MapStatus.TilingDone);

        // upload everything under public/uploads/<fileBase>/tiles to R2
        await uploadTilesToS3(tilesDir);

        await setStatus(MapStatus.Ready);
        console.log(`[Tiling] Map ${mapId} ready.`);
    } catch (error) {
        console.error(`[Tiling] Failed for ${mapId}:`, error);
        await setStatus(MapStatus.ErrorWhileTiling);
    }

    return { 'message': 'tiling done.' }
}

const uploadTilesToS3 = async (tilesDir) => {
    const walk = async (dir) => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            } else if (entry.isFile()) {
                const data = await fs.readFile(full);
                // key relative to public/uploads/, e.g. <fileBase>/tiles/5/3/7.png
                const s3Key = full.substring(full.indexOf('uploads/') + 'uploads/'.length);
                await uploadToS3Bucket(data, s3Key, process.env.AWS_S3_TILES_BUCKET);
            }
        }
    }
    await walk(tilesDir);
}

/**
 * Warps the map image with its control points into geo-referenced XYZ tiles and
 * uploads them to <fileBase>/geotiles/. This is what makes the embed cheap to load:
 * the browser then fetches only the visible tiles instead of the full image.
 *
 * Kept separate from the raster tiling above: the editor needs the *unwarped* image
 * (raster tiles, image coords) to place control points, the embed needs the *warped*
 * one (geotiles, Web Mercator coords). Hence two output folders.
 *
 * Requires at least 3 control points.
 */
export const createGeoTilesFromMap = async (map) => {
    const mapId = map._id.toString();

    const setGeoStatus = async (geoStatus) => {
        await fetch(process.env.HOST_BASE_URL_LOCAL + '/api/map/' + mapId, {
            method: 'PATCH',
            body: JSON.stringify({ geoStatus })
        })
    }

    const gcps = (map.controlPoints || [])
        .filter(cp => cp.toPoint?.length >= 2 && cp.rasterImageCoords?.length >= 2)
        .map(cp => ({
            source: [cp.rasterImageCoords[0], cp.rasterImageCoords[1]],
            destination: [cp.toPoint[1], cp.toPoint[0]]   // [lng, lat], as in the client
        }))

    if (gcps.length < 3) {
        console.log(`[GeoTiles] Map ${mapId} has only ${gcps.length} control points, skipping.`);
        return { message: 'not enough control points.' };
    }

    await setGeoStatus(GeoStatus.Processing)

    const sourceImagePath = path.join(process.cwd(), 'public/uploads/', map.fileId);
    const geoDir = sourceImagePath.substring(0, sourceImagePath.lastIndexOf('.')) + '/geotiles';

    try {
        const maxZoom = await geoMaxZoom(gcps, map.width);
        console.log(`[GeoTiles] Warping map ${mapId} at maxZoom ${maxZoom}`);

        const { tiles } = await warpToTiles(sourceImagePath, gcps, map.transformationType, geoDir, maxZoom);
        console.log(`[GeoTiles] Wrote ${tiles} geo tiles for ${mapId}`);

        await uploadTilesToS3(geoDir);
        await setGeoStatus(GeoStatus.Ready);
        console.log(`[GeoTiles] Map ${mapId} ready.`);
    } catch (error) {
        console.error(`[GeoTiles] Failed for ${mapId}:`, error);
        await setGeoStatus(GeoStatus.Error);
    }

    return { message: 'georeferencing done.' };
}

// Picks the zoom level where one tile pixel is about one source pixel, so the map
// is not upscaled into mush and not oversampled either. Clamped to Web Mercator.
const geoMaxZoom = async (gcps, imageWidth) => {
    const lngs = gcps.map(g => g.destination[0]);
    const spanLng = Math.max(...lngs) - Math.min(...lngs);
    if (!(spanLng > 0) || !imageWidth) return 6;

    const z = Math.log2((imageWidth * 360) / (spanLng * 256));
    return Math.max(0, Math.min(22, Math.round(z)));
}