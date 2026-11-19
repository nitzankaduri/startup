import { Billboard } from '@react-three/drei';

export function EnemyHPBar({ ratio, yOffset = 1.15 }) {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped >= 1) return null;

  return (
    <Billboard position={[0, yOffset, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.04, 0.14]} />
        <meshBasicMaterial color="#121215" />
      </mesh>
      <mesh position={[-(1 - clamped) * 0.48, 0, 0]}>
        <planeGeometry args={[0.96 * clamped, 0.08]} />
        <meshBasicMaterial color="#FAFAFA" />
      </mesh>
    </Billboard>
  );
}
