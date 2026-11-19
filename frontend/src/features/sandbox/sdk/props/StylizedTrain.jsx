import { RoundedBox } from '@react-three/drei';

export function StylizedRampTrain({ w = 2.4, h = 1.3, d = 4.5 }) {
  return (
    <group rotation={[-0.28, 0, 0]}>
      <RoundedBox args={[w, 0.36, d]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#7A6747" roughness={0.75} metalness={0.1} />
      </RoundedBox>
      {[-0.3, 0, 0.3].map((zOff, i) => (
        <RoundedBox key={i} args={[w * 0.72, 0.05, 0.42]} radius={0.02} position={[0, 0.2, zOff * d]}>
          <meshStandardMaterial color={i % 2 === 0 ? '#E5B869' : '#181715'} roughness={0.45} metalness={0.2} />
        </RoundedBox>
      ))}
      {[-w * 0.46, w * 0.46].map((x) => (
        <RoundedBox key={x} args={[0.14, 0.24, d * 0.96]} radius={0.03} position={[x, 0.24, 0]} castShadow>
          <meshStandardMaterial color="#2E2C28" roughness={0.6} metalness={0.3} />
        </RoundedBox>
      ))}
    </group>
  );
}

export function StylizedTrain({ w = 2.5, h = 2.4, d = 11 }) {
  const bodyH = h * 0.8;
  return (
    <group>
      <RoundedBox args={[w, bodyH, d]} radius={0.18} smoothness={4} position={[0, 0.12, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#27303A" roughness={0.48} metalness={0.25} />
      </RoundedBox>
      <RoundedBox args={[w + 0.06, 0.15, d * 0.96]} radius={0.03} position={[0, 0.02, 0]}>
        <meshStandardMaterial color="#D4D4D8" roughness={0.28} metalness={0.68} />
      </RoundedBox>
      <RoundedBox args={[w * 0.78, bodyH * 0.34, 0.08]} radius={0.04} position={[0, 0.36, d / 2 - 0.02]}>
        <meshStandardMaterial color="#181715" roughness={0.18} metalness={0.6} />
      </RoundedBox>
      {[-w * 0.28, w * 0.28].map((x) => (
        <RoundedBox key={x} args={[0.32, 0.18, 0.08]} radius={0.03} position={[x, -0.22, d / 2 - 0.01]}>
          <meshStandardMaterial color="#FFF3E0" roughness={0.15} metalness={0.1} />
        </RoundedBox>
      ))}
      {[-0.28, 0, 0.28].map((zOff, idx) => (
        <group key={idx}>
          <mesh position={[-w / 2 - 0.01, 0.34, zOff * d]}>
            <boxGeometry args={[0.04, 0.44, 1.4]} />
            <meshStandardMaterial color="#181715" roughness={0.2} metalness={0.55} />
          </mesh>
          <mesh position={[w / 2 + 0.01, 0.34, zOff * d]}>
            <boxGeometry args={[0.04, 0.44, 1.4]} />
            <meshStandardMaterial color="#181715" roughness={0.2} metalness={0.55} />
          </mesh>
        </group>
      ))}
      {[-0.24, 0.24].map((zOff, i) => (
        <RoundedBox key={i} args={[w * 0.52, 0.22, 1.5]} radius={0.05} position={[0, bodyH * 0.5 + 0.2, zOff * d]} castShadow>
          <meshStandardMaterial color="#52525B" roughness={0.55} metalness={0.35} />
        </RoundedBox>
      ))}
      <RoundedBox args={[w * 0.82, 0.28, d * 0.86]} radius={0.05} position={[0, -bodyH * 0.5 + 0.02, 0]}>
        <meshStandardMaterial color="#181715" roughness={0.82} />
      </RoundedBox>
      {[-d * 0.34, -d * 0.18, d * 0.18, d * 0.34].map((wz, i) => (
        <group key={i} position={[0, -bodyH * 0.5 - 0.05, wz]}>
          {[-w * 0.38, w * 0.38].map((wx) => (
            <mesh key={wx} position={[wx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.24, 0.24, 0.16, 12]} />
              <meshStandardMaterial color="#71717A" roughness={0.4} metalness={0.65} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
