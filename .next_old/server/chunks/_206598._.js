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
"[project]/app/api/map/route.js [app-route] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_module_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, M: __turbopack_modules__, l: __turbopack_load__, j: __turbopack_dynamic__, P: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "GET": ()=>GET,
    "dynamic": ()=>dynamic
});
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/database.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$map$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/models/map.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$enums$2e$jsx__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/utils/enums.jsx [app-route] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
const dynamic = 'force-dynamic';
const GET = async (req)=>{
    try {
        // const url = new URL(req.url);
        // const searchParams = new URLSearchParams(url.searchParams);
        // console.log('searchParams', searchParams);
        const searchParams = req.nextUrl.searchParams;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$database$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])();
        if (searchParams.get('selectedMap') !== null) {
            const selectedMapSearchParam = searchParams.get('selectedMap');
            console.log('selected map query : ' + selectedMapSearchParam);
            let newest = selectedMapSearchParam === 'newest';
            const selectedMap = await __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$map$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].aggregate().sort({
                createdAt: newest ? 1 : -1
            }).limit(1).exec();
            console.log('selected map result : ' + JSON.stringify(selectedMap));
            return new Response(JSON.stringify(selectedMap, {
                status: 200
            }));
        } else {
            const maps = await __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$map$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].find({}).populate('user');
            return new Response(JSON.stringify(maps, {
                status: 200
            }));
        }
    } catch (error) {
        console.log(error);
        return new Response("Failed to retrieve maps.", {
            status: 500
        });
    }
};

})()),

};

//# sourceMappingURL=_206598._.js.map