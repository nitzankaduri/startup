import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { createChevronBarrierTexture, createStarCoinTexture } from './propTextures';

/** Subway-Surfers signature red/white chevron sawhorse hurdle with twin reflector lamps & steel A-frame legs. */
export function LowHurdleProp({ w = 2.6, h = 1.08, d = 0.72, position = [0, 0, 0], rotation = [0, 0, 0], centered = false }) {
  const chevron = useMemo(() => createChevronBarrierTexture(), []);
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, centered ? 0 : h * 0.5, 0]}>
        {[-w * 0.4, w * 0.4].map((x) => (
          <group key={x} position={[x, -0.05, 0]}>
            <mesh rotation={[0.24, 0, 0]} position={[0, 0, -0.11]} castShadow>
              <boxGeometry args={[0.13, h * 0.96, 0.13]} />
              <meshStandardMaterial color="#2C3038" roughness={0.48} metalness={0.55} />
            </mesh>
            <mesh rotation={[-0.24, 0, 0]} position={[0, 0, 0.11]} castShadow>
              <boxGeometry args={[0.13, h * 0.96, 0.13]} />
              <meshStandardMaterial color="#2C3038" roughness={0.48} metalness={0.55} />
            </mesh>
          </group>
        ))}
        {/* Main chevron caution board */}
        <RoundedBox args={[w, h * 0.52, d * 0.46]} radius={0.05} position={[0, h * 0.16, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...chevron} />
        </RoundedBox>
        {/* Top vertical red/white crown bar + twin side reflector lamps */}
        <RoundedBox args={[w * 1.02, h * 0.24, d * 0.5]} radius={0.04} position={[0, h * 0.48, 0]} castShadow>
          <meshStandardMaterial {...chevron} />
        </RoundedBox>
        {[-w * 0.46, w * 0.46].map((x) => (
          <group key={x} position={[x, h * 0.48, d * 0.24]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.16, 0.14, 14]} />
              <meshStandardMaterial color="#374151" metalness={0.65} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0.08]}>
              <circleGeometry args={[0.11, 14]} />
              <meshStandardMaterial color="#FFF3C4" emissive="#FBBF24" emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** Overhead slide-under gantry barrier with chevron hazard board, steel trusses & glowing warning lamps. */
export function HighBarrierProp({ w = 2.75, h = 1.25, d = 0.72, position = [0, 0, 0], rotation = [0, 0, 0], centered = false }) {
  const chevron = useMemo(() => createChevronBarrierTexture(), []);
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, centered ? 0 : 1.9, 0]}>
        {[-w * 0.46, w * 0.46].map((x) => (
          <RoundedBox key={x} args={[0.2, 2.6, 0.22]} radius={0.04} position={[x, -0.65, 0]} castShadow>
            <meshStandardMaterial color="#2E323A" roughness={0.48} metalness={0.55} />
          </RoundedBox>
        ))}
        <RoundedBox args={[w, h * 0.74, d * 0.64]} radius={0.07} position={[0, 0.12, 0]} castShadow receiveShadow>
          <meshStandardMaterial {...chevron} />
        </RoundedBox>
        <RoundedBox args={[w * 0.88, 0.15, d * 0.72]} radius={0.03} position={[0, -h * 0.28, 0]}>
          <meshStandardMaterial color="#23262C" roughness={0.6} metalness={0.4} />
        </RoundedBox>
      </group>
    </group>
  );
}

/** Auto-spinning, gleaming 3D Subway-Surfers embossed golden star coin with milled rim & drop shadow. */
export function StylizedCoinProp({ size = 0.44, shadowY = -0.78, position = [0, 0, 0], animate = true, solid = false }) {
  const spinRef = useRef(null);
  const starTex = useMemo(() => createStarCoinTexture(), []);
  const phase = (position[0] * 0.7 + position[2] * 0.35) || 0;

  useFrame(({ clock }) => {
    if (!animate || !spinRef.current) return;
    const t = clock.elapsedTime;
    spinRef.current.rotation.y = t * 3.3 + phase;
    spinRef.current.position.y = Math.sin(t * 3.8 + phase) * 0.09;
  });

  return (
    <group position={position}>
      <group ref={spinRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[size, size, 0.14, 28]} />
          <meshPhysicalMaterial
            {...starTex}
            color="#FFD54F"
            metalness={0.8}
            roughness={0.18}
            clearcoat={0.85}
            emissive="#E69A12"
            emissiveIntensity={0.28}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[size * 0.96, 0.058, 12, 28]} />
          <meshPhysicalMaterial color="#FFE98A" metalness={0.88} roughness={0.14} clearcoat={0.9} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, shadowY, 0]}>
        <circleGeometry args={[size * 0.72, 18]} />
        <meshBasicMaterial color="#181715" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}
