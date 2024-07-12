import connectToDatabase  from '@utils/database';
import Map from "@models/map";
// import { URLSearchParams } from 'next/dist/compiled/@edge-runtime/primitives/url';

import { MapStatus } from '@utils/enums';

export const dynamic = 'force-dynamic';

export const GET = async (req) => {
    try {
        // const url = new URL(req.url);
        // const searchParams = new URLSearchParams(url.searchParams);
        // console.log('searchParams', searchParams);

        const searchParams = req.nextUrl.searchParams;

        await connectToDatabase();

        if (searchParams.get('selectedMap') !== null) {
            const selectedMapSearchParam = searchParams.get('selectedMap');

            console.log('selected map query : ' + selectedMapSearchParam);

            let newest = selectedMapSearchParam === 'newest';
            const selectedMap = await Map.aggregate()
                                    .sort({ createdAt : newest ? 1 : -1 })
                                    .limit(1)
                                    .exec();

            console.log('selected map result : ' + JSON.stringify(selectedMap));

            return new Response(JSON.stringify(selectedMap, { status : 200 }));
        }
        else {
            let maps = await Map.find({}).populate('user');
            if (maps == null || maps == undefined) {
                maps = [];
            }
            return new Response(JSON.stringify(maps, { status : 200 }));
        }
        
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve maps.", { status: 500 });
    }
}