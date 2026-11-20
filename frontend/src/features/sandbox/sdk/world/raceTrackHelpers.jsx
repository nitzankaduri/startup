import * as THREE from 'three';

export const DEFAULT_TRACK_WAYPOINTS = [
  [0, 0, -45], [38, 0, -52], [62, 0, -24], [52, 0, 18],
  [18, 0, 32], [-18, 0, 48], [-54, 0, 34], [-60, 0, -14], [-34, 0, -42],
];

/** Builds banked ribbon road, red/white safety curbs & outer barrier colliders along a closed CatmullRom spline. */
export function buildRaceTrackGeometry(waypoints = DEFAULT_TRACK_WAYPOINTS, width = 16, samples = 96) {
  const pts = (waypoints?.length >= 3 ? waypoints : DEFAULT_TRACK_WAYPOINTS).map(
    (p) => (Array.isArray(p) ? new THREE.Vector3(p[0] || 0, p[1] || 0, p[2] || 0) : new THREE.Vector3(p.x || 0, p.y || 0, p.z || 0))
  );
  const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.45);
  const half = width * 0.5;
  const roadPos = []; const roadUv = []; const roadIdx = [];
  const curbSegs = []; const barriers = []; const gates = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const p = curve.getPointAt(u % 1);
    const t = curve.getTangentAt(u % 1).setY(0).normalize();
    const tNext = curve.getTangentAt(((i + 1) / samples) % 1).setY(0).normalize();
    const right = new THREE.Vector3().crossVectors(t, up).normalize();
    const bank = THREE.MathUtils.clamp((t.x * tNext.z - t.z * tNext.x) * 3.2, -0.14, 0.14);
    const lx = p.x - right.x * half; const lz = p.z - right.z * half;
    const rx = p.x + right.x * half; const rz = p.z + right.z * half;
    const ly = p.y + 0.05 - bank * half * 0.35;
    const ry = p.y + 0.05 + bank * half * 0.35;
    roadPos.push(lx, ly, lz, rx, ry, rz);
    roadUv.push(0, u * 28, 1, u * 28);
    if (i < samples) {
      const b = i * 2;
      roadIdx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      const yaw = Math.atan2(t.x, t.z);
      const segLen = curve.getLength() / samples + 0.35;
      curbSegs.push(
        { x: lx - right.x * 0.45, y: ly + 0.06, z: lz - right.z * 0.45, yaw, len: segLen, red: i % 2 === 0 },
        { x: rx + right.x * 0.45, y: ry + 0.06, z: rz + right.z * 0.45, yaw, len: segLen, red: i % 2 === 0 }
      );
      if (i % 2 === 0) {
        const bOff = half + 1.15;
        barriers.push(
          { id: `rt-bl-${i}`, x: p.x - right.x * bOff, y: ly, z: p.z - right.z * bOff, yaw, len: segLen * 2.05 },
          { id: `rt-br-${i}`, x: p.x + right.x * bOff, y: ry, z: p.z + right.z * bOff, yaw, len: segLen * 2.05 }
        );
      }
      if (i % 16 === 0) gates.push({ id: `gate-${i}`, x: p.x, y: p.y, z: p.z, yaw });
    }
  }

  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadPos, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUv, 2));
  roadGeo.setIndex(roadIdx);
  roadGeo.computeVertexNormals();
  return { roadGeo, curbSegs, barriers, gates };
}
