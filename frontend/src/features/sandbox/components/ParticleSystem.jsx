import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';

const DIRS = [
  [1, 0.9, 0], [-1, 0.9, 0], [0, 0.9, 1], [0, 0.9, -1],
  [0.75, 1.3, 0.75], [-0.75, 1.3, 0.75], [0.75, 1.3, -0.75], [-0.75, 1.3, -0.75],
  [0.45, 1.7, 0], [-0.45, 1.7, 0], [0, 1.7, 0.45], [0, 1.7, -0.45],
];

function BurstGroup({ burst, onDone }) {
  const groupRef = useRef(null);
  const ageRef = useRef(0);
  const vectors = useMemo(() => DIRS, []);

  useFrame((_, delta) => {
    ageRef.current += delta;
    const progress = ageRef.current / 0.48;
    if (progress >= 1) {
      onDone(burst.id);
      return;
    }
    if (!groupRef.current) return;
    const scale = Math.max(0.01, (1 - progress) * (1 + progress * 0.4));
    groupRef.current.children.forEach((mesh, idx) => {
      const [dx, dy, dz] = vectors[idx];
      mesh.position.set(dx * progress * 1.9, dy * progress * 1.6, dz * progress * 1.9);
      mesh.scale.setScalar(scale);
      mesh.rotation.x += delta * 8;
      mesh.rotation.y += delta * 8;
    });
  });

  return (
    <group ref={groupRef} position={burst.position}>
      {vectors.map((_, idx) => (
        <mesh key={idx}>
          <octahedronGeometry args={[0.13, 0]} />
          <meshStandardMaterial
            color={burst.color || (idx % 2 === 0 ? '#E5B869' : '#FFF3E0')}
            metalness={0.7}
            roughness={0.22}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ParticleSystem() {
  const bursts = useGameStore((s) => s.bursts);
  const removeBurst = useGameStore((s) => s.removeBurst);

  return (
    <group>
      {bursts.map((burst) => (
        <BurstGroup key={burst.id} burst={burst} onDone={removeBurst} />
      ))}
    </group>
  );
}
