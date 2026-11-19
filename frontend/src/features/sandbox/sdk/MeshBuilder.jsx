import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createPbrTextureSet, createPhysicalMaterial, PBR_SURFACES, usePbrMaterial } from './pbrMaterials';
import { RealisticTerrain } from './RealisticTerrain';

export { StudioBackdrop } from './StudioBackdrop';
export { createPbrTextureSet, createPhysicalMaterial, PBR_SURFACES, RealisticTerrain, usePbrMaterial };

const VARIANT_TO_SURFACE = {
  matte: 'cracked_concrete',
  ceramic: 'polished_marble',
  brushedMetal: 'brushed_steel',
  wood: 'aged_timber',
  asphalt: 'wet_asphalt',
  rock: 'volcanic_rock',
  sand: 'desert_sand',
  snow: 'alpine_snow',
  glass: 'architectural_glass',
  paint: 'automotive_paint',
  foliage: 'foliage_leaf',
};

/** Memoized MeshPhysicalMaterial descriptor binding 512x512 albedo, normal, roughness & physical properties. */
export function useStudioMaterial({ color = '#D96B27', variant = 'matte', surface, repeat = [1, 1], roughness, metalness, bumpScale, ...rest } = {}) {
  return useMemo(() => {
    const resolvedSurface = surface || VARIANT_TO_SURFACE[variant] || 'cracked_concrete';
    const tex = createPbrTextureSet(resolvedSurface, { repeat });
    return {
      ...tex,
      color,
      bumpScale: bumpScale ?? tex.bumpScale,
      roughness: roughness ?? tex.roughness,
      metalness: metalness ?? tex.metalness,
      ...rest,
    };
  }, [color, variant, surface, repeat[0], repeat[1], roughness, metalness, bumpScale]);
}

/** Beveled 2D-to-3D extruded polygon mesh built from [[x, y], ...] profile points. */
export function ExtrudedShape({ points = [], depth = 0.4, bevel = 0.05, color = '#D96B27', variant = 'matte', surface, materialProps, ...props }) {
  const mat = useStudioMaterial({ color, variant, surface, ...materialProps });
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
    if (points.length > 2) shape.closePath();
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3,
    });
    geom.translate(0, 0, -depth / 2);
    return geom;
  }, [points, depth, bevel]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      <meshPhysicalMaterial {...mat} />
    </mesh>
  );
}

/** Rotationally symmetric sculpted mesh built from [[radius, y], ...] profile pairs. */
export function LatheObject({ points = [[0.01, 0], [0.5, 0.3], [0.25, 1]], segments = 24, color = '#EFECE4', variant = 'ceramic', surface, materialProps, ...props }) {
  const mat = useStudioMaterial({ color, variant, surface, ...materialProps });
  const geometry = useMemo(() => new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments), [points, segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      <meshPhysicalMaterial {...mat} />
    </mesh>
  );
}

/** Lightweight radial particle burst triggered whenever active switches true or burstKey changes. */
export function ParticleBurst({ active = false, burstKey = 0, origin = [0, 0, 0], color = '#E5B869', count = 12, speed = 5, size = 0.11 }) {
  const groupRef = useRef(null);
  const stateRef = useRef({ t: 99, particles: [] });

  useEffect(() => {
    if (!active && burstKey === 0) return;
    stateRef.current = {
      t: 0,
      particles: Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const v = speed * (0.5 + Math.random() * 0.7);
        return { vx: Math.cos(a) * v, vy: 2.2 + Math.random() * speed * 0.6, vz: Math.sin(a) * v };
      }),
    };
  }, [active, burstKey, count, speed]);

  useFrame((_, rawDelta) => {
    const grp = groupRef.current;
    const st = stateRef.current;
    if (!grp) return;
    st.t += Math.min(0.05, rawDelta);
    const life = 0.65;
    const visible = st.t < life && st.particles.length > 0;
    grp.visible = visible;
    if (!visible) return;
    const s = Math.max(0.01, 1 - st.t / life);
    grp.children.forEach((child, i) => {
      const p = st.particles[i];
      if (!p) return;
      child.position.set(p.vx * st.t, p.vy * st.t - 4.9 * st.t * st.t, p.vz * st.t);
      child.scale.setScalar(s);
    });
  });

  return (
    <group ref={groupRef} position={origin} visible={false}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <icosahedronGeometry args={[size, 0]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Crisp studio-styled world-space HTML pill label. */
export function FloatingLabel({ text, position = [0, 1.5, 0], accent = false }) {
  if (!text) return null;
  return (
    <Html position={position} center distanceFactor={11} zIndexRange={[10, 0]}>
      <div
        className={`pointer-events-none px-2.5 py-1 rounded-xl border text-[11px] font-semibold tracking-tight whitespace-nowrap shadow-sm ${
          accent ? 'bg-[#D96B27] border-[#D96B27] text-[#FFFFFF]' : 'bg-[#FFFFFF]/95 border-[#E6E2D8] text-[#181715]'
        }`}
      >
        {text}
      </div>
    </Html>
  );
}
