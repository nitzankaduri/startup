import { playArcadeSfx } from './ArcadeSoundEngine';
import { radarBus } from '../sdk/navigation/radarBus';

export function syncSandboxRadarBlips(st) {
  if (!st?.isSandbox) return;
  radarBus.blips.clear();
  if (st.mission) radarBus.blips.set('mission', { id: 'mission', type: 'objective', position: [st.mission.x, 0, st.mission.z], label: st.mission.title });
  st.vehicles.forEach((v, i) => { if (v.alive && !v.occupied) radarBus.blips.set(`v${i}`, { id: `v${i}`, type: 'vehicle', position: [v.x, 0, v.z] }); });
  st.enemies.forEach((e, i) => { if (e.alive) radarBus.blips.set(`e${i}`, { id: `e${i}`, type: 'enemy', position: [e.x, 0, e.z] }); });
}

const MISSION_ROTATION = ['reach_beacon', 'eliminate_boss', 'deliver_cargo', 'escape_pursuit'];

export function addWantedHeat(st, amount, now) {
  st.heat = Math.min(5.0, (st.heat || 0) + amount);
  st.wantedStars = Math.min(5, Math.ceil(st.heat));
  st.lastCrimeAt = now;
}

export function createNextMission(st, idx = 0) {
  const kind = MISSION_ROTATION[idx % MISSION_ROTATION.length];
  const pts = st.beacons || [[60, -60], [-60, -20], [20, 60], [-60, 60]];
  const [bx, bz] = pts[(idx * 2 + 1) % pts.length];
  const [dx, dz] = pts[(idx * 2 + 3) % pts.length];

  if (kind === 'eliminate_boss') {
    st.boss.spawned = true; st.boss.alive = true;
    st.boss.x = bx; st.boss.y = 1.8; st.boss.z = bz;
    st.boss.hp = st.boss.maxHp;
    return { idx, kind, title: 'Eliminate Boss Target', x: bx, z: bz, stage: 0, timer: 0 };
  }
  if (kind === 'deliver_cargo') {
    return { idx, kind, title: 'Pick Up Stolen Cargo', x: bx, z: bz, dropX: dx, dropZ: dz, stage: 0, timer: 0 };
  }
  if (kind === 'escape_pursuit') {
    st.heat = Math.max(st.heat || 0, 3.0);
    st.wantedStars = Math.max(st.wantedStars || 0, 3);
    st.lastCrimeAt = performance.now();
    return { idx, kind, title: 'Escape 3-Star Pursuit', x: dx, z: dz, stage: 0, timer: 18.0 };
  }
  return { idx, kind: 'reach_beacon', title: 'Reach Mission Beacon', x: bx, z: bz, stage: 0, timer: 0 };
}

function completeMission(st, now, cb, spawnBurst) {
  st.missionsDone = (st.missionsDone || 0) + 1;
  st.score += 350;
  st.heat = Math.max(0, (st.heat || 0) - 1.5);
  st.wantedStars = Math.ceil(st.heat);
  playArcadeSfx('victory');
  spawnBurst(st, st.px, st.py + 1.2, st.pz, 'coin', 16);
  cb.onEvent?.('mission', st);
  if (st.missionsDone >= (st.targetMissions || 4)) {
    cb.onWin?.(st);
    return;
  }
  st.mission = createNextMission(st, st.missionsDone);
  st.lastCrimeAt = now;
}

export function stepOpenWorldMissions(st, dt, now, cb, spawnBurst) {
  if (st.heat > 0 && now - (st.lastCrimeAt || 0) > 9500) {
    st.heat = Math.max(0, st.heat - dt * 0.28);
    st.wantedStars = st.heat > 0.05 ? Math.ceil(st.heat) : 0;
  }

  for (let i = 0; i < (st.props?.length || 0); i += 1) {
    const p = st.props[i];
    if (!p.alive) continue;
    const hitByCar = st.inVehicleIdx >= 0 && Math.abs(st.curSpeed) > 5 && Math.hypot(st.px - p.x, st.pz - p.z) < 2.0;
    let hitByShot = false;
    for (let s = 0; s < st.shots.length; s += 1) {
      if (st.shots[s].alive && Math.hypot(st.shots[s].x - p.x, st.shots[s].z - p.z) < 1.2) {
        st.shots[s].alive = false; hitByShot = true; break;
      }
    }
    if (hitByCar || hitByShot) {
      p.alive = false; st.score += 35;
      addWantedHeat(st, 0.35, now);
      spawnBurst(st, p.x, p.y + 0.4, p.z, 'spark', 10);
      playArcadeSfx('hit');
    }
  }

  const m = st.mission;
  if (!m) return;
  if (m.kind === 'reach_beacon' && Math.hypot(st.px - m.x, st.pz - m.z) < 4.2) {
    completeMission(st, now, cb, spawnBurst);
  } else if (m.kind === 'deliver_cargo') {
    if (m.stage === 0 && Math.hypot(st.px - m.x, st.pz - m.z) < 4.2) {
      m.stage = 1; m.x = m.dropX; m.z = m.dropZ; m.title = 'Deliver Stolen Cargo';
      playArcadeSfx('powerup'); spawnBurst(st, st.px, st.py + 1.0, st.pz, 'coin', 10);
    } else if (m.stage === 1 && Math.hypot(st.px - m.x, st.pz - m.z) < 4.5) {
      completeMission(st, now, cb, spawnBurst);
    }
  } else if (m.kind === 'eliminate_boss' && !st.boss.alive) {
    completeMission(st, now, cb, spawnBurst);
  } else if (m.kind === 'escape_pursuit') {
    m.timer = Math.max(0, m.timer - dt);
    if (m.timer <= 0 || Math.hypot(st.px - m.x, st.pz - m.z) < 4.2) {
      completeMission(st, now, cb, spawnBurst);
    }
  }
}

export function formatSandboxHud(st) {
  const m = st.mission;
  return {
    goalType: 'open_world_sandbox',
    goalLabel: m ? `${m.title} (${(st.missionsDone || 0) + 1}/${st.targetMissions || 4})` : 'Open World',
    goalValue: m?.kind === 'escape_pursuit' ? `${Math.ceil(m.timer)}s` : `$${st.score}`,
    goalPct: Math.min(100, (((st.missionsDone || 0) / Math.max(1, st.targetMissions || 4)) * 100) || 12),
    wantedStars: st.wantedStars || 0,
    inVehicle: st.inVehicleIdx >= 0,
    nearVehicle: st.nearVehicle,
  };
}
