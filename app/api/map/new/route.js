import connectToDatabase  from '@utils/database';
import mongoose from 'mongoose';

import Map from "@models/map";

export const POST = async (req) => {
    const { userId, title, maxZoomLevel, scope } = await req.json();

    console.log('user id : ' + userId);
    console.log('title : ' + title);
    console.log('maxZoomLevel : ' + maxZoomLevel);
    console.log('scope : ' + scope);

    await connectToDatabase();

    try {
        const newMap = new Map({
            user: userId, 
            title,
            maxZoomLevel,
            scope
        })

        await newMap.save();

        return new Response(JSON.stringify(newMap), { status: 201 })
    } catch (error) {
        console.log(error);
        return new Response("Failed to create a new map", { status: 500 })
    }
}