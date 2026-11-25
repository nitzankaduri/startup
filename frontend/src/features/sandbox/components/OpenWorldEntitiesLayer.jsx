import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { buildObstacleMesh, buildPlayerMesh } from '../kernel/EntityMeshFactory';

/** Renders & syncs open_world_sandbox vehicles, destructible street props, and glowing mission beacon. */
export function OpenWorldEntitiesLayer({ stRef, specPal }) {
  const vehRefs = useRef([]);
  const propRefs = useRef([]);
  const beaconRef = useRef(null);
  const st = stRef.current;

  const vehMeshes = useMemo(() => (st.vehicles || []).map((v) => (
    v.kind === 'police_car'
      ? buildObstacleMesh('police_car', specPal)
      : buildPlayerMesh('sports_car', { ...specPal, primary: '#D96B27' })
  )), [st.vehicles, specPal]);

  const propMeshes = useMemo(() => (st.props || []).map((p) => (
    buildObstacleMesh(p.kind === 'hydrant' ? 'pirate_barrel' : 'street_barrier', specPal)
  )), [st.props, specPal]);

  useFrame(({ clock }) => {
    const cur = stRef.current;
    if (!cur?.isSandbox) return;
    for (let i = 0; i < cur.vehicles.length; i += 1) {
      const m = vehRefs.current[i]; const v = cur.vehicles[i];
      if (m) { m.visible = v.alive; if (v.alive) { m.position.set(v.x, 0, v.z); m.rotation.y = v.yaw; } }
    }
    for (let i = 0; i < cur.props.length; i += 1) {
      const m = propRefs.current[i]; const p = cur.props[i];
      if (m) { m.visible = p.alive; if (p.alive) { m.position.set(p.x, 0, p.z); m.scale.setScalar(0.55); } }
    }
    if (beaconRef.current && cur.mission) {
      beaconRef.current.visible = cur.mission.kind !== 'eliminate_boss';
      beaconRef.current.position.set(cur.mission.x, 0.12, cur.mission.z);
      beaconRef.current.rotation.y = clock.elapsedTime * 1.8;
    }
  });

  if (!st.isSandbox) return null;
  return (
    <group>
      {(st.vehicles || []).map((_, i) => <primitive key={`v${i}`} object={vehMeshes[i]} ref={(el) => { vehRefs.current[i] = el; }} />)}
      {(st.props || []).map((_, i) => <primitive key={`pr${i}`} object={propMeshes[i]} ref={(el) => { propRefs.current[i] = el; }} />)}
      <group ref={beaconRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.2, 3.0, 28]} /><meshBasicMaterial color="#D96B27" /></mesh>
        <mesh position={[0, 8, 0]}><cylinderGeometry args={[0.28, 0.7, 16, 12]} /><meshBasicMaterial color="#F59E0B" transparent opacity={0.28} /></mesh>
      </group>
    </group>
  );
}
