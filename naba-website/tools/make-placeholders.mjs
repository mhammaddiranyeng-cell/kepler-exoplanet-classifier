#!/usr/bin/env node
/**
 * Generates the placeholder OG share card (1200x630 PNG) with a tiny built-in
 * PNG encoder, so the repo needs no image dependencies.
 *
 * Run:  node tools/make-placeholders.mjs
 * Replace static/assets/img/og-placeholder.png with a real share card built
 * from the NABA logo as soon as it exists.
 */

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "assets", "img", "og-placeholder.png");

const W = 1200;
const H = 630;

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const mix = (a, b, t) => Math.round(a + (b - a) * t);

// Diagonal wash between the logo's bronze and globe-blue tones.
const raw = Buffer.alloc((W * 3 + 1) * H);
let o = 0;
for (let y = 0; y < H; y++) {
  raw[o++] = 0; // filter byte: none
  for (let x = 0; x < W; x++) {
    const t = (x / W) * 0.7 + (y / H) * 0.3;
    raw[o++] = mix(0x3d, 0x1b, t);
    raw[o++] = mix(0x1d, 0x7b, t);
    raw[o++] = mix(0x0b, 0xa0, t);
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: truecolour
writeFileSync(
  OUT,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
);

console.log(`✓ wrote ${OUT} (${W}x${H})`);
