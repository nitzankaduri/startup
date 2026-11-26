import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'studio');
const MIN_BYTES = 10240; // Strictly > 10KB

const K_RAW = 'https://raw.githubusercontent.com/shorepine/kenney/main/3d';
const K_CDN = 'https://cdn.jsdelivr.net/gh/shorepine/kenney@main/3d';
const THREE_RAW = 'https://raw.githubusercontent.com/mrdoob/three.js/r169/examples/models/gltf';
const THREE_CDN = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r169/examples/models/gltf';

const kenneyMirrors = (rel) => [`${K_RAW}/${rel}`, `${K_CDN}/${rel}`];

const PACK_MANIFEST = [
  { file: 'hero_stylized.glb', urls: [...kenneyMirrors('mini-characters/character-male-a.glb'), `${THREE_RAW}/Soldier.glb`] },
  { file: 'enemy_guard.glb', urls: [...kenneyMirrors('mini-characters/character-male-d.glb'), `${THREE_RAW}/Xbot.glb`] },
  { file: 'enemy_monster.glb', urls: [...kenneyMirrors('graveyard/character-zombie.glb'), `${THREE_RAW}/RobotExpressive/RobotExpressive.glb`, `${THREE_CDN}/RobotExpressive/RobotExpressive.glb`] },
  { file: 'subway_locomotive.glb', urls: kenneyMirrors('train/train-electric-subway-a.glb') },
  { file: 'subway_wagon.glb', urls: kenneyMirrors('train/train-electric-subway-b.glb') },
  { file: 'sports_car.glb', urls: kenneyMirrors('car/sedan-sports.glb') },
  { file: 'police_cruiser.glb', urls: kenneyMirrors('car/police.glb') },
  { file: 'starfighter.glb', urls: [...kenneyMirrors('space/craft_speederA.glb'), ...kenneyMirrors('space/craft_racer.glb')] },
  { file: 'city_building_a.glb', urls: kenneyMirrors('city-commercial/building-a.glb') },
  { file: 'city_building_b.glb', urls: kenneyMirrors('city-commercial/building-b.glb') },
  { file: 'street_lamp.glb', urls: [...kenneyMirrors('city-roads/light-curved.glb'), ...kenneyMirrors('city-roads/light-square.glb')] },
  { file: 'stylized_tree.glb', urls: kenneyMirrors('nature/tree_detailed.glb') },
  { file: 'gold_coin.glb', urls: kenneyMirrors('platformer/coin-gold.glb') },
  { file: 'crate_prop.glb', urls: kenneyMirrors('platformer/crate-strong.glb') },
];

const texCache = new Map();
const pad4 = (buf, byte) => (buf.length % 4 === 0 ? buf : Buffer.concat([buf, Buffer.alloc(4 - (buf.length % 4), byte)]));

async function fetchBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-studio-pack/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function packSelfContainedGlb(rawBuf, sourceUrl) {
  if (rawBuf.length < 20 || rawBuf.subarray(0, 4).toString('utf8') !== 'glTF') throw new Error('Invalid GLB header');
  const jsonLen = rawBuf.readUInt32LE(12);
  const gltf = JSON.parse(rawBuf.subarray(20, 20 + jsonLen).toString('utf8'));
  const extImgs = (gltf.images || []).filter((img) => img.uri && !img.uri.startsWith('data:'));
  if (!extImgs.length) return rawBuf;

  const baseDir = sourceUrl.slice(0, sourceUrl.lastIndexOf('/'));
  const binOff = 20 + jsonLen;
  let bin = binOff + 8 <= rawBuf.length ? rawBuf.subarray(binOff + 8, binOff + 8 + rawBuf.readUInt32LE(binOff)) : Buffer.alloc(0);
  gltf.bufferViews = gltf.bufferViews || [];
  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];

  for (const img of extImgs) {
    const texUrl = `${baseDir}/${img.uri}`;
    if (!texCache.has(texUrl)) texCache.set(texUrl, await fetchBytes(texUrl));
    const texBytes = texCache.get(texUrl);
    bin = pad4(bin, 0x00);
    gltf.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: texBytes.length });
    img.bufferView = gltf.bufferViews.length - 1;
    img.mimeType = img.uri.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    delete img.uri;
    bin = Buffer.concat([bin, texBytes]);
  }
  bin = pad4(bin, 0x00);
  gltf.buffers[0].byteLength = bin.length;
  const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const out = Buffer.alloc(12 + 8 + jsonBuf.length + 8 + bin.length);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jsonBuf.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jsonBuf.copy(out, 20);
  const bo = 20 + jsonBuf.length;
  out.writeUInt32LE(bin.length, bo); out.writeUInt32LE(0x004e4942, bo + 4); bin.copy(out, bo + 8);
  return out;
}

async function downloadWithMirrors({ file, urls }) {
  for (const url of urls) {
    try {
      const raw = await fetchBytes(url);
      const packed = await packSelfContainedGlb(raw, url);
      if (packed.length <= MIN_BYTES) throw new Error(`Too small (${packed.length} B <= ${MIN_BYTES} B)`);
      const jsonLen = packed.readUInt32LE(12);
      const meta = JSON.parse(packed.subarray(20, 20 + jsonLen).toString('utf8'));
      const anims = (meta.animations || []).map((a) => a.name).filter(Boolean);
      await fs.writeFile(path.join(OUT_DIR, file), packed);
      console.log(`✓ ${file.padEnd(23)} ${(packed.length / 1024).toFixed(1).padStart(7)} KB | anims: ${anims.length ? anims.join(',') : 'static'}`);
      return true;
    } catch (err) {
      console.warn(`  retry ${file} (${url}): ${err.message}`);
    }
  }
  return false;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const results = await Promise.all(PACK_MANIFEST.map(downloadWithMirrors));
  const okCount = results.filter(Boolean).length;
  console.log(`\nStudio Pack Verified: ${okCount}/${PACK_MANIFEST.length} assets (>10KB self-contained GLB) in ${OUT_DIR}`);
  if (okCount !== PACK_MANIFEST.length) process.exit(1);
}

main();
