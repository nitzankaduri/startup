import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'models');
const KENNEY_RAW = 'https://raw.githubusercontent.com/shorepine/kenney/main/3d';

const PRO_MODELS = [
  { out: 'character_hero.glb', sources: ['mini-characters/character-male-a.glb'], fallback: 'cartoon_character.glb' },
  { out: 'character_enemy.glb', sources: ['mini-characters/character-male-d.glb'], fallback: 'chaser_guard.glb' },
  { out: 'car_sports.glb', sources: ['car/sedan-sports.glb'], fallback: 'sports_car.glb' },
  { out: 'car_police.glb', sources: ['car/police.glb'], fallback: 'police_cruiser.glb' },
  { out: 'starfighter.glb', sources: ['space/craft_speederA.glb', 'space/craft_racer.glb'], fallback: 'spaceship.glb' },
  { out: 'train_car.glb', sources: ['train/train-electric-subway-a.glb'], fallback: 'subway_train.glb' },
  { out: 'building_tower.glb', sources: ['city-commercial/building-skyscraper-a.glb', 'city-commercial/building-a.glb'], fallback: 'skyscraper.glb' },
  { out: 'tree_stylized.glb', sources: ['nature/tree_detailed.glb'], fallback: 'tree.glb' },
];

const texCache = new Map();

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-pro-models' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

function pad4(buf, byte) {
  const rem = buf.length % 4;
  return rem === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - rem, byte)]);
}

async function packExternalTextures(glbBuf, kitDir) {
  if (glbBuf.subarray(0, 4).toString('utf8') !== 'glTF') throw new Error('Invalid GLB header');
  const jsonLen = glbBuf.readUInt32LE(12);
  const gltf = JSON.parse(glbBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const extImgs = (gltf.images || []).filter((img) => img.uri && !img.uri.startsWith('data:'));
  if (!extImgs.length) return glbBuf;

  const binOff = 20 + jsonLen;
  let binBuf = binOff + 8 <= glbBuf.length ? glbBuf.subarray(binOff + 8, binOff + 8 + glbBuf.readUInt32LE(binOff)) : Buffer.alloc(0);
  gltf.bufferViews = gltf.bufferViews || [];
  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];

  for (const img of extImgs) {
    const texUrl = `${KENNEY_RAW}/${kitDir}/${img.uri}`;
    if (!texCache.has(texUrl)) texCache.set(texUrl, await fetchBytes(texUrl));
    const png = texCache.get(texUrl);
    binBuf = pad4(binBuf, 0x00);
    gltf.bufferViews.push({ buffer: 0, byteOffset: binBuf.length, byteLength: png.length });
    img.bufferView = gltf.bufferViews.length - 1;
    img.mimeType = img.uri.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    delete img.uri;
    binBuf = Buffer.concat([binBuf, png]);
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

async function downloadModel(entry) {
  for (const rel of entry.sources) {
    try {
      const raw = await fetchBytes(`${KENNEY_RAW}/${rel}`);
      const packed = await packExternalTextures(raw, rel.split('/')[0]);
      await fs.writeFile(path.join(OUT_DIR, entry.out), packed);
      console.log(`✓ ${entry.out} (${(packed.length / 1024).toFixed(1)} KB) <- ${rel}`);
      return true;
    } catch (err) {
      console.warn(`  retry ${entry.out} (${rel}): ${err.message}`);
    }
  }
  const fbPath = path.join(OUT_DIR, entry.fallback);
  try {
    await fs.copyFile(fbPath, path.join(OUT_DIR, entry.out));
    console.log(`✓ ${entry.out} (copied fallback ${entry.fallback})`);
    return true;
  } catch (err) {
    console.error(`✗ ${entry.out} failed: ${err.message}`);
    return false;
  }
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const entry of PRO_MODELS) {
    if (await downloadModel(entry)) ok += 1;
  }
  console.log(`Studio GLB pack ready: ${ok}/${PRO_MODELS.length} models in ${OUT_DIR}`);
}

run();
