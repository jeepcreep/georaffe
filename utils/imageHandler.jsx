const fs = require('fs').promises;
const path = require('node:path'); 

const sharp = require("sharp");

import {imageDimensionsFromData} from 'image-dimensions';

import { MapStatus } from '@utils/enums';

import { uploadToS3Bucket } from './s3handler';
import { buildTilePyramid } from './tiler';

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