const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const TILE_SIZE = 256;

// @allmaps/transform ships a broken UMD build, so it must be imported as ESM.
const loadGcpTransformer = async () => {
    const mod = await import('@allmaps/transform');
    return mod.GcpTransformer;
};

// Same options the client uses, so the server warp matches what the user sees live.
const TRANSFORM_OPTIONS = { differentHandedness: true, maxOffsetRatio: 5, maxDepth: 100 };

const lngLatToPixel = (lng, lat, z) => {
    const size = TILE_SIZE * Math.pow(2, z);
    const x = ((lng + 180) / 360) * size;
    const latRad = (lat * Math.PI) / 180;
    const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * size;
    return [x, y];
};

const pixelToLngLat = (x, y, z) => {
    const size = TILE_SIZE * Math.pow(2, z);
    const lng = (x / size) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * y) / size;
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    return [lng, lat];
};

/**
 * Warps a source image into geo-referenced XYZ tiles (EPSG:3857) using the map's
 * control points, then writes them under outputDir/<z>/<x>/<y>.png.
 *
 * Variant A of the embed rework: the browser then loads ordinary tiles instead of
 * a 50-100 MB image that the client-side arrugator would have to warp live.
 *
 * The mesh is evaluated on a coarse grid and interpolated bilinearly, which keeps
 * the number of (expensive) allmaps transform calls low. At ~100ms per 4M output
 * pixels this is fast enough for a one-off job.
 *
 * Returns { tiles: <count> }.
 */
const warpToTiles = async (sourceImagePath, gcps, transformationType, outputDir, maxZoomLevel) => {
    const GcpTransformer = await loadGcpTransformer();

    const transformer = new GcpTransformer(gcps, transformationType || 'polynomial');
    // Web Mercator tops out at z=22. The old 1..6 cap came from the raster-tiling
    // world (gdal2tiles + L.RasterCoords) and is far too coarse for georeferenced
    // tiles: at z=6 a 0.1 degree map is only ~4 pixels wide.
    const maxZoom = Math.max(0, Math.min(22, Number(maxZoomLevel) || 5));

    // Destination extent: where the image corners land on the map.
    const meta = await sharp(sourceImagePath).metadata();
    const corners = [
        transformer.transformToGeo([0, 0], TRANSFORM_OPTIONS),
        transformer.transformToGeo([meta.width, 0], TRANSFORM_OPTIONS),
        transformer.transformToGeo([meta.width, meta.height], TRANSFORM_OPTIONS),
        transformer.transformToGeo([0, meta.height], TRANSFORM_OPTIONS)
    ];
    const lngs = corners.map(c => c[0]);
    const lats = corners.map(c => c[1]);
    const bbox = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];

    // Load the source once as raw RGBA.
    const { data: src, info } = await sharp(sourceImagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const SW = info.width;
    const SH = info.height;

    const [minLng, minLat, maxLng, maxLat] = bbox;

    // Top-left and bottom-right of the bbox in pixel coords at maxZoom.
    const [bx0, by0] = lngLatToPixel(minLng, maxLat, maxZoom);
    const [bx1, by1] = lngLatToPixel(maxLng, minLat, maxZoom);

    // Grid rectangle (in maxZoom pixels) that covers the bbox, snapped to tiles.
    const tileX0 = Math.floor(bx0 / TILE_SIZE);
    const tileY0 = Math.floor(by0 / TILE_SIZE);
    const tileX1 = Math.floor(bx1 / TILE_SIZE);
    const tileY1 = Math.floor(by1 / TILE_SIZE);

    let tileCount = 0;
    // Warp the whole bbox once per zoom level, then cut tiles out of it.
    for (let z = maxZoom; z >= 0; z--) {
        const scale = 1 / Math.pow(2, maxZoom - z);
        // region in this level's pixel coords
        const rx0 = tileX0 * TILE_SIZE * scale;
        const ry0 = tileY0 * TILE_SIZE * scale;
        const rw = Math.max(1, Math.round((tileX1 - tileX0 + 1) * TILE_SIZE * scale));
        const rh = Math.max(1, Math.round((tileY1 - tileY0 + 1) * TILE_SIZE * scale));

        // Mesh of source-image coordinates for this region.
        const step = 16;
        const gw = Math.ceil(rw / step) + 1;
        const gh = Math.ceil(rh / step) + 1;
        const mx = new Float32Array(gw * gh);
        const my = new Float32Array(gw * gh);
        for (let gy = 0; gy < gh; gy++) {
            for (let gx = 0; gx < gw; gx++) {
                const px = rx0 + gx * step;
                const py = ry0 + gy * step;
                const [lng, lat] = pixelToLngLat(px, py, z);
                const r = transformer.transformToResource([lng, lat], TRANSFORM_OPTIONS);
                const i = gy * gw + gx;
                mx[i] = r[0];
                my[i] = r[1];
            }
        }

        const warped = Buffer.alloc(rw * rh * 4);
        for (let y = 0; y < rh; y++) {
            const gy = Math.min(gh - 2, Math.floor(y / step));
            const fy = (y - gy * step) / step;
            for (let x = 0; x < rw; x++) {
                const gx = Math.min(gw - 2, Math.floor(x / step));
                const fx = (x - gx * step) / step;
                const i00 = gy * gw + gx, i10 = i00 + 1, i01 = i00 + gw, i11 = i01 + 1;
                const sx = (mx[i00] * (1 - fx) + mx[i10] * fx) * (1 - fy) + (mx[i01] * (1 - fx) + mx[i11] * fx) * fy;
                const sy = (my[i00] * (1 - fx) + my[i10] * fx) * (1 - fy) + (my[i01] * (1 - fx) + my[i11] * fx) * fy;

                const o = (y * rw + x) * 4;
                if (sx < 0 || sy < 0 || sx >= SW - 1 || sy >= SH - 1) {
                    continue; // outside the source => stays transparent
                }
                const x0 = Math.floor(sx), y0 = Math.floor(sy), tx = sx - x0, ty = sy - y0;
                const p00 = (y0 * SW + x0) * 4, p10 = p00 + 4, p01 = ((y0 + 1) * SW + x0) * 4, p11 = p01 + 4;
                warped[o]     = (src[p00] * (1 - tx) + src[p10] * tx) * (1 - ty) + (src[p01] * (1 - tx) + src[p11] * tx) * ty;
                warped[o + 1] = (src[p00 + 1] * (1 - tx) + src[p10 + 1] * tx) * (1 - ty) + (src[p01 + 1] * (1 - tx) + src[p11 + 1] * tx) * ty;
                warped[o + 2] = (src[p00 + 2] * (1 - tx) + src[p10 + 2] * tx) * (1 - ty) + (src[p01 + 2] * (1 - tx) + src[p11 + 2] * tx) * ty;
                warped[o + 3] = (src[p00 + 3] * (1 - tx) + src[p10 + 3] * tx) * (1 - ty) + (src[p01 + 3] * (1 - tx) + src[p11 + 3] * tx) * ty;
            }
        }

        // Cut the region into tiles.
        const gridSize = Math.pow(2, z);
        const regionTilesX = tileX1 - tileX0 + 1;
        const regionTilesY = tileY1 - tileY0 + 1;
        for (let tx = 0; tx < regionTilesX; tx++) {
            const gxTile = tileX0 + tx;
            if (gxTile < 0 || gxTile >= gridSize) continue;
            const dir = path.join(outputDir, String(z), String(gxTile));
            await fs.mkdir(dir, { recursive: true });
            for (let ty = 0; ty < regionTilesY; ty++) {
                const gyTile = tileY0 + ty;
                if (gyTile < 0 || gyTile >= gridSize) continue;

                const tile = await sharp(warped, { raw: { width: rw, height: rh, channels: 4 } })
                    .extract({ left: tx * TILE_SIZE, top: ty * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })
                    .png()
                    .toBuffer();
                await fs.writeFile(path.join(dir, `${gyTile}.png`), tile);
                tileCount++;
            }
        }
    }

    return { tiles: tileCount };
};

module.exports = { warpToTiles };
