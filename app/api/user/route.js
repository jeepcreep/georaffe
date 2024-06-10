import connectToDatabase  from '@utils/database';

import User from "@models/user";

export const GET = async (req, { params }) => {
    try {
        await connectToDatabase();

        const user = await User.findById(params.id);

        if (!user) return new Response("User not found!", { status : 404 });

        return new Response(JSON.stringify(user, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve user.", { status: 500 });
    }
}

// export const PATCH = async (req, { params }) => {
//     const { status, fileId, width, height } = await req.json();

//     try {
//         await connectToDatabase();

//         const existingMap = await Map.findById(params.id).populate('user');

//         if (!existingMap) return new Response("Map not found!", { status : 404 });

//         if (status) {
//             existingMap.status = status;
//         }
//         if (fileId) {
//             existingMap.fileId = fileId;
//         }
//         if (width) {
//             existingMap.width = width;
//         }
//         if (height) {
//             existingMap.height = height;
//         }

//         await existingMap.save();

//         return new Response(JSON.stringify(existingMap, { status : 200 }));
//     } catch (error) {
//         console.log(error);
//         return new Response("Failed to update map.", { status: 500 });
//     }
// }

// export const DELETE = async (req, { params }) => {
//     try {
//         await connectToDatabase();

//         const map = await Map.findById(params.id)
//         const s3Filename = map.fileUrl;

//         await deleteFromS3Bucket(s3Filename);

//         await Map.findByIdAndDelete(params.id);

//         return new Response("Map deleted successfully", { status : 200 });
//     } catch (error) {
//         console.log(error);
//         return new Response("Failed to delete map.", { status: 500 });
//     }
// }