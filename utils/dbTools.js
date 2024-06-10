import connectToDatabase  from '@utils/database';

import Map from "@models/map";
import User from "@models/user";

export const getMapById = async (mapId) => {
    await connectToDatabase();
    const map = await Map.findById(mapId).populate('user');

    if (map && map != null) {
        return map;
    }
    return null;
}

export const deleteMapById = async (mapId) => {
    await connectToDatabase();
    await Map.findByIdAndDelete(mapId);
}