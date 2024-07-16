import { deleteFromS3Bucket } from '@utils/s3handler';

import { getMapById, deleteMapById } from '@utils/dbTools';

export const GET = async (req, { params }) => {
    try {
        const map = await getMapById(params.id);

        if (!map) return new Response("Map not found!", { status : 404 });

        return new Response(JSON.stringify(map, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve map.", { status: 500 });
    }
}

export const PATCH = async (req, { params }) => {
    const { status, fileId, width, height, title, scope, year, location } = await req.json();

    try {
        const existingMap = await getMapById(params.id);

        if (!existingMap) return new Response("Map not found!", { status : 404 });

        if (status) {
            existingMap.status = status;
        }
        if (fileId) {
            existingMap.fileId = fileId;
        }
        if (width) {
            existingMap.width = width;
        }
        if (height) {
            existingMap.height = height;
        }
        if (title) {
            existingMap.title = title;
        }
        if (scope) {
            existingMap.scope = scope;
        }
        if (year) {
            existingMap.yearDepicted = year;
        }
        if (location) {
            existingMap.locationDepicted = location;
        }

        await existingMap.save();

        return new Response(JSON.stringify(existingMap, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to update map.", { status: 500 });
    }
}

export const DELETE = async (req, { params }) => {
    try {
        const map = await getMapById(params.id);
        const fileId = map.fileId;

        await deleteFromS3Bucket(fileId, process.env.AWS_S3_TILES_BUCKET);

        await deleteMapById(params.id);

        return new Response("Map deleted successfully", { status : 200 });
    } catch (error) {
        console.log(error);
        return new Response("Failed to delete map.", { status: 500 });
    }
}