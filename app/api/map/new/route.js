import connectToDatabase  from '@utils/database';

import Map from "@models/map";

export const POST = async (req) => {
    const { userId, title, s3ImageUrl } = await req.json();

    console.log('user id : ' + userId);
    console.log('title : ' + title);
    console.log('s3ImageUrl : ' + s3ImageUrl);

    await connectToDatabase();

    try {
        const newMap = new Map({
            creator: userId,
            title,
            fileUrl: s3ImageUrl
        })

        await newMap.save();

        return new Response(JSON.stringify(newMap), { status: 201 })
    } catch (error) {
        console.log(error);
        return new Response("Failed to create a new map", { status: 500 })
    }
}