import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RIG_DIR = path.join(ROOT, 'public', 'models', 'rigged');
const MAT_DIR = path.join(ROOT, 'public', 'matcaps');
const KENNEY_RAW = 'https://raw.githubusercontent.com/shorepine/kenney/main/3d';
const THREE_ROBOT = 'https://raw.githubusercontent.com/mrdoob/three.js/r169/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

const RIGGED_ASSETS = [
  [`${KENNEY_RAW}/mini-characters/character-male-a.glb`, 'player_runner.glb', `${KENNEY_RAW}/mini-characters`],
  [`${KENNEY_RAW}/mini-characters/character-female-a.glb`, 'hero_female.glb', `${KENNEY_RAW}/mini-characters`],
  [`${KENNEY_RAW}/mini-characters/character-male-d.glb`, 'enemy_guard.glb', `${KENNEY_RAW}/mini-characters`],
  [`${KENNEY_RAW}/mini-characters/character-male-b.glb`, 'enemy_pirate.glb', `${KENNEY_RAW}/mini-characters`],
  [THREE_ROBOT, 'enemy_robot.glb', null],
];

const texCache = new Map();
async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-studio-fetcher' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const pad4 = (buf, b) => (buf.length % 4 === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4), b)]));

async function packGlb(glbBuf, texBase) {
  if (!texBase || glbBuf.subarray(0, 4).toString('utf8') !== 'glTF') return glbBuf;
  const jsonLen = glbBuf.readUInt32LE(12);
  const gltf = JSON.parse(glbBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const ext = (gltf.images || []).filter((i) => i.uri && !i.uri.startsWith('data:'));
  if (!ext.length) return glbBuf;

  const bOff0 = 20 + jsonLen;
  let bin = bOff0 + 8 <= glbBuf.length ? glbBuf.subarray(bOff0 + 8, bOff0 + 8 + glbBuf.readUInt32LE(bOff0)) : Buffer.alloc(0);
  gltf.bufferViews = gltf.bufferViews || [];
  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];

  for (const img of ext) {
    const texUrl = `${texBase}/${img.uri}`;
    if (!texCache.has(texUrl)) texCache.set(texUrl, await fetchBytes(texUrl));
    const png = texCache.get(texUrl);
    bin = pad4(bin, 0);
    gltf.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: png.length });
    img.bufferView = gltf.bufferViews.length - 1;
    img.mimeType = 'image/png';
    delete img.uri;
    bin = Buffer.concat([bin, png]);
  }
  bin = pad4(bin, 0);
  gltf.buffers[0].byteLength = bin.length;
  const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const out = Buffer.alloc(12 + 8 + jsonBuf.length + 8 + bin.length);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jsonBuf.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jsonBuf.copy(out, 20);
  const bo = 20 + jsonBuf.length;
  out.writeUInt32LE(bin.length, bo); out.writeUInt32LE(0x004e4942, bo + 4); bin.copy(out, bo + 8);
  return out;
}

function encodePngRgba(w, h, rgba) {
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) { c ^= byte; for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0); }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const cBuf = Buffer.alloc(4); cBuf.writeUInt32BE(crc(Buffer.concat([t, data])), 0);
    return Buffer.concat([len, t, data, cBuf]);
  };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y += 1) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

function buildMatcapPng(mode) {
  const S = 128; const buf = Buffer.alloc(S * S * 4);
  for (let py = 0; py < S; py += 1) {
    for (let px = 0; px < S; px += 1) {
      const nx = (px / (S - 1)) * 2 - 1; const ny = 1 - (py / (S - 1)) * 2;
      const r2 = nx * nx + ny * ny;
      const nz = r2 < 1 ? Math.sqrt(1 - r2) : 0;
      const ndotl = Math.max(0, nx * 0.45 + ny * 0.65 + nz * 0.6);
      const spec = Math.pow(Math.max(0, nx * 0.35 + ny * 0.6 + nz * 0.72), mode === 'metallic' ? 28 : 10);
      const rim = Math.pow(1 - Math.max(0, nz), 2.5);
      let lum = mode === 'vibrant'
        ? (ndotl > 0.68 ? 245 : ndotl > 0.32 ? 195 : 122) + spec * 45 + rim * 28
        : mode === 'metallic'
          ? 85 + ndotl * 125 + spec * 115 + rim * 40
          : 118 + ndotl * 118 + spec * 25 + rim * 22;
      const v = Math.min(255, Math.max(0, Math.round(lum)));
      const idx = (py * S + px) * 4;
      buf[idx] = v; buf[idx + 1] = Math.min(255, v + (mode === 'vibrant' ? 4 : 0)); buf[idx + 2] = Math.min(255, v + (mode === 'metallic' ? 10 : 0)); buf[idx + 3] = 255;
    }
  }
  return encodePngRgba(S, S, buf);
}

async function run() {
  await fs.mkdir(RIG_DIR, { recursive: true });
  await fs.mkdir(MAT_DIR, { recursive: true });
  for (const [name, mode] of [['toon_vibrant.png', 'vibrant'], ['toon_metallic.png', 'metallic'], ['toon_soft.png', 'soft']]) {
    const png = buildMatcapPng(mode);
    await fs.writeFile(path.join(MAT_DIR, name), png);
    console.log(`✓ matcap/${name} (${(png.length / 1024).toFixed(1)} KB)`);
  }
  for (const [url, file, base] of RIGGED_ASSETS) {
    try {
      const packed = await packGlb(await fetchBytes(url), base);
      await fs.writeFile(path.join(RIG_DIR, file), packed);
      console.log(`✓ rigged/${file} (${(packed.length / 1024).toFixed(1)} KB)`);
    } catch (e) { console.warn(`! Skipped ${file}: ${e.message}`); }
  }
}
run();
