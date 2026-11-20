import { useEffect, useId, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { StudioProp } from '../assets/StudioProps';
import { registerCollider, unregisterCollider } from '../runtime/useArenaPhysics';
import { createCityRoadTextures } from '../worlds/worldTextures';
import { DEFAULT_TRACK_WAYPOINTS, buildRaceTrackGeometry } from './raceTrackHelpers';

/** Flat asphalt city street grid with raised sidewalks (+0.25m), warm streetlamps & colliding block buildings. */
export function CityGrid({ blocks = 4, roadWidth = 14, blockSize = 36 }) {
  const count = Math.max(2, Math.min(6, Math.round(blocks)));
  const stride = blockSize + roadWidth;
  const totalSpan = count * blockSize + (count + 1) * roadWidth;
  const roadTex = useMemo(() => createCityRoadTextures(1, Math.max(8, count * 5)), [count]);

  const { roads, blockList, lamps } = useMemo(() => {
    const halfSpan = totalSpan * 0.5;
    const roadLines = Array.from({ length: count + 1 }, (_, i) => -halfSpan + roadWidth * 0.5 + i * stride);
    const blkItems = []; const lampPts = [];
    for (let gx = 0; gx < count; gx += 1) {
      for (let gz = 0; gz < count; gz += 1) {
        const bx = -halfSpan + roadWidth + blockSize * 0.5 + gx * stride;
        const bz = -halfSpan + roadWidth + blockSize * 0.5 + gz * stride;
        const inner = Math.max(6, blockSize * 0.25);
        const buildings = [[-inner, -inner], [inner, -inner], [-inner, inner], [inner, inner]].map(([ox, oz], k) => {
          const seed = gx * 7 + gz * 11 + k * 3;
          const kind = seed % 5 === 0 ? 'timber_tavern' : 'skyscraper_block';
          const scale = kind === 'skyscraper_block' ? [1.2 + (seed % 3) * 0.25, 0.75 + (seed % 4) * 0.35, 1.2 + ((seed + 1) % 3) * 0.25] : 1.4;
          return { x: bx + ox, z: bz + oz, kind, scale, color: ['#475569', '#5B6472', '#6B5E54', '#3E4C5E'][seed % 4] };
        });
        blkItems.push({ bx, bz, buildings });
        const corner = blockSize * 0.44;
        lampPts.push([bx - corner, 0.25, bz - corner], [bx + corner, 0.25, bz + corner]);
      }
    }
    return { roads: roadLines, blockList: blkItems, lamps: lampPts };
  }, [count, roadWidth, blockSize, stride, totalSpan]);

  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[totalSpan + 24, totalSpan + 24]} />
        <meshStandardMaterial color="#353942" roughness={0.9} />
      </mesh>
      {roads.map((pos, i) => (
        <group key={i}>
          <mesh position={[pos, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[roadWidth, totalSpan]} /><meshStandardMaterial {...roadTex} />
          </mesh>
          <mesh position={[0, 0.025, pos]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[roadWidth, totalSpan]} /><meshStandardMaterial {...roadTex} />
          </mesh>
        </group>
      ))}
      {blockList.map((blk, bi) => (
        <group key={bi}>
          <RoundedBox args={[blockSize, 0.25, blockSize]} radius={0.04} position={[blk.bx, 0.125, blk.bz]} receiveShadow>
            <meshStandardMaterial color="#D6D0C4" roughness={0.86} />
          </RoundedBox>
          {blk.buildings.map((b, i) => (
            <StudioProp key={i} type={b.kind} position={[b.x, 0.25, b.z]} scale={b.scale} color={b.color} colliderPadding={0.35} />
          ))}
        </group>
      ))}
      {lamps.map((p, i) => <StudioProp key={i} type="streetlamp" position={p} colliderPadding={0.1} />)}
    </group>
  );
}

/** Smooth banked spline RaceTrack with red/white safety curbs, colliding barriers & warm checkpoint gates. */
export function RaceTrack({ waypoints = DEFAULT_TRACK_WAYPOINTS, width = 16, onCheckpoint }) {
  const trackId = useId();
  const roadTex = useMemo(() => createCityRoadTextures(1, 24), []);
  const { roadGeo, curbSegs, barriers, gates } = useMemo(() => buildRaceTrackGeometry(waypoints, width, 92), [waypoints, width]);

  useEffect(() => {
    const ids = [];
    barriers.forEach((b) => {
      const fx = Math.sin(b.yaw); const fz = Math.cos(b.yaw); const step = b.len * 0.28;
      [-step, 0, step].forEach((off, k) => {
        const id = `${trackId}-${b.id}-${k}`;
        ids.push(id);
        registerCollider(id, { position: [b.x + fx * off, b.y, b.z + fz * off], radius: Math.max(0.85, step * 0.65), maxY: b.y + 3 }, 'sphere');
      });
    });
    gates.forEach((g) => {
      const gid = `${trackId}-${g.id}`;
      ids.push(gid);
      registerCollider(gid, { position: [g.x, g.y, g.z], radius: width * 0.52, onCollide: () => onCheckpoint?.(g.id) }, 'trigger');
    });
    return () => {
      roadGeo.dispose();
      ids.forEach(unregisterCollider);
    };
  }, [trackId, roadGeo, barriers, gates, width, onCheckpoint]);

  return (
    <group>
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial {...roadTex} side={2} />
      </mesh>
      {curbSegs.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[0, c.yaw, 0]} receiveShadow>
          <boxGeometry args={[0.9, 0.12, c.len]} />
          <meshStandardMaterial color={c.red ? '#C83E2B' : '#F6F4EF'} roughness={0.78} />
        </mesh>
      ))}
      {barriers.map((b, i) => (
        <mesh key={i} position={[b.x, b.y + 0.55, b.z]} rotation={[0, b.yaw, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 1.1, b.len]} />
          <meshStandardMaterial color="#8B8D91" roughness={0.82} />
        </mesh>
      ))}
      {gates.map((g) => (
        <group key={g.id} position={[g.x, g.y, g.z]} rotation={[0, g.yaw, 0]}>
          {[-width * 0.52, width * 0.52].map((x) => (
            <mesh key={x} position={[x, 3.1, 0]} castShadow><cylinderGeometry args={[0.24, 0.3, 6.2, 10]} /><meshStandardMaterial color="#27303F" metalness={0.5} roughness={0.45} /></mesh>
          ))}
          <RoundedBox args={[width + 1.4, 0.72, 0.9]} radius={0.08} position={[0, 6.1, 0]} castShadow>
            <meshStandardMaterial color="#D96B27" emissive="#F59E0B" emissiveIntensity={0.45} roughness={0.4} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
