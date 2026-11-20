import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { createTrainRoofTexture } from './propTextures';

export function StylizedRampTrain({ w = 2.65, h = 1.65, d = 5.6, position = [0, 0, 0], rotation = [0, 0, 0], centered = false }) {
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, centered ? 0 : h * 0.48, 0]} rotation={[-0.3, 0, 0]}>
        <RoundedBox args={[w, 0.34, d]} radius={0.07} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#F2A444" roughness={0.38} metalness={0.24} clearcoat={0.5} />
        </RoundedBox>
        {[-0.32, -0.1, 0.12, 0.34].map((zOff, i) => (
          <RoundedBox key={i} args={[w * 0.76, 0.06, 0.48]} radius={0.02} position={[0, 0.19, zOff * d]}>
            <meshStandardMaterial color={i % 2 === 0 ? '#FFE066' : '#262A30'} roughness={0.38} metalness={0.2} />
          </RoundedBox>
        ))}
        {[-w * 0.47, w * 0.47].map((x) => (
          <RoundedBox key={x} args={[0.16, 0.3, d * 0.96]} radius={0.03} position={[x, 0.25, 0]} castShadow>
            <meshStandardMaterial color="#343840" roughness={0.42} metalness={0.5} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

/** Signature Subway-Surfers golden-ochre & burgundy metro train with textured louvered roof, dual windshields & LED lights. */
export function StylizedTrain({
  w = 2.8,
  h = 2.75,
  d = 12.2,
  color = '#F4AA4E',
  accent = '#6D2A38',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  centered = false,
}) {
  const roofTex = useMemo(() => createTrainRoofTexture(), []);
  const bodyH = h * 0.78;
  const baseY = centered ? 0 : h * 0.5;
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, baseY, 0]}>
        {/* Golden-ochre painted metro car chassis */}
        <RoundedBox args={[w, bodyH, d]} radius={0.22} smoothness={4} position={[0, 0.06, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color={color} roughness={0.32} metalness={0.24} clearcoat={0.7} clearcoatRoughness={0.16} />
        </RoundedBox>

        {/* Deep burgundy lower livery skirt */}
        <RoundedBox args={[w + 0.05, bodyH * 0.36, d * 0.99]} radius={0.08} position={[0, -bodyH * 0.24, 0]}>
          <meshPhysicalMaterial color={accent} roughness={0.38} metalness={0.25} clearcoat={0.55} />
        </RoundedBox>

        {/* Crisp cream pinstripe */}
        <RoundedBox args={[w + 0.07, 0.09, d * 0.99]} radius={0.02} position={[0, -bodyH * 0.06, 0]}>
          <meshStandardMaterial color="#FFF6E5" roughness={0.3} />
        </RoundedBox>

        {/* Rounded runnable slate-grey roof with recessed vent louver texture */}
        <RoundedBox args={[w * 0.94, 0.36, d * 0.98]} radius={0.15} smoothness={4} position={[0, bodyH * 0.48, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...roofTex} />
        </RoundedBox>

        {/* Twin reflective sky-blue front windshields + top Cyclops headlamp pod */}
        {[-w * 0.23, w * 0.23].map((wx) => (
          <RoundedBox key={wx} args={[w * 0.37, bodyH * 0.35, 0.08]} radius={0.05} position={[wx, 0.28, d / 2 - 0.01]}>
            <meshPhysicalMaterial color="#4C7BA0" roughness={0.06} metalness={0.35} clearcoat={1.0} emissive="#2A4D6E" emissiveIntensity={0.25} />
          </RoundedBox>
        ))}
        <mesh position={[0, bodyH * 0.48, d / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.2, 0.18, 14]} />
          <meshStandardMaterial color="#4A505A" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, bodyH * 0.48, d / 2 + 0.11]}>
          <circleGeometry args={[0.13, 14]} />
          <meshStandardMaterial color="#FFF8E1" emissive="#FFE8A3" emissiveIntensity={1.9} toneMapped={false} />
        </mesh>

        {/* Lower twin silver headlights + glowing ruby nose jewel + steel bumper */}
        {[-w * 0.32, w * 0.32].map((x) => (
          <mesh key={x} position={[x, -0.34, d / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.09, 14]} />
            <meshStandardMaterial color="#FFFDF5" emissive="#FFE8B0" emissiveIntensity={1.9} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, -0.28, d / 2 + 0.04]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshStandardMaterial color="#EF4444" emissive="#F87171" emissiveIntensity={2.1} toneMapped={false} />
        </mesh>
        <RoundedBox args={[w * 0.94, 0.26, 0.24]} radius={0.06} position={[0, -bodyH * 0.44, d / 2 + 0.02]} castShadow>
          <meshStandardMaterial color="#272B33" roughness={0.45} metalness={0.65} />
        </RoundedBox>

        {/* Side passenger windows */}
        {[-0.32, -0.1, 0.12, 0.34].map((zOff, idx) => (
          <group key={idx}>
            <mesh position={[-w / 2 - 0.01, 0.3, zOff * d]}>
              <boxGeometry args={[0.05, 0.58, 1.65]} />
              <meshPhysicalMaterial color="#3A6385" roughness={0.1} metalness={0.4} clearcoat={0.95} />
            </mesh>
            <mesh position={[w / 2 + 0.01, 0.3, zOff * d]}>
              <boxGeometry args={[0.05, 0.58, 1.65]} />
              <meshPhysicalMaterial color="#3A6385" roughness={0.1} metalness={0.4} clearcoat={0.95} />
            </mesh>
          </group>
        ))}

        {/* Undercarriage & steel bogie wheels */}
        <RoundedBox args={[w * 0.82, 0.3, d * 0.88]} radius={0.05} position={[0, -bodyH * 0.5 - 0.02, 0]}>
          <meshStandardMaterial color="#1E2026" roughness={0.8} />
        </RoundedBox>
        {[-d * 0.34, -d * 0.18, d * 0.18, d * 0.34].map((wz, i) => (
          <group key={i} position={[0, -bodyH * 0.5 - 0.12, wz]}>
            {[-w * 0.36, w * 0.36].map((wx) => (
              <mesh key={wx} position={[wx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.25, 0.25, 0.16, 12]} />
                <meshStandardMaterial color="#9CA3AF" roughness={0.32} metalness={0.78} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
