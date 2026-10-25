import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    endpoint: process.env.AWS_S3_ENDPOINT,
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
    let fullUrl = `${process.env.NEXT_PUBLIC_TILES_HOST_URL}/${filename}/tiles`;
    return fullUrl;
}

export default getFullImageUrl;