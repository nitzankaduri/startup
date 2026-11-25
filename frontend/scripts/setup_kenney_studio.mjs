import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'models', 'kenney');
const KENNEY_SOURCES = [
  'https://raw.githubusercontent.com/shorepine/kenney/main/3d',
  'https://cdn.jsdelivr.net/gh/shorepine/kenney@main/3d',
];

const KENNEY_PACK = [
  { rel: 'mini-characters/character-male-a.glb', out: 'character_player.glb' },
  { rel: 'mini-characters/character-male-d.glb', out: 'character_enemy.glb' },
  { rel: 'train/train-electric-subway-a.glb', out: 'train_front.glb' },
  { rel: 'train/train-electric-subway-b.glb', out: 'train_carriage.glb' },
  { rel: 'car/sedan-sports.glb', out: 'car_sports.glb' },
  { rel: 'car/police.glb', out: 'car_police.glb' },
  { rel: 'space/craft_speederA.glb', out: 'spaceship.glb' },
  { rel: 'city-commercial/building-a.glb', out: 'building_city.glb' },
  { rel: 'nature/tree_pineRoundA.glb', out: 'tree_pine.glb', alt: 'nature/tree_detailed.glb' },
  { rel: 'platformer/crate-strong.glb', out: 'crate.glb' },
  { rel: 'platformer/coin-gold.glb', out: 'coin_gold.glb' },
];

const texCache = new Map();
const pad4 = (b, v) => (b.length % 4 === 0 ? b : Buffer.concat([b, Buffer.alloc(4 - (b.length % 4), v)]));

async function fetchUrl(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-kenney-studio' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function fetchFromMirrors(rel) {
  let lastErr;
  for (const base of KENNEY_SOURCES) {
    try { return { buf: await fetchUrl(`${base}/${rel}`), base }; } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function packTextures(glbBuf, kitDir, base) {
  if (glbBuf.subarray(0, 4).toString('utf8') !== 'glTF') throw new Error('Invalid glTF header');
  const jLen = glbBuf.readUInt32LE(12);
  const gltf = JSON.parse(glbBuf.subarray(20, 20 + jLen).toString('utf8'));
  const imgs = (gltf.images || []).filter((i) => i.uri && !i.uri.startsWith('data:'));
  if (!imgs.length) return glbBuf;
  const bOff = 20 + jLen;
  let bin = bOff + 8 <= glbBuf.length ? glbBuf.subarray(bOff + 8, bOff + 8 + glbBuf.readUInt32LE(bOff)) : Buffer.alloc(0);
  gltf.bufferViews = gltf.bufferViews || [];
  gltf.buffers = gltf.buffers?.length ? gltf.buffers : [{ byteLength: 0 }];
  for (const img of imgs) {
    const tUrl = `${base}/${kitDir}/${img.uri}`;
    if (!texCache.has(tUrl)) texCache.set(tUrl, await fetchUrl(tUrl));
    const png = texCache.get(tUrl);
    bin = pad4(bin, 0);
    gltf.bufferViews.push({ buffer: 0, byteOffset: bin.length, byteLength: png.length });
    img.bufferView = gltf.bufferViews.length - 1;
    img.mimeType = img.uri.toLowerCase().endsWith('.jpg') ? 'image/jpeg' : 'image/png';
    delete img.uri;
    bin = Buffer.concat([bin, png]);
  }
  bin = pad4(bin, 0); gltf.buffers[0].byteLength = bin.length;
  const jBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20);
  const out = Buffer.alloc(12 + 8 + jBuf.length + 8 + bin.length);
  out.write('glTF', 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jBuf.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jBuf.copy(out, 20);
  const bo = 20 + jBuf.length;
  out.writeUInt32LE(bin.length, bo); out.writeUInt32LE(0x004e4942, bo + 4); bin.copy(out, bo + 8);
  return out;
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let ok = 0;
  for (const item of KENNEY_PACK) {
    let done = false;
    for (const rel of [item.rel, item.alt].filter(Boolean)) {
      try {
        const { buf, base } = await fetchFromMirrors(rel);
        const packed = await packTextures(buf, rel.split('/')[0], base);
        if (packed.length < 5120) throw new Error(`Too small (${packed.length} B)`);
        await fs.writeFile(path.join(OUT_DIR, item.out), packed);
        console.log(`✓ kenney/${item.out} (${(packed.length / 1024).toFixed(1)} KB)`);
        ok += 1; done = true; break;
      } catch (e) { console.warn(`  retry ${item.out} (${rel}): ${e.message}`); }
    }
    if (!done) throw new Error(`Failed to fetch ${item.out}`);
  }
  console.log(`\nVerified ${ok}/${KENNEY_PACK.length} Kenney CC0 .glb assets in ${OUT_DIR}`);
}

run();
