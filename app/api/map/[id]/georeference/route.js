import { createGeoTilesFromMap } from '@utils/imageHandler';
import { getMapById } from '@utils/dbTools';

// Warps the map into geo-referenced tiles using its control points and uploads them.
// Triggered from the editor once the control points are set (fire and forget: the
// response returns immediately, progress is tracked via the map's status field).
export const POST = async (req, { params }) => {
    try {
        const map = await getMapById(params.id);
        if (!map) return new Response("Map not found!", { status: 404 });

        // run in the background, respond right away
        createGeoTilesFromMap(map).catch((error) => {
            console.error('[GeoTiles] background job failed', error);
        });

        return Response.json({ status: 'georeferencing started' }, { status: 202 });
    } catch (error) {
        console.log(error);
        return new Response("Failed to start georeferencing.", { status: 500 });
    }
}
