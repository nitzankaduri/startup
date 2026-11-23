import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/** Chunky stylized cartoon car / police cruiser with oversized wheels, tinted glass, spoiler & lightbar. */
export function CartoonCarPrefab({ color = '#D96B27', police = false }) {
  const coat = police ? '#1E293B' : color;
  return (
    <group>
      <RoundedBox args={[1.88, 0.64, 3.85]} radius={0.14} position={[0, 0.62, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={coat} />
      </RoundedBox>
      {police && (
        <mesh position={[0, 0.66, 0]} castShadow><boxGeometry args={[1.92, 0.56, 1.45]} /><meshStandardMaterial color="#FFFBEB" /></mesh>
      )}
      <RoundedBox args={[1.5, 0.54, 1.92]} radius={0.14} position={[0, 1.12, 0.1]} castShadow>
        <meshStandardMaterial color="#0F172A" />
      </RoundedBox>
      <mesh position={[0, 1.12, -0.87]} rotation={[-0.35, 0, 0]}><boxGeometry args={[1.28, 0.42, 0.08]} /><meshStandardMaterial color="#38BDF8" /></mesh>
      <mesh position={[0, 1.14, 1.76]} castShadow><boxGeometry args={[1.78, 0.11, 0.44]} /><meshStandardMaterial color="#1E1B4B" /></mesh>
      {[-0.58, 0.58].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.64, -1.93]}><boxGeometry args={[0.38, 0.18, 0.08]} /><meshStandardMaterial color="#FFFBEB" emissive="#FDE047" emissiveIntensity={1.6} toneMapped={false} /></mesh>
          <mesh position={[x, 0.64, 1.93]}><boxGeometry args={[0.42, 0.16, 0.08]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.8} toneMapped={false} /></mesh>
        </group>
      ))}
      {police && (
        <group position={[0, 1.44, 0.1]}>
          <mesh position={[-0.26, 0, 0]}><boxGeometry args={[0.48, 0.16, 0.28]} /><meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={2.0} toneMapped={false} /></mesh>
          <mesh position={[0.26, 0, 0]}><boxGeometry args={[0.48, 0.16, 0.28]} /><meshStandardMaterial color="#0EA5E9" emissive="#0EA5E9" emissiveIntensity={2.0} toneMapped={false} /></mesh>
        </group>
      )}
      {[-0.98, 0.98].flatMap((wx) => [-1.15, 1.15].map((wz) => (
        <group key={`${wx}-${wz}`} position={[wx, 0.46, wz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.46, 0.46, 0.36, 14]} /><meshStandardMaterial color="#1E1B4B" /></mesh>
          <mesh><cylinderGeometry args={[0.25, 0.25, 0.38, 10]} /><meshStandardMaterial color="#F8FAFC" /></mesh>
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
    spinRef.current.position.y = Math.sin(t * 3.4) * 0.1 + 0.52;
  });

  if (kind === 'powerup_magnet') {
    return (
      <group ref={spinRef} position={[0, 0.56, 0]}>
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
    <group ref={spinRef} position={[0, 0.52, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.45, 0.45, 0.14, 20]} /><meshStandardMaterial color="#FBBF24" emissive="#F59E0B" emissiveIntensity={0.55} /></mesh>
      <mesh><torusGeometry args={[0.44, 0.06, 8, 22]} /><meshStandardMaterial color="#FDE047" /></mesh>
      {[0, Math.PI / 4].map((r) => (
        <mesh key={r} rotation={[0, 0, r]}><boxGeometry args={[0.28, 0.28, 0.2]} /><meshStandardMaterial color="#FFFBEB" emissive="#FBBF24" emissiveIntensity={1.3} toneMapped={false} /></mesh>
      ))}
      <mesh><sphereGeometry args={[0.64, 12, 12]} /><meshBasicMaterial color="#FBBF24" transparent opacity={0.2} /></mesh>
    </group>
  );
}

/** Articulated cartoon runner or chaser guard with cap, hoodie/uniform, sneakers & swinging limbs. */
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
      <RoundedBox args={[0.54, 0.64, 0.36]} radius={0.12} castShadow><meshStandardMaterial color={outfit} /></RoundedBox>
      <RoundedBox args={[0.4, 0.44, 0.22]} radius={0.08} position={[0, 0.04, -0.24]} castShadow><meshStandardMaterial color={guard ? '#334155' : '#D96B27'} /></RoundedBox>
      {guard && <mesh position={[0.14, 0.14, 0.2]}><boxGeometry args={[0.12, 0.14, 0.04]} /><meshStandardMaterial color="#FBBF24" /></mesh>}
      <group position={[0, 0.56, 0]}>
        <RoundedBox args={[0.44, 0.42, 0.42]} radius={0.15} castShadow><meshStandardMaterial color="#FDE68A" /></RoundedBox>
        {[-0.1, 0.1].map((ex) => (
          <mesh key={ex} position={[ex, 0.02, 0.22]}><sphereGeometry args={[0.045, 8, 8]} /><meshStandardMaterial color="#1E1B4B" /></mesh>
        ))}
        <RoundedBox args={[0.48, 0.2, 0.48]} radius={0.07} position={[0, 0.16, 0]} castShadow><meshStandardMaterial color={guard ? '#1E1B4B' : '#D96B27'} /></RoundedBox>
        <mesh position={[0, 0.1, 0.26]}><boxGeometry args={[0.4, 0.06, 0.22]} /><meshStandardMaterial color={guard ? '#FBBF24' : '#D96B27'} /></mesh>
      </group>
      {[-0.38, 0.38].map((x, idx) => (
        <group key={x} ref={idx === 0 ? lArm : rArm} position={[x, 0.18, 0]}>
          <RoundedBox args={[0.17, 0.46, 0.17]} radius={0.06} position={[0, -0.18, 0]} castShadow><meshStandardMaterial color={outfit} /></RoundedBox>
          <mesh position={[0, -0.44, 0]}><sphereGeometry args={[0.09, 8, 8]} /><meshStandardMaterial color="#FDE68A" /></mesh>
        </group>
      ))}
      {[-0.16, 0.16].map((x, idx) => (
        <group key={x} ref={idx === 0 ? lLeg : rLeg} position={[x, -0.32, 0]}>
          <RoundedBox args={[0.18, 0.42, 0.18]} radius={0.05} position={[0, -0.2, 0]} castShadow><meshStandardMaterial color="#1E1B4B" /></RoundedBox>
          <RoundedBox args={[0.24, 0.15, 0.36]} radius={0.05} position={[0, -0.46, -0.06]} castShadow><meshStandardMaterial color={guard ? '#334155' : '#E11D48'} /></RoundedBox>
        </group>
      ))}
    </group>
  );
}
