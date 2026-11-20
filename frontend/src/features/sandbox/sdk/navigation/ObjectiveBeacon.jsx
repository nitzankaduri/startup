import { useEffect, useId, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motionBus } from '../motionBus';
import { radarBus, registerRadarBlip, unregisterRadarBlip } from './radarBus';

const TMP_V = new THREE.Vector3();
const TMP_FWD = new THREE.Vector3();
const TMP_TO = new THREE.Vector3();

/** 3D vertical light beacon, pulsing ground ring, radar blip registration & offscreen pointer projection. */
export function ObjectiveBeacon({ id, position = [0, 0, -24], label = 'Objective', color = '#2E7D32', radius = 1.8, active = true, onReach }) {
  const autoId = useId();
  const beaconId = id || `obj-${autoId}`;
  const { camera } = useThree();
  const ringRef = useRef(null);
  const beamRef = useRef(null);
  const reachedRef = useRef(false);

  useEffect(() => {
    reachedRef.current = false;
  }, [position[0], position[1], position[2], active]);

  useEffect(() => {
    if (!active) {
      unregisterRadarBlip(beaconId);
      return;
    }
    registerRadarBlip(beaconId, { type: 'objective', position, label });
    return () => unregisterRadarBlip(beaconId);
  }, [beaconId, active, position[0], position[1], position[2], label]);

  useFrame(({ clock }) => {
    if (!active) return;
    const t = clock.elapsedTime;
    if (ringRef.current) {
      const pulse = 0.85 + Math.sin(t * 3.4) * 0.2;
      ringRef.current.scale.setScalar(pulse);
    }
    if (beamRef.current) {
      beamRef.current.material.opacity = 0.16 + Math.sin(t * 2.5) * 0.06;
    }

    const p = motionBus.pos;
    const dist = Math.hypot(p.x - position[0], p.z - position[2]);
    if (!reachedRef.current && dist <= radius && onReach) {
      reachedRef.current = true;
      onReach();
    }

    TMP_V.set(position[0], position[1] + 1.6, position[2]);
    TMP_TO.subVectors(TMP_V, camera.position);
    camera.getWorldDirection(TMP_FWD);
    const inFront = TMP_FWD.dot(TMP_TO) > 0;
    TMP_V.project(camera);

    const offscreen = !inFront || Math.abs(TMP_V.x) > 0.9 || Math.abs(TMP_V.y) > 0.85;
    if (offscreen) {
      let sx = inFront ? TMP_V.x : -TMP_V.x;
      let sy = inFront ? TMP_V.y : -TMP_V.y;
      const len = Math.hypot(sx, sy) || 1;
      sx /= len;
      sy /= len;
      const edgeX = 50 + sx * 42;
      const edgeY = 50 - sy * 38;
      const angleDeg = (Math.atan2(sx, sy) * 180) / Math.PI;
      radarBus.pointers.set(beaconId, { id: beaconId, label, color, edgeX, edgeY, angleDeg, dist: Math.round(dist) });
    } else {
      radarBus.pointers.delete(beaconId);
    }
  });

  if (!active) return null;
  return (
    <group position={position}>
      <mesh ref={beamRef} position={[0, 12, 0]}>
        <cylinderGeometry args={[radius * 0.22, radius * 0.55, 24, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.65, radius * 0.95, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
    </group>
  );
}
