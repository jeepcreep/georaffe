import connectToDatabase  from '@utils/database';

import getFullImageUrl, { uploadToS3Bucket } from '@utils/s3handler';

const { db } = await connectToDatabase();


export const POST = async (req) => {
    try { 
        const formData = await req.formData();
        //console.log('data : ' + formData);

        const file = formData.get('file');
        //console.log('file : ' + file);
        if (!file) {
            return new Response({ error: "No files received."}, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename =  file.name.replaceAll(" ", "_");

        const s3Filename = `${filename}-${Date.now()}`
        await uploadToS3Bucket(buffer, s3Filename);

        console.log(`successfully stored ${s3Filename} in the S3 bucket.`);
        
        // const completePath = path.join(process.cwd(), "public/assets/" + filename);
        // await writeFile(completePath, buffer);

        // var fileId = new mongoose.Types.ObjectId();

        // var reader = fs.createReadStream(completePath);

        // console.log('completePath : ' + completePath);

        console.log('success');

        const s3ImageUrl = getFullImageUrl(s3Filename);

        const jsonResult = {
            s3ImageUrl
        }
        return Response.json(jsonResult, 
                                { statusText: 'image successfully uploaded.',
                                status: 201
                                });

      } catch (error) {
        console.error(error);
        return new Response({ error: 'Upload failed' }, { status: 500 });
      }
  }