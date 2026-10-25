// Self-check for utils/tiler.js — no test framework in this project, so plain asserts.
// Run: node utils/tiler.test.mjs
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const { buildTilePyramid } = require('./tiler.js');

const dir = await mkdtemp(path.join(tmpdir(), 'georaffe-tiler-'));
try {
    // 1000x500 landscape test image
    const src = path.join(dir, 'src.png');
    await sharp({
        create: { width: 1000, height: 500, channels: 4, background: { r: 200, g: 50, b: 50, alpha: 1 } }
    }).png().toFile(src);

    const out = path.join(dir, 'tiles');
    const maxZoom = 2;
    const count = await buildTilePyramid(src, out, maxZoom);

    // z=0: 1 tile, z=1: 4, z=2: 16 => 21
    const expected = 1 + 4 + 16;
    assert.equal(count, expected, `expected ${expected} tiles, got ${count}`);

    // every expected tile file exists and is 256x256
    for (let z = 0; z <= maxZoom; z++) {
        const grid = 2 ** z;
        for (let x = 0; x < grid; x++) {
            for (let y = 0; y < grid; y++) {
                const p = path.join(out, String(z), String(x), `${y}.png`);
                await stat(p); // throws if missing
                const meta = await sharp(p).metadata();
                assert.equal(meta.width, 256, `${z}/${x}/${y} width`);
                assert.equal(meta.height, 256, `${z}/${x}/${y} height`);
            }
        }
    }

    console.log(`tiler self-check OK: ${count} tiles, all 256x256`);
} finally {
    await rm(dir, { recursive: true, force: true });
}
