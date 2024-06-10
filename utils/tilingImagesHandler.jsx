const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('node:path'); 

import {imageDimensionsFromData} from 'image-dimensions';
const { Readable } = require('stream');

import { MapStatus } from '@utils/enums';

export const saveImageLocally = async (file, mapId)  => {

    const data = Buffer.from(await file.arrayBuffer())

    //const stream = Readable.from(data);
    const imageDimensions = await imageDimensionsFromData(data);
    console.log('imageDimensions', imageDimensions);

    //creating temp local file path
    let filename =  file.name.replaceAll(" ", "_");
    const extension = filename.substring(filename.lastIndexOf('.') + 1);
    filename = filename.substring(0, filename.lastIndexOf('.'));
    const tempFilename = `${filename}-${Date.now()}.${extension}`
    const uploadFilePath = path.join(process.cwd(), "public/uploads/" + tempFilename);
    console.log('uploadFilePath : ' + uploadFilePath);

    await fetch(process.env.HOST_BASE_URL_DEV + '/api/map/' + mapId, {
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

    await fetch(process.env.HOST_BASE_URL_DEV + '/api/map/' + mapId, {
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
            await fetch(process.env.HOST_BASE_URL_DEV + '/api/map/' + mapId, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: MapStatus.TilingDone
                })
              })
        }
        else {
            await fetch(process.env.HOST_BASE_URL_DEV + '/api/map/' + mapId, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: MapStatus.ErrorWhileTiling
                })
              })
        }
    });

    return {'message': 'tiling has started.'}
}