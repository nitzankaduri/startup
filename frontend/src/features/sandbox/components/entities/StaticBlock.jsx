import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { createAsphaltCobbleTextures } from '../../sdk/proceduralTextures';

export function StaticBlock({ entity, isRacer = false }) {
  const { position, scale, color = '#27272A', type } = entity;
  const [sx, sy, sz] = scale;
  const rotation = type === 'ramp' ? [-0.24, 0, 0] : [0, 0, 0];
  const radius = Math.min(0.1, sx * 0.15, sy * 0.25, sz * 0.15);

  const deckTex = useMemo(
    () => createAsphaltCobbleTextures(isRacer ? '#2E2C28' : '#3F3F46', Math.max(1, Math.round(sx / 4)), Math.max(1, Math.round(sz / 4))),
    [isRacer, sx, sz]
  );

  const curbs = useMemo(() => {
    if (!isRacer || type !== 'platform' || sz < 6) return [];
    const segLen = 2.0;
    const count = Math.max(2, Math.floor(sz / segLen));
    return Array.from({ length: count }, (_, idx) => ({
      z: -sz / 2 + segLen * 0.5 + idx * (sz / count),
      len: sz / count - 0.08,
      red: idx % 2 === 0,
    }));
  }, [isRacer, sz, type]);

  const pillarOffsets = useMemo(() => {
    if (type === 'ramp') return [];
    if (sx < 5 && sz < 5) return [[0, -12 - sy / 2, 0]];
    const ox = Math.max(0.8, sx * 0.36);
    const oz = Math.max(0.8, sz * 0.36);
    return [[-ox, -12 - sy / 2, -oz], [ox, -12 - sy / 2, -oz], [-ox, -12 - sy / 2, oz], [ox, -12 - sy / 2, oz]];
  }, [sx, sy, sz, type]);

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation} friction={0.6}>
      <CuboidCollider args={[sx / 2, sy / 2, sz / 2]} />
      <RoundedBox args={[sx, sy, sz]} radius={radius} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.78} metalness={0.06} />
      </RoundedBox>
      <RoundedBox args={[sx * 0.94, 0.06, sz * 0.94]} radius={0.025} smoothness={2} position={[0, sy / 2 + 0.01, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={deckTex.map} bumpMap={deckTex.bumpMap} bumpScale={0.03} roughness={0.72} metalness={0.08} />
      </RoundedBox>

      {pillarOffsets.map((p, idx) => (
        <mesh key={idx} position={p} receiveShadow>
          <boxGeometry args={[0.7, 24, 0.7]} />
          <meshStandardMaterial color="#3F3A34" roughness={0.9} metalness={0.05} />
        </mesh>
      ))}

      {curbs.map((c, idx) => (
        <group key={idx}>
          <mesh position={[-sx / 2 + 0.35, sy / 2 + 0.045, c.z]} receiveShadow>
            <boxGeometry args={[0.45, 0.04, c.len]} />
            <meshStandardMaterial color={c.red ? '#9A3412' : '#F6F4EF'} roughness={0.75} />
          </mesh>
          <mesh position={[sx / 2 - 0.35, sy / 2 + 0.045, c.z]} receiveShadow>
            <boxGeometry args={[0.45, 0.04, c.len]} />
            <meshStandardMaterial color={c.red ? '#9A3412' : '#F6F4EF'} roughness={0.75} />
          </mesh>
          {c.red && (
            <mesh position={[0, sy / 2 + 0.045, c.z]}>
              <boxGeometry args={[0.24, 0.02, c.len * 0.55]} />
              <meshStandardMaterial color="#E6E2D8" roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}
    </RigidBody>
  );
}
