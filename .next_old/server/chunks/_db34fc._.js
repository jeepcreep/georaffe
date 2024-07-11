module.exports = {

"[project]/utils/database.js [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

// import mongoose from 'mongoose';
// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) {
//   throw new Error(
//     'Please define the MONGODB_URI environment variable inside .env.local'
//   );
// }
// let cached = global.mongoose;
// if (!cached) {
//   cached = global.mongoose = { conn: null, promise: null };
// }
// const connectToDatabase = async () => {
//   if (cached.conn) {
//     return cached.conn;
//   }
//   if (!cached.promise) {
//     const opts = {
//       dbName: 'georef'
//     };
//     cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
//       return mongoose;
//     });
//   }
//   cached.conn = await cached.promise;
//   return cached.conn;
// }
// export default connectToDatabase;
__turbopack_esm__({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__commonjs__external__mongoose__ = __turbopack_external_require__("mongoose", true);
"__TURBOPACK__ecmascript__hoisting__location__";
;
//let connection = null;
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    };
}
const connectToDatabase = async ()=>{
    __TURBOPACK__commonjs__external__mongoose__["default"].set('strictQuery', true);
    //mongoose.set('timestamps', true);
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false
        };
        cached.promise = __TURBOPACK__commonjs__external__mongoose__["default"].connect(process.env.MONGODB_URI, {
            dbName: 'georef'
        }).then((mongoose)=>{
            return mongoose;
        });
    }
    cached.conn = await cached.promise;
    return cached.conn;
// try {
//     connection = await mongoose.createConnection(process.env.MONGODB_URI, {
//         dbName: 'georef'
//     }).asPromise();
//     if (connection.readyState == 1) {
//       console.log('db connection established!');
//       return connection;
//     }
//     return null;
// } catch (error) {
//     console.log(error);
// }
};
const __TURBOPACK__default__export__ = connectToDatabase;

})()),
"[project]/utils/enums.jsx [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "ControlPointSelection": ()=>ControlPointSelection,
    "CurrentControlPointStatus": ()=>CurrentControlPointStatus,
    "MapStatus": ()=>MapStatus,
    "TransformationType": ()=>TransformationType,
    "TransformationTypeLabels": ()=>TransformationTypeLabels,
    "TransformationTypes": ()=>TransformationTypes,
    "TransformationTypesMinGCP": ()=>TransformationTypesMinGCP
});
const MapStatus = {
    New: 'new',
    Tiling: 'tiling',
    TilingDone: 'tilingDone',
    ErrorWhileTiling: 'errorWhileTiling',
    SyncingWithStorage: 'syncingWithStorage',
    Synced: 'synced',
    Uploading: 'uploading',
    Ready: 'ready'
};
const CurrentControlPointStatus = {
    FromPointSelected: 'fromPointSelected',
    ToPointSelected: 'toPointSelected',
    FreeForSelection: 'freeForSelection',
    ReadyForSaving: 'readyForSaving',
    EditExisting: 'editExisting'
};
const ControlPointSelection = {
    From: 'from',
    To: 'to',
    Both: 'both'
};
const TransformationType = {
    Polynomial: 'polynomial',
    Polynomial2: 'polynomial2',
    Polynomial3: 'polynomial3',
    ThinPlateSpline: 'thinPlateSpline',
    Projective: 'projective'
};
const TransformationTypes = [
    TransformationType.Polynomial,
    TransformationType.Polynomial2,
    TransformationType.Polynomial3,
    TransformationType.ThinPlateSpline,
    TransformationType.Projective
];
const TransformationTypeLabels = {
    'polynomial': '1st order Polynomial',
    'polynomial2': '2nd order Polynomial',
    'polynomial3': '3rd order Polynomial',
    'thinPlateSpline': 'Thin plate spline',
    'projective': 'Projective'
};
const TransformationTypesMinGCP = {
    'polynomial': 3,
    'polynomial2': 6,
    'polynomial3': 10,
    'thinPlateSpline': 3,
    'projective': 4
};

})()),
"[project]/models/map.js [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>__TURBOPACK__default__export__
});
var __TURBOPACK__commonjs__external__mongoose__ = __turbopack_external_require__("mongoose", true);
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/enums.jsx [app-route] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
const ControlPointSchema = new __TURBOPACK__commonjs__external__mongoose__["Schema"]({
    fromPoint: {
        type: [
            Number
        ],
        required: [
            true,
            'fromPoint (virtual lat and long) is required.'
        ]
    },
    toPoint: {
        type: [
            Number
        ],
        required: [
            true,
            'toPoint (long and lat within OSM) is required.'
        ]
    },
    rasterImageCoords: {
        type: [
            Number
        ],
        required: [
            true,
            'rasterImageCoords (x, y coords of raster image) is required.'
        ]
    }
}, {
    timestamps: true
});
ControlPointSchema.pre('save', (next)=>{
    console.log('pre save for control point : ' + this);
    next();
});
// export const ControlPoint = models.ControlPoint || model('ControlPoint', ControlPointSchema)
const MapSchema = new __TURBOPACK__commonjs__external__mongoose__["Schema"]({
    user: {
        type: __TURBOPACK__commonjs__external__mongoose__["Schema"].Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: [
            true,
            'title is required.'
        ]
    },
    status: {
        type: String,
        default: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapStatus"].New
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
    controlPoints: [
        ControlPointSchema
    ]
}, {
    timestamps: true
});
const Map = __TURBOPACK__commonjs__external__mongoose__["models"].Map || (0, __TURBOPACK__commonjs__external__mongoose__["model"])("Map", MapSchema);
const __TURBOPACK__default__export__ = Map;

})()),
"[project]/utils/s3handler.jsx [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>__TURBOPACK__default__export__,
    "deleteFromS3Bucket": ()=>deleteFromS3Bucket,
    "getFullImageUrl": ()=>getFullImageUrl,
    "startPolling": ()=>startPolling,
    "uploadToS3Bucket": ()=>uploadToS3Bucket
});
var __TURBOPACK__commonjs__external__$40$aws$2d$sdk$2f$client$2d$s3__ = __turbopack_external_require__("@aws-sdk/client-s3", true);
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/database.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$map$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/models/map.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/enums.jsx [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$poll$2f$dist$2f$poll$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/poll/dist/poll.js [app-route] (ecmascript)");
var __TURBOPACK__commonjs__external__fs__ = __turbopack_external_require__("fs", true);
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
;
;
;
const path = require("path");
const tiledMapsToUpload = {};
let polling = false;
let uploading = false;
const s3Client = new __TURBOPACK__commonjs__external__$40$aws$2d$sdk$2f$client$2d$s3__["S3Client"]({
    region: process.env.AWS_S3_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESSKEYID,
        secretAccessKey: process.env.AWS_S3_SECRETACCESSKEY
    }
});
const uploadToS3Bucket = async (file, s3Filename, bucket, contentType = 'image/png')=>{
    const params = {
        Bucket: bucket,
        Key: s3Filename,
        Body: file,
        ContentType: contentType
    };
    const command = new __TURBOPACK__commonjs__external__$40$aws$2d$sdk$2f$client$2d$s3__["PutObjectCommand"](params);
    const data = await s3Client.send(command);
};
const deleteFromS3Bucket = async (s3Filename, bucket)=>{
    let s3Key = s3Filename;
    if (s3Filename.startsWith('http')) {
        s3Key = s3Filename.substring(s3Filename.lastIndexOf('/') + 1);
    }
    if (s3Filename.endsWith('.jpeg') || s3Filename.endsWith('.jpg') || s3Filename.endsWith('.png')) {
        s3Key = s3Key.substring(0, s3Key.lastIndexOf('.'));
    }
    const params = {
        Bucket: bucket,
        Key: s3Key
    };
    const command = new __TURBOPACK__commonjs__external__$40$aws$2d$sdk$2f$client$2d$s3__["DeleteObjectCommand"](params);
    const data = await s3Client.send(command);
};
const getFullImageUrl = (filename)=>{
    let fullUrl = `https://${process.env.AWS_S3_TILES_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${filename}/tiles`;
    return fullUrl;
};
const pollDB = async ()=>{
    console.log('polling DB for new tiled images that need to uploaded');
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        const tiledMaps = await __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$map$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({
            status: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapStatus"].TilingDone
        }).exec();
        if (tiledMaps && tiledMaps.length > 0) {
            for(let i = 0; i < tiledMaps.length; i++){
                const map = tiledMaps[i];
                const mapId = map._id.toString();
                if (!tiledMapsToUpload.hasOwnProperty(mapId)) {
                    // add map to list of maps to upload
                    console.log('adding new map to upload list', mapId);
                    tiledMapsToUpload[mapId] = map.fileId;
                }
            }
        }
    } catch (error) {
        throw new Error('Error while fetching map', error.message);
    }
};
async function* walk(dir) {
    for await (const d of (await __TURBOPACK__commonjs__external__fs__["promises"].opendir(dir))){
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry);
        else if (d.isFile()) yield entry;
    }
}
const uploadTiledMapsToS3 = async ()=>{
    console.log('iterating over maps flagged for upload.');
    if (Object.keys(tiledMapsToUpload).length > 0 && !uploading) {
        for (const [key, value] of Object.entries(tiledMapsToUpload)){
            uploading = true;
            console.log(`${key}: ${value}`);
            await fetch(process.env.HOST_BASE_URL + '/api/map/' + key, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapStatus"].Uploading
                })
            });
            const tilesDir = value.substring(0, value.lastIndexOf('.'));
            for await (const p of walk('public/uploads/' + tilesDir + '/tiles')){
                console.log(p);
                const fullPath = path.join(process.cwd(), p);
                const data = await __TURBOPACK__commonjs__external__fs__["promises"].readFile(fullPath);
                var base64data = new Buffer(data, 'binary');
                const s3Filename = p.replace('public/uploads/', '');
                await uploadToS3Bucket(base64data, s3Filename, process.env.AWS_S3_TILES_BUCKET);
            }
            await fetch(process.env.HOST_BASE_URL + '/api/map/' + key, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MapStatus"].Ready
                })
            });
            // important: delete afterwards
            delete tiledMapsToUpload[key];
        }
        uploading = false;
    }
};
const startPolling = ()=>{
    if (!polling) {
        console.log('start polling...');
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$poll$2f$dist$2f$poll$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["poll"])(pollDB, 5000);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$poll$2f$dist$2f$poll$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["poll"])(uploadTiledMapsToS3, 4000);
        polling = true;
    }
};
const __TURBOPACK__default__export__ = getFullImageUrl;

})()),
"[project]/app/api/services/scheduler/route.js [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/database.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$s3handler$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/s3handler.jsx [app-route] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
const POST = async (req)=>{
    try {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$s3handler$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__["startPolling"])();
        return new Response({
            'success': 'polling started.'
        }, {
            status: 200
        });
    } catch (error) {
        console.log(error);
        return new Response("Failed to create a new map", {
            status: 500
        });
    }
};

})()),

};

//# sourceMappingURL=_db34fc._.js.map