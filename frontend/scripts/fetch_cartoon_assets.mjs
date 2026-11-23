import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'models');
const KENNEY_RAW = 'https://raw.githubusercontent.com/shorepine/kenney/main/3d';

const ASSETS = [
  ['car/sedan-sports.glb', 'sports_car.glb'],
  ['car/police.glb', 'police_cruiser.glb'],
  ['train/train-electric-subway-a.glb', 'subway_train.glb'],
  ['city-roads/construction-barrier.glb', 'street_barrier.glb'],
  ['city-commercial/building-a.glb', 'city_building.glb'],
  ['city-commercial/building-skyscraper-a.glb', 'skyscraper.glb'],
  ['platformer/coin-gold.glb', 'coin.glb'],
  ['platformer/crate-strong.glb', 'scifi_crate.glb'],
  ['nature/tree_detailed.glb', 'tree.glb'],
  ['nature/tree_palmDetailedShort.glb', 'palm_tree.glb'],
  ['mini-characters/character-male-a.glb', 'cartoon_character.glb'],
  ['mini-characters/character-male-d.glb', 'chaser_guard.glb'],
];

const texCache = new Map();
async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-asset-fetcher' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function pad4(buf, byte) {
  const rem = buf.length % 4;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem, byte)]);
}

async function embedExternalTextures(glbBuf, kitDir) {
  if (glbBuf.subarray(0, 4).toString('utf8') !== 'glTF') throw new Error('Invalid GLB header');
  const jsonLen = glbBuf.readUInt32LE(12);
  const gltf = JSON.parse(glbBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const extImgs = (gltf.images || []).filter((img) => img.uri && !img.uri.startsWith('data:'));
  if (!extImgs.length) return glbBuf;

  const binHdrOff = 20 + jsonLen;
  let binBuf = binHdrOff + 8 <= glbBuf.length ? glbBuf.subarray(binHdrOff + 8, binHdrOff + 8 + glbBuf.readUInt32LE(binHdrOff)) : Buffer.alloc(0);
  gltf.bufferViews = gltf.bufferViews || [];
  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];

  for (const img of extImgs) {
    const texUrl = `${KENNEY_RAW}/${kitDir}/${img.uri}`;
    if (!texCache.has(texUrl)) texCache.set(texUrl, await fetchBytes(texUrl));
    const png = texCache.get(texUrl);
    binBuf = pad4(binBuf, 0x00);
    const viewIdx = gltf.bufferViews.length;
    gltf.bufferViews.push({ buffer: 0, byteOffset: binBuf.length, byteLength: png.length });
    binBuf = Buffer.concat([binBuf, png]);
    img.bufferView = viewIdx;
    img.mimeType = img.uri.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    delete img.uri;
  }

  binBuf = pad4(binBuf, 0x00);
  gltf.buffers[0].byteLength = binBuf.length;
  const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const totalLen = 12 + 8 + jsonBuf.length + 8 + binBuf.length;
  const out = Buffer.alloc(totalLen);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(totalLen, 8);
  out.writeUInt32LE(jsonBuf.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jsonBuf.copy(out, 20);
  const bOff = 20 + jsonBuf.length;
  out.writeUInt32LE(binBuf.length, bOff); out.writeUInt32LE(0x004e4942, bOff + 4); binBuf.copy(out, bOff + 8);
  return out;
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const [remoteRel, localName] of ASSETS) {
    const url = `${KENNEY_RAW}/${remoteRel}`;
    try {
      const raw = await fetchBytes(url);
      const packed = await embedExternalTextures(raw, remoteRel.split('/')[0]);
      await fs.writeFile(path.join(OUT_DIR, localName), packed);
      console.log(`✓ ${localName} (${(packed.length / 1024).toFixed(1)} KB) <- ${remoteRel}`);
      ok += 1;
    } catch (err) {
      console.warn(`! Skipped ${localName}: ${err.message}`);
    }
  }
  console.log(`Done: ${ok}/${ASSETS.length} CC0 .glb models ready in ${OUT_DIR}`);
}

run();
