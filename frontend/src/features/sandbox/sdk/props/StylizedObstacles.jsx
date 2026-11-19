import { RoundedBox } from '@react-three/drei';

export function LowHurdleProp({ w = 2.6, h = 1.0, d = 0.7 }) {
  return (
    <group>
      {[-w * 0.38, w * 0.38].map((x) => (
        <group key={x} position={[x, -0.05, 0]}>
          <mesh rotation={[0.22, 0, 0]} position={[0, 0, -0.1]} castShadow>
            <boxGeometry args={[0.12, h * 0.95, 0.12]} />
            <meshStandardMaterial color="#2E2C28" roughness={0.55} metalness={0.45} />
          </mesh>
          <mesh rotation={[-0.22, 0, 0]} position={[0, 0, 0.1]} castShadow>
            <boxGeometry args={[0.12, h * 0.95, 0.12]} />
            <meshStandardMaterial color="#2E2C28" roughness={0.55} metalness={0.45} />
          </mesh>
        </group>
      ))}
      <RoundedBox args={[w, h * 0.42, d * 0.55]} radius={0.05} position={[0, h * 0.24, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F6F4EF" roughness={0.6} />
      </RoundedBox>
      {[-0.32, 0, 0.32].map((xOff, i) => (
        <RoundedBox key={i} args={[w * 0.2, h * 0.44, d * 0.6]} radius={0.03} position={[xOff * w, h * 0.24, 0]}>
          <meshStandardMaterial color="#9A3412" roughness={0.58} />
        </RoundedBox>
      ))}
      {[-w * 0.45, w * 0.45].map((x) => (
        <RoundedBox key={x} args={[0.12, 0.16, d * 0.64]} radius={0.02} position={[x, h * 0.24, 0]}>
          <meshStandardMaterial color="#E5B869" roughness={0.3} metalness={0.5} />
        </RoundedBox>
      ))}
    </group>
  );
}

export function HighBarrierProp({ w = 2.6, h = 1.25, d = 0.7 }) {
  return (
    <group>
      {[-w * 0.46, w * 0.46].map((x) => (
        <RoundedBox key={x} args={[0.18, h + 1.45, 0.2]} radius={0.04} position={[x, -0.7, 0]} castShadow>
          <meshStandardMaterial color="#2E2C28" roughness={0.55} metalness={0.45} />
        </RoundedBox>
      ))}
      <RoundedBox args={[w, h * 0.68, d * 0.7]} radius={0.07} position={[0, 0.12, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7F1D1D" roughness={0.62} metalness={0.15} />
      </RoundedBox>
      {[-0.28, 0.28].map((xOff, i) => (
        <RoundedBox key={i} args={[w * 0.24, h * 0.5, d * 0.76]} radius={0.03} position={[xOff * w, 0.12, 0]}>
          <meshStandardMaterial color="#E5B869" roughness={0.42} metalness={0.25} />
        </RoundedBox>
      ))}
      <RoundedBox args={[w * 0.72, 0.14, d * 0.78]} radius={0.03} position={[0, -h * 0.26, 0]}>
        <meshStandardMaterial color="#181715" roughness={0.7} />
      </RoundedBox>
    </group>
  );
}

export function StylizedCoinProp({ size = 0.34, shadowY = -0.72 }) {
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[size, size, 0.11, 22]} />
        <meshStandardMaterial color="#E5B869" metalness={0.78} roughness={0.18} />
      </mesh>
      <mesh>
        <torusGeometry args={[size * 0.96, 0.045, 10, 26]} />
        <meshStandardMaterial color="#FFF3E0" metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[size * 0.72, size * 0.72, 0.15]} />
        <meshStandardMaterial color="#FFF3E0" metalness={0.82} roughness={0.15} />
      </mesh>
      <mesh rotation={[0, 0, 0]}>
        <boxGeometry args={[size * 0.72, size * 0.72, 0.15]} />
        <meshStandardMaterial color="#FFF3E0" metalness={0.82} roughness={0.15} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, shadowY, 0]}>
        <ringGeometry args={[size * 0.55, size * 0.9, 20]} />
        <meshBasicMaterial color="#181715" transparent opacity={0.26} depthWrite={false} />
      </mesh>
    </group>
  );
}
