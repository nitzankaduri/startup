import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { WEATHER_CONFIGS, createParticleSprite } from './weatherPresets';

const BOX_XZ = 64;
const BOX_Y = 34;

function wrapAxis(val, center, span) {
  const half = span * 0.5;
  let d = val - center;
  if (d > half) d -= span * Math.floor((d + half) / span);
  else if (d < -half) d += span * Math.floor((-d + half) / span);
  return center + d;
}

/** GPU weather & volumetric atmospheric particles (rain, snow, embers, sandstorm, fireflies) following camera frustum at 60 FPS. */
export function WeatherSystem({ type = 'clear', intensity = 0.7 }) {
  const cleanType = String(type || 'clear').toLowerCase().replace(/[\s-]+/g, '_');
  const spec = WEATHER_CONFIGS[cleanType] || WEATHER_CONFIGS.clear;
  const clamped = THREE.MathUtils.clamp(Number(intensity) || 0, 0, 1);
  const count = Math.round(spec.count * clamped);

  if (count <= 0 || cleanType === 'clear') return null;
  if (cleanType === 'rain') return <RainStreaks count={count} spec={spec} intensity={clamped} />;
  return <ParticleCloud count={count} spec={spec} type={cleanType} intensity={clamped} />;
}

function RainStreaks({ count, spec, intensity }) {
  const { camera } = useThree();
  const meshRef = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => {
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i += 1) {
      arr[i * 4] = (Math.random() - 0.5) * BOX_XZ;
      arr[i * 4 + 1] = (Math.random() - 0.5) * BOX_Y;
      arr[i * 4 + 2] = (Math.random() - 0.5) * BOX_XZ;
      arr[i * 4 + 3] = 0.78 + Math.random() * 0.45;
    }
    return arr;
  }, [count]);

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color: spec.color,
    transparent: true,
    opacity: spec.opacity * (0.55 + intensity * 0.45),
    depthWrite: false,
  }), [spec.color, spec.opacity, intensity]);
  const geo = useMemo(() => new THREE.BoxGeometry(0.028, 1.35, 0.028), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(0.05, rawDelta);
    const cx = camera.position.x;
    const cy = Math.max(4, camera.position.y + 4);
    const cz = camera.position.z;
    for (let i = 0; i < count; i += 1) {
      const idx = i * 4;
      const spd = seeds[idx + 3];
      const x = wrapAxis(seeds[idx] + spec.speedXZ * spd * dt, cx, BOX_XZ);
      const y = wrapAxis(seeds[idx + 1] + spec.speedY * spd * dt, cy, BOX_Y);
      const z = wrapAxis(seeds[idx + 2] + spec.speedXZ * 0.35 * spd * dt, cz, BOX_XZ);
      seeds[idx] = x; seeds[idx + 1] = y; seeds[idx + 2] = z;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0.04, 0, -0.11);
      dummy.scale.set(1, spd, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

function ParticleCloud({ count, spec, type, intensity }) {
  const { camera } = useThree();
  const pointsRef = useRef(null);
  const sprite = useMemo(() => createParticleSprite(), []);
  const { positions, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * BOX_XZ;
      pos[i * 3 + 1] = Math.random() * BOX_Y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX_XZ;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, phases: ph };
  }, [count]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);
  const mat = useMemo(() => new THREE.PointsMaterial({
    color: spec.color,
    size: spec.size * (0.8 + intensity * 0.35),
    map: sprite,
    transparent: true,
    opacity: spec.opacity,
    depthWrite: false,
    blending: type === 'embers' || type === 'fireflies' ? THREE.AdditiveBlending : THREE.NormalBlending,
  }), [spec.color, spec.size, spec.opacity, intensity, sprite, type]);

  useEffect(() => () => { geo.dispose(); mat.dispose(); sprite.dispose(); }, [geo, mat, sprite]);

  useFrame((state, rawDelta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;
    const attr = pts.geometry.attributes.position;
    const arr = attr.array;
    const cx = camera.position.x;
    const cy = type === 'fireflies' || type === 'sandstorm' ? 4.5 : Math.max(4, camera.position.y + 4);
    const cz = camera.position.z;
    const spanY = type === 'fireflies' ? 9 : BOX_Y;
    for (let i = 0; i < count; i += 1) {
      const k = i * 3;
      const p = phases[i];
      const vx = spec.speedXZ + Math.cos(t * spec.swirl + p) * 1.4;
      const vy = spec.speedY + (type === 'fireflies' ? Math.sin(t * 1.9 + p) * 0.85 : 0);
      const vz = Math.sin(t * spec.swirl + p * 1.3) * (type === 'sandstorm' ? 3.5 : 1.1);
      arr[k] = wrapAxis(arr[k] + vx * dt, cx, BOX_XZ);
      arr[k + 1] = wrapAxis(arr[k + 1] + vy * dt, cy, spanY);
      arr[k + 2] = wrapAxis(arr[k + 2] + vz * dt, cz, BOX_XZ);
    }
    attr.needsUpdate = true;
    if (type === 'fireflies') mat.opacity = 0.55 + Math.sin(t * 2.8) * 0.35;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} />;
}
