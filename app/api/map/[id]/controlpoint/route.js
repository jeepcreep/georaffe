import { deleteFromS3Bucket } from '@utils/s3handler';

import { getMapById, deleteMapById } from '@utils/dbTools';
import { ControlPointSelection } from '@utils/enums';


export const POST = async (req, { params }) => {
    const { controlPoint, controlPointsCount } = await req.json();

    try {
        const existingMap = await getMapById(params.id);

        if (!existingMap) return new Response("Map not found!", { status : 404 });

        console.log('trying to create control point : ' + controlPoint);
        console.log('existing count : ' + controlPointsCount);
        const newControlPointObj = {
            index: controlPointsCount + 1,
            fromPoint: [ controlPoint.fromPoint.lat, controlPoint.fromPoint.lng ],
            toPoint: [ controlPoint.toPoint.lat, controlPoint.toPoint.lng ],
            rasterImageCoords: [ controlPoint.rasterImageCoords.x, controlPoint.rasterImageCoords.y ]
        };
        existingMap.controlPoints.push(newControlPointObj);
        const newControlPoint = existingMap.controlPoints[existingMap.controlPoints.length - 1];
        await existingMap.save();

        console.log('creation of new control point successful!, id : ' + newControlPoint._id);

        return new Response(JSON.stringify(newControlPoint, { status : 201 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to create control point.", { status: 500 });
    }
}

export const GET = async (req, { params }) => {
    try {
        const map = await getMapById(params.id);

        if (!map) return new Response("Map not found!", { status : 404 });

        return new Response(JSON.stringify(map, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve map.", { status: 500 });
    }
}

export const PATCH = async (req, { params }) => {
    const { status, fileId, width, height } = await req.json();

    try {
        const existingMap = await getMapById(params.id);

        if (!existingMap) return new Response("Map not found!", { status : 404 });

        if (status) {
            existingMap.status = status;
        }
        if (fileId) {
            existingMap.fileId = fileId;
        }
        if (width) {
            existingMap.width = width;
        }
        if (height) {
            existingMap.height = height;
        }

        await existingMap.save();

        return new Response(JSON.stringify(existingMap, { status : 200 }));
    } catch (error) {
        console.log(error);
        return new Response("Failed to update map.", { status: 500 });
    }
}

export const DELETE = async (req, { params }) => {
    const { controlPointId } = await req.json();

    try {
        const map = await getMapById(params.id);
        const controlPoint = map.controlPoints.id(controlPointId);

        if (controlPoint != null) {
            controlPoint.deleteOne();
        }
        else {
            return new Response("control point not found.", { status : 400 });
        }

        await map.save();

        return new Response(JSON.stringify(map), { status : 200 });
    } catch (error) {
        console.log(error);
        return new Response("Failed to delete control point.", { status: 500 });
    }
}