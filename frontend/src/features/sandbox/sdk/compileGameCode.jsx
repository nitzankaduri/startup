import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContactShadows, Float, Html, OrbitControls, RoundedBox, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { transform } from 'sucrase';
import * as THREE from 'three';
import { soundEngine } from '../../../shared/audio/soundEngine';
import { useGameStore } from '../store/useGameStore';
import { useSceneEditorStore } from '../store/useSceneEditorStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
  ArticulatedRunner, AssetCatalog, AutoNormalizeMesh, BiomeStage, CityBlockWorld, CityGrid, ColliderBox, DEFAULT_UPGRADES,
  DrivableVehicle, DynamicWater, ExplosionBurst, ExtrudedShape, FloatingLabel, FlyableCraft, GameRuntimeProvider,
  GridBuilder, HealthBar3D, HighBarrierProp, InstancedFoliage, LatheObject, LowHurdleProp, ObjectiveBeacon,
  PBR_SURFACES, ParticleBurst, PlayerController, PracticalLights, ProjectilePool, PropModel, RaceTrack, RealisticPhysicsRig, RealisticTerrain,
  SkeletalActor, SkidMarks, SmartCamera, SmartEntity, SmokeTrail, StudioBackdrop, StudioProp, StylizedCoinProp,
  StylizedRampTrain, StylizedTrain, SubwayCorridor, WeatherSystem, addImpactTrauma, createPbrTextureSet, createPhysicalMaterial,
  emitPopup, getFeelDelta, getTerrainHeight, motionBus, pbrMaterials, recordComboEvent, registerCollider,
  registerRadarBlip, resolveModelAsset, resolveMovement, setTargetFov, setTerrainConfig, spawnFloatingNumber,
  registerObjectCollider, stepInertiaBody, stepSpring, triggerCameraShake, triggerHitStop, triggerUpgradeDraft, unregisterCollider,
  useArenaPhysics, useEconomy, useGameInput, useGameLoop, useMissionState, usePbrMaterial, useStudioMaterial,
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
  'SkeletalActor', 'ArticulatedRunner', 'PropModel', 'AssetCatalog', 'AutoNormalizeMesh', 'StudioProp', 'BiomeStage',
  'PlayerController', 'ColliderBox', 'GameRuntimeProvider',
  'SubwayCorridor', 'CityBlockWorld', 'CityGrid', 'RaceTrack', 'StylizedTrain', 'StylizedRampTrain', 'LowHurdleProp', 'HighBarrierProp',
  'StylizedCoinProp', 'DynamicWater', 'InstancedFoliage', 'WeatherSystem', 'PracticalLights', 'ProjectilePool', 'ExplosionBurst',
  'SmartEntity', 'DrivableVehicle', 'SkidMarks', 'FlyableCraft', 'GridBuilder', 'ObjectiveBeacon',
  'RealisticTerrain', 'SmartCamera', 'StudioBackdrop', 'ExtrudedShape', 'LatheObject',
  'ParticleBurst', 'FloatingLabel', 'HealthBar3D', 'SmokeTrail', 'RealisticPhysicsRig',
];

function prepareSource(rawCode) {
  let src = rawCode
    .replace(/^```[a-zA-Z]*\s*/gm, '')
    .replace(/```\s*$/gm, '')
    .replace(/([=:,({\[]\s*)#(\[|\{)/g, '$1$2')
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

function useSafeFrame(cb, priority) {
  return useFrame((state, rawDelta) => {
    const { hasStarted, gameState } = useGameStore.getState();
    const { isPaused } = useSettingsStore.getState();
    if (!hasStarted || isPaused || useSceneEditorStore.getState().isEditMode || gameState !== 'playing') return;
    cb(state, Math.min(0.05, Math.max(0.001, rawDelta)));
  }, priority);
}

const HtmlCtx = React.createContext(false);
const HTML_DOM_TAGS = new Set(['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'button', 'section', 'ul', 'li']);

function SafeHtml({ children, ...props }) {
  return <Html {...props}><HtmlCtx.Provider value={true}>{children}</HtmlCtx.Provider></Html>;
}

function SafeCanvasDom({ tag, domProps, children }) {
  const insideHtml = React.useContext(HtmlCtx);
  if (!insideHtml) return null;
  return React.createElement(tag, domProps, ...children);
}

const SafeReact = {
  ...React,
  createElement(type, props, ...children) {
    if (typeof type === 'string' && HTML_DOM_TAGS.has(type)) {
      return React.createElement(SafeCanvasDom, { tag: type, domProps: props, key: props?.key }, ...children);
    }
    if (type === 'mesh' && props?.material && !props.material.isMaterial && !Array.isArray(props.material) && typeof props.material === 'object') {
      const { material: matProps, ...restProps } = props;
      return React.createElement(type, restProps, ...children, React.createElement('meshPhysicalMaterial', matProps));
    }
    return React.createElement(type, props, ...children);
  },
};

/** Compiles bespoke R3F JSX strings with verified non-undefined Atomic SDK bindings and safe box fallbacks. */
export function compileGameCode(rawCode, helpers = {}) {
  const prepared = prepareSource(rawCode);
  const compiled = transform(prepared, { transforms: ['jsx'], jsxRuntime: 'classic' }).code;
  const scope = {
    React: SafeReact, useState, useEffect, useRef, useMemo, useCallback,
    THREE, useFrame: useSafeFrame, useGameLoop, useThree,
    RoundedBox, OrbitControls, Html: SafeHtml, ContactShadows, Float, Text,
    Physics, RigidBody, CuboidCollider, BallCollider,
    useGameInput, SmartCamera, RealisticPhysicsRig, stepInertiaBody, SmokeTrail,
    PlayerController, ColliderBox, GameRuntimeProvider, useArenaPhysics, useMissionState,
    registerCollider, registerObjectCollider, unregisterCollider, resolveMovement, getTerrainHeight, setTerrainConfig,
    SkeletalActor, ArticulatedRunner, PropModel, AssetCatalog, AutoNormalizeMesh, StudioProp, BiomeStage, WeatherSystem, PracticalLights,
    SubwayCorridor, CityBlockWorld, CityGrid, RaceTrack, StylizedTrain, StylizedRampTrain, LowHurdleProp, HighBarrierProp, StylizedCoinProp,
    resolveModelAsset, DynamicWater, InstancedFoliage, ProjectilePool,
    ExplosionBurst, SmartEntity, DrivableVehicle, SkidMarks, FlyableCraft, GridBuilder, useEconomy,
    ObjectiveBeacon, registerRadarBlip, ExtrudedShape, LatheObject, RealisticTerrain, ParticleBurst,
    FloatingLabel, HealthBar3D, StudioBackdrop, useStudioMaterial, usePbrMaterial, createPbrTextureSet,
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
