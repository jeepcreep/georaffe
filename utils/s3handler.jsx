import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import connectToDatabase  from '@utils/database';

import Map from "@models/map";

import { MapStatus } from '@utils/enums';

import { poll } from 'poll';
import { promises as fs } from 'fs';
const path = require('path');


const tiledMapsToUpload = {};
let polling = false;
let uploading = false;

const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESSKEYID,
      secretAccessKey: process.env.AWS_S3_SECRETACCESSKEY,
    },
});

export const uploadToS3Bucket = async (file, s3Filename, bucket, contentType = 'image/png') => {
    const params = {
      Bucket: bucket, // required
      Key: s3Filename, // required
      Body: file,
      ContentType: contentType
    };

    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command)
}

export const deleteFromS3Bucket = async (s3Filename, bucket) => {
    let s3Key = s3Filename;
    if (s3Filename.startsWith('http')) {
        s3Key = s3Filename.substring(s3Filename.lastIndexOf('/') + 1);
    }
    if (s3Filename.endsWith('.jpeg') || s3Filename.endsWith('.jpg') || s3Filename.endsWith('.png')) {
        s3Key = s3Key.substring(0, s3Key.lastIndexOf('.'));
    }
    const params = {
      Bucket: bucket, // required
      Key: s3Key
    };

    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command)
}

export const getFullImageUrl = (filename) => {
    let fullUrl = `https://${process.env.AWS_S3_TILES_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${filename}/tiles`;
    return fullUrl;
}

const pollDB  = async () => {
  console.log('polling DB for new tiled images that need to uploaded');
  try {
    await connectToDatabase();

    const tiledMaps = await Map.find({ status : MapStatus.TilingDone }).exec();

    if (tiledMaps && tiledMaps.length > 0) {
      for (let i = 0; i < tiledMaps.length; i++) {
        const map = tiledMaps[i];
        const mapId = map._id.toString();
        if (!tiledMapsToUpload.hasOwnProperty(mapId)) {
          // add map to list of maps to upload
          console.log('adding new map to upload list', mapId);
          tiledMapsToUpload[mapId] = map.fileId;
        }
      }
    }
  } catch (error) {
      throw new Error('Error while fetching map', error.message);
  }
}

async function* walk(dir) {
  for await (const d of await fs.opendir(dir)) {
      const entry = path.join(dir, d.name);
      if (d.isDirectory()) yield* walk(entry);
      else if (d.isFile()) yield entry;
  }
}


const uploadTiledMapsToS3 = async () => {
  console.log('iterating over maps flagged for upload.')
  if (Object.keys(tiledMapsToUpload).length > 0 && !uploading) {
    for (const [key, value] of Object.entries(tiledMapsToUpload)) {
      uploading = true;
      console.log(`${key}: ${value}`);

      await fetch(process.env.HOST_BASE_URL + '/api/map/' + key, {
        method: 'PATCH',
        body: JSON.stringify({
            status: MapStatus.Uploading
        })
      })

      const tilesDir = value.substring(0, value.lastIndexOf('.'));
      for await (const p of walk('public/uploads/' + tilesDir + '/tiles')) {
        console.log(p)
        const fullPath = path.join(process.cwd(), p);
        const data = await fs.readFile(fullPath)

        var base64data = new Buffer(data, 'binary');

        const s3Filename = p.replace('public/uploads/', '');
        await uploadToS3Bucket(base64data, s3Filename, process.env.AWS_S3_TILES_BUCKET);
      }

      await fetch(process.env.HOST_BASE_URL + '/api/map/' + key, {
        method: 'PATCH',
        body: JSON.stringify({
            status: MapStatus.Ready
        })
      })

      // important: delete afterwards
      delete tiledMapsToUpload[key];
    }
    uploading = false;
  }
}

export const startPolling = () => {
  if (!polling) {
    console.log('start polling...');
    poll(pollDB, 5000);
    poll(uploadTiledMapsToS3, 4000);
    polling = true;
  }
};

export default getFullImageUrl;