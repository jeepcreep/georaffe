import { Schema, model, models } from 'mongoose';
import { MapStatus } from '@utils/enums';

const ControlPointSchema = new Schema({
    index: {
        type: Number,
        required: [true, 'index is required.']
    },
    fromPoint: {
        type: [Number],
        required: [true, 'fromPoint (virtual lat and long) is required.']
    },
    toPoint: {
        type: [Number],
        required: [true, 'toPoint (long and lat within OSM) is required.']
    },
    rasterImageCoords: {
        type: [Number],
        required: [true, 'rasterImageCoords (x, y coords of raster image) is required.']
    }
}, { timestamps: true, })

ControlPointSchema.pre('save', (next) => {
    console.log('pre save for control point : ' + this)
    next();
})

// export const ControlPoint = models.ControlPoint || model('ControlPoint', ControlPointSchema)

const MapSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: [true, 'title is required.']
    },
    status: {
        type: String,
        default: MapStatus.New
    },
    fileId: {
        type: String
    },
    width: {
        type: Number
    },
    height: {
        type: Number
    },
    maxZoomLevel: {
        type: Number,
        default: 5
    },
    controlPoints: [ControlPointSchema],
}, { timestamps: true, })

const Map = models.Map || model("Map", MapSchema);

export default Map;