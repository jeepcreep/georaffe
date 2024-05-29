import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESSKEYID,
      secretAccessKey: process.env.AWS_S3_SECRETACCESSKEY,
    },
});

export const uploadToS3Bucket = async (file, s3Filename) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET, // required
      Key: s3Filename, // required
      Body: file,
      ContentType: "image/jpg"
    };

    const command = new PutObjectCommand(params);
    const data = await s3Client.send(command)
}

export const deleteFromS3Bucket = async (s3Filename) => {
    let s3Key = s3Filename;
    if (s3Filename.startsWith('http')) {
        s3Key = s3Filename.substring(s3Filename.lastIndexOf('/') + 1);
    }
    const params = {
      Bucket: process.env.AWS_S3_BUCKET, // required
      Key: s3Key
    };

    const command = new DeleteObjectCommand(params);
    const data = await s3Client.send(command)
}

export const getFullImageUrl = (filename) => {
    let fullUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${filename}`;
    return fullUrl;
}

export default getFullImageUrl;