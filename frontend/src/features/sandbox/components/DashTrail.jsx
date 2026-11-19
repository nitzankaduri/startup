import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const MAX_TRAIL = 5;

export function DashTrail({ trailRef, color = '#FAFAFA' }) {
  const groupRef = useRef(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const now = performance.now();
    const items = trailRef.current.filter((item) => now - item.at < 260);
    trailRef.current = items;

    for (let i = 0; i < MAX_TRAIL; i += 1) {
      const mesh = group.children[i];
      if (!mesh) continue;
      const item = items[i];
      if (!item) {
        mesh.visible = false;
      } else {
        const life = 1 - (now - item.at) / 260;
        mesh.visible = true;
        mesh.position.set(item.x, item.y, item.z);
        mesh.scale.setScalar(0.55 + life * 0.4);
        mesh.material.opacity = life * 0.28;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: MAX_TRAIL }).map((_, idx) => (
        <mesh key={idx} visible={false}>
          <capsuleGeometry args={[0.3, 0.52, 6, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
