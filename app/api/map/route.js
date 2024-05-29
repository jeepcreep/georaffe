import connectToDatabase  from '@utils/database';
import Map from "@models/map";

export const GET = async (req) => {
    try {
        await connectToDatabase();

        const maps = await Map.find({}).populate('user');

        return new Response(JSON.stringify(maps, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve maps.", { status: 500 });
    }
}