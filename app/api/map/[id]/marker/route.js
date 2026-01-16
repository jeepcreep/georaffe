import { getMapById } from '@utils/dbTools';

export const POST = async (req, { params }) => {
    const { lat, lng, title, description, link } = await req.json();

    try {
        const map = await getMapById(params.id);
        if (!map) return new Response("Map not found!", { status : 404 });

        map.markers.push({ lat, lng, title, description, link });
        await map.save();

        const newMarker = map.markers[map.markers.length - 1];

        return new Response(JSON.stringify(newMarker), { status: 201 });
    } catch (error) {
        console.log(error);
        return new Response("Failed to add marker.", { status: 500 });
    }
}

export const DELETE = async (req, { params }) => {
    const { markerId } = await req.json();

    try {
        const map = await getMapById(params.id);
        if (!map) return new Response("Map not found!", { status : 404 });

        const marker = map.markers.id(markerId);
        if (marker) {
            marker.deleteOne();
            await map.save();
             // Return the updated list of markers
             return new Response(JSON.stringify(map.markers), { status: 200 });
        } else {
             return new Response("Marker not found.", { status: 404 });
        }
    } catch (error) {
        console.log(error);
        return new Response("Failed to delete marker.", { status: 500 });
    }
}
