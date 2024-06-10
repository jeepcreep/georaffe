import connectToDatabase  from '@utils/database';

import { startPolling } from '@utils/s3handler';

export const POST = async (req) => {

    try {
        startPolling();

        return new Response({'success': 'polling started.'}, { status: 200 })
    } catch (error) {
        console.log(error);
        return new Response("Failed to create a new map", { status: 500 })
    }
}