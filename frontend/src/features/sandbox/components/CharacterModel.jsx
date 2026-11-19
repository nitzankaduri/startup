import { RoundedBox } from '@react-three/drei';

function ArmLimb({ side, armRef, foreRef, color }) {
  const x = side === 'left' ? -0.32 : 0.32;
  return (
    <group ref={armRef} position={[x, 0.2, 0]}>
      <RoundedBox args={[0.13, 0.24, 0.13]} radius={0.05} position={[0, -0.1, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.6} />
      </RoundedBox>
      <group ref={foreRef} position={[0, -0.22, 0]}>
        <RoundedBox args={[0.11, 0.22, 0.11]} radius={0.04} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color="#F2D2B6" roughness={0.7} />
        </RoundedBox>
        <mesh position={[0, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.065, 10, 10]} />
          <meshStandardMaterial color="#181715" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

function LegLimb({ side, legRef, kneeRef }) {
  const x = side === 'left' ? -0.13 : 0.13;
  return (
    <group ref={legRef} position={[x, -0.22, 0]}>
      <RoundedBox args={[0.16, 0.24, 0.16]} radius={0.05} position={[0, -0.11, 0]} castShadow>
        <meshStandardMaterial color="#181715" roughness={0.8} />
      </RoundedBox>
      <group ref={kneeRef} position={[0, -0.22, 0]}>
        <RoundedBox args={[0.13, 0.22, 0.13]} radius={0.04} position={[0, -0.1, 0]} castShadow>
          <meshStandardMaterial color="#2E2C28" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.1, 0.25]} radius={0.04} position={[0, -0.23, -0.04]} castShadow>
          <meshStandardMaterial color="#D96B27" roughness={0.55} />
        </RoundedBox>
        <RoundedBox args={[0.17, 0.04, 0.26]} radius={0.01} position={[0, -0.27, -0.04]}>
          <meshStandardMaterial color="#F6F4EF" roughness={0.7} />
        </RoundedBox>
      </group>
    </group>
  );
}

export function CharacterModel({ color = '#FAFAFA', refs }) {
  return (
    <>
      <group ref={refs.visual}>
        <group ref={refs.body}>
          <RoundedBox args={[0.46, 0.5, 0.32]} radius={0.1} smoothness={3} position={[0, 0.04, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.06} />
          </RoundedBox>
          <RoundedBox args={[0.48, 0.1, 0.34]} radius={0.04} position={[0, -0.17, 0]}>
            <meshStandardMaterial color="#D96B27" roughness={0.65} />
          </RoundedBox>
          <RoundedBox args={[0.48, 0.1, 0.34]} radius={0.04} position={[0, 0.26, 0]} castShadow>
            <meshStandardMaterial color="#D96B27" roughness={0.65} />
          </RoundedBox>

          <group ref={refs.pack} position={[0, 0.06, 0.23]}>
            <RoundedBox args={[0.32, 0.36, 0.18]} radius={0.06} castShadow>
              <meshStandardMaterial color="#2E2C28" roughness={0.72} />
            </RoundedBox>
            <RoundedBox args={[0.26, 0.08, 0.2]} radius={0.02} position={[0, 0.08, 0]}>
              <meshStandardMaterial color="#D96B27" roughness={0.6} />
            </RoundedBox>
          </group>

          <group ref={refs.scarf} position={[0, 0.24, 0.18]}>
            <RoundedBox args={[0.24, 0.42, 0.05]} radius={0.02} position={[0, -0.19, 0.06]} castShadow>
              <meshStandardMaterial color="#D96B27" roughness={0.75} />
            </RoundedBox>
          </group>

          <group ref={refs.head} position={[0, 0.46, 0]}>
            <RoundedBox args={[0.36, 0.34, 0.34]} radius={0.13} smoothness={3} castShadow>
              <meshStandardMaterial color="#F2D2B6" roughness={0.65} />
            </RoundedBox>
            <RoundedBox args={[0.39, 0.16, 0.38]} radius={0.08} position={[0, 0.11, 0.01]} castShadow>
              <meshStandardMaterial color="#181715" roughness={0.65} />
            </RoundedBox>
            <RoundedBox args={[0.32, 0.04, 0.22]} radius={0.02} position={[0, 0.06, 0.22]} castShadow>
              <meshStandardMaterial color="#D96B27" roughness={0.55} />
            </RoundedBox>
            <mesh position={[-0.08, 0.0, -0.17]}><sphereGeometry args={[0.036, 8, 8]} /><meshStandardMaterial color="#181715" roughness={0.2} /></mesh>
            <mesh position={[0.08, 0.0, -0.17]}><sphereGeometry args={[0.036, 8, 8]} /><meshStandardMaterial color="#181715" roughness={0.2} /></mesh>

            <group ref={refs.dizzy} position={[0, 0.32, 0]} visible={false}>
              {[0, 2.1, 4.2].map((ang, i) => (
                <mesh key={i} position={[Math.cos(ang) * 0.28, 0, Math.sin(ang) * 0.28]}>
                  <octahedronGeometry args={[0.06, 0]} />
                  <meshStandardMaterial color="#E5B869" metalness={0.75} roughness={0.2} />
                </mesh>
              ))}
            </group>
          </group>

          <ArmLimb side="left" armRef={refs.lArm} foreRef={refs.lFore} color={color} />
          <ArmLimb side="right" armRef={refs.rArm} foreRef={refs.rFore} color={color} />
          <LegLimb side="left" legRef={refs.lLeg} kneeRef={refs.lKnee} />
          <LegLimb side="right" legRef={refs.rLeg} kneeRef={refs.rKnee} />
        </group>

        <group ref={refs.slideDust} visible={false}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[(i - 2.5) * 0.14, -0.58, 0.4 + i * 0.18]}>
              <dodecahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial color="#EFECE4" roughness={0.92} />
            </mesh>
          ))}
        </group>
      </group>

      <mesh ref={refs.shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.68, 0]}>
        <circleGeometry args={[0.52, 24]} />
        <meshBasicMaterial color="#181715" transparent opacity={0.36} depthWrite={false} />
      </mesh>
    </>
  );
}
