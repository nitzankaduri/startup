export function buildShareUrl(gameId) {
  const id = encodeURIComponent(gameId || 'world');
  return typeof window !== 'undefined' ? `${window.location.origin}/play/${id}` : `https://spawn.gg/play/${id}`;
}

export function buildEmbedSnippet({ url, width = '960', height = '600', responsive = true, hideWatermark = false }) {
  const src = `${url}?embed=1${hideWatermark ? '&watermark=0' : ''}`;
  const attrs = `src="${src}" allow="autoplay; fullscreen; pointer-events: *; pointer-lock" allowfullscreen loading="lazy" style="border:0;border-radius:16px;"`;
  if (responsive) {
    return `<div style="position:relative;width:100%;padding-bottom:56.25%;overflow:hidden;border-radius:16px;">\n  <iframe ${attrs.replace('style="border:0;border-radius:16px;"', 'style="position:absolute;inset:0;width:100%;height:100%;border:0;"')}></iframe>\n</div>`;
  }
  return `<iframe width="${width}" height="${height}" ${attrs}></iframe>`;
}

export function buildQrCells(seedText = 'spawn.gg') {
  const size = 21;
  const cells = Array.from({ length: size }, () => Array(size).fill(false));
  const drawFinder = (ox, oy) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[oy + y][ox + x] = edge || inner;
      }
    }
  };
  drawFinder(0, 0); drawFinder(size - 7, 0); drawFinder(0, size - 7);
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) { h ^= seedText.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if ((x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8)) continue;
      h = Math.imul(h ^ (x * 31 + y * 17), 2246822519) >>> 0;
      cells[y][x] = (h % 11) < 5;
    }
  }
  return cells;
}

export function buildStandaloneHtml(game) {
  const title = (game?.title || 'Spawn.gg 3D World').replace(/[<>&"]/g, '');
  const cfg = game?.game_config || {};
  const payload = JSON.stringify({ id: game?.id, title, game_config: cfg }).replace(/<\/script/gi, '<\\/script');
  const originUrl = buildShareUrl(game?.id);
  const hint = (cfg.controls_hint || 'WASD move · Space jump · R restart').replace(/[<>&"]/g, '');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title} — Standalone Playable Build</title>
<style>
  html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#0A0D14;color:#F1F5F9;font-family:Inter,system-ui,sans-serif}
  #hud{position:fixed;top:16px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;pointer-events:none;z-index:10}
  .pill{pointer-events:auto;background:rgba(17,22,34,.88);border:1px solid #232E42;padding:8px 14px;border-radius:14px;font-size:13px;backdrop-filter:blur(8px)}
  .btn{background:#D96B27;color:#fff;border:0;border-radius:10px;padding:7px 14px;font-weight:600;cursor:pointer;text-decoration:none}
  #c{display:block;width:100vw;height:100vh}
</style>
</head>
<body>
<div id="hud">
  <div class="pill"><strong>${title}</strong> &middot; <span style="color:#94A3B8">${hint}</span></div>
  <a class="pill btn" href="${originUrl}" target="_blank" rel="noopener">Launch Full Cloud Studio</a>
</div>
<canvas id="c"></canvas>
<script>window.__SPAWN_GAME_BUNDLE__ = ${payload};</script>
<script type="module">
import * as THREE from 'https://unpkg.com/three@0.169.0/build/three.module.js';
const bundle = window.__SPAWN_GAME_BUNDLE__;
const env = (bundle.game_config && bundle.game_config.environment) || {};
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight); renderer.shadowMap.enabled = true;
const scene = new THREE.Scene(); scene.background = new THREE.Color(env.sky_color || '#1D273B'); scene.fog = new THREE.FogExp2(env.fog_color || '#1D273B', 0.012);
const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300); cam.position.set(0, 6, 12);
scene.add(new THREE.HemisphereLight('#FFF4DC', '#2C313C', 0.9));
const sun = new THREE.DirectionalLight('#FFE8C2', 2.2); sun.position.set(20, 28, 16); sun.castShadow = true; scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ color: env.ground_color || '#383532', roughness: 0.85 }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const hero = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.9, 6, 12), new THREE.MeshStandardMaterial({ color: '#D96B27', roughness: 0.45 }));
hero.position.set(0, 0.95, 0); hero.castShadow = true; scene.add(hero);
const keys = {}; addEventListener('keydown', (e) => (keys[e.code] = true)); addEventListener('keyup', (e) => (keys[e.code] = false));
addEventListener('resize', () => { cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
const clk = new THREE.Clock();
(function loop() {
  requestAnimationFrame(loop); const dt = Math.min(0.05, clk.getDelta()); const spd = ((bundle.game_config && bundle.game_config.player && bundle.game_config.player.speed) || 9) * dt;
  if (keys.KeyW || keys.ArrowUp) hero.position.z -= spd; if (keys.KeyS || keys.ArrowDown) hero.position.z += spd;
  if (keys.KeyA || keys.ArrowLeft) hero.position.x -= spd; if (keys.KeyD || keys.ArrowRight) hero.position.x += spd;
  cam.position.lerp(new THREE.Vector3(hero.position.x, hero.position.y + 5.5, hero.position.z + 10.5), 0.1); cam.lookAt(hero.position);
  renderer.render(scene, cam);
})();
</script>
</body>
</html>`;
}

export function downloadTextFile(filename, content, mime = 'text/html;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
