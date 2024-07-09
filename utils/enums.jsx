export const MapStatus = {
    New: 'new',
    Tiling: 'tiling',
    TilingDone: 'tilingDone',
    ErrorWhileTiling: 'errorWhileTiling',
    SyncingWithStorage: 'syncingWithStorage',
    Synced: 'synced',
    Uploading: 'uploading',
    Ready: 'ready'
}

export const CurrentControlPointStatus = {
    FromPointSelected: 'fromPointSelected',
    ToPointSelected: 'toPointSelected',
    FreeForSelection: 'freeForSelection',
    ReadyForSaving: 'readyForSaving',
    EditExisting: 'editExisting'
}

export const ControlPointSelection = {
    From: 'from',
    To: 'to',
    Both: 'both'
}

export const TransformationType = {
    Polynomial: 'polynomial',
    Polynomial2: 'polynomial2',
    Polynomial3: 'polynomial3',
    ThinPlateSpline: 'thinPlateSpline',
    Projective: 'projective'
}

export const TransformationTypes = [
    TransformationType.Polynomial,
    TransformationType.Polynomial2,
    TransformationType.Polynomial3,
    TransformationType.ThinPlateSpline,
    TransformationType.Projective
]

export const TransformationTypeLabels = {
    'polynomial' : '1st order Polynomial',
    'polynomial2' : '2nd order Polynomial',
    'polynomial3' : '3rd order Polynomial',
    'thinPlateSpline' : 'Thin plate spline',
    'projective' : 'Projective'
}

export const TransformationTypesMinGCP = {
    'polynomial' : 3,
    'polynomial2' : 6,
    'polynomial3' : 10,
    'thinPlateSpline' : 3,
    'projective' : 4
}