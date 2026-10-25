const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const TILE_SIZE = 256;

/**
 * Builds an XYZ tile pyramid (256px PNG, z/x/y.png) from a single raster image.
 *
 * Replaces the old GDAL-based gdal2tiles.py (utils/gdal2tiles.py) which needed a
 * multi-GB GDAL docker image for the same job. sharp/libvips does it in-process.
 *
 * The pyramid is built from the bottom (maxZoom) up: each level is derived from the
 * level below by 2x downscale, so the source image is only decoded once.
 *
 * Returns the number of tiles written.
 */
const buildTilePyramid = async (sourceImagePath, outputDir, maxZoomLevel) => {
    const maxZoom = Math.max(0, Math.min(6, Number(maxZoomLevel) || 5));

    const meta = await sharp(sourceImagePath).metadata();
    const { width, height } = meta;

    if (!width || !height) {
        throw new Error(`Could not read image dimensions from ${sourceImagePath}`);
    }

    // Zoom 0 fits the whole image into a single tile; each further level doubles the grid.
    // The base level is a canvas of 256 * 2^maxZoom px, which the image is scaled into.
    const baseSize = TILE_SIZE * Math.pow(2, maxZoom);
    const scale = Math.min(baseSize / width, baseSize / height);
    const baseWidth = Math.round(width * scale);
    const baseHeight = Math.round(height * scale);

    // Rasterise the source once, at base-level resolution, with a flat transparent canvas
    // so partial tiles at the edges stay transparent instead of black.
    let level = await sharp({
        create: {
            width: baseSize,
            height: baseSize,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([{
            input: await sharp(sourceImagePath).resize(baseWidth, baseHeight, { fit: 'fill' }).png().toBuffer(),
            top: 0,
            left: 0
        }])
        .png()
        .toBuffer();

    await fs.mkdir(outputDir, { recursive: true });

    let tileCount = 0;

    for (let z = maxZoom; z >= 0; z--) {
        const gridSize = Math.pow(2, z);
        const levelDir = path.join(outputDir, String(z));

        if (z < maxZoom) {
            // Derive this level from the previous one (half the resolution).
            const resized = await sharp(level)
                .resize(TILE_SIZE * gridSize, TILE_SIZE * gridSize)
                .png()
                .toBuffer();
            level = resized;
        }

        // Split the level image into gridSize x gridSize tiles.
        for (let x = 0; x < gridSize; x++) {
            const xDir = path.join(levelDir, String(x));
            await fs.mkdir(xDir, { recursive: true });

            for (let y = 0; y < gridSize; y++) {
                const tile = await sharp(level)
                    .extract({
                        left: x * TILE_SIZE,
                        top: y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE
                    })
                    .png()
                    .toBuffer();

                await fs.writeFile(path.join(xDir, `${y}.png`), tile);
                tileCount++;
            }
        }
    }

    return tileCount;
}

module.exports = { buildTilePyramid };
