import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const BANNER_COLORS = ['#E53E51', '#F6C23E', '#2FB36D', '#3B82F6', '#A855F7', '#F97316'];
const SPICE_COLORS = ['#E11D48', '#8B5CF6', '#0EA5E9', '#F59E0B', '#10B981'];

/** Wind-swaying festival pennants, curved ribbons, striped brick station arches & colorful sidewalk market props. */
export function CorridorOverheadProps({ halfWidth = 7.4 }) {
  const garlandRefs = useRef([]);
  const arches = useMemo(() => [-20, -64, -104], []);
  const garlands = useMemo(() => [-8, -28, -48, -72, -92, -112], []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    garlandRefs.current.forEach((grp, idx) => {
      if (!grp) return;
      grp.rotation.x = Math.sin(t * 2.4 + idx * 1.1) * 0.14;
      grp.position.y = Math.sin(t * 1.8 + idx) * 0.06;
    });
  });

  return (
    <group>
      {arches.map((z, idx) => (
        <group key={`arch-${idx}`} position={[0, 0, z]}>
          {[-halfWidth - 0.5, halfWidth + 0.5].map((x) => (
            <RoundedBox key={x} args={[1.6, 9.6, 2.4]} radius={0.08} position={[x, 4.6, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#E6B28A" roughness={0.74} />
            </RoundedBox>
          ))}
          <RoundedBox args={[halfWidth * 2 + 2.8, 1.95, 2.5]} radius={0.12} position={[0, 8.8, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#D9986A" roughness={0.72} />
          </RoundedBox>
          {[-6, -4, -2, 0, 2, 4, 6].map((kx, ki) => (
            <mesh key={ki} position={[kx, 7.82, 1.28]} castShadow>
              <boxGeometry args={[1.35, 0.62, 0.16]} />
              <meshStandardMaterial color={ki % 2 === 0 ? '#E86A38' : '#FFF2DC'} roughness={0.58} />
            </mesh>
          ))}
          {[-3.2, 0, 3.2].map((lx, li) => (
            <group key={li} position={[lx, 7.25, 0]}>
              <mesh><boxGeometry args={[0.58, 0.48, 0.36]} /><meshStandardMaterial color="#272A32" roughness={0.45} metalness={0.5} /></mesh>
              <mesh position={[0, 0, 0.2]}><circleGeometry args={[0.14, 12]} /><meshStandardMaterial color="#FFE58F" emissive="#FBBF24" emissiveIntensity={1.6} toneMapped={false} /></mesh>
            </group>
          ))}
        </group>
      ))}

      {garlands.map((z, gi) => (
        <group key={`garland-${gi}`} position={[0, 0, z]}>
          {[-halfWidth + 0.25, halfWidth - 0.25].map((px) => (
            <mesh key={px} position={[px, 4.0, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.19, 8.0, 8]} />
              <meshStandardMaterial color="#78523A" roughness={0.82} />
            </mesh>
          ))}
          <group ref={(el) => { garlandRefs.current[gi] = el; }}>
            {Array.from({ length: 13 }).map((_, fi) => {
              const t = (fi + 0.5) / 13;
              const x = -halfWidth + 0.4 + t * (halfWidth * 2 - 0.8);
              const sag = Math.sin(t * Math.PI) * 1.25;
              const color = BANNER_COLORS[(gi * 3 + fi) % BANNER_COLORS.length];
              return (
                <mesh key={fi} position={[x, 7.5 - sag, 0]} rotation={[0, 0, Math.PI]} castShadow>
                  <coneGeometry args={[0.46, 0.94, 3]} />
                  <meshStandardMaterial color={color} roughness={0.52} side={2} />
                </mesh>
              );
            })}
            {[-0.6, 0.6].map((rz, ri) => (
              <mesh key={ri} position={[0, 6.95, rz]} rotation={[0, 0, (ri === 0 ? 1 : -1) * 0.06]}>
                <boxGeometry args={[halfWidth * 1.9, 0.22, 0.05]} />
                <meshStandardMaterial color={BANNER_COLORS[(gi + ri * 2) % BANNER_COLORS.length]} roughness={0.48} />
              </mesh>
            ))}
          </group>

          <group position={[-halfWidth + 0.95, 0.25, 1.0]}>
            <mesh position={[0, 0.48, 0]} castShadow><cylinderGeometry args={[0.38, 0.34, 0.96, 10]} /><meshStandardMaterial color="#8A5A3C" roughness={0.8} /></mesh>
            <mesh position={[0, 0.96, 0]}><coneGeometry args={[0.34, 0.34, 10]} /><meshStandardMaterial color={SPICE_COLORS[gi % SPICE_COLORS.length]} roughness={0.75} /></mesh>
            <mesh position={[0.75, 0.22, 0.7]}><coneGeometry args={[0.42, 0.44, 10]} /><meshStandardMaterial color={SPICE_COLORS[(gi + 2) % SPICE_COLORS.length]} roughness={0.75} /></mesh>
          </group>
          <RoundedBox args={[0.92, 0.88, 0.92]} radius={0.05} position={[halfWidth - 0.95, 0.68, -1.1]} castShadow receiveShadow>
            <meshStandardMaterial color="#A36E45" roughness={0.8} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
