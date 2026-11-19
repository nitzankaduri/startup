import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { isPowerupActive, motionBus } from '../sdk/spawnSdk';

export function PowerupPickupProp({ type = 'jetpack' }) {
  if (type === 'magnet') {
    return (
      <group>
        <mesh rotation={[0, 0, Math.PI]} castShadow>
          <torusGeometry args={[0.26, 0.08, 10, 20, Math.PI]} />
          <meshStandardMaterial color="#9A3412" roughness={0.4} metalness={0.35} />
        </mesh>
        {[-0.26, 0.26].map((x) => (
          <mesh key={x} position={[x, 0.08, 0]} castShadow>
            <boxGeometry args={[0.14, 0.16, 0.14]} />
            <meshStandardMaterial color="#D4D4D8" metalness={0.75} roughness={0.22} />
          </mesh>
        ))}
      </group>
    );
  }
  if (type === 'sneakers') {
    return (
      <group>
        <RoundedBox args={[0.42, 0.2, 0.56]} radius={0.06} castShadow>
          <meshStandardMaterial color="#D96B27" roughness={0.45} metalness={0.15} />
        </RoundedBox>
        <RoundedBox args={[0.44, 0.08, 0.58]} radius={0.02} position={[0, -0.1, 0]}>
          <meshStandardMaterial color="#F6F4EF" roughness={0.6} />
        </RoundedBox>
      </group>
    );
  }
  if (type === 'multiplier') {
    return (
      <group>
        <mesh castShadow>
          <octahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial color="#E5B869" metalness={0.78} roughness={0.18} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.44, 0.04, 8, 24]} />
          <meshStandardMaterial color="#FFF3E0" metalness={0.75} roughness={0.2} />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {[-0.14, 0.14].map((x) => (
        <mesh key={x} position={[x, 0, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.13, 0.5, 12]} />
          <meshStandardMaterial color="#D4D4D8" metalness={0.7} roughness={0.25} />
        </mesh>
      ))}
      <RoundedBox args={[0.36, 0.22, 0.14]} radius={0.04} position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#D96B27" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

export function PowerupSystem() {
  const rootRef = useRef(null);
  const jetRef = useRef(null);
  const magRef = useRef(null);
  const sneakRef = useRef(null);
  const multRef = useRef(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const p = motionBus.pos;
    if (rootRef.current) {
      rootRef.current.position.set(p.x, p.y, p.z);
      rootRef.current.rotation.z = -motionBus.steer * 0.22;
    }
    if (jetRef.current) {
      jetRef.current.visible = isPowerupActive('jetpack');
      if (jetRef.current.visible) {
        jetRef.current.children.forEach((c, idx) => {
          if (idx >= 2) c.scale.y = 0.8 + Math.sin(t * 28 + idx) * 0.35;
        });
      }
    }
    if (magRef.current) {
      magRef.current.visible = isPowerupActive('magnet');
      if (magRef.current.visible) {
        const s = 1 + (t * 1.8 % 1) * 1.6;
        magRef.current.scale.setScalar(s);
        magRef.current.rotation.z = t * 1.5;
      }
    }
    if (sneakRef.current) {
      sneakRef.current.visible = isPowerupActive('sneakers');
      if (sneakRef.current.visible) sneakRef.current.position.y = -0.58 + Math.sin(t * 14) * 0.05;
    }
    if (multRef.current) {
      multRef.current.visible = isPowerupActive('multiplier');
      if (multRef.current.visible) multRef.current.rotation.y = t * 2.2;
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={jetRef} visible={false} position={[0, 0.05, 0.3]}>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow><cylinderGeometry args={[0.1, 0.12, 0.48, 12]} /><meshStandardMaterial color="#D4D4D8" metalness={0.75} roughness={0.22} /></mesh>
        ))}
        {[-0.14, 0.14].map((x) => (
          <mesh key={`f-${x}`} position={[x, -0.38, 0]}><coneGeometry args={[0.09, 0.42, 8]} /><meshBasicMaterial color="#FFF3E0" transparent opacity={0.85} /></mesh>
        ))}
      </group>
      <mesh ref={magRef} visible={false} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.03, 8, 28]} />
        <meshBasicMaterial color="#E5B869" transparent opacity={0.45} />
      </mesh>
      <group ref={sneakRef} visible={false} position={[0, -0.58, 0]}>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.14, 0.035, 8, 16]} /><meshStandardMaterial color="#D96B27" metalness={0.5} roughness={0.35} /></mesh>
        ))}
      </group>
      <mesh ref={multRef} visible={false} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.035, 8, 28]} />
        <meshStandardMaterial color="#E5B869" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
