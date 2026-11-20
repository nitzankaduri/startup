import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/** Twin bumper-mounted SpotLights (with parented road targets) + flickering warm nitro exhaust flames. */
export function VehicleHeadlights({ nitroRef = null, zFront = -1.35, zRear = 1.68, intensity = 22 }) {
  const leftLight = useRef(null);
  const rightLight = useRef(null);
  const leftTarget = useRef(null);
  const rightTarget = useRef(null);
  const flamesRef = useRef(null);

  useEffect(() => {
    if (leftLight.current && leftTarget.current) leftLight.current.target = leftTarget.current;
    if (rightLight.current && rightTarget.current) rightLight.current.target = rightTarget.current;
  }, []);

  useFrame((state) => {
    const fl = flamesRef.current;
    if (!fl) return;
    const on = Boolean(nitroRef?.current);
    fl.visible = on;
    if (on) {
      const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 38) * 0.25;
      fl.scale.set(1, 1, pulse * 1.35);
    }
  });

  return (
    <>
      {[-0.55, 0.55].map((x, idx) => (
        <group key={x}>
          <object3D ref={idx === 0 ? leftTarget : rightTarget} position={[x * 0.9, 0.05, zFront - 22]} />
          <spotLight
            ref={idx === 0 ? leftLight : rightLight}
            position={[x, 0.58, zFront]}
            color="#FFF3D6"
            intensity={intensity}
            distance={52}
            angle={0.54}
            penumbra={0.58}
            decay={1.5}
          />
        </group>
      ))}
      <group ref={flamesRef} visible={false}>
        {[-0.38, 0.38].map((x) => (
          <group key={x} position={[x, 0.38, zRear]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.42]}>
              <coneGeometry args={[0.14, 0.92, 8]} />
              <meshStandardMaterial color="#F97316" emissive="#F59E0B" emissiveIntensity={2.1} toneMapped={false} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.26]}>
              <coneGeometry args={[0.08, 0.56, 6]} />
              <meshStandardMaterial color="#FDE68A" emissive="#FFF3D6" emissiveIntensity={2.4} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
