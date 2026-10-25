// Self-check for utils/geowarp.js — warps a synthetic image with known corner
// colours and verifies the result lands at the expected geo location.
// Run: node utils/geowarp.test.mjs
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { warpToTiles } = require('./geowarp.js');

const dir = await mkdtemp(path.join(tmpdir(), 'georaffe-warp-'));
try {
    // 400x400 source: each quadrant a distinct, saturated colour.
    const S = 400, Q = S / 2;
    const px = Buffer.alloc(S * S * 4);
    const set = (x, y, r, g, b) => {
        const o = (y * S + x) * 4;
        px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
    };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (x < Q && y < Q) set(x, y, 255, 0, 0);        // top-left red
        else if (x >= Q && y < Q) set(x, y, 0, 255, 0);  // top-right green
        else if (x < Q && y >= Q) set(x, y, 0, 0, 255);  // bottom-left blue
        else set(x, y, 255, 255, 0);                     // bottom-right yellow
    }
    const src = path.join(dir, 'src.png');
    await sharp(px, { raw: { width: S, height: S, channels: 4 } }).png().toFile(src);

    // Image corners -> a 0.1 x 0.1 degree box around Hamburg.
    const gcps = [
        { source: [0, 0], destination: [10.0, 53.0] },     // top-left
        { source: [S, 0], destination: [10.1, 53.0] },     // top-right
        { source: [0, S], destination: [10.0, 52.9] },     // bottom-left
        { source: [S, S], destination: [10.1, 52.9] }      // bottom-right
    ];

    const out = path.join(dir, 'tiles');
    const z = 14;
    const { tiles } = await warpToTiles(src, gcps, 'polynomial', out, z);
    assert.ok(tiles > 1, `expected several tiles at z=${z}, got ${tiles}`);

    // Centre of the image at lng 10.05, lat 52.95 -> which tile at zoom z?
    const size = 256 * 2 ** z;
    const tx = Math.floor((((10.05 + 180) / 360) * size) / 256);
    const latRad = (52.95 * Math.PI) / 180;
    const ty = Math.floor(((((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * size)) / 256);

    const centreTile = path.join(out, String(z), String(tx), `${ty}.png`);
    await stat(centreTile); // must exist

    // The centre tile spans the meeting point of all four quadrants -> several colours.
    const { data } = await sharp(centreTile).raw().toBuffer({ resolveWithObject: true });
    const seen = new Set();
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue; // ignore transparent
        seen.add(`${data[i] >> 6},${data[i + 1] >> 6},${data[i + 2] >> 6}`);
    }
    assert.ok(seen.size >= 2, `centre tile should contain multiple colours, saw ${seen.size}`);

    // A tile far away from the bbox must not have been written.
    let farExists = true;
    try { await stat(path.join(out, String(z), String(tx + 50), `${ty}.png`)); }
    catch { farExists = false; }
    assert.equal(farExists, false, 'no tiles should be written outside the image extent');

    // A non-affine transform must actually curve: a quadratic (polynomial2) with a
    // mid GCP pulled sideways should place the image midpoint off the straight line
    // that an affine transform would produce.
    const curvedGcps = [
        { source: [0, 0], destination: [10.0, 53.0] },
        { source: [S, 0], destination: [10.1, 53.0] },
        { source: [0, S], destination: [10.0, 52.9] },
        { source: [S, S], destination: [10.1, 52.9] },
        { source: [S / 2, S / 2], destination: [10.08, 52.94] }, // pulled east
        { source: [S / 2, 0], destination: [10.05, 53.0] },
        { source: [S / 2, S], destination: [10.05, 52.9] }
    ];
    const { GcpTransformer } = await import('@allmaps/transform');
    const aff = new GcpTransformer(curvedGcps.slice(0, 4), 'polynomial');
    const quad = new GcpTransformer(curvedGcps, 'polynomial2');
    const opts = { differentHandedness: true, maxOffsetRatio: 5, maxDepth: 100 };
    const mid = [S / 2, S / 2];
    const affineMid = aff.transformToGeo(mid, opts);
    const quadMid = quad.transformToGeo(mid, opts);
    const shift = Math.abs(quadMid[0] - affineMid[0]);
    assert.ok(shift > 0.005, `polynomial2 should curve the midpoint noticeably, shifted ${shift}`);
    console.log(`non-affine check OK: polynomial2 moves the midpoint ${shift.toFixed(4)} deg vs affine`);

    console.log(`geowarp self-check OK: ${tiles} tiles, centre tile has ${seen.size} colour groups`);
} finally {
    await rm(dir, { recursive: true, force: true });
}
