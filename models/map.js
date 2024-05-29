import { Schema, model, models } from 'mongoose';

const MapSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: [true, 'title is required.']
    },
    fileUrl: {
        type: String,
        required: [true, 'image url is required.']
    }
})

const Map = models.Map || model("Map", MapSchema);

export default Map;