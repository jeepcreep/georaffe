import connectToDatabase  from '@utils/database';
import { saveImageLocally, createTilesFromImage, saveSizeReducedCopy, uploadReducedImage } from '@utils/imageHandler'

import { getMapById } from '@utils/dbTools';

const { db } = await connectToDatabase();
const fs = require('node:fs');
const path = require('node:path'); 


export const POST = async (req, { params }) => {
    try { 
        const formData = await req.formData();
        //console.log('data : ' + formData);

        const file = formData.get('file');
        //console.log('file : ' + file);
        if (!file) {
            return new Response({ error: "No files received."}, { status: 400 });
        }

        console.log('max zoom level : ' + req.nextUrl.searchParams['maxZoomLevel']);

        const mapId = params.id;
        const map = await getMapById(mapId);
        // first save it locally
        let localFilePath = await saveImageLocally(file, mapId);
        let statusText = 'image saved locally ';

        const pathForReducedImage = await saveSizeReducedCopy(localFilePath);
        await uploadReducedImage(pathForReducedImage);

        if (localFilePath) {
            // then trigger the tiling process (calls an external tool)
            const result = await createTilesFromImage(localFilePath, mapId, map.maxZoomLevel);
            if (result.message) {
                console.log(result.message);

                statusText += 'and tiling started...';
                return Response.json({}, 
                    { statusText,
                    status: 200
                    });
            }
        }

        // const buffer = Buffer.from(await file.arrayBuffer());

        
        // await uploadToS3Bucket(buffer, s3Filename);

        //console.log(`successfully stored ${s3Filename} in the S3 bucket.`);
        
        // const completePath = path.join(process.cwd(), "public/assets/" + filename);
        // await writeFile(completePath, buffer);

        // var fileId = new mongoose.Types.ObjectId();

        // var reader = fs.createReadStream(completePath);

        // console.log('completePath : ' + completePath);

        // console.log('success');

        // const s3ImageUrl = getFullImageUrl(s3Filename);

        // const jsonResult = {
        //     s3ImageUrl
        // }
        // return Response.json(jsonResult, 
        //                         { statusText: 'image successfully uploaded.',
        //                         status: 201
        //                         });

      } catch (error) {
        console.error(error);
        return new Response({ error: 'Upload failed' }, { status: 500 });
      }
  }