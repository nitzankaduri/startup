import { useMemo } from 'react';
import * as THREE from 'three';

function createArenaFloorTex(baseHex = '#292524', gridHex = '#44403C') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = gridHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(64, 64, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const PILLARS = [
  [-39, -39], [39, -39], [-39, 39], [39, 39],
  [-20, -39], [20, -39], [-20, 39], [20, 39],
  [-39, -20], [39, -20], [-39, 20], [39, 20],
];

/** Open 360-degree 80x80 tactical combat arena with perimeter walls & stone/metal corner towers. */
export function ArenaWorldScene({ palette }) {
  const groundColor = palette?.ground || '#3F3A34';
  const accentColor = palette?.accent || '#D96B27';
  const floorTex = useMemo(() => createArenaFloorTex(groundColor, '#57534E'), [groundColor]);

  return (
    <group>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#1C1917" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[11.5, 12.1, 48]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
      </mesh>

      {[
        [0, 1.3, -40, 82, 2.6, 1.4],
        [0, 1.3, 40, 82, 2.6, 1.4],
        [-40, 1.3, 0, 1.4, 2.6, 82],
        [40, 1.3, 0, 1.4, 2.6, 82],
      ].map(([x, y, z, w, h, d], idx) => (
        <mesh key={idx} position={[x, y, z]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#292524" roughness={0.8} />
        </mesh>
      ))}

      {PILLARS.map(([x, z], idx) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, 2.4, 0]}>
            <boxGeometry args={[2.2, 4.8, 2.2]} />
            <meshStandardMaterial color="#44403C" roughness={0.75} />
          </mesh>
          <mesh position={[0, 5.0, 0]}>
            <boxGeometry args={[1.4, 0.5, 1.4]} />
            <meshBasicMaterial color={accentColor} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
