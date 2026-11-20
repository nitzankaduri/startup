import { useEffect, useId, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { LatheObject } from '../MeshBuilder';
import { usePbrMaterial } from '../pbrMaterials';
import { registerObjectCollider, unregisterCollider } from '../runtime/useArenaPhysics';

let _shadowTex = null;
function getSoftShadowTex() {
  if (_shadowTex || typeof document === 'undefined') return _shadowTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
  g.addColorStop(0, 'rgba(24,23,21,0.42)'); g.addColorStop(0.55, 'rgba(24,23,21,0.16)'); g.addColorStop(1, 'rgba(24,23,21,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  _shadowTex = new THREE.CanvasTexture(c); _shadowTex.needsUpdate = true;
  return _shadowTex;
}

/** Zero-FBO shared radial contact shadow decal under static props & buildings. */
export function SoftShadowDecal({ scale = 2.4, opacity = 0.85 }) {
  const tex = useMemo(() => getSoftShadowTex(), []);
  if (!tex) return null;
  return (
    <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ ignoreEditSelect: true }}>
      <planeGeometry args={[scale, scale]} />
      <meshBasicMaterial map={tex} transparent opacity={opacity} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}
import { CatapultMesh, CrystalShrineMesh, GoblinEnemyMesh, KnightHeroMesh, TimberTavernMesh } from './fantasyProps';
import { ConcreteBarrierMesh, OffroadBuggyMesh, PoliceCruiserMesh, SkyscraperBlockMesh, StreetlampMesh, SuspensionBridgeMesh } from './modernProps';
import { CampfireMesh, PalmTreeMesh, RuinsPillarMesh, StylizedOakMesh, WoodenDockMesh } from './natureProps';
import { AsteroidClusterMesh, CryoPodMesh, OrbitalRingGateMesh, PlanetaryRoverMesh } from './scifiProps';
import { CastleTowerMesh, ScifiTurretMesh, SpaceshipMesh, SportsCarMesh } from './studioPropParts';

const TRUNK_PROFILE = [[0.42, 0], [0.28, 0.6], [0.22, 2.0], [0.14, 3.2]];

/** 4-tier sculpted cedar/pine tree with tapered lathe bark trunk & layered foliage needles. */
export function PineTreeMesh({ color = '#446648' }) {
  const leaf = usePbrMaterial({ surface: 'foliage_leaf', color });
  return (
    <group>
      <LatheObject points={TRUNK_PROFILE} segments={10} surface="aged_timber" color="#6E4B32" />
      {[{ y: 1.85, r: 1.45, h: 1.6 }, { y: 2.75, r: 1.15, h: 1.45 }, { y: 3.55, r: 0.85, h: 1.25 }, { y: 4.25, r: 0.52, h: 0.95 }].map((t, i) => (
        <mesh key={i} position={[0, t.y, 0]} castShadow receiveShadow>
          <coneGeometry args={[t.r, t.h, 8]} />
          <meshPhysicalMaterial {...leaf} />
        </mesh>
      ))}
    </group>
  );
}

/** Asymmetric multi-cluster geological rock formation with lichen pebbles & sharp mineral facets. */
export function BoulderMesh({ color = '#766D62' }) {
  const rock = usePbrMaterial({ surface: 'volcanic_rock', color });
  const moss = usePbrMaterial({ surface: 'mossy_stone', color: '#5D6E59' });
  return (
    <group>
      <mesh position={[0, 0.58, 0]} scale={[1.25, 0.82, 1.05]} rotation={[0.2, 0.4, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.78, 1]} /><meshPhysicalMaterial {...rock} flatShading />
      </mesh>
      <mesh position={[-0.68, 0.35, 0.38]} scale={[0.72, 0.55, 0.68]} rotation={[0.4, 1.1, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.62, 0]} /><meshPhysicalMaterial {...moss} flatShading />
      </mesh>
      <mesh position={[0.65, 0.28, -0.35]} scale={[0.62, 0.48, 0.58]} rotation={[0.1, 2.2, 0.3]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.55, 0]} /><meshPhysicalMaterial {...rock} flatShading />
      </mesh>
    </group>
  );
}

/** Ornamented oak & brushed-brass treasure chest with arched lid, iron straps, gold lock & glowing core trim. */
export function TreasureChestMesh({ color = '#8C5832' }) {
  const wood = usePbrMaterial({ surface: 'aged_timber', color });
  const brass = usePbrMaterial({ surface: 'brushed_steel', color: '#E5B869' });
  return (
    <group>
      <RoundedBox args={[1.22, 0.58, 0.82]} radius={0.05} position={[0, 0.29, 0]} castShadow receiveShadow><meshPhysicalMaterial {...wood} /></RoundedBox>
      <mesh position={[0, 0.62, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.4, 0.4, 1.2, 14, 1, false, 0, Math.PI]} /><meshPhysicalMaterial {...wood} /></mesh>
      {[-0.42, 0.42].map((x) => (
        <RoundedBox key={x} args={[0.1, 0.72, 0.88]} radius={0.02} position={[x, 0.42, 0]} castShadow><meshPhysicalMaterial {...brass} /></RoundedBox>
      ))}
      <RoundedBox args={[0.22, 0.28, 0.1]} radius={0.03} position={[0, 0.55, 0.43]} castShadow><meshPhysicalMaterial {...brass} /></RoundedBox>
      <mesh position={[0, 0.55, 0.49]}><sphereGeometry args={[0.05, 8, 8]} /><meshStandardMaterial color="#FFF3D6" emissive="#F59E0B" emissiveIntensity={1.6} toneMapped={false} /></mesh>
    </group>
  );
}

/** Reinforced industrial cargo crate with corner bumpers & steel X-bracing. */
export function ArmoredCrateMesh({ color = '#94653E' }) {
  const wood = usePbrMaterial({ surface: 'aged_timber', color });
  const steel = usePbrMaterial({ surface: 'brushed_steel', color: '#475569' });
  return (
    <group>
      <RoundedBox args={[1.05, 1.05, 1.05]} radius={0.06} position={[0, 0.525, 0]} castShadow receiveShadow><meshPhysicalMaterial {...wood} /></RoundedBox>
      <RoundedBox args={[1.12, 0.14, 1.12]} radius={0.02} position={[0, 0.96, 0]} castShadow><meshPhysicalMaterial {...steel} /></RoundedBox>
      <RoundedBox args={[1.12, 0.14, 1.12]} radius={0.02} position={[0, 0.08, 0]} castShadow><meshPhysicalMaterial {...steel} /></RoundedBox>
      <RoundedBox args={[1.1, 0.12, 0.12]} radius={0.02} position={[0, 0.52, 0.51]} rotation={[0, 0, Math.PI / 4]}><meshPhysicalMaterial {...steel} /></RoundedBox>
    </group>
  );
}

const PROP_MAP = {
  tower: CastleTowerMesh, castle_tower: CastleTowerMesh, castle_keep: CastleTowerMesh, keep: CastleTowerMesh,
  turret: ScifiTurretMesh, scifi_turret: ScifiTurretMesh, laser_turret: ScifiTurretMesh,
  sports_car: SportsCarMesh, supercar: SportsCarMesh, coupe: SportsCarMesh, car: SportsCarMesh, vehicle: SportsCarMesh,
  offroad_buggy: OffroadBuggyMesh, police_cruiser: PoliceCruiserMesh, streetlamp: StreetlampMesh, lamp: StreetlampMesh,
  concrete_barrier: ConcreteBarrierMesh, jersey_barrier: ConcreteBarrierMesh, barrier: ConcreteBarrierMesh,
  suspension_bridge: SuspensionBridgeMesh, bridge: SuspensionBridgeMesh, skyscraper_block: SkyscraperBlockMesh, skyscraper: SkyscraperBlockMesh,
  spaceship: SpaceshipMesh, starfighter: SpaceshipMesh, jet: SpaceshipMesh, ship: SpaceshipMesh,
  planetary_rover: PlanetaryRoverMesh, rover: PlanetaryRoverMesh, cryo_pod: CryoPodMesh,
  orbital_ring_gate: OrbitalRingGateMesh, orbital_gate: OrbitalRingGateMesh, ring_gate: OrbitalRingGateMesh,
  asteroid_cluster: AsteroidClusterMesh, asteroid: AsteroidClusterMesh,
  knight_hero: KnightHeroMesh, knight: KnightHeroMesh, goblin_enemy: GoblinEnemyMesh, goblin: GoblinEnemyMesh, skeleton_enemy: GoblinEnemyMesh, skeleton: GoblinEnemyMesh,
  timber_tavern: TimberTavernMesh, tavern: TimberTavernMesh, crystal_shrine: CrystalShrineMesh, shrine: CrystalShrineMesh,
  catapult: CatapultMesh, siege_catapult: CatapultMesh, treasure_chest: TreasureChestMesh, chest: TreasureChestMesh,
  pine_tree: PineTreeMesh, tree: PineTreeMesh, palm_tree: PalmTreeMesh, stylized_oak: StylizedOakMesh, oak_tree: StylizedOakMesh,
  boulder: BoulderMesh, rock: BoulderMesh, wooden_dock: WoodenDockMesh, dock: WoodenDockMesh,
  campfire: CampfireMesh, ruins_pillar: RuinsPillarMesh, pillar: RuinsPillarMesh, crate: ArmoredCrateMesh,
};

const NON_SOLID_TYPES = new Set(['coin', 'pickup', 'checkpoint', 'grass', 'flower']);

/** Multi-part beveled/lathed PBR prop renderer with automatic world Box3 collider registration. */
export function StudioProp({ type, name, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, color, solid = true, colliderPadding = 0, onCollide }) {
  const key = String(type || name || 'crate').toLowerCase().replace(/[\s-]+/g, '_');
  const Comp = PROP_MAP[key] || ArmoredCrateMesh;
  const isSolid = solid !== false && !NON_SOLID_TYPES.has(key);
  const meshRef = useRef(null);
  const cid = `prop-${useId()}`;
  const px = position?.[0] || 0; const py = position?.[1] || 0; const pz = position?.[2] || 0;
  const rx = rotation?.[0] || 0; const ry = rotation?.[1] || 0; const rz = rotation?.[2] || 0;
  const sMax = Array.isArray(scale) ? Math.max(...scale.map((n) => Math.abs(Number(n) || 1))) : (Number(scale) || 1);

  useEffect(() => {
    registerObjectCollider(cid, meshRef.current, { padding: colliderPadding, solid: isSolid, onCollide });
    return () => unregisterCollider(cid);
  }, [cid, isSolid, colliderPadding, onCollide, key, px, py, pz, rx, ry, rz, sMax]);

  return (
    <group position={position} rotation={rotation} userData={{ studioProp: true, solid: isSolid, entityLabel: key.replace(/_/g, ' ') }}>
      <SoftShadowDecal scale={2.6 * sMax} />
      <group ref={meshRef} scale={scale}><Comp color={color} /></group>
    </group>
  );
}
