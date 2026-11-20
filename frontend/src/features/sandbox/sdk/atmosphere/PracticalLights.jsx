import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from '../runtime/useArenaPhysics';

const ANCHOR_ANGLES = [0, 0.785, 1.571, 2.356, 3.142, 3.927, 4.712, 5.498];

/** Practical warm lantern posts & point lights during midnight or golden_hour moods (zero neon). */
export function PracticalLights({ enabled = false, radius = 19, color = '#FDBA74', intensity = 14 }) {
  const lightRefs = useRef([]);

  const anchors = useMemo(() => ANCHOR_ANGLES.map((ang, idx) => {
    const r = radius + (idx % 2 === 0 ? 0 : 6);
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const y = getTerrainHeight(x, z);
    return { x, y, z, hasPoint: idx % 2 === 0 };
  }), [radius]);

  useFrame((state) => {
    if (!enabled) return;
    const t = state.clock.elapsedTime;
    lightRefs.current.forEach((lgt, idx) => {
      if (!lgt) return;
      lgt.intensity = intensity * (0.88 + Math.sin(t * 5.2 + idx * 1.7) * 0.12);
    });
  });

  if (!enabled) return null;

  let lightSlot = 0;
  return (
    <group>
      {anchors.map((a, idx) => {
        const slot = a.hasPoint ? lightSlot++ : -1;
        return (
          <group key={idx} position={[a.x, a.y, a.z]}>
            <mesh position={[0, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.1, 0.14, 3.2, 8]} />
              <meshStandardMaterial color="#333740" roughness={0.78} metalness={0.45} />
            </mesh>
            <mesh position={[0, 3.25, 0]}>
              <cylinderGeometry args={[0.28, 0.22, 0.12, 6]} />
              <meshStandardMaterial color="#272A32" roughness={0.65} metalness={0.5} />
            </mesh>
            <mesh position={[0, 3.0, 0]}>
              <sphereGeometry args={[0.2, 10, 10]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.85} roughness={0.2} />
            </mesh>
            {a.hasPoint && (
              <pointLight
                ref={(el) => { lightRefs.current[slot] = el; }}
                position={[0, 3.05, 0]}
                color={color}
                intensity={intensity}
                distance={22}
                decay={2}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}
