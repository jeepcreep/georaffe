const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('node:path'); 

const sharp = require("sharp");

import {imageDimensionsFromData} from 'image-dimensions';
const { Readable } = require('stream');

import { MapStatus } from '@utils/enums';

import { uploadToS3Bucket } from './s3handler';

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

    //creating temp local file path
    let filename =  file.name.replaceAll(" ", "_");
    const extension = filename.substring(filename.lastIndexOf('.') + 1);
    filename = filename.substring(0, filename.lastIndexOf('.'));
    const tempFilename = `${filename}-${Date.now()}.${extension}`
    const uploadFilePath = path.join(process.cwd(), "public/uploads/" + tempFilename);
    console.log('uploadFilePath : ' + uploadFilePath);
    console.log('tempFilename : ' + tempFilename);
    console.log('mapId : ' + mapId);

    await fetch(process.env.HOST_BASE_URL + '/api/map/' + mapId, {
        method: 'PATCH',
        body: JSON.stringify({
            fileId: tempFilename,
            width: imageDimensions.width,
            height: imageDimensions.height
        })
      })

    try {
        await fs.writeFile(uploadFilePath, data);
        console.log("image saved successfully");
        return uploadFilePath;
    } catch (error) {
        console.log(error)
    }

    return null;
}

// we need to call 
// python3 gdal2tiles.py -p raster -l -z 0-5 <filename>
export const createTilesFromImage = async (filename, mapId, maxZoomLevel) => {

    await fetch(process.env.HOST_BASE_URL + '/api/map/' + mapId, {
        method: 'PATCH',
        body: JSON.stringify({
            status: MapStatus.Tiling
        })
      })

    console.log('calling python3 gdal2tiles.py with file : ' + filename);

    const tilesDir = filename.substring(0, filename.lastIndexOf('.')) + '/tiles';

    const pythonProcess = spawn('python3', [
        'utils/gdal2tiles.py',
        '-p',
        'raster',
        '-l',
        '-z',
        '0-' + maxZoomLevel,
        filename,
        tilesDir
    ]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
      
    pythonProcess.stderr.on('data', async (data) => {
        console.error(`stderr: ${data}`);
    });
      
    pythonProcess.on('close', async (code) => {
        console.log(`child process exited with code ${code}`);
        if (code == 0) {
            await fetch(process.env.HOST_BASE_URL + '/api/map/' + mapId, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: MapStatus.TilingDone
                })
              })
        }
        else {
            await fetch(process.env.HOST_BASE_URL + '/api/map/' + mapId, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: MapStatus.ErrorWhileTiling
                })
              })
        }
    });

    return {'message': 'tiling has started.'}
}