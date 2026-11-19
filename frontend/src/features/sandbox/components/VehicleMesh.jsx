import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Wheel({ position, spinRef, steerRef }) {
  return (
    <group position={position} ref={steerRef}>
      <group ref={spinRef} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.31, 0.31, 0.24, 18]} />
          <meshStandardMaterial color="#181715" roughness={0.85} metalness={0.08} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.19, 0.19, 0.25, 12]} />
          <meshStandardMaterial color="#D4D4D8" roughness={0.32} metalness={0.7} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.26, 0.26, 0.05]} />
          <meshStandardMaterial color="#52525B" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export function VehicleMesh({ color = '#FAFAFA', telemetryRef }) {
  const chassisRef = useRef(null);
  const flSteer = useRef(null);
  const frSteer = useRef(null);
  const wheels = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const spinAngle = useRef(0);

  useFrame((_, delta) => {
    const { speed = 0, steer = 0, isDrifting = false, yaw = 0 } = telemetryRef.current || {};
    spinAngle.current -= speed * delta * 1.9;

    wheels.forEach((w) => {
      if (w.current) w.current.rotation.x = spinAngle.current;
    });

    const targetSteer = steer * 0.42;
    if (flSteer.current) flSteer.current.rotation.y = THREE.MathUtils.lerp(flSteer.current.rotation.y, targetSteer, Math.min(1, delta * 12));
    if (frSteer.current) frSteer.current.rotation.y = THREE.MathUtils.lerp(frSteer.current.rotation.y, targetSteer, Math.min(1, delta * 12));

    if (chassisRef.current) {
      const slipYaw = isDrifting ? steer * 0.24 : 0;
      chassisRef.current.rotation.y = yaw + slipYaw;
      const roll = -steer * Math.min(0.14, Math.abs(speed) * 0.008) * (isDrifting ? 1.5 : 1);
      chassisRef.current.rotation.z = THREE.MathUtils.lerp(chassisRef.current.rotation.z, roll, Math.min(1, delta * 10));
    }
  });

  return (
    <group ref={chassisRef}>
      <RoundedBox args={[1.38, 0.42, 2.25]} radius={0.12} smoothness={3} position={[0, 0.06, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.22} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.34, 1.05]} radius={0.1} smoothness={3} position={[0, 0.38, 0.12]} castShadow>
        <meshStandardMaterial color="#181715" roughness={0.18} metalness={0.65} />
      </RoundedBox>
      <RoundedBox args={[1.28, 0.14, 0.18]} radius={0.04} position={[0, -0.02, -1.14]} castShadow>
        <meshStandardMaterial color="#27272A" roughness={0.7} metalness={0.2} />
      </RoundedBox>
      {[-0.44, 0.44].map((x) => (
        <RoundedBox key={x} args={[0.24, 0.1, 0.08]} radius={0.02} position={[x, 0.1, -1.12]}>
          <meshStandardMaterial color="#FFF3E0" roughness={0.2} metalness={0.1} />
        </RoundedBox>
      ))}
      <RoundedBox args={[1.28, 0.07, 0.3]} radius={0.02} position={[0, 0.56, 0.96]} castShadow>
        <meshStandardMaterial color="#27272A" roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.38, 0.94]} castShadow>
          <boxGeometry args={[0.08, 0.34, 0.1]} />
          <meshStandardMaterial color="#181715" roughness={0.6} />
        </mesh>
      ))}
      <Wheel position={[-0.76, -0.15, -0.68]} spinRef={wheels[0]} steerRef={flSteer} />
      <Wheel position={[0.76, -0.15, -0.68]} spinRef={wheels[1]} steerRef={frSteer} />
      <Wheel position={[-0.76, -0.15, 0.68]} spinRef={wheels[2]} />
      <Wheel position={[0.76, -0.15, 0.68]} spinRef={wheels[3]} />
    </group>
  );
}
