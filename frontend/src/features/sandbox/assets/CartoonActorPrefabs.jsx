import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/** Chunky stylized cartoon car / police cruiser with oversized wheels, tinted glass, spoiler & lightbar. */
export function CartoonCarPrefab({ color = '#D96B27', police = false }) {
  const coat = police ? '#1E293B' : color;
  return (
    <group>
      <RoundedBox args={[1.88, 0.62, 3.8]} radius={0.14} position={[0, 0.62, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={coat} />
      </RoundedBox>
      {police && (
        <mesh position={[0, 0.66, 0]} castShadow><boxGeometry args={[1.92, 0.56, 1.45]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
      )}
      <RoundedBox args={[1.48, 0.52, 1.9]} radius={0.14} position={[0, 1.12, 0.12]} castShadow>
        <meshStandardMaterial color="#1E293B" />
      </RoundedBox>
      <mesh position={[0, 1.12, 1.75]} castShadow><boxGeometry args={[1.76, 0.1, 0.42]} /><meshStandardMaterial color="#1E1B4B" /></mesh>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.64, 1.92]}><boxGeometry args={[0.42, 0.16, 0.08]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.8} toneMapped={false} /></mesh>
      ))}
      {police && (
        <mesh position={[0, 1.44, 0.12]}><boxGeometry args={[0.98, 0.16, 0.28]} /><meshStandardMaterial color="#F59E0B" emissive="#D96B27" emissiveIntensity={2.0} toneMapped={false} /></mesh>
      )}
      {[-0.96, 0.96].flatMap((wx) => [-1.15, 1.15].map((wz) => (
        <group key={`${wx}-${wz}`} position={[wx, 0.44, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.44, 0.44, 0.34, 14]} /><meshStandardMaterial color="#1E1B4B" /></mesh>
          <mesh><cylinderGeometry args={[0.24, 0.24, 0.36, 10]} /><meshStandardMaterial color="#F8FAFC" /></mesh>
        </group>
      )))}
    </group>
  );
}

/** Spinning beveled gold coin with star emblem, horseshoe magnet, and twin-tank jetpack pickups. */
export function CartoonPickupPrefab({ kind = 'gold_coin' }) {
  const spinRef = useRef(null);
  useFrame(({ clock }) => {
    if (!spinRef.current) return;
    const t = clock.elapsedTime;
    spinRef.current.rotation.y = t * 2.8;
    spinRef.current.position.y = Math.sin(t * 3.4) * 0.1;
  });

  if (kind === 'powerup_magnet') {
    return (
      <group ref={spinRef} position={[0, 0.58, 0]}>
        <mesh rotation={[0, 0, Math.PI]} castShadow><torusGeometry args={[0.36, 0.11, 10, 18, Math.PI]} /><meshStandardMaterial color="#E11D48" /></mesh>
        {[-0.36, 0.36].map((x) => (
          <mesh key={x} position={[x, 0.14, 0]}><boxGeometry args={[0.22, 0.26, 0.22]} /><meshStandardMaterial color="#E2E8F0" /></mesh>
        ))}
        <mesh><sphereGeometry args={[0.62, 12, 12]} /><meshBasicMaterial color="#FBBF24" transparent opacity={0.18} /></mesh>
      </group>
    );
  }

  if (kind === 'jetpack') {
    return (
      <group ref={spinRef} position={[0, 0.62, 0]}>
        {[-0.2, 0.2].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh castShadow><cylinderGeometry args={[0.15, 0.15, 0.82, 12]} /><meshStandardMaterial color="#0EA5E9" /></mesh>
            <mesh position={[0, -0.48, 0]}><coneGeometry args={[0.14, 0.28, 8]} /><meshStandardMaterial color="#F59E0B" emissive="#D96B27" emissiveIntensity={1.8} toneMapped={false} /></mesh>
          </group>
        ))}
        <mesh position={[0, 0.1, 0.1]}><boxGeometry args={[0.52, 0.22, 0.16]} /><meshStandardMaterial color="#FBBF24" /></mesh>
      </group>
    );
  }

  return (
    <group ref={spinRef} position={[0, 0.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.46, 0.46, 0.14, 20]} /><meshStandardMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={0.6} /></mesh>
      <mesh position={[0, 0, 0]}><octahedronGeometry args={[0.22, 0]} /><meshStandardMaterial color="#FFFBEB" emissive="#FBBF24" emissiveIntensity={1.4} toneMapped={false} /></mesh>
      <mesh><sphereGeometry args={[0.62, 12, 12]} /><meshBasicMaterial color="#FBBF24" transparent opacity={0.18} /></mesh>
    </group>
  );
}

/** Articulated cartoon runner or chaser guard with cap, hoodie/uniform, sneakers & animated limbs. */
export function CartoonCharacterPrefab({ color = '#0EA5E9', guard = false }) {
  const lArm = useRef(null), rArm = useRef(null), lLeg = useRef(null), rLeg = useRef(null);
  useFrame(({ clock }) => {
    const s = Math.sin(clock.elapsedTime * 7.5) * 0.65;
    if (lArm.current) lArm.current.rotation.x = -s;
    if (rArm.current) rArm.current.rotation.x = s;
    if (lLeg.current) lLeg.current.rotation.x = s;
    if (rLeg.current) rLeg.current.rotation.x = -s;
  });
  const outfit = guard ? '#1E3A8A' : color;
  return (
    <group position={[0, 0.92, 0]}>
      <RoundedBox args={[0.52, 0.62, 0.36]} radius={0.12} castShadow><meshStandardMaterial color={outfit} /></RoundedBox>
      <group position={[0, 0.56, 0]}>
        <RoundedBox args={[0.44, 0.42, 0.42]} radius={0.15} castShadow><meshStandardMaterial color="#FDE68A" /></RoundedBox>
        <RoundedBox args={[0.46, 0.18, 0.46]} radius={0.07} position={[0, 0.16, 0]} castShadow><meshStandardMaterial color={guard ? '#1E1B4B' : '#D96B27'} /></RoundedBox>
        <mesh position={[0, 0.1, 0.25]}><boxGeometry args={[0.38, 0.06, 0.22]} /><meshStandardMaterial color={guard ? '#FBBF24' : '#D96B27'} /></mesh>
      </group>
      {[-0.36, 0.36].map((x, idx) => (
        <group key={x} ref={idx === 0 ? lArm : rArm} position={[x, 0.18, 0]}>
          <RoundedBox args={[0.16, 0.46, 0.16]} radius={0.05} position={[0, -0.18, 0]} castShadow><meshStandardMaterial color={outfit} /></RoundedBox>
        </group>
      ))}
      {[-0.16, 0.16].map((x, idx) => (
        <group key={x} ref={idx === 0 ? lLeg : rLeg} position={[x, -0.32, 0]}>
          <RoundedBox args={[0.18, 0.42, 0.18]} radius={0.05} position={[0, -0.2, 0]} castShadow><meshStandardMaterial color="#1E1B4B" /></RoundedBox>
          <RoundedBox args={[0.24, 0.14, 0.36]} radius={0.05} position={[0, -0.46, -0.06]} castShadow><meshStandardMaterial color={guard ? '#334155' : '#E11D48'} /></RoundedBox>
        </group>
      ))}
    </group>
  );
}
