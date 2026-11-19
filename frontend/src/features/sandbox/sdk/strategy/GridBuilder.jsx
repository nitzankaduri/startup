import { useRef, useState } from 'react';
import { Html, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { soundEngine } from '../../../../shared/audio/soundEngine';
import { ParticleBurst } from '../MeshBuilder';
import { usePbrMaterial } from '../pbrMaterials';
import { useGameInput } from '../useGameInput';
import { useEconomy } from './useEconomy';

export { useEconomy };

function SpringStructure({ builtAt, position, children }) {
  const grpRef = useRef(null);
  useFrame(() => {
    if (!grpRef.current) return;
    const t = Math.min(1, (performance.now() - builtAt) / 360);
    const spring = t < 1 ? 1 + Math.sin(t * Math.PI) * 0.16 * (1 - t) : 1;
    const s = Math.max(0.1, t < 0.45 ? (t / 0.45) * 1.12 : spring);
    grpRef.current.scale.setScalar(s);
  });
  return <group ref={grpRef} position={position}>{children}</group>;
}

function DefaultOutpostMesh({ timber, stone, cellSize }) {
  const w = cellSize * 0.72;
  return (
    <group>
      <RoundedBox args={[w, 0.35, w]} radius={0.05} smoothness={2} position={[0, 0.18, 0]} castShadow receiveShadow><meshStandardMaterial {...stone} /></RoundedBox>
      <RoundedBox args={[w * 0.78, 1.1, w * 0.78]} radius={0.05} smoothness={2} position={[0, 0.88, 0]} castShadow receiveShadow><meshStandardMaterial {...timber} /></RoundedBox>
      <mesh position={[0, 1.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow><coneGeometry args={[w * 0.65, 0.7, 4]} /><meshStandardMaterial color="#D96B27" roughness={0.68} /></mesh>
    </group>
  );
}

/** Snap-to-grid 3D builder with translucent valid/invalid ghost, spring pop animation, dust burst & thud audio. */
export function GridBuilder({
  cellSize = 2.0,
  gridRadius = 16,
  groundY = 0,
  buildCost = { gold: 25 },
  economy,
  enabled = true,
  occupiedCells = [],
  onPlace,
  renderBuilding,
}) {
  const [hover, setHover] = useState({ x: 0, z: 0, key: '0,0', valid: true, visible: false });
  const [structures, setStructures] = useState([]);
  const [burst, setBurst] = useState({ pos: [0, 0, 0], count: 0 });
  const timber = usePbrMaterial({ surface: 'aged_timber', color: '#9B7048' });
  const stone = usePbrMaterial({ surface: 'cracked_concrete', color: '#9E978B' });

  const isValidCell = (gx, gz, key) => {
    if (Math.abs(gx) > gridRadius || Math.abs(gz) > gridRadius) return false;
    if (occupiedCells.includes(key) || structures.some((s) => s.key === key)) return false;
    if (economy && !economy.canAfford(buildCost)) return false;
    return true;
  };

  useGameInput({
    groundY,
    onPointerMove: ({ groundPoint }) => {
      if (!enabled || !groundPoint) return;
      const gx = Math.round(groundPoint.x / cellSize) * cellSize;
      const gz = Math.round(groundPoint.z / cellSize) * cellSize;
      const key = `${gx},${gz}`;
      const valid = isValidCell(gx, gz, key);
      if (hover.key !== key || hover.valid !== valid || !hover.visible) {
        setHover({ x: gx, z: gz, key, valid, visible: true });
      }
    },
    onPointerDown: ({ groundPoint, button }) => {
      if (!enabled || button !== 0 || !groundPoint) return;
      const gx = Math.round(groundPoint.x / cellSize) * cellSize;
      const gz = Math.round(groundPoint.z / cellSize) * cellSize;
      const key = `${gx},${gz}`;
      if (!isValidCell(gx, gz, key)) return;
      if (economy && !economy.spend(buildCost)) return;

      const pos = [gx, groundY, gz];
      const item = { key, cell: [gx / cellSize, gz / cellSize], position: pos, builtAt: performance.now(), tier: 1 };
      setStructures((prev) => [...prev, item]);
      setBurst((b) => ({ pos: [gx, groundY + 0.15, gz], count: b.count + 1 }));
      soundEngine.woodBuild();
      onPlace?.(item);
    },
  });

  const popups = economy?.popups || [];
  return (
    <group>
      {enabled && hover.visible && (
        <group position={[hover.x, groundY + 0.05, hover.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[cellSize * 0.94, cellSize * 0.94]} />
            <meshBasicMaterial color={hover.valid ? '#2E7D32' : '#C62828'} transparent opacity={0.38} />
          </mesh>
          <RoundedBox args={[cellSize * 0.72, 1.1, cellSize * 0.72]} radius={0.05} position={[0, 0.56, 0]}>
            <meshStandardMaterial color={hover.valid ? '#2E7D32' : '#C62828'} transparent opacity={0.42} roughness={0.6} />
          </RoundedBox>
        </group>
      )}

      {structures.map((st) => (
        <SpringStructure key={st.key} builtAt={st.builtAt} position={st.position}>
          {renderBuilding ? renderBuilding(st) : <DefaultOutpostMesh timber={timber} stone={stone} cellSize={cellSize} />}
        </SpringStructure>
      ))}

      <ParticleBurst burstKey={burst.count} origin={burst.pos} color="#D8D0C4" count={14} speed={4.5} size={0.14} />

      {popups.map((p) => (
        <Html key={p.id} position={[p.position[0], p.position[1] + 2.3, p.position[2]]} center distanceFactor={13}>
          <span className="pointer-events-none px-2 py-0.5 rounded-lg bg-[#FFFFFF]/90 border border-[#E6E2D8] text-[11px] font-semibold text-[#D96B27] shadow-sm animate-bounce whitespace-nowrap">
            {p.text}
          </span>
        </Html>
      ))}
    </group>
  );
}
