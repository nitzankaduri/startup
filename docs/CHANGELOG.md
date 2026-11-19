# Changelog

## [0.66.0] - 2026-11-19
### Fixed
- Removed silent keyword-routing fallback (`build_fallback_game`) from `backend/ai_service.py`: missing/empty `GEMINI_API_KEY` now raises explicit `HTTP 503` (surfacing the exact message in the Lobby prompt bar), and invalid Gemini JSON/empty JSX responses raise explicit `HTTP 502` instead of silently serving canned presets.
- Added `generation_source`, `model_id` (`gemini-2.5-flash`), and `generation_error` fields to `backend/schemas.py`, `ai_key_configured` to `/api/health` in `backend/main.py`, `cache: 'no-store'` in `gameApi.jsx`, and a transparent `SynthesisStatusPill` (`"AI Live Synthesized"` vs `"Fallback: <reason>"`) in `HUDModeWidgets.jsx` / `GameHUD.jsx`.

## [0.65.0] - 2026-11-19
### Added
- Added `DIRECTOR_PACING_MANDATE` in `backend/ai_service.py` (wired into `generate_game_config` and `remix_game_config`) requiring `triggerHitStop`, `spawnFloatingNumber`, `triggerCameraShake`, `triggerUpgradeDraft` (after Wave 1 / Checkpoint 2), destructible environmental props & energy cores, elevated vantage points, and an armored `boss` climax guarding the final `ObjectiveBeacon`.
- Updated `docs/ARCHITECTURE.md` Section 3 with `DIRECTOR_PACING_MANDATE`.

## [0.64.0] - 2026-11-19
### Added
- Created `RunProgression.jsx` (`ComboStreakHUD`, `recordComboEvent`, `triggerUpgradeDraft`, `resetProgression`) and `UpgradeModal.jsx` inside `frontend/src/features/sandbox/sdk/progression/`, exposed via `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.
- Mounted `<ComboStreakHUD />` (live decaying `x2`/`x3`/`x5` streak meter synced with combat/collect/checkpoint/drift events) and `<UpgradeModal />` (3 warm-editorial upgrade cards selectable via click or `1 / 2 / 3` while cleanly pausing gameplay/Rapier physics) in `GameHUD.jsx`, `PauseMenu.jsx`, and `GameCanvas.jsx`.

## [0.63.0] - 2026-11-19
### Added
- Created `gameFeel.jsx` (`triggerHitStop`, `getFeelDelta`, `spawnFloatingNumber`, `FloatingNumbersLayer`, `resetFeelBus`) exposed via `spawnSdk.jsx`, `compileGameCode.jsx`, and mounted in `GameCanvas.jsx` for critical-hit/explosion/landing hit-stop time dilation and animated world-space damage/score numbers (`-40`, `+100`).
- Upgraded `SkeletalActor.jsx` & `SmartEntity.jsx` with `0.12s` white emissive hit-flash, directional knockback impulses on damage, and `enableDash` `Shift` dash bursts with cooldown ring, FOV pulse, HUD sync, and `SmokeTrail` dust plumes; wired `getFeelDelta` across `CombatVFX.jsx`, `ExplosionBurst.jsx`, and `SmartEntity.jsx`.

## [0.62.0] - 2026-11-19
### Fixed
- Replaced the 14m-radius spinning pre-start orbit in `SmartCamera.jsx` with a steady close behind-player showcase framing (`p.z + 7.6`, gentle sway only) so the screen never spins around behind buildings or zooms far out.
- Hardened `TitleOverlay.jsx` (`hasStarted` guard even from `idle`) and `App.jsx` (`fetchGameById` `game_config` validation).

## [0.61.0] - 2026-11-19
### Added
- Added car jump (`Space` / touch jump) with coyote/buffer support and moved handbrake drift-boost to `Shift` across `RacerController.jsx` (using Rapier downward raycast ground check so cars hop cleanly onto raised road stairs/ledges), `DrivableVehicle.jsx`, `HUDModeWidgets.jsx`, and `backend/prompts.py`.

## [0.60.0] - 2026-11-19
### Fixed
- **Black Screen Recovery & Visible Error Boundaries:**
  - Created `CanvasErrorBoundary.jsx` and `SandboxViewport.jsx` (`style={{ width: '100vw', height: '100vh' }}`, wired into `App.jsx` and `DynamicGameRunner.jsx`) so any WebGL or dynamic scene failure renders an explicit error message, component stack, Retry button, and Lobby exit instead of a silent black canvas.
  - Safely bypassed `EffectComposer` inside `PostFX.jsx` so direct `ACESFilmicToneMapping` renders reliably without Three.js r187 post-processing FBO mismatches.
  - Added guaranteed `<ambientLight intensity={0.8} />`, `<directionalLight position={[10, 20, 10]} intensity={1.5} />`, `<color attach="background" args={[...]} />` (`#E8DFD5` fallback), and isolated `<Suspense>` + ErrorBoundary wrappers around `<Environment>`/`<AtmosphereRig>` in `SceneEnvironment.jsx` and `StudioBackdrop.jsx`.
  - Audited `spawnSdk.jsx` & `compileGameCode.jsx`, exporting `pbrMaterials` / `SkidMarks` and guarding all injected SDK components with `SafeFallbackBox` so missing symbols cannot throw `ReferenceError`.

## [0.59.0] - 2026-11-19
### Fixed
- **Critical Runtime & Freeze Recovery (`cameraMath.jsx`, `SmartCamera.jsx`, `entitySteering.jsx`, `SmartEntity.jsx`, `CombatVFX.jsx`):**
  - Fixed `THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.` uncaught exception loop when `SmartCamera`, `SmartEntity`, or `ProjectilePool` raycasted over `SmokeTrail` sprites (`raycaster.camera = camera` + strict `h.object?.isMesh` filtering).
  - Eliminated all React `setState` calls inside `useFrame` loops across `SmartEntity.jsx` (`telegraphRef`), `DrivableVehicle.jsx` (`driftRef` + `smokeActiveRef` into `SkidMarks.jsx` / `SmokeTrail.jsx`), and `FlyableCraft.jsx` (`boostRef`).
  - Hardened `PostFX.jsx` to crash-proof `<EffectComposer multisampling={0}>` + `<Bloom>` + `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />` (removing `N8AO`/`SMAA`/`DepthOfField` WebGL stalls), replaced heavy `MeshReflectorMaterial` FBO passes in `DynamicWater.jsx` with a fast Fresnel sky-reflection + animated ripple GLSL shader, and switched `<Environment>` to `resolution={256} frames={1}`.

## [0.58.0] - 2026-11-19
### Added
- Redesigned the lobby entry experience with Lovable-inspired airy warm-editorial polish:
  - Upgraded `HeroMeshBackground.jsx`, `LobbyHero.jsx` (`min-h-[calc(100vh-4rem)]`), `PromptBar.jsx`, and `LobbyPage.jsx` so the initial above-the-fold viewport stays pure minimalist (navbar + headline + floating prompt card over the twin-arch coastal-blue/coral/apricot gradient), moving quick-chips, `ShowcaseStrip`, and the community gallery below the fold on scroll.
  - Upgraded `index.css`, `Navbar.jsx`, `ShowcaseStrip.jsx`, and `LobbyPage.jsx` with staggered fade-up + blur-clear entrance transitions.

## [0.57.0] - 2026-11-19
### Added
- Created `InstancedFoliage.jsx` and `foliagePresets.jsx` (`frontend/src/features/sandbox/sdk/foliage/`): GPU-instanced 4-layer biome flora system (`grass`, `flower`, `shrub`, `pebble`) using `THREE.InstancedMesh` + custom `onBeforeCompile` root-locked wind-sway vertex shader (`6` biomes: `meadow`, `forest`, `desert`, `alpine`, `volcanic`, `coastal`), exposed via `spawnSdk.jsx`, `compileGameCode.jsx`, and mounted in `BiomeTerrain.jsx`.
- Upgraded `DynamicWater.jsx` and `waterShaders.jsx` with real-time planar reflections via `@react-three/drei`'s `<MeshReflectorMaterial>` + procedural Sobel ripple `normalMap` and puddle `roughnessMap` for `ocean`, `river`, `lake`, and `harbor` presets (scaling resolution by quality preset while preserving GLSL magma for `lava`).
- Updated `backend/ai_service.py` (`OUTDOOR_DETAIL_RULE`) and `backend/prompts.py` to enforce `<InstancedFoliage>` and `MeshPhysicalMaterial` presets in every outdoor scene.

## [0.56.0] - 2026-11-19
### Added
- Upgraded `PostFX.jsx` into a full **Unity Post-Processing Stack v3** pipeline: `<N8AO halfRes aoRadius={1.8} intensity={1.6} distanceFalloff={0.8} />`, `<SMAA />`, `<Bloom mipmapBlur luminanceThreshold={1.15} intensity={0.3} />`, `<DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={1.8} />` (toggleable for diorama/isometric/orbit/title views), `<BrightnessContrast contrast={0.06} />`, `<HueSaturation saturation={0.12} />`, and `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />`.
- Wired quality scaling across `useSettingsStore.jsx`, `PauseMenu.jsx`, and `GameCanvas.jsx` (`Ultra` = full stack + DoF toggle, `Balanced` = `N8AO` + `SMAA` + `ToneMapping`, `Low` = native WebGL rendering).

## [0.55.0] - 2026-11-19
### Added
- Upgraded `pbrMaterials.jsx`, `pbrNoise.jsx`, and `MeshBuilder.jsx` to Unity-grade `THREE.MeshPhysicalMaterial` shaders (`createPhysicalMaterial`, `<meshPhysicalMaterial>`, Sobel `normalMap` synthesis) adding 5 physical surface presets: `automotive_paint` (`clearcoat: 1.0`), `architectural_glass` (`transmission: 0.88`, `ior: 1.5`, `thickness: 0.4`), `wet_asphalt` & `polished_marble` (puddle/wear roughness maps `0.12`–`0.85`), and `foliage_leaf` (`sheen: 0.6`, `#C5E1A5`), applied in `DrivableVehicle.jsx` and `ProceduralAssetFallbacks.jsx`.
- Upgraded `RealisticTerrain.jsx` with `MeshPhysicalMaterial` multi-layer `onBeforeCompile` shader blending of valley grass/soil and cliff rock normal + roughness detail maps by slope and elevation.

## [0.54.0] - 2026-11-19
### Added
- Created `AtmosphereRig.jsx` combining Drei `<Sky>` scattering, a smooth distant horizon haze shader dome, and a camera-aware additive volumetric sun-glare & god-ray halo shader.
- Upgraded `SceneEnvironment.jsx` and `StudioBackdrop.jsx` with player-following `2048x2048` directional shadow frustums (`[-35, 35]`, `shadow-bias={-0.0003}`, `shadow-normalBias={0.025}`) and custom `512px` PMREM `<Environment>` lightformers (warm sun disc, horizon ring, cool zenith fill, warm ground bounce, rim fill).

## [0.53.0] - 2026-11-19
### Added
- Upgraded `backend/database.py`, `backend/schemas.py`, and `backend/main.py` so `POST /api/games/{game_id}/score` accepts `{ player_name, score, time_seconds }` and persists the Top 10 descending records in MongoDB, plus `POST /api/games/{game_id}/play` (`increment_plays_count`) wired into `App.jsx` and `GameCard.jsx`.
- Upgraded `LeaderboardPanel.jsx`, `GameHUD.jsx`, and `useGameStore.jsx` to display Top 5 records, nickname submission, and 1-click `"Copy Challenge Link"` (`/play/{game_id}`) with a confirmation toast on both Victory and Run-Ended modals.

## [0.52.0] - 2026-11-19
### Added
- Created `PauseMenu.jsx` and `useSettingsStore.jsx` triggered via `Esc` or the top-right gear button in `GameHUD.jsx`.
- Added persisted Graphics Quality Presets (`Low` | `Balanced` | `Ultra`) dynamically controlling `<Canvas>` DPR (`[1, 1]` / `[1, 1.5]` / `[1, 2]`), shadow map resolution (`1024` / `2048` in `SceneEnvironment.jsx`), and `PostFX.jsx` (`N8AO` SSAO / `Bloom` / `Vignette`).
- Added Camera Sensitivity slider (`0.4x`–`2.0x` wired into `SmartCamera.jsx` / `cameraMath.jsx`), Master Volume slider (wired into `soundEngine.jsx` / `audioLoops.jsx`), plus `"Resume"`, `"Restart Run"`, `"Remix World"`, and `"Exit to Lobby"` actions.

## [0.51.0] - 2026-11-19
### Added
- Extracted `LobbyPage.jsx` and `lobbyHelpers.jsx` from `App.jsx` with 5 genre filter tabs (`All Worlds`, `Action & Combat`, `Vehicles & Flight`, `Strategy & Builder`, `Arcade & Parkour`) and instant community search.
- Upgraded `GameCard.jsx` (`#FAF9F6` light-editorial / `#111622` midnight dark) with live detected genre badges (`Action`, `Vehicles`, `Strategy`, `Flight`, `Adventure`), play counter, top-score badge, and hover overlay `"Play"` + `"Remix"` actions.

## [0.50.0] - 2026-11-19
### Changed
- Upgraded `backend/ai_service.py` to `thinkingBudget: 6144`, `temperature: 0.9`, and `maxOutputTokens: 16384` (with `75s` timeout) for `generate_game_config` and `remix_game_config`.
- Added strict **Pre-Output QA & Gameplay Depth Checklist** in `backend/prompts.py` enforcing specialized SDK rig matching (`SkeletalActor`, `DrivableVehicle`, `FlyableCraft`, `GridBuilder`, `SmartEntity`, `DynamicWater`, `ObjectiveBeacon`), terrain/water Y-height coordinate alignment, 3+ distinct gameplay beats, `registerRadarBlip` + `triggerCameraShake` wiring, and compiler-safe prop/hook validation.

## [0.49.0] - 2026-11-19
### Added
- Created spatial navigation & mission-clarity components inside `frontend/src/features/sandbox/sdk/navigation/`:
  - `ObjectiveBeacon.jsx`: 3D vertical light beam, animated ground ring, reach trigger, and frustum edge projection.
  - `ObjectivePointer.jsx`: screen-edge directional arrow + distance badge whenever active objectives sit outside the camera frustum.
  - `MinimapHUD.jsx` & `radarBus.jsx`: compact corner radar plotting player heading chevron, terracotta enemy dots, gold collectibles, and emerald objective stars, mounted inside `GameHUD.jsx`.
- Exposed `ObjectiveBeacon` and `registerRadarBlip` via `spawnSdk.jsx`, `compileGameCode.jsx`, `SmartEntity.jsx`, and `backend/prompts.py`.

## [0.48.0] - 2026-11-19
### Added
- Upgraded `SmartCamera.jsx` & `cameraMath.jsx` to cast wall-avoidance rays every frame from `playerPos + [0, 1.5, 0]` toward `DESIRED_POS` and smoothly pull the camera forward to `hit.distance - 0.35`.
- Converted trauma screen shake in `SmartCamera.jsx` to damped Perlin/sine offsets on camera rotation (`rotation.x/y/z`) alongside dynamic `motionBus.targetFov` expansion.
- Exposed `triggerCameraShake(intensity)` and `setTargetFov(fov)` via `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.47.0] - 2026-11-19
### Added
- Upgraded `frontend/src/shared/audio/soundEngine.jsx` and created `audioLoops.jsx` implementing a procedural Web Audio foley & adaptive music synthesizer:
  - Continuous velocity-mapped loops: `engineHum` (pitch/filter scaled to speed), `windRush` (scaled to airspeed & altitude), and rhythmic `footstepGravel`.
  - Action foley library: `swordSlash`, `laserBolt`, `heavyCannon`, `woodBuild`, `coinChime`, `shieldHit`, `powerupFanfare`, and `uiClick`.
  - Generative warm ambient chord pad (`startAmbient`, `stopAmbient`, `setCombatIntensity`) shifting during combat/boss encounters, paired with the mute toggle in `GameHUD.jsx`.

## [0.46.0] - 2026-11-19
### Added
- Created interactive 3D strategy & builder kit inside `frontend/src/features/sandbox/sdk/strategy/`:
  - `GridBuilder.jsx`: mouse terrain/grid raycast snap-to-grid placement, translucent valid (`#2E7D32`) / blocked (`#C62828`) ghost preview, spring scale-up pop animation, dust `ParticleBurst`, and wood/stone construction thud audio.
  - `useEconomy.jsx`: `gold`/`energy`/`wood` resource state manager, passive generator ticks, upgrade tier multipliers, and rising floating `+income` popups.
- Exposed `GridBuilder` and `useEconomy` via `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.45.0] - 2026-11-19
### Added
- Created studio-grade vehicle and flight controllers in `frontend/src/features/sandbox/sdk/vehicles/`:
  - `DrivableVehicle.jsx` & `SkidMarks.jsx`: forward acceleration/reverse, speed-sensitive steering, lateral tire grip vs `Shift`/`Space` handbrake drift with smoke plumes and pooled skid marks, spring roll/pitch suspension, rotating wheels, and brake/headlight emitters.
  - `FlyableCraft.jsx`: 6-DOF flight/hover rig with yaw-coupled banking roll, climb/dive pitch, `Shift` throttle boost thruster flames, soft altitude floor/ceiling clamps, and forward lead-indicator targeting reticle.
- Exposed `DrivableVehicle` and `FlyableCraft` via `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.44.0] - 2026-11-19
### Added
- Created `sdk/assets/normalizeModelMetrics.jsx` (`computeNormalizedMetrics` via `THREE.Box3`) to auto-normalize any loaded `.glb` model to its meter `targetHeight` (`1.8m` humanoids, `1.6m` vehicles, `4.5m` trees) and shift its inner mesh `position.y` by `-min.y * normScale` so feet/wheels rest cleanly at `y = 0`.
- Upgraded `SkeletalActor.jsx` and `PropModel.jsx` with automatic `Box3` normalization and grounded `<ContactShadows>` beneath every actor/prop.
- Added `preloadAllRegistryModels()` (`useGLTF.preload`) in `modelRegistry.jsx`, called automatically on `GameCanvas.jsx` mount to eliminate spawn stutter.

## [0.43.0] - 2026-11-19
### Added
- Created `TitleOverlay.jsx` and wired `hasStarted` / `startGame()` into `useGameStore.jsx`, `gameStoreHelpers.jsx`, `SmartCamera.jsx` (smooth intro orbit over the live 3D world before PLAY), and `GameHUD.jsx`, showing title, mission objective, control pills, and instant start on `"PLAY"` click or first movement key.
- Enhanced `soundEngine.jsx` (and wired into `CombatVFX.jsx`, `ExplosionBurst.jsx`, `RealisticPhysicsRig.jsx`) with ballistic `playCannonFire`, sub-bass `playExplosionBoom`, velocity-synced `playFootstep` / `updateMotionAudio` engine rumble, and expanded victory/defeat stingers.
- Updated `PromptBar.jsx` with 4 AAA showcase quick-start prompts (`Coastal Siege`, `Desert Convoy`, `Lava Citadel`, `Alpine Outpost`) featuring GLB skeletal characters, water shaders, combat VFX, and vehicles.

## [0.42.0] - 2026-11-19
### Changed
- Upgraded `backend/ai_service.py` (`temperature: 0.92`, `maxOutputTokens: 12288`, `thinkingBudget: 4096`) and Master Studio System Prompt in `backend/prompts.py` so every newly generated game leverages the full AAA studio stack (`SkeletalActor` GLB heroes/NPCs instead of box characters, `DynamicWater` ocean/river/lava shaders, `SmartEntity` AI guards/bosses, `ProjectilePool` + `ExplosionBurst` combat VFX, `RealisticTerrain`, `pbrMaterials`, `PostFX`, and `RealisticPhysicsRig`).
- Enforced a complete playable game loop on every generation: clear objective, progressive wave/checkpoint escalation, dynamic HUD meters/actions, crisp win/lose states, and restart safety.

## [0.41.0] - 2026-11-19
### Added
- Created autonomous AI state-machine actors in `frontend/src/features/sandbox/sdk/ai/`:
  - `SmartEntity.jsx` & `entitySteering.jsx`: `<SmartEntity behavior="patrol_chase | ranged_turret | swarm | boss" model="hero" hp={100} />` powered by `SkeletalActor`, with raycast obstacle-avoidance steering, flanking/waypoint movement, automatic `Idle`/`Walk`/`Run`/`Attack` animation switching, damage-only floating `<Html>` health bar, telegraphed attack indicator rings, and knockback defeat `<ExplosionBurst>`.
- Exposed `SmartEntity` in `spawnSdk.jsx`, `compileGameCode.jsx`, `CombatVFX.jsx` (`ProjectilePool` ancestor damage routing), and `backend/prompts.py`.

## [0.40.0] - 2026-11-19
### Added
- Created `frontend/src/features/sandbox/sdk/vfx/`:
  - `DynamicWater.jsx` & `waterShaders.jsx`: custom GLSL vertex+fragment animated `ocean`, `river`, and `lava` shader planes featuring multi-wave vertex displacement, specular sun glints, shoreline foam, and flowing UV distortion.
  - `CombatVFX.jsx` (`ProjectilePool` with glowing emissive tracers and scene raycast hit detection) and `ExplosionBurst.jsx` (expanding shockwave ring, gravity fiery debris, lingering smoke puffs, dynamic point-light flash, and micro camera trauma shake).
- Exposed `DynamicWater`, `ProjectilePool`, and `ExplosionBurst` via `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.39.0] - 2026-11-19
### Added
- Built the 3D GLTF/GLB Asset & Skeletal Animation Engine inside `frontend/src/features/sandbox/sdk/assets/`:
  - `modelRegistry.jsx`: curated CORS-enabled Three.js / Khronos GLB registry (`Soldier`, `RobotExpressive`, `CesiumMan`, `CesiumMilkTruck`, `Buggy`, `DamagedHelmet`, `Fox`, plus `tree`, `rock`, `crate`).
  - `SkeletalActor.jsx`: `useGLTF`, `SkeletonUtils.clone` for independent instanced actors, `useAnimations` with `0.15s` `crossFadeTo` transitions (`Idle`, `Walk`, `Run`, `Jump`, `Attack`), and automatic child mesh shadow casting.
  - `PropModel.jsx` & `ProceduralAssetFallbacks.jsx`: GLB prop/vehicle renderer with offline PBR fallback meshes.
- Exported `SkeletalActor`, `PropModel`, `GLB_ASSETS`, and `resolveModelAsset` from `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.38.0] - 2026-11-19
### Changed
- Upgraded `backend/ai_service.py` (`temperature: 0.9`, `thinkingBudget: 4096`) and `backend/prompts.py` (`ART_DIRECTION_RULES`) to enforce a gritty, grounded photorealistic art direction: forbids cartoonish/toy aesthetics, floating neon rings, single-color flat plastic blocks, and squash-and-stretch distortion, and mandates `pbrMaterials`, `RealisticTerrain`, `<Sky>` + HDR `<Environment>`, `RealisticPhysicsRig`, `SmokeTrail`, multi-part architectural structures, and industrial/natural clutter.

## [0.37.0] - 2026-11-19
### Added
- Created `sdk/RealisticPhysicsRig.jsx` and `sdk/SmokeTrail.jsx` (plus `stepInertiaBody`) removing cartoon squash-and-stretch `scale` deformations in favor of weighty mass/inertia integration, suspension landing compression, braking nose-dive, throttle squat, cornering body roll, and alpha-blended billboarded tire/thruster smoke plumes.
- Updated `MotionRig.jsx` to delegate to `RealisticPhysicsRig` and exposed `RealisticPhysicsRig`, `stepInertiaBody`, and `SmokeTrail` across `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.
- Upgraded `sdk/SmartCamera.jsx` with `sdk/cameraMath.jsx` (`smoothDamp` critically-damped springs, Perlin-style `noise2D` idle micro-breathing, scene raycast collision avoidance, and velocity-based FOV shift).

## [0.36.0] - 2026-11-19
### Added
- Created `sdk/pbrNoise.jsx` and `sdk/pbrMaterials.jsx` generating cached `512x512` seamless offscreen `<canvas>` Albedo (`map`), `bumpMap`, and `roughnessMap` textures across 8 material surfaces (`weathered_asphalt`, `cracked_concrete`, `brushed_steel`, `aged_timber`, `volcanic_rock`, `desert_sand`, `alpine_snow`, `mossy_stone`).
- Upgraded `useStudioMaterial` in `sdk/MeshBuilder.jsx` to bind multi-map PBR textures automatically on every `ExtrudedShape`, `LatheObject`, and custom primitive.
- Created `sdk/RealisticTerrain.jsx` rendering `128x128` subdivided fBm geological terrain meshes vertex-colored by slope and elevation with computed normals and PBR relief maps, integrated into `BiomeTerrain.jsx`, `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.35.0] - 2026-11-19
### Added
- Installed `@react-three/postprocessing` and `postprocessing`; created `PostFX.jsx` (`<EffectComposer>` with `<N8AO>`, `<Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.35} />`, and `<Vignette darkness={0.35} offset={0.25} />`).
- Configured `ACESFilmicToneMapping` (`toneMappingExposure: 1.05`) and `shadows="soft"` (`PCFSoftShadowMap`, `2048x2048`, `shadow-normalBias={0.03}`) in `GameCanvas.jsx` and `StudioBackdrop.jsx`.
- Upgraded `SceneEnvironment.jsx` and `sceneryHelpers.jsx` with Drei `<Sky>` atmospheric scattering, depth-matched `<fogExp2>`, and biome-matched `<Environment preset="sunset|forest|dawn|city" resolution={256} />` (with `<Lightformer>` offline ErrorBoundary fallback).

## [0.34.0] - 2026-11-19
### Added
- Created `compileGameCode.jsx` (`sucrase` JSX compiler + Atomic SDK sandbox scope) and `DynamicGameRunner.jsx` (ErrorBoundary + auto-healing via `POST /api/fix-code`), wired into `GameCanvas.jsx` when `game_config.code` is present.
- Upgraded `GameHUD.jsx`, `HUDModeWidgets.jsx`, `useGameStore.jsx`, and `gameStoreHelpers.jsx` with Dynamic Context HUD support (`registerHud({ meters, actions, controlsHint })` for custom meters, custom on-screen action buttons, and dynamic `controls_hint`).
- Upgraded `QuickEditDrawer.jsx`, `gameApi.jsx`, `backend/schemas.py`, `backend/main.py`, and `backend/ai_service.py` so iterative remixes send active `generated_code` + follow-up instruction to `POST /api/remix`.

## [0.33.0] - 2026-11-19
### Added
- Upgraded `backend/ai_service.py` and `backend/prompts.py` to use Gemini 2.5 Flash deep thinking (`maxOutputTokens: 12288`, `thinkingConfig: { thinkingBudget: 4096 }`, thought-part filtering) and forbid defaulting to generic runner/collector templates.
- Required bespoke `architecture_plan` (`camera_mode`, `input_scheme`, `models`, `rules_summary`, `win_loss_triggers`, `hud_meters`) and self-contained React Three Fiber JSX `code` built from Atomic SDK primitives (`useGameInput`, `SmartCamera`, `MeshBuilder`, `StudioBackdrop`).
- Added `fix_generated_code` (`thinkingBudget: 2048`) in `backend/ai_service.py`, `FixCodeRequest` / `FixCodeResponse` in `backend/schemas.py`, and `POST /api/fix-code` in `backend/main.py` for runtime self-healing.

## [0.32.0] - 2026-11-19
### Added
- Replaced rigid genre templates in `frontend/src/features/sandbox/sdk/` (moving `trackChunks.jsx` to `modes/trackChunks.jsx`) with composable **Atomic Game Building Blocks**:
  - `sdk/useGameInput.jsx`: universal keyboard state (`keys`, `isPressed`), pointer NDC tracking, mesh `bindMesh` pointer handlers, and `getGroundPoint()` 3D world-space raycasting.
  - `sdk/SmartCamera.jsx`: programmable multi-mode camera supporting `follow`, `first_person`, `isometric` (WASD pan + wheel zoom), `orbit`, and `side_scroller`, wired into `CameraRig.jsx` and `GameCanvas.jsx`.
  - `sdk/MeshBuilder.jsx` & `sdk/StudioBackdrop.jsx`: tactile PBR & geometry kit (`useStudioMaterial`, `ExtrudedShape`, `LatheObject`, `ParticleBurst`, `FloatingLabel`, and `StudioBackdrop` with `<ContactShadows>`, directional sunlight, and atmospheric sky dome).

## [0.31.1] - 2026-11-19
### Changed
- Refined Dark Mode into a **Midnight Blue-Black-Grey** palette (`#0A0D14` canvas, `#111622` cards, `#182032` chips, `#232E42` borders, `#F1F5F9` text, `#94A3B8` muted text) with subtle atmospheric radial hero depth while keeping **Warm Beige Light Mode** aligned with Base44.
- Enlarged `PromptBar.jsx` (`max-w-2xl`, `min-h-[168px]`, `rows={4}`) with 5 quick-start category tiles (`Rooftop Chase`, `Snowboard Run`, `Train Heist`, `Temple Arena`, `Drift Rally`), staggered `animate-fade-up` entrances, interactive button micro-animations, and live CSS animations inside `ShowcaseStrip.jsx` (`animate-spin-slow`, `animate-bar-breathe`, `animate-pulse`).

## [0.31.0] - 2026-11-19
### Added
- Implemented Base44-inspired editorial landing layout and full dual-theme switching via `useTheme.jsx` and Tailwind `darkMode: 'class'`: **Warm Beige Light Mode** (`#F6F4EF` / `#FFFFFF` / `#EFECE4` / `#E6E2D8` / `#181715`) and **Space Grey Black Dark Mode** (`#111214` / `#1B1C20` / `#25262B` / `#2E3036` / `#F4F4F5`).
- Added Light/Dark theme toggle in `Navbar.jsx`, rebuilt `ShowcaseStrip.jsx` with the 6-card hanging architectural strip, refined `PromptBar.jsx` with a crisp `"Build"` badge + `#D96B27` launch tile, and applied Space Grey dark styling across `App.jsx`, `RecentGamesGrid.jsx`, `GameCard.jsx`, `GameHUD.jsx`, `HUDModeWidgets.jsx`, `LeaderboardPanel.jsx`, `PowerupHUD.jsx`, `SpeedEffects.jsx`, `TouchControls.jsx`, and `QuickEditDrawer.jsx`.
- Updated `GEMINI.md`, `CLAUDE.md`, and `docs/ARCHITECTURE.md` to specify the dual Light Beige + Space Grey Black Dark design system.

## [0.30.0] - 2026-11-19
### Added
- Upgraded `backend/prompts.py` (used by `backend/ai_service.py`) to instruct Gemini 2.5 Flash to populate 20–28 dense frame-1 entities utilizing `train`, `ramp_train`, `powerup` pickups (`jetpack`, `magnet`, `sneakers`, `multiplier`), overhead slide `hazard` gates, curved `collectible` arcs, `WorldScenery`, `HoverboardSystem`, and musical combo audio.
- Added `powerup` entity type (`powerup_type`) to `backend/schemas.py`, `PowerupBlock.jsx`, and `AssetCatalog.jsx` so power-ups spawn across all modes.

## [0.29.0] - 2026-11-19
### Added
- Upgraded `soundEngine.jsx` with escalating pentatonic coin marimba chimes (`C5 -> D5 -> E5 -> G5 -> A5 -> C6`), lane-switch whoosh, landing bass thump, metallic clang + glass-shatter hoverboard save, and high-score fanfare.
- Created `ParticleSystem.jsx` and `SpeedEffects.jsx` for 75%+ speed peripheral wind streaks, floating world/event popups (`+50/100 NEAR MISS!`, `JETPACK!`, `SAVED!`), and 0.12s cinematic hit-stop + camera trauma shake on crashes.

## [0.28.0] - 2026-11-19
### Added
- Created `PowerupSystem.jsx` and `PowerupHUD.jsx` implementing 4 spawnable world power-ups with radial SVG countdown rings: `jetpack` (8s high-altitude flight + sky coin ribbon), `magnet` (10s 3-lane curved coin pull), `sneakers` (10s boosted jump height + shoe springs), and `multiplier` (10s 2x combo aura).
- Created `HoverboardSystem.jsx` supporting double-tap `Space` or `E` deployment for a 15s hoverboard shield that shatters in slow-mo, blasts nearby obstacles away, and saves the run on crash.
- Wired power-up spawning, magnet pull, and hoverboard crash recovery into `trackChunks.jsx`, `RunnerWorldStream.jsx`, `ArcadeRunnerRig.jsx`, `PlayerController.jsx`, `useGameStore.jsx`, `GameCanvas.jsx`, and `GameHUD.jsx`.

## [0.27.0] - 2026-11-19
### Added
- Created `BiomeTerrain.jsx` replacing smooth cone mountains with sculpted vertex-displaced `IcosahedronGeometry` multi-peak ridges, organic snow/sandstone caps, and stepped mid-ground cliff terraces.
- Created `proceduralTextures.jsx` generating offscreen `<canvas>` PBR `map` + `bumpMap` textures for railway gravel ballast and cobblestone/asphalt deck wear.
- Upgraded `WorldScenery.jsx` and `WorldTrackDressing.jsx` with Mediterranean/urban buildings (balconies, awnings, rooftop water towers), layered trees, steel truss gantries, and sunlit billboards; upgraded `RunnerWorldStream.jsx` with wooden sleepers/ties and gleaming metallic twin rails, and `StaticBlock.jsx` with procedural cobblestone/asphalt surface maps.

## [0.26.0] - 2026-11-19
### Added
- Created `CharacterModel.jsx` and upgraded `PlayerMesh.jsx` with a full articulated limb hierarchy (hoodie torso, bouncing backpack, backward cap/visor & eyes, upper/lower arm pivots, thigh/shin/sneaker pivots, trailing scarf, dizzy crash stars, roll dust, and altitude-scaled grounded shadow decal).
- Implemented procedural IK-style animation state machine in `PlayerMesh.jsx` covering Run Cycle, Jump/Mid-Air knee-tuck & raised arms, Slide/Roll tuck + dust trail, and Stumble/Crash knockback tumble with orbiting dizzy stars.

## [0.25.0] - 2026-11-19
### Added
- Created `features/sandbox/sdk/props/StylizedTrain.jsx` (`StylizedTrain` with chamfered body, metallic trim stripe, tinted windshield/windows, warm headlights, roof AC vents, bogies/wheels; and `StylizedRampTrain` with amber hazard chevrons).
- Created `features/sandbox/sdk/props/StylizedObstacles.jsx` (`LowHurdleProp` red-and-cream sawhorse barrier, `HighBarrierProp` overhead caution gantry, and `StylizedCoinProp` beveled gold coin with embossed star emblem and floor shadow ring).
- Wired stylized props into `RunnerWorldStream.jsx`, `CollectibleItem.jsx`, `HazardBlock.jsx`, `TrainBlock.jsx`, `AssetCatalog.jsx`, and `backend/schemas.py`.

## [0.24.0] - 2026-11-19
### Fixed
- Fixed `backend/ai_service.py` `.env` loading path (`Path(__file__).resolve().parent / ".env"`, `override=False`) and restored prompt-aware procedural fallback synthesis (`presets.py`) when `GEMINI_API_KEY` is blank so the user is never blocked on generation, while preserving explicit `502` error surfacing if a configured key fails.
- Expanded `_detect_mode()` and `_pick_biome()` in `backend/presets.py` to detect `sliding`, `near-miss`, `combo`, `surf`, `ski`, `snowboard`, and `rooftop` prompts as `arcade_runner` with matching coastal/alpine/desert/obsidian palettes.
- Increased `PromptBar.jsx` textarea height to `rows={3}` so multi-line prompts display cleanly without scrollbars.

## [0.23.0] - 2026-11-19
### Changed
- Updated `backend/prompts.py` (used by `backend/ai_service.py`) to enforce `MotionRig`, `WorldScenery`, curved magnetic collectible arcs, and `ArcadeRunnerRig` selection for running/chasing/surfing/skiing prompts, including a complete sunlit freight-dash JSON reference example.
- Added `createProceduralMaterial` helper to `frontend/src/features/sandbox/sdk/spawnSdk.jsx`.
- Polished `PromptBar.jsx` with 4 showcase quick-start tiles: *Sunlit Rooftop Parkour Chase*, *Alpine Snowboard Canyon Run*, *Desert Train Heist Runner*, and *Ancient Temple Guardian Arena*.

## [0.22.0] - 2026-11-19
### Added
- Added `arcade_runner` mode (`ArcadeRunnerRig.jsx`, `RunnerWorldStream.jsx`, and `createTrackChunks()` in `trackChunks.jsx` / `spawnSdk.jsx`) with snappy 3-lane switching + free steering, `S`/`Down` roll-duck & mid-air fast-fall slam, climbable trains/bridges, low hurdles, high barriers, moving hazards, and endless chunk recycling.
- Added `+50 NEAR MISS` floating badge, `x1 -> x2 -> x5` Combo Multiplier in `HUDModeWidgets.jsx` / `GameHUD.jsx`, 60ms Hit-Stop, and roll animation in `MotionRig.jsx`.
- Updated `backend/schemas.py`, `backend/prompts.py`, `backend/presets.py`, and `GameCard.jsx` to support `arcade_runner`.

## [0.21.0] - 2026-11-19
### Changed
- Upgraded `SceneEnvironment.jsx` with a sunlit 3-point stylized lighting rig (`#FFF3E0` golden sunlight `2.35`, `#8EC5FC` / `#E6C79C` hemisphere sky-to-ground bounce `1.05`, and `#8EC5FC` rim light) plus smooth atmospheric sky dome and exponential horizon haze.
- Upgraded `WorldScenery.jsx`, `sceneryHelpers.jsx`, and created `WorldTrackDressing.jsx` with instanced multi-story buildings (pitched roofs and lit windows), layered-canopy trees, overhead gantries, wooden fences, street lamps, mountain ring, and drifting clouds.
- Upgraded `spawnSdk.jsx`, `CollectibleItem.jsx`, `ParticleBursts.jsx`, and `HazardBlock.jsx` with metallic gold PBR collectibles (`metalness: 0.75, roughness: 0.2`), 2.5-unit magnetic pull-in animation, 12-sparkle gold/ivory bursts, striped barrier warning trims, and grounded contact shadows.

## [0.20.0] - 2026-11-19
### Added
- Created `features/sandbox/sdk/spawnSdk.jsx` with spring-damper physics (`stepSpring`), `motionBus`, jump/land triggers, and impact trauma helpers.
- Created `MotionRig.jsx` wrapping characters and vehicles in a spring-damped squash/stretch rig (`[0.82, 1.28, 0.82]` 140ms jump launch, `[1.26, 0.74, 1.26]` landing squash + 12-particle dust ring burst, `±0.28 rad` strafe/steer bank tilt, forward lean, and speed-synced bounce).
- Created `CameraRig.jsx` and `SpeedLines.jsx` for Subway-Surfers style spring-lagged third-person camera with separate XZ/Y/look-ahead damping, dynamic `60°`–`72°` FOV expansion, peripheral speed lines, and micro-impact trauma shake.

## [0.19.0] - 2026-11-19
### Changed
- Updated `backend/ai_service.py` to authenticate against `gemini-2.5-flash:generateContent` strictly via `x-goog-api-key` header (no `?key=` URL param) with `temperature: 0.95` and `responseMimeType: "application/json"`.
- Removed silent static preset fallback on Gemini API failure: missing keys or Google API errors now log full details and raise `HTTPException(status_code=502, detail="Gemini API Error: ...")`.
- Updated `backend/prompts.py` for unique 18–28 entity prompt-tailored generation, `gameApi.jsx` to parse FastAPI JSON error `detail`, and `PromptBar.jsx` to render backend errors in a warm alert banner.

## [0.18.0] - 2026-11-19
### Fixed & Improved
- Fixed `Score: 0` bug on the Victory modal and Leaderboard: added `computeFinalScore()` in `gameStoreHelpers.jsx`, `finalScore` and `registerDriftBoost()` in `useGameStore.jsx`, and wired `LeaderboardPanel.jsx` and `RacerController.jsx` so winning runs calculate a real score from collectibles, checkpoints, kills, drift boosts, and time bonuses.
- Upgraded `backend/prompts.py`, `backend/presets.py`, and `backend/presets_modes.py` to generate rich 15–20+ entity winding S-curve levels with varied elevation, jump gaps, ramps, boost pads, and hazards across all 4 game modes.

## [0.17.0] - 2026-11-19
### Changed
- Created `VehicleMesh.jsx` and upgraded `PlayerMesh.jsx` + `RacerController.jsx`: multi-part rally buggy with tinted cockpit, headlights, spoiler, spinning metallic-rim wheels, steering wheel angle, and suspension roll; articulated explorer/soldier character with running leg/arm stride, flowing scarf trail, and grounded contact shadow.
- Upgraded `StaticBlock.jsx`, `CheckpointGate.jsx`, `GoalZone.jsx`, `AssetCatalog.jsx`, and `GameCanvas.jsx` with downward architectural support pillars, alternating red/cream motorsport rumble-strip curbs on road segments, and animated golden checkpoint/goal arches with spinning rings and translucent light beams.

## [0.16.0] - 2026-11-19
### Added
- Upgraded `SceneEnvironment.jsx` with a custom GLSL atmospheric `<SkyDome>` shader (warm golden-hour `#E8C9A3` -> `#6B8EAE` for daytime themes, `#23293A` -> `#0F131C` for twilight themes), matching exponential `<fogExp2>`, warm `#FFF3E0` key sunlight (`2.2`), cool `#B8D4F0` fill light (`0.9`), and rim lighting.
- Created `WorldScenery.jsx` and `sceneryHelpers.jsx` using `InstancedMesh` to render a 360-degree low-poly mountain range with snow/stone caps, architectural ruin pillars, pine trees, boulders, and slow-drifting volumetric low-poly clouds.

## [0.15.0] - 2026-11-19
### Changed
- Added root `.gitignore` excluding `.env` and `backend/.env`, and created `backend/.env` with `GEMINI_API_KEY`, `MONGO_URI`, and `FRONTEND_URL`.
- Updated `backend/ai_service.py` to support both Google AI Studio keys (`AIza...` via `x-goog-api-key`) and Cloud/Vertex tokens (`AQ....` via `Authorization: Bearer` with `?key=` fallback), plus startup/error logging and offline preset fallback.

## [0.14.0] - 2026-11-19
### Changed
- Redesigned the Lobby landing experience after the Base44 editorial layout: added sticky `Navbar.jsx`, hero typography (`Every player needs a world`), `PromptBar.jsx` with terracotta `#D96B27` submit square and 5 icon category tiles (`Parkour`, `Arena`, `Racing`, `Survival`, `Temple`), and `ShowcaseStrip.jsx` hanging architectural preview cards.

## [0.13.0] - 2026-11-19
### Changed
- Updated `GEMINI.md` and `CLAUDE.md` to replace the dark theme with the **Warm Editorial & Tactile Studio** palette (`#F6F4EF` Warm Alabaster canvas, `#FFFFFF` elevated cards, `#EFECE4` soft sand chips, `#E6E2D8` warm borders, `#181715` charcoal text/CTAs, `#6E6A61` warm stone muted text, `#D96B27` terracotta accent).
- Redesigned `App.jsx`, `PromptBar.jsx`, `RecentGamesGrid.jsx`, `GameCard.jsx`, `GameHUD.jsx`, `HUDModeWidgets.jsx`, `LeaderboardPanel.jsx`, `QuickEditDrawer.jsx`, `TouchControls.jsx`, `tailwind.config.js`, `index.html`, and `index.css` with frosted warm glass HUDs, editorial typography, and Bento gallery cards.

## [0.12.0] - 2026-11-19
### Added
- **Performance & GPU Hardening:** Integrated Drei `<PerformanceMonitor>` in `GameCanvas.jsx` with adaptive `dpr` and shadow map scaling (`2048` -> `1024`) in `SceneEnvironment.jsx`, plus `SceneCleanup.jsx` to dispose Three.js geometries and materials on reset/unmount.
- **Mobile Touch Support:** Created `TouchControls.jsx` and `touchInputState.jsx` (auto-detected via `pointer: coarse` / `maxTouchPoints`) with matte thumb-joystick and Jump/Dash/Fire controls wired into `PlayerController.jsx`, `RacerController.jsx`, and `App.jsx`.
- **Full Repository Audit:** Verified zero `.ts`/`.tsx` files, zero hardcoded secrets, `render.yaml`/`README.md`/`.env.example` consistency, and strict <150-line compliance across all files.

## [0.11.0] - 2026-11-19
### Added
- **Live 3D Thumbnail Capture:** Enabled `preserveDrawingBuffer: true` on `<Canvas>`, created `ThumbnailCapturer.jsx`, and added `POST /api/games/{game_id}/thumbnail`.
- **Global Speedrun & High-Score Leaderboard:** Added `scores` array to game records, `POST /api/games/{game_id}/score`, `LeaderboardPanel.jsx`, and Top-3 previews in `GameCard.jsx`.
- **Discovery & One-Click Remix:** Added genre filter pills, search in `RecentGamesGrid.jsx`, and `"Remix"` button on `GameCard.jsx`.

## [0.10.0] - 2026-11-19
### Added
- Upgraded Spawn.gg to a Multi-Genre 3D Game Engine (`platformer`, `arena_shooter`, `time_trial_racer`, `survival_waves`).

## [0.9.0] - 2026-11-19
### Added
- Created `backend/prompts.py` and `POST /api/remix` wired to `QuickEditDrawer.jsx`.

## [0.8.0] - 2026-11-19
### Added
- Added `rotating_beam`, `speed_pad`, `crumbling_platform`, `key`, `locked_gate`, and `patrol_bot` entities plus Coyote Time, Jump Buffering, and Mid-Air Dash.

## [0.7.0] - 2026-11-19
### Changed
- Added `SceneEnvironment.jsx`, beveled `<RoundedBox>` geometry, and procedural `PlayerMesh.jsx` with grounded contact shadow.

## [0.6.0] - 2026-11-19
### Added
- Added `render.yaml` Blueprint and root `README.md` for Render.com deployment.

## [0.5.0] - 2026-11-19
### Added
- Added `soundEngine.jsx`, `ParticleBursts.jsx`, squash/stretch, camera shake, and `QuickEditDrawer.jsx`.

## [0.4.0] - 2026-11-19
### Added
- Built `PromptBar.jsx`, `RecentGamesGrid.jsx`, `GameHUD.jsx`, `gameApi.jsx`, and `/play/:id` routing.

## [0.3.0] - 2026-11-19
### Added
- Built core R3F + Rapier 3D sandbox engine (`GameCanvas.jsx`, `PlayerController.jsx`, `AssetCatalog.jsx`, `useGameStore.jsx`).

## [0.2.0] - 2026-11-19
### Added
- Implemented FastAPI + Motor backend (`main.py`, `schemas.py`, `database.py`, `ai_service.py`, `presets.py`).

## [0.1.0] - 2026-11-19
### Added
- Initialized repository with `GEMINI.md`, `CLAUDE.md`, Vite `.jsx` frontend, and `/backend`.
