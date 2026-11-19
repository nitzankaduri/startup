import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const MAX_MARKS = 64;

/** Pooled ground skid mark stamps emitted during handbrake drifts. */
export function SkidMarks({ driftRef = null, active = false, x = 0, z = 0, yaw = 0, color = '#181715' }) {
  const meshesRef = useRef([]);
  const poolRef = useRef([]);
  const cursorRef = useRef(0);
  const lastEmitRef = useRef({ x: 999, z: 999 });

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const pool = poolRef.current;
    if (!pool.length) {
      for (let i = 0; i < MAX_MARKS; i += 1) pool.push({ life: 0, x: 0, z: 0, yaw: 0 });
    }

    const src = driftRef?.current;
    const isActive = src ? src.active : active;
    const curX = src ? src.x : x;
    const curZ = src ? src.z : z;
    const curYaw = src ? src.yaw : yaw;

    if (isActive && Math.hypot(curX - lastEmitRef.current.x, curZ - lastEmitRef.current.z) > 0.45) {
      lastEmitRef.current = { x: curX, z: curZ };
      const cos = Math.cos(curYaw);
      const sin = Math.sin(curYaw);
      [-0.68, 0.68].forEach((side) => {
        const slot = pool[cursorRef.current % MAX_MARKS];
        cursorRef.current += 1;
        slot.life = 3.2;
        slot.x = curX + cos * side + sin * 0.85;
        slot.z = curZ - sin * side + cos * 0.85;
        slot.yaw = curYaw;
      });
    }

    for (let i = 0; i < MAX_MARKS; i += 1) {
      const m = meshesRef.current[i];
      const s = pool[i];
      if (!m || !s) continue;
      if (s.life <= 0) { m.visible = false; continue; }
      s.life -= dt;
      m.visible = s.life > 0;
      m.position.set(s.x, 0.03, s.z);
      m.rotation.set(-Math.PI / 2, 0, -s.yaw);
      m.material.opacity = Math.min(0.45, (s.life / 3.2) * 0.45);
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_MARKS }).map((_, i) => (
        <mesh key={i} ref={(el) => { meshesRef.current[i] = el; }} visible={false}>
          <planeGeometry args={[0.26, 0.58]} />
          <meshBasicMaterial color={color} transparent depthWrite={false} opacity={0} />
        </mesh>
      ))}
    </group>
  );
}
