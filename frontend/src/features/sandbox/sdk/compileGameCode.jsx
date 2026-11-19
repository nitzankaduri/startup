import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContactShadows, Float, Html, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { transform } from 'sucrase';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import {
  DEFAULT_UPGRADES, DrivableVehicle, DynamicWater, ExplosionBurst, ExtrudedShape, FloatingLabel,
  FlyableCraft, GridBuilder, InstancedFoliage, LatheObject, ObjectiveBeacon, PBR_SURFACES, ParticleBurst,
  ProjectilePool, PropModel, RealisticPhysicsRig, RealisticTerrain,
  SkeletalActor, SkidMarks, SmartCamera, SmartEntity, SmokeTrail, StudioBackdrop,
  addImpactTrauma, createPbrTextureSet, createPhysicalMaterial, emitPopup, getFeelDelta,
  motionBus, pbrMaterials, recordComboEvent, registerRadarBlip, resolveModelAsset, setTargetFov,
  spawnFloatingNumber, stepInertiaBody, stepSpring, triggerCameraShake, triggerHitStop,
  triggerUpgradeDraft, useEconomy, useGameInput, usePbrMaterial, useStudioMaterial,
} from './spawnSdk';

function SafeFallbackBox({ position = [0, 0, 0], children }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#D96B27" roughness={0.7} />
      </mesh>
      {children}
    </group>
  );
}

const COMPONENT_FALLBACK_KEYS = [
  'SkeletalActor', 'PropModel', 'DynamicWater', 'InstancedFoliage', 'ProjectilePool', 'ExplosionBurst',
  'SmartEntity', 'DrivableVehicle', 'SkidMarks', 'FlyableCraft', 'GridBuilder', 'ObjectiveBeacon',
  'RealisticTerrain', 'SmartCamera', 'StudioBackdrop', 'ExtrudedShape', 'LatheObject',
  'ParticleBurst', 'FloatingLabel', 'SmokeTrail', 'RealisticPhysicsRig',
];

function prepareSource(rawCode) {
  let src = rawCode
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
  let exportedName = null;
  src = src.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, (_, name) => {
    exportedName = name;
    return `function ${name}`;
  });
  src = src.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;?/, (_, name) => {
    exportedName = name;
    return '';
  });
  src = src.replace(/export\s+default\s+/, 'const GeneratedGame = ');
  src = src.replace(/export\s+(const|let|function)\s+/g, '$1 ');
  const candidate = exportedName || (/\bfunction\s+GeneratedGame\b|\bconst\s+GeneratedGame\b/.test(src) ? 'GeneratedGame' : null);
  return `${src}\nreturn ${candidate || 'typeof GeneratedGame !== "undefined" ? GeneratedGame : null'};`;
}

/** Compiles bespoke R3F JSX strings with verified non-undefined Atomic SDK bindings and safe box fallbacks. */
export function compileGameCode(rawCode, helpers = {}) {
  const prepared = prepareSource(rawCode);
  const compiled = transform(prepared, { transforms: ['jsx'], jsxRuntime: 'classic' }).code;
  const scope = {
    React, useState, useEffect, useRef, useMemo, useCallback,
    THREE, useFrame, useThree,
    RoundedBox, OrbitControls, Html, ContactShadows, Float, Text,
    Physics, RigidBody, CuboidCollider, BallCollider,
    useGameInput, SmartCamera, RealisticPhysicsRig, stepInertiaBody, SmokeTrail,
    SkeletalActor, PropModel, resolveModelAsset, DynamicWater, InstancedFoliage, ProjectilePool,
    ExplosionBurst, SmartEntity, DrivableVehicle, SkidMarks, FlyableCraft, GridBuilder, useEconomy,
    ObjectiveBeacon, registerRadarBlip, ExtrudedShape, LatheObject, RealisticTerrain, ParticleBurst,
    FloatingLabel, StudioBackdrop, useStudioMaterial, usePbrMaterial, createPbrTextureSet,
    createPhysicalMaterial, PBR_SURFACES, pbrMaterials, motionBus, addImpactTrauma,
    triggerCameraShake, setTargetFov, emitPopup, triggerHitStop, spawnFloatingNumber, getFeelDelta,
    triggerUpgradeDraft, recordComboEvent, DEFAULT_UPGRADES, stepSpring, soundEngine,
    ...helpers,
  };
  COMPONENT_FALLBACK_KEYS.forEach((key) => {
    if (scope[key] === undefined || scope[key] === null) scope[key] = SafeFallbackBox;
  });
  const keys = Object.keys(scope);
  const fn = new Function(...keys, compiled);
  const Component = fn(...keys.map((k) => scope[k]));
  if (typeof Component !== 'function') throw new Error('Generated JSX must export a component function.');
  return Component;
}
