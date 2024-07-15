import connectToDatabase  from '@utils/database';
import Map from "@models/map";
// import { URLSearchParams } from 'next/dist/compiled/@edge-runtime/primitives/url';

import { authOptions } from '/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth/next'

export const dynamic = 'force-dynamic';


export const GET = async (req) => {
    try {
        const session = await getServerSession(authOptions);
        console.log('session', session);

        if (session === null) {
            return new Response(JSON.stringify([], { status : 401 }));
        }

        // const url = new URL(req.url);
        // const searchParams = new URLSearchParams(url.searchParams);
        // console.log('searchParams', searchParams);

        const searchParams = req.nextUrl.searchParams;

        await connectToDatabase();

        if (searchParams.get('selectedMap') !== null) {
            const selectedMapSearchParam = searchParams.get('selectedMap');

            console.log('selected map query : ' + selectedMapSearchParam);

            let newest = selectedMapSearchParam === 'newest';
            // const selectedMap = await Map.aggregate()
            //                         .match({ user: session?.user.id})
            //                         .sort({ createdAt : newest ? -1 : 1 })
            //                         .limit(1)
            //                         .exec();
            const selectedMap = await Map.find({user: session?.user.id})
                                    .sort({'createdAt': -1})
                                    .limit(1);                  

            console.log('selected map result : ' + JSON.stringify(selectedMap));

            return new Response(JSON.stringify(selectedMap, { status : 200 }));
        }
        else {
            let maps = await Map.find({user: session?.user.id})
                        .sort({'createdAt': -1}) 
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