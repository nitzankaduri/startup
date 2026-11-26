import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_GLTF_DIR = path.join(ROOT, 'node_modules', 'three', 'examples', 'models', 'gltf');
const THREE_DRACO_DIR = path.join(ROOT, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');
const MODELS_DIR = path.join(ROOT, 'public', 'models');
const DRACO_OUT = path.join(ROOT, 'public', 'draco');

const LOCAL_MODELS = [
  { name: 'RobotExpressive.glb', seed: 'enemy_bot.glb' },
  { name: 'ferrari.glb', seed: 'sports_car.glb' },
  { name: 'Xbot.glb', seed: 'cyber_hero.glb' },
  { name: 'Fox.glb', seed: 'Fox.glb' },
  { name: 'Flamingo.glb', seed: 'flying_creature.glb' },
  { name: 'Soldier.glb', seed: 'hero_runner.glb' },
];

fs.mkdirSync(THREE_GLTF_DIR, { recursive: true });
fs.mkdirSync(MODELS_DIR, { recursive: true });
fs.mkdirSync(DRACO_OUT, { recursive: true });

if (fs.existsSync(THREE_DRACO_DIR)) {
  for (const file of fs.readdirSync(THREE_DRACO_DIR)) {
    fs.copyFileSync(path.join(THREE_DRACO_DIR, file), path.join(DRACO_OUT, file));
  }
}

for (const { name, seed } of LOCAL_MODELS) {
  const threeSrc = path.join(THREE_GLTF_DIR, name);
  const seedPath = path.join(MODELS_DIR, seed);
  const destPath = path.join(MODELS_DIR, name);

  if (!fs.existsSync(threeSrc) && fs.existsSync(seedPath)) {
    fs.copyFileSync(seedPath, threeSrc);
  }
  fs.copyFileSync(threeSrc, destPath);
  const sizeKb = (fs.statSync(destPath).size / 1024).toFixed(1);
  console.log(`✓ Copied local ${name.padEnd(22)} -> public/models/${name} (${sizeKb} KB)`);
}
