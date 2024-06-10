import { Schema, model, models } from 'mongoose';
import { MapStatus } from '@utils/enums';

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
    }
}, { timestamps: true, })

const Map = models.Map || model("Map", MapSchema);

export default Map;