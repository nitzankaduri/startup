import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'models');
const DRACO_OUT = path.join(ROOT, 'public', 'draco');
const THREE_GLTF_LOCAL = path.join(ROOT, 'node_modules', 'three', 'examples', 'models', 'gltf');
const THREE_DRACO_LOCAL = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');
const THREE_RAW = 'https://raw.githubusercontent.com/mrdoob/three.js/r169/examples/models/gltf';
const KHRONOS_RAW = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

const MODEL_SPECS = [
  { out: 'hero_runner.glb', localRel: 'Soldier.glb', remote: `${THREE_RAW}/Soldier.glb`, fallback: 'character_hero.glb' },
  { out: 'enemy_bot.glb', localRel: 'RobotExpressive/RobotExpressive.glb', remote: `${THREE_RAW}/RobotExpressive/RobotExpressive.glb`, fallback: 'rigged/enemy_robot.glb' },
  { out: 'sports_car.glb', localRel: 'ferrari.glb', remote: `${THREE_RAW}/ferrari.glb`, fallback: 'car_sports.glb' },
  { out: 'cyber_hero.glb', localRel: 'Xbot.glb', remote: `${THREE_RAW}/Xbot.glb`, fallback: 'character_hero.glb' },
  { out: 'flying_creature.glb', localRel: 'Flamingo.glb', remote: `${THREE_RAW}/Flamingo.glb`, fallback: 'starfighter.glb' },
  { out: 'CesiumMilkTruck.glb', remote: `${KHRONOS_RAW}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`, fallback: 'car_police.glb' },
  { out: 'DamagedHelmet.glb', remote: `${KHRONOS_RAW}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`, fallback: 'drone.glb' },
  { out: 'Fox.glb', remote: `${KHRONOS_RAW}/Fox/glTF-Binary/Fox.glb`, fallback: 'character_enemy.glb' },
];

async function copyDracoDecoders() {
  await fs.mkdir(DRACO_OUT, { recursive: true });
  const files = await fs.readdir(THREE_DRACO_LOCAL);
  for (const f of files) {
    await fs.copyFile(path.join(THREE_DRACO_LOCAL, f), path.join(DRACO_OUT, f));
  }
  console.log(`✓ Copied ${files.length} Draco decoder files to public/draco/`);
}

async function fetchValidGlb(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'spawn-gg-real-models' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10240 || buf.subarray(0, 4).toString('utf8') !== 'glTF') {
    throw new Error(`Invalid or too small GLB (${buf.length} bytes)`);
  }
  return buf;
}

async function installOne(spec) {
  const dest = path.join(OUT_DIR, spec.out);
  if (spec.localRel) {
    try {
      const localPath = path.join(THREE_GLTF_LOCAL, spec.localRel);
      const st = await fs.stat(localPath);
      if (st.size > 10240) {
        await fs.copyFile(localPath, dest);
        console.log(`✓ ${spec.out} (${(st.size / 1024).toFixed(1)} KB) [local three]`);
        return true;
      }
    } catch { /* fallback to remote */ }
  }
  try {
    const buf = await fetchValidGlb(spec.remote);
    await fs.writeFile(dest, buf);
    console.log(`✓ ${spec.out} (${(buf.length / 1024).toFixed(1)} KB) <- ${spec.remote}`);
    return true;
  } catch (err) {
    console.warn(`  warn ${spec.out}: ${err.message}`);
  }
  if (spec.fallback) {
    const fb = path.join(OUT_DIR, spec.fallback);
    const st = await fs.stat(fb);
    if (st.size > 10240) {
      await fs.copyFile(fb, dest);
      console.log(`✓ ${spec.out} (${(st.size / 1024).toFixed(1)} KB) [fallback ${spec.fallback}]`);
      return true;
    }
  }
  return false;
}

async function run() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await copyDracoDecoders();
  let ok = 0;
  for (const spec of MODEL_SPECS) {
    if (await installOne(spec)) ok += 1;
  }
  console.log(`\nVerified ${ok}/${MODEL_SPECS.length} AAA .glb models in ${OUT_DIR}`);
}

run();
