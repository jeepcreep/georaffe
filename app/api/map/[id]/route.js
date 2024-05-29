import connectToDatabase  from '@utils/database';

import { deleteFromS3Bucket } from '@utils/s3handler';

import Map from "@models/map";

export const GET = async (req, { params }) => {
    try {
        await connectToDatabase();

        const map = await Map.findById(params.id).populate('user');

        if (!map) return new Response("Map not found!", { status : 404 });

        return new Response(JSON.stringify(map, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve map.", { status: 500 });
    }
}

// export const PATCH = async (req, { params }) => {
//     const { prompt, tag } = await req.json();

//     try {
//         await connectToDatabase();

//         const existingMap = await Map.findById(params.id).populate('user');

//         if (!prompt) return new Response("Prompt not found!", { status : 404 });

//         existingMap.prompt = prompt;
//         existingMap.tag = tag;

//         await existingMap.save();

//         return new Response(JSON.stringify(existingMap, { status : 200 }));
//     } catch (error) {
//         console.log(error);
//         return new Response("Failed to update prompt.", { status: 500 });
//     }
// }

export const DELETE = async (req, { params }) => {
    try {
        await connectToDatabase();

        const map = await Map.findById(params.id)
        const s3Filename = map.fileUrl;

        await deleteFromS3Bucket(s3Filename);

        await Map.findByIdAndDelete(params.id);

        return new Response("Map deleted successfully", { status : 200 });
    } catch (error) {
        console.log(error);
        return new Response("Failed to delete map.", { status: 500 });
    }
}