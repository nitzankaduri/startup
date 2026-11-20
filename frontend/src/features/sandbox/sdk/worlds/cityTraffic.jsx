import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

const TRAFFIC_COLORS = ['#C84B31', '#2B5F82', '#D99B38', '#3B6E5C', '#EAE4DA', '#424954'];
const STREET_LINES = [-44, 0, 44];

/** Autonomous clearcoat traffic cars cruising along sunlit city avenues with glowing headlights. */
export function AmbientTraffic({ count = 10 }) {
  const refs = useRef([]);
  const cars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const horiz = i % 2 === 0;
        const lane = STREET_LINES[i % STREET_LINES.length];
        const dir = i % 4 < 2 ? 1 : -1;
        return {
          horiz,
          lane: lane + dir * 3.1,
          dir,
          offset: -75 + (i * 19) % 150,
          speed: 7 + (i % 4) * 2.4,
          color: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length],
        };
      }),
    [count]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    cars.forEach((c, i) => {
      const node = refs.current[i];
      if (!node) return;
      const travel = (((c.offset + c.dir * t * c.speed + 85) % 170) + 170) % 170 - 85;
      if (c.horiz) {
        node.position.set(travel, 0.42, c.lane);
        node.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        node.position.set(c.lane, 0.42, travel);
        node.rotation.y = c.dir > 0 ? 0 : Math.PI;
      }
    });
  });

  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <RoundedBox args={[1.65, 0.52, 3.2]} radius={0.12} position={[0, 0.16, 0]} castShadow receiveShadow>
            <meshPhysicalMaterial color={c.color} roughness={0.28} metalness={0.55} clearcoat={0.9} clearcoatRoughness={0.1} />
          </RoundedBox>
          <RoundedBox args={[1.38, 0.42, 1.55]} radius={0.1} position={[0, 0.56, -0.1]} castShadow>
            <meshPhysicalMaterial color="#1C2A38" roughness={0.1} metalness={0.2} clearcoat={1} />
          </RoundedBox>
          {[-0.54, 0.54].map((x) => (
            <mesh key={x} position={[x, 0.2, 1.62]}>
              <boxGeometry args={[0.28, 0.14, 0.04]} />
              <meshStandardMaterial color="#FFF4DC" emissive="#FFF4DC" emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
