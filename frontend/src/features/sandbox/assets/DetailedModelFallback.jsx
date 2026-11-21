/** High-detail multi-part fallback builders (wheels, spoilers, glass windshields, glowing taillights) when .glb is loading or offline. */
function DetailedCar({ color = '#D96B27', police = false }) {
  const bodyColor = police ? '#1A2130' : color;
  return (
    <group>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow><boxGeometry args={[1.78, 0.44, 3.86]} /><meshStandardMaterial color={bodyColor} metalness={0.62} roughness={0.26} /></mesh>
      {police && <mesh position={[0, 0.5, 0.04]} castShadow><boxGeometry args={[1.81, 0.4, 1.5]} /><meshStandardMaterial color="#F6F4EF" roughness={0.38} /></mesh>}
      <mesh position={[0, 0.88, 0.14]} castShadow><boxGeometry args={[1.46, 0.42, 1.82]} /><meshPhysicalMaterial color="#182232" roughness={0.08} metalness={0.18} clearcoat={1} clearcoatRoughness={0.08} opacity={0.92} transparent /></mesh>
      <mesh position={[0, 0.98, 1.66]} castShadow><boxGeometry args={[1.56, 0.08, 0.34]} /><meshStandardMaterial color="#1F242D" metalness={0.5} roughness={0.35} /></mesh>
      {[-0.56, 0.56].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.84, 1.66]}><boxGeometry args={[0.09, 0.28, 0.18]} /><meshStandardMaterial color="#181715" roughness={0.6} /></mesh>
          <mesh position={[x, 0.54, 1.94]}><boxGeometry args={[0.42, 0.12, 0.06]} /><meshStandardMaterial color="#EF4444" emissive="#DC2626" emissiveIntensity={2.0} toneMapped={false} /></mesh>
          <mesh position={[x, 0.48, -1.94]}><boxGeometry args={[0.34, 0.12, 0.06]} /><meshStandardMaterial color="#FFF3D6" emissive="#FFF3D6" emissiveIntensity={1.8} toneMapped={false} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.24, -1.86]} castShadow><boxGeometry args={[1.72, 0.1, 0.24]} /><meshStandardMaterial color="#181715" roughness={0.55} metalness={0.35} /></mesh>
      {police && <mesh position={[0, 1.18, 0.1]}><boxGeometry args={[0.92, 0.12, 0.24]} /><meshStandardMaterial color="#D96B27" emissive="#F59E0B" emissiveIntensity={2.1} toneMapped={false} /></mesh>}
      {[-0.88, 0.88].flatMap((sx) => [-1.14, 1.14].map((sz) => (
        <group key={`${sx}-${sz}`} position={[sx, 0.34, sz]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.34, 0.34, 0.24, 14]} /><meshStandardMaterial color="#171717" roughness={0.86} /></mesh>
          <mesh><cylinderGeometry args={[0.2, 0.2, 0.26, 10]} /><meshStandardMaterial color="#D4D4D8" metalness={0.88} roughness={0.2} /></mesh>
        </group>
      )))}
    </group>
  );
}

export function DetailedModelFallback({ kind = 'scifi_crate', color = '#D96B27' }) {
  if (kind === 'sports_car') return <DetailedCar color={color} />;
  if (kind === 'police_cruiser') return <DetailedCar color="#1A2130" police />;
  if (kind === 'skyscraper') {
    return (
      <group>
        <mesh position={[0, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[6.2, 2.2, 6.2]} /><meshStandardMaterial color="#D6CFC2" roughness={0.82} /></mesh>
        <mesh position={[0, 8.5, 0]} castShadow receiveShadow><boxGeometry args={[4.8, 12.6, 4.8]} /><meshPhysicalMaterial color="#1E293B" metalness={0.55} roughness={0.14} clearcoat={0.8} /></mesh>
        <mesh position={[0, 15.1, 0]} castShadow><boxGeometry args={[5.2, 0.65, 5.2]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} /></mesh>
      </group>
    );
  }
  if (kind === 'tree') {
    return (
      <group>
        <mesh position={[0, 0.9, 0]} castShadow><cylinderGeometry args={[0.24, 0.38, 1.8, 10]} /><meshStandardMaterial color="#6D4E38" roughness={0.9} /></mesh>
        <mesh position={[0, 2.2, 0]} castShadow><coneGeometry args={[1.45, 1.8, 9]} /><meshStandardMaterial color="#3B6347" roughness={0.84} flatShading /></mesh>
        <mesh position={[0, 3.4, 0]} castShadow><coneGeometry args={[1.05, 1.6, 9]} /><meshStandardMaterial color="#4F7959" roughness={0.8} flatShading /></mesh>
      </group>
    );
  }
  if (kind === 'rock') {
    return (
      <group>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow><dodecahedronGeometry args={[0.92, 0]} /><meshStandardMaterial color="#756E65" roughness={0.92} flatShading /></mesh>
        <mesh position={[0.55, 0.35, 0.25]} castShadow><dodecahedronGeometry args={[0.5, 0]} /><meshStandardMaterial color="#5E5850" roughness={0.94} flatShading /></mesh>
      </group>
    );
  }
  if (kind === 'coin') {
    return (
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.14, 18]} />
        <meshStandardMaterial color="#E5B869" metalness={0.88} roughness={0.2} emissive="#D97706" emissiveIntensity={0.45} />
      </mesh>
    );
  }
  if (kind === 'drone') {
    return (
      <group>
        <mesh position={[0, 0.65, 0]} castShadow><boxGeometry args={[0.82, 0.42, 0.82]} /><meshStandardMaterial color="#27303F" metalness={0.68} roughness={0.3} /></mesh>
        <mesh position={[0, 0.68, -0.43]}><boxGeometry args={[0.56, 0.12, 0.08]} /><meshStandardMaterial color="#F59E0B" emissive="#D96B27" emissiveIntensity={2.0} toneMapped={false} /></mesh>
        {[-0.65, 0.65].flatMap((rx) => [-0.65, 0.65].map((rz) => (
          <mesh key={`${rx}-${rz}`} position={[rx, 0.72, rz]}><cylinderGeometry args={[0.28, 0.28, 0.09, 10]} /><meshStandardMaterial color="#3F4756" metalness={0.75} roughness={0.28} /></mesh>
        )))}
      </group>
    );
  }
  if (kind === 'spaceship') {
    return (
      <group>
        <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.16, 0.45, 3.1, 10]} /><meshStandardMaterial color="#E6E2D8" metalness={0.62} roughness={0.28} /></mesh>
        <mesh position={[0, 0.48, 0.22]} castShadow><boxGeometry args={[2.8, 0.1, 1.05]} /><meshStandardMaterial color={color} metalness={0.5} roughness={0.35} /></mesh>
        <mesh position={[0, 0.78, -0.15]}><boxGeometry args={[0.56, 0.3, 1.0]} /><meshPhysicalMaterial color="#1E293B" roughness={0.1} clearcoat={1} /></mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 1.1, 1.1]} /><meshStandardMaterial color="#3B424E" metalness={0.48} roughness={0.5} /></mesh>
      <mesh position={[0, 1.02, 0]}><boxGeometry args={[1.18, 0.16, 1.18]} /><meshStandardMaterial color="#A39E93" metalness={0.75} roughness={0.32} /></mesh>
      <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.62, 0.12, 1.14]} /><meshStandardMaterial color="#D96B27" emissive="#D96B27" emissiveIntensity={1.2} /></mesh>
    </group>
  );
}
