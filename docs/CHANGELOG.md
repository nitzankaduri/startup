# Changelog

## [0.102.1] - 2026-11-25
### Connected & Hardened
- **5-Genre `WorldGenreDirector.js` & Freeze-Frame Live Editor Integration (`StudioEngineCore.js`, `DirectorSetup.js`, `GameKernel.jsx`):**
  - Created `WorldGenreDirector.js` (`GENRE_PROFILES`, `resolveGenreProfile`, `buildGenreObstacles`, `buildGenreCoins`, `buildGenreWorldConfig`) driving `endless_runner`, `open_world_sandbox`, `sky_shooter`, `vehicle_pursuit`, and `arena_action` through `StudioEngineCore.createStudioWorldRuntime`.
  - Hardened Freeze-Frame Live Editor pause & resume flow in `GameKernel.jsx`: clicking `"Edit World"` sets both `kernelFreezeBus.paused` and `useSettingsStore.isPaused = true`, allows live `POST /api/games/refine` or preset/mode/speed switches on the frozen 3D frame, and resumes cleanly after the `3-2-1-GO!` countdown without `useEffect` overriding the countdown lock.

## [0.102.0] - 2026-11-25
### Changed & Added
- **Clean-Slate `sandbox/` Rebuild & Official Kenney CC0 `.glb` Studio Pack (`setup_kenney_studio.mjs`, `StudioEngineCore.js`, `SandboxViewport.jsx`, `SandboxCanvas.jsx`, `StudioVisualRig.jsx`):**
  - Removed 100+ redundant legacy files across `sandbox/assets/`, `sandbox/gameplay/`, `sandbox/modes/`, `sandbox/physics/`, `sandbox/components/entities/`, and unused `sandbox/sdk/*` modules while keeping `<SandboxViewport gameSpec={...} />`, `GameHUD`, `PublishModal`, `TouchControls`, and `StudioCopilotBar` contracts intact.
  - Created `frontend/scripts/setup_kenney_studio.mjs` downloading and texture-packing 11 verified Kenney CC0 `.glb` models into `frontend/public/models/kenney/` (`character_player.glb`, `character_enemy.glb`, `train_front.glb`, `train_carriage.glb`, `car_sports.glb`, `car_police.glb`, `spaceship.glb`, `building_city.glb`, `tree_pine.glb`, `crate.glb`, `coin_gold.glb`).
  - Added `StudioEngineCore.js` with `normalizeKenneyModel` (`targetHeight = 1.7`, grounded at `y = 0`, facing `-Z`), `PCFSoftShadowMap` (`1024x1024`) directional sun shadows (`StudioVisualRig.jsx`, `SandboxCanvas.jsx`), and third-person camera framing (`[0, 4.5, 9.5]`, `lookAt [0, 1.5, -10]`).

## [0.101.1] - 2026-11-25
### Fixed & Upgraded
- **Exact `SkinnedMesh` Height Normalization, Arcade Toon Outlines & Runner Camera Framing (`ModelAssetLoader.js`, `EntityMeshFactory.js`, `ActionCameraRig.js`):**
  - Fixed the 15x giant character bug caused by `Box3.setFromObject()` miscalculating `SkinnedMesh` bounds: `measureExactBounds` now calls `updateMatrixWorld(true)` and `skeleton.update()` and transforms geometry bounding-box corners directly into world space, scaling characters cleanly to `1.75` units grounded at `y = 0`.
  - Replaced `Soldier.glb` as the default hero with expressive stylized characters (`RobotExpressive.glb` / `character_hero.glb` / `Fox.glb`) shaded with vibrant `MeshStandardMaterial` (`roughness: 0.35, metalness: 0.05`) and `#1E1B4B` `BackSide` vertex-extruded outline hulls.
  - Tuned `ActionCameraRig.js` `endless_runner` framing to `[0, 4.6, 9.2]` looking at `[player.x * 0.4, 1.4, player.z - 10]`.

## [0.101.0] - 2026-11-25
### Upgraded
- **AAA Three.js & Khronos `.glb` Models + Draco Decoders + Skeletal AnimationMixer (`install_real_models.mjs`, `ModelAssetLoader.js`, `EntityMeshFactory.js`, `GameKernel.jsx`):**
  - Created `frontend/scripts/install_real_models.mjs` bundling local Draco decoders (`public/draco/`) and installing 8 verified `.glb` studio models (`hero_runner.glb`, `enemy_bot.glb`, `sports_car.glb`, `cyber_hero.glb`, `flying_creature.glb`, `CesiumMilkTruck.glb`, `DamagedHelmet.glb`, `Fox.glb`) into `frontend/public/models/`.
  - Added `DRACOLoader` + `createMixerController` (`Run`, `Idle`, `Jump`, `Attack`) and chassis/clothing tint preservation (keeping metallic/glass/wheel materials crisp) in `ModelAssetLoader.js`, wired directly to `GameKernel.jsx` via `EntityMeshFactory.js`.

## [0.100.0] - 2026-11-25
### Added & Upgraded
- **Arcade Rules, Mission Loop & Score Breakdown (`GameHudOverlay.jsx`, `GoalEngine.js`, `GameplayDirector.js`, `ModePhysics.js`, `EntityShadowPool.jsx`):**
  - Added `GameHudOverlay.jsx` displaying a 2-second mission briefing banner (`MISSION: [objectiveText]`), a live top-center objective progress bar + target counter, and a Victory / Game Over modal with Accuracy %, Max Combo, Eliminations, `"Next Level (+25%)"` difficulty progression, `"Edit World"`, `"Play Again"`, and leaderboard submission.
  - Upgraded `GameplayDirector.js`, `ModePhysics.js`, and `GoalEngine.js` with enemy flanking behavior, knockback, hit-flash, floating damage/score numbers (`FloatingNumbersLayer`), and 100%-objective Final Boss or Extraction Portal finale triggers.

## [0.99.0] - 2026-11-25
### Upgraded
- **Studio `.glb` Asset Pipeline, Sculpted Fallbacks & Studio Rim Lighting (`download_pro_models.mjs`, `ModelAssetLoader.js`, `SculptedFallbacks.js`, `EntityMeshFactory.js`, `EntityShadowPool.jsx`, `StudioVisualRig.jsx`):**
  - Created `frontend/scripts/download_pro_models.mjs` downloading and texture-packing 8 CC0 Kenney `.glb` studio models (`character_hero.glb`, `character_enemy.glb`, `car_sports.glb`, `car_police.glb`, `starfighter.glb`, `train_car.glb`, `building_tower.glb`, `tree_stylized.glb`) into `frontend/public/models/`.
  - Built `ModelAssetLoader.js` (`GLTFLoader` + `SkeletonUtils.clone()`, automatic `Box3` scaling and `y = 0` grounding) and `SculptedFallbacks.js` (`LatheGeometry`, beveled `ExtrudeGeometry`, `CapsuleGeometry` — eliminating raw stacked `BoxGeometry` cubes).
  - Upgraded `StudioVisualRig.jsx` with hemisphere bounce, warm directional key light, dedicated back rim light, and gradient sky dome, plus `EntityShadowPool.jsx` rendering instanced contact shadows beneath every moving enemy, boss, and vehicle.

## [0.98.1] - 2026-11-25
### Upgraded
- **Open-World Intent Routing & `open_world_missions` Goal (`backend/genre_routing.py`, `backend/world_schemas.py`, `backend/spatial_validator.py`, `backend/game_architect.py`, `backend/ai_service.py`):**
  - Mapped Hebrew & English open-world/GTA/heist/city/sandbox keywords (`"גי טי איי"`, `"gta"`, `"עולם פתוח"`, `"עיר פתוחה"`, `"חופשי"`, `"שוד"`, `"open world"`, `"sandbox"`, `"city"`, `"free roam"`, `"heist"`) directly to `mode: "open_world_sandbox"`, `goalType: "open_world_missions"`, `canShoot: true`, `vehiclesEnabled: true`, and `wantedSystem: true`.
  - Enabled live `POST /api/games/refine` mode switching into `open_world_sandbox` with localized mission objectives.

## [0.98.0] - 2026-11-25
### Added
- **5th Core Engine Archetype — `open_world_sandbox` (`OpenWorldBuilder.js`, `SandboxVehicleSystem.js`, `OpenWorldMissions.js`, `OpenWorldScene.jsx`, `OpenWorldEntitiesLayer.jsx`):**
  - Built a full `180x180` 360-degree open-world city generator with intersecting avenues (`[-60, -20, 20, 60]`), central spawn plaza, `THREE.InstancedMesh` buildings, destructible street props (`hydrant`, `crate`, `barrier`), glowing mission beacons, and smooth AABB wall collision sliding.
  - Added seamless on-foot (`WASD` + `Space` jump + `Click/E` shoot) and vehicle hijack/drive (`F` to enter/exit parked & roaming cars, 360° steering, `Space` handbrake drift, `Shift` nitro, high-speed ramming) with dynamic `ActionCameraRig.js` transitions (`[0, 5.5, 9.5]` on foot ↔ `[0, 6.5, 12]` driving) and live `MinimapHUD` vehicle/mission/enemy blips.
  - Added 1–5 Wanted Heat Stars (`★☆☆☆☆`) in `HUDModeWidgets.jsx` dynamically scaling pursuing enforcers alongside repeatable city missions (`Reach Mission Beacon`, `Eliminate Boss Target`, `Deliver Stolen Cargo`, `Escape 3-Star Pursuit`), plus bilingual `genre_routing.py` support for GTA/open-world prompts.

## [0.97.1] - 2026-11-25
### Upgraded
- **Bilingual Smart Genre & Goal Routing (`backend/genre_routing.py`, `backend/game_architect.py`, `backend/ai_service.py`, `backend/spatial_validator.py`):**
  - Added `genre_routing.py` mapping Hebrew & English prompts cleanly across all 4 engine modes and 4 goal types (`sky_shooter` + `eliminate_targets`, `arena_action` + `survive_waves`, `vehicle_pursuit` + `distance_race`, `endless_runner` + `collect_and_escape`).
  - Updated `WORLD_ARCHITECT_PROMPT`, `WORLD_REFINE_PROMPT`, `validate_world_dict`, and `refine_world_json` so `POST /api/generate` and `POST /api/games/refine` switch `mode`, `goalType`, layout, rig, and entities dynamically without leaking `endless_runner` defaults.

## [0.97.0] - 2026-11-25
### Added & Upgraded
- **Data-Driven Multi-Mode `GameKernel` & 4 Distinct Goal Engines (`GameKernel.jsx`, `ModePhysics.js`, `GoalEngine.js`, `ActionCameraRig.js`, `GameplayDirector.js`, `ModeEnvironmentScene.jsx`):**
  - Replaced the single hardcoded 3-lane subway track & movement loop with 4 genuinely distinct, data-driven `GameSpec.mode` worlds and physics models:
    - `endless_runner`: 3-lane railway corridor (`SubwayCorridorScene`), lane snapping (`A/D`), jumping onto walkable obstacle roofs (`Space`), and roll/slam (`S`).
    - `arena_action`: Open `80x80` 360° tactical arena (`ArenaWorldScene`), scattered solid cover pillars, 8-directional free movement (`WASD`), 360° aim-and-shoot (`Mouse / Space / E`), and edge-spawning converging enemy waves.
    - `sky_shooter`: Ground-free deep-space starfield & volumetric cloud/ring arena (`SkyShooterScene`), full 3D flight freedom (`WASD`), forward thrust (`Shift`), `Q/E` barrel rolls with dodge invulnerability, and enemy squadrons + boss ships.
    - `vehicle_pursuit`: Wide 5-lane streaming highway (`HighwayPursuitScene`), smooth analog steering (`A/D`), throttle/brake (`W/S`), nitro boost (`Shift/Space`), oncoming traffic, and ramming mechanics against pursuit targets.
  - Upgraded `ActionCameraRig.js` with mode-specific camera rigs (`endless_runner` chase `[0, 4.2, 8.5]`, `arena_action` tactical isometric `[0, 14, 13]` with enemy centroid tracking, `sky_shooter` banking flight `[0, 3.0, 9.5]` with turn roll, and `vehicle_pursuit` hood chase `[0, 3.2, 7.5]` with speed-scaled FOV `60–82`).
  - Built `GoalEngine.js` + updated `HUDModeWidgets.jsx` and backend schemas (`world_schemas.py`, `game_architect.py`, `spatial_validator.py`) to drive 4 distinct `goalType` win conditions (`eliminate_targets`, `survive_waves`, `collect_and_escape`, `distance_race`) in the top HUD bar.

## [0.96.2] - 2026-11-23
### Fixed
- **Live Gemini Model Failover & Thinking Budget Hang (`backend/game_architect.py`, `backend/ai_service.py`):**
  - Replaced retired `gemini-2.5-flash-lite` / `gemini-2.0-flash` fallback entries (which threw `404 NOT_FOUND` when `gemini-3.1-flash-lite` hit `503 UNAVAILABLE`) with the live verified model chain (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`).
  - Removed `thinking_budget=0` (which returned `400 INVALID_ARGUMENT` on `flash-lite` and stalled `3.5`/`3.6-flash`) and tuned the architect prompt to synthesize `12-16` key entities before `spatial_validator.py` expands the full `34+`-entity corridor.

## [0.96.1] - 2026-11-23
### Added & Verified
- **Automated CC0 Cartoon GLB Asset Fetcher & Texture Packing (`frontend/scripts/fetch_cartoon_assets.mjs`, `CartoonAssetCatalog.js`, `StylizedEntity.jsx`, `ToonMaterialHelper.js`):**
  - Created `fetch_cartoon_assets.mjs` downloading 12 CC0 Kenney `.glb` models (cars, subway train, street barrier, city buildings, gold coin, trees, and rigged animated characters) into `frontend/public/models/` while embedding external `Textures/colormap.png` buffers directly into each `.glb` binary for zero 404 console errors.
  - Wired the local `.glb` paths + character animation clips (`idle`, `walk`, `sprint`, `jump`) into `CartoonAssetCatalog.js` with procedural cartoon prefabs preserved as instant fallbacks.
  - Hardened `StylizedEntity.jsx` (`rotationY` before `Box3` normalization + spinning coin bobbing) and `ToonMaterialHelper.js` (`SkinnedMesh` toon conversion + unmounted portal filtering).

## [0.96.0] - 2026-11-23
### Upgraded & Hardened
- **Stylized Cartoon Prefabs, Slide-Under Colliders & Architect Anti-Overlap (`CartoonWorldPrefabs.jsx`, `CartoonActorPrefabs.jsx`, `StylizedEntity.jsx`, `CartoonAssetCatalog.js`, `backend/spatial_validator.py`, `backend/world_schemas.py`, `backend/ai_service.py`, `docs/ARCHITECTURE.md`):**
  - Added dual-end train windshields/headlights & framed passenger windows (`SubwayTrainPrefab`), grounded barrier feet (`StreetBarrierPrefab`), framed side/front windows (`CartoonCityBuildingPrefab`), beveled star-emblem `gold_coin` (`CartoonPickupPrefab`), dual red/blue police lightbar + front windshield (`CartoonCarPrefab`), and backpack/badge/eyes details (`CartoonCharacterPrefab`).
  - Added raised overhead crossbar collider (`y = 2.02`) for `high_barrier` in `StylizedEntity.jsx` and `jump_ramp` alias normalization across `CartoonAssetCatalog.js` + `backend/world_schemas.py`.
  - Tightened `spatial_validator.py` (`_ensure_passable_lanes`, `_supplement_cartoon`) to eliminate overlapping obstacle/building colliders and guarantee `chaser_guard` variety, and added base-blueprint merging inside `ai_service.py` (`refine_world_json`).

## [0.95.0] - 2026-11-21
### Upgraded
- **Endless Subway Surfers 3-Lane Corridor, Train Roof Parkour & Hero Chase Framing (`SubwayCorridorScene.jsx`, `CartoonWorldPrefabs.jsx`, `StylizedEntity.jsx`, `worldEntityActors.jsx`, `DynamicActionCamera.jsx`, `backend/game_architect.py`, `backend/spatial_validator.py`):**
  - Created `SubwayCorridorScene.jsx` streaming infinite ballast railbeds, 6 chrome rails, instanced wooden crossties, flanking pastel storefront shops (`TRADE`, red-white striped awnings), canyon/horizon cliffs, and named theme Gateway Overpass signs (`SALOON`, `ALOHA`, `TOKYO`, `CANDY`, `METRO`).
  - Built sloped `TrainRampPrefab` wooden crate ramps with matching rotated Rapier `CuboidCollider` and `RigidBody type="kinematicPosition"` moving `subway_train` roofs so players sprint smoothly up ramps onto train rooftops collecting elevated coin arcs.
  - Locked tight over-the-shoulder Subway Surfers hero chase framing (`DynamicActionCamera.jsx`: `distance=4.9`, `height=3.25`, `lookAheadZ=-8.5`) and defaulted backend blueprints cleanly to `three_lane_track` + `three_lane_runner` (`wild_west` palette included).

## [0.94.0] - 2026-11-21
### Upgraded & Connected
- **Stylized Cartoon World Architect & Multilingual Co-Pilot Refinement (`backend/game_architect.py`, `ai_service.py`, `spatial_validator.py`, `world_schemas.py`):**
  - Enforced the 5 stylized arcade themes (`sunny_city`, `tropical_beach`, `candy_sky`, `tokyo_festival`, `desert_canyon`), cartoon prefab/GLB `modelId`s (`subway_train`, `street_barrier`, `high_barrier`, `cartoon_car`, `police_cruiser`, `city_building`, `gold_coin`, `powerup_magnet`, `powerup_jetpack`, `cartoon_character`, `chaser_guard`), parabolic jump-arc coin rows, and Python 3-lane passability validation (`_ensure_passable_lanes`) guaranteeing fair survivable lanes with zero impossible walls.
  - Upgraded `POST /api/games/refine` to handle bilingual English & Hebrew Co-Pilot refinements (e.g. fast oncoming trains, tropical beach swaps, jetpack drops) in ~2s.
  - Connected theme sky gradients (`SubwayToonArtDirector.jsx`), `powerup_jetpack` / `moving_train` handling (`WorldJsonScene.jsx`, `worldEntityActors.jsx`, `CartoonAssetCatalog.js`), `CartoonPlayerRig`, and `StylizedEntity` end-to-end inside `SandboxViewport.jsx`.

## [0.93.0] - 2026-11-21
### Added
- **Stylized Cartoon 3D Asset & Prefab Library (`frontend/src/features/sandbox/assets/`):**
  - Created `CartoonAssetCatalog.js`, `StylizedEntity.jsx`, `CartoonWorldPrefabs.jsx`, `CartoonActorPrefabs.jsx`, and `cartoonDecals.js` (integrated across `WorldJsonScene.jsx`, `worldEntityActors.jsx`, `GameCanvas.jsx`, `spawnSdk.jsx`, and `compileGameCode.jsx`).
  - Built multi-part stylized prefabs usable standalone or as zero-latency `.glb` fallbacks (`subway_train` with rounded roof, windshield, AC vents, bumper & `CanvasTexture` graffiti decals; `street_barrier` / `high_barrier`; chunky `cartoon_car` / `police_cruiser`; pastel `city_building` with billboards, cornice & striped awnings; `gold_coin`, `powerup_magnet`, `jetpack`; articulated `cartoon_character` / `chaser_guard`), auto-normalized to `y = 0` with `SubwayToonGroup` shading, `#1E1B4B` outlines, and automatic Rapier `RigidBody` colliders.

## [0.92.0] - 2026-11-21
### Added
- **Expressive Cartoon Character/Vehicle Rig, Dynamic Action Camera & Cartoon VFX (`frontend/src/features/sandbox/gameplay/`):**
  - Created `CartoonPlayerRig.jsx` & `CartoonVisualMesh.jsx` (using `@react-three/rapier` and `SubwayToonGroup`) supporting `three_lane_runner` (snappy lane-switching roll tilt, squash-and-stretch takeoff/landing, slide crouch pose, running limb/hoverboard bobbing), `arcade_car` (drift lean, bouncy spring suspension, nitro boost), `third_person_action`, and `flight_combat`, with a permanent raycasted `GroundedBlobShadow` scaling cleanly by jump altitude.
  - Created `DynamicActionCamera.jsx` (`CameraRig.jsx`, `WorldJsonScene.jsx`) with boost FOV kick, lane/turn banking, and bouncy combo/crash micro-shake.
  - Created `CartoonVFX.jsx` & `cartoonSfx.jsx` (mounted in `GameCanvas.jsx`, exported in `spawnSdk.jsx` & `compileGameCode.jsx`) delivering golden star/ring coin sparkles, puffy dust clouds, boost speed lines, comical impact stars, and keypress-unlocked arcade SFX (coin ding, whoosh jump, lane swipe, combo chime, crash biff).

## [0.91.0] - 2026-11-21
### Changed & Added
- **Stylized Subway Surfers Toon Art Direction (`SubwayToonArtDirector.jsx`, `ToonMaterialHelper.js`):**
  - Locked global sandbox lighting in `SubwayToonArtDirector.jsx` (integrated in `GameCanvas.jsx`) with warm key directional light (`#FFF7E0`, `2.2`, `2048x2048` shadows), `#7DD3FC` / `#FDE68A` sky-to-sand hemisphere bounce, `<Environment preset="park" />`, cerulean-to-cream gradient sky dome, soft distance haze (`#BAE6FD`), and `<EffectComposer multisampling={4}>` with `<Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.35} />`, `<BrightnessContrast>`, `<HueSaturation>`, and `ACES_FILMIC` tone mapping.
  - Created `ToonMaterialHelper.js` providing a cached 3-step `THREE.DataTexture` (`NearestFilter`) toon ramp, automatic washed-out gray replacement via `saturateToonColor`, `MeshToonMaterial` conversion, and `SubwayToonGroup` (`<Outlines thickness={0.03} color="#1E1B4B" />`) across `SmartModel`, `RigVisuals`, `PlayerMesh`, `StylizedTrain`, and `StylizedObstacles`.

## [0.90.0] - 2026-11-21
### Connected & Enhanced
- **Unified `SandboxViewport` World Blueprint Pipeline (`SandboxViewport.jsx`, `GameCanvas.jsx`, `WorldJsonScene.jsx`, `worldEntityActors.jsx`, `HUDModeWidgets.jsx`, `ThumbnailCapturer.jsx`):**
  - Connected `StudioLightingRig`, Rapier `<WorldPhysicsProvider>`, `SmartModel` `.glb` assets, `PlayerRigController`, `ChaseCameraRig`, and `JuiceFX` cleanly through `SandboxViewport.jsx` + `WorldJsonScene.jsx` (rendering `CityGridGenerator`, `TrackGenerator`, 3-lane tracks, and `BiomeStage` layouts with live patrol/chase/boss actors and win/loss triggers).
  - Wired live HUD telemetry (`hp`, `score`, `$cash`, `speedKmh`, `timer`, and `MinimapHUD` blips) in `HUDModeWidgets.jsx` + `MinimapHUD.jsx`.
  - Preserved `<Canvas>` & keyboard focus seamlessly across Studio Co-Pilot `worldSpec` hot-swaps (`SandboxViewport.jsx`, `StudioCopilotBar.jsx`).
  - Upgraded `ThumbnailCapturer.jsx` to capture crisp WebP 3D cover thumbnails `1.5s` after studio lighting and `.glb` models finish rendering.

## [0.89.0] - 2026-11-21
### Changed & Added
- **Fast Structured 3D World JSON Pipeline & Instant Co-Pilot Refinement (`backend/game_architect.py`, `ai_service.py`, `world_schemas.py`, `spatial_validator.py`, `main.py`):**
  - Replaced slow multi-pass JSX code synthesis with fast `<5s` structured `WorldBlueprintJSON` synthesis outputting `theme`, `lightingPreset` (`sunset` | `night` | `city` | `dawn`), `weather`, `worldLayout` (`city_grid` | `three_lane_track` | `race_circuit` | `open_biome`), `playerRig` (`arcade_car` | `three_lane_runner` | `third_person_action` | `flight_combat`), `entities[]` (25–50 entities mapped to valid `.glb` `modelId`s), and `rules` (`winCondition`, `targetScore`, `timeLimit`).
  - Built Python `spatial_validator.py` (`sanitize_world_json`) to snap city vehicles/checkpoints onto road centerlines (`[-100, -50, 0, 50, 100]`), keep 3-lane track entities aligned (`[-3.2, 0.0, 3.2]`), and keep all buildings/obstacles clear of roads and `spawn.position`.
  - Upgraded `POST /api/games/refine` in `backend/main.py` (`refine_world_json`) to accept `{ current_world_json, refinement_prompt }` for ~2–3s live Co-Pilot updates (adding bosses, changing weather/lighting, swapping rigs/vehicles), persisted via `update_game_world_json` (`database.py`) and rendered deterministically on the client via `WorldJsonScene.jsx`.

## [0.88.0] - 2026-11-21
### Added
- **Bundled 3D `.glb` Assets, Auto-Normalized Loader & JuiceFX (`frontend/public/models/`, `frontend/src/features/sandbox/assets/`):**
  - Bundled 9 binary glTF 2.0 `.glb` models in `frontend/public/models/` (`sports_car.glb`, `police_cruiser.glb`, `skyscraper.glb`, `tree.glb`, `rock.glb`, `coin.glb`, `drone.glb`, `spaceship.glb`, `scifi_crate.glb`).
  - Created `ModelCatalog.js`, `SmartModel.jsx`, and `DetailedModelFallback.jsx`: maps bundled `.glb` + CC0 CDN assets with multi-part detailed fallbacks (wheels, spoilers, translucent glass windshields, glowing taillights), computes `THREE.Box3` uniform normalization grounded flush at `y = 0`, and mounts exact `RigidBody` + `CuboidCollider` bounds automatically.
  - Created `JuiceFX.jsx` and `juiceAudio.js` (integrated in `GameCanvas.jsx`, `spawnSdk.jsx`, and `compileGameCode.jsx`): single 240-instance GPU particle pool for collision sparks, tire drift smoke, nitro exhaust flames, coin pickup sparkles, and enemy explosions paired with first-keypress-unlocked spatial `StereoPannerNode` Web Audio SFX (engine hum, drift screech, coin chime, crash thud).

## [0.87.0] - 2026-11-21
### Added
- **Rapier Physics World, Static Colliders & Universal 4-Rig Controller (`frontend/src/features/sandbox/physics/`):**
  - Created `WorldPhysicsProvider.jsx` wrapping the active 3D scene tree (`GameCanvas.jsx`) in `<Physics gravity={[0, -22, 0]}>` plus context-guarded `<StaticPhysicsBody type="fixed">` colliders automatically mounted on roads, terrain (`RealisticTerrain.jsx`), city grids/tracks (`CityRoadBuilder.jsx`, `CityBlockWorld.jsx`), and skyline buildings (`WorldScenery.jsx`).
  - Created `PlayerRigController.jsx`, `rigHelpers.jsx`, `actionFlightRigs.jsx`, and `RigVisuals.jsx` implementing 4 Rapier-backed game rigs: `arcade_car` (WASD steering/acceleration, lateral tire grip/drift friction, Space handbrake, Shift nitro flame/smoke trail, twin bumper `spotLight` headlights), `three_lane_runner` (A/D lane switch, W/Space jump, S slide), `third_person_action` (camera-relative WASD, double-jump, Shift dash, click melee/projectile), and `flight_combat` (pitch/yaw/roll banking, Shift boost throttle, twin laser firing).
  - Created `ChaseCameraRig.jsx` (wired via `CameraRig.jsx` for follow/chase cameras) with critically-damped spring-arm tracking, wall raycast push-in, velocity FOV punch, corner roll tilt, and collision trauma micro-shake.

## [0.86.0] - 2026-11-21
### Added & Upgraded
- **Studio-Grade PBR Lighting Rig & Post-Processing (`StudioLightingRig.jsx`, `GameCanvas.jsx`):**
  - Created `StudioLightingRig.jsx` providing switchable `@react-three/drei` `<Environment preset={...} />` reflections (`sunset`, `city`, `night`, `dawn`, `park`), high-resolution shadow-casting `directionalLight` (`shadow-mapSize={[2048, 2048]}`), `hemisphereLight` bounce fill, `<ContactShadows />`, distance atmospheric `<fog>`, and `<EffectComposer multisampling={4}>` with `<Bloom mipmapBlur luminanceThreshold={1.0} intensity={0.45} />`, `<Vignette darkness={0.35} />`, and `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />`.
  - Integrated `<StudioLightingRig>` into `GameCanvas.jsx` replacing legacy `<SceneEnvironment>` / `<PostFX>` wiring cleanly with ErrorBoundary + Suspense fallbacks.
- **Procedural Canvas PBR Textures (`ProceduralTextures.js`, `WorldScenery.jsx`, `BiomeTerrain.jsx`, `GameCanvas.jsx`):**
  - Created `ProceduralTextures.js` generating cached offscreen `<canvas>` PBR maps (`CanvasTexture` with `RepeatWrapping` and `anisotropy = 8`) for asphalt roads (mineral grain + tire paths + lane markings), concrete/glass building facades (lit warm/cool interior windows + emissiveMap + roughnessMap), grass/sand terrain textures, and brushed metal streaks.
  - Applied procedural PBR texture maps across starting platforms/pedestals (`GameCanvas.jsx`), skyline buildings/roofs/balconies/awnings/tanks (`WorldScenery.jsx`), and sculpted mountains/cliffs (`BiomeTerrain.jsx`) so no background or structural mesh renders as a flat untextured solid color.

## [0.85.1] - 2026-11-20
### Fixed
- **Root-Level `registerHud(React.createElement)` Crash & Circular Store Guard (`useGameStore.jsx`, `HUDModeWidgets.jsx`, `SkeletalActor.jsx`, `ProceduralAssetFallbacks.jsx`, `DynamicGameRunner.jsx`, `code_validator.py`, `prompts.py`):**
  - Prevented AI-generated `registerHud(React.createElement('div', ...))` payloads from decomposing React fiber objects into `customMeters` and crashing top-level `HUDModeWidgets` with `Objects are not valid as a React child`, and added equality checks to block `useEffect([missionState])` render loops.
  - Replaced `<ContactShadows>` inside `SkeletalActor.jsx` with shared `SoftShadowDecal`, set `solid={false}` on `ProceduralAssetFallbacks`, avoided duplicate `<StudioBackdrop />` when scenes mount `<BiomeStage />`, and added `registerHud(React.createElement|JSX)` rejection in `code_validator.py`.

## [0.85.0] - 2026-11-20
### Fixed
- **Resolved "Screen Stuck" Runtime Freeze, WebGL VRAM/FBO Overload & R3F DOM Crashes (`pbrMaterials.jsx`, `StudioProps.jsx`, `AutoNormalizeMesh.jsx`, `compileGameCode.jsx`, `motionBus.jsx`, `code_validator.py`):**
  - **GPU Texture Set Caching (`TEXTURE_SET_CACHE` in `pbrMaterials.jsx`):** Cached synthesized `THREE.CanvasTexture` sets by `(surface, rx, ry)`, preventing `<CityGrid />` (`64` skyscrapers + `32` lamps) from allocating ~480 duplicate `512×512` GPU textures (~500 MB VRAM spike) on frame 1.
  - **Zero-FBO Prop Ground Shadows (`SoftShadowDecal` in `StudioProps.jsx` & `AutoNormalizeMesh.jsx`):** Replaced per-prop `<ContactShadows>` FBO render targets (~100 full-scene shadow passes on frame 1 in city worlds) with one shared `64×64` radial gradient decal texture, reserving true `<ContactShadows>` for the player/hero rig (`BiomeStage` / `SceneEnvironment`).
  - **R3F DOM Crash Guard (`SafeHtml` + `SafeCanvasDom` in `compileGameCode.jsx` & `code_validator.py`):** Safely neutralized stray HTML tags (`<div>`, `<span>`, `<button>`) rendered directly inside Three.js `<Canvas>` outside `<Html>` so `R3F: Div is not part of the THREE namespace` can never freeze/crash scenes, and added backend validation + `fix_generated_code` self-repair for raw Canvas DOM tags.
  - **Zero Circular SDK Imports (`motionBus.jsx`):** Extracted `motionBus` and spring/motion helpers into a zero-dependency leaf module imported across SDK submodules, eliminating Vite circular-import HMR reloads and initialization races.

## [0.84.0] - 2026-11-20
### Added
- **Road-Aware Spatial Layouts, Terrain Grounding & Strict Objective Loop (`backend/game_architect.py`, `backend/ai_service.py`, `backend/prompts.py`, `useMissionState.jsx`):**
  - Updated Stage 1 Blueprint & Stage 2 synthesis rules to enforce `<CityGrid />` / `<RaceTrack />` with `flatGround={true}` for driving, racing, heist, police-chase, and urban prompts (aligning spawn points, checkpoints, pickups, and patrolling AI cars along exact road centerlines `[-100, -50, 0, 50, 100]` outside building footprints) and `getTerrainHeight(x, z)` placement on terrain worlds.
  - Enforced mandatory `<ObjectiveBeacon />` directional waypoints, active steering AI opponents (`SmartEntity` or road-patrolling cruisers/rivals), and functional win/lose triggers (`targetScore` / `onVictory` / `onDefeat` wired into `useMissionState.jsx`).

## [0.83.0] - 2026-11-20
### Fixed
- **Balanced Midnight Lighting & Damp-Satin Asphalt Materials (`SceneEnvironment.jsx`, `BiomeStage.jsx`, `weatherPresets.jsx`, `pbrMaterials.jsx`, `pbrNoise.jsx`, `RealisticTerrain.jsx`, `worldTextures.jsx`):**
  - Replaced mirror-gloss wet roughness (`0.09–0.34`) with damp-satin roughness (`0.72–0.85`) and restrained clearcoat (`0.16–0.18`, `clearcoatRoughness: 0.46`) across road textures, terrain rain puddles, and `wet_asphalt`.
  - Added a soft moonlight hemisphere fill (`#4A5D7A` sky / `#2A2622` ground, `intensity: 0.65`) for twilight/midnight scenes so street edges, curbs, buildings, and obstacles read clearly in dark lighting.
- **Production Vehicle Dynamics & Twin SpotLight Headlights (`VehicleHeadlights.jsx`, `ArcadeCarVisual.jsx`, `DrivableVehicle.jsx`, `PlayerController.jsx`, `runtimeRigHelpers.jsx`):**
  - Created `VehicleHeadlights.jsx` mounting twin bumper `<spotLight>` beams (`#FFF3D6`, `distance={52}`) with vehicle-parented targets + warm flickering nitro exhaust flame cones (`#F97316` / `#FDE68A`).
  - Upgraded both `PlayerController` (`preset="arcade_vehicle"` via `ArcadeCarVisual.jsx`) and `DrivableVehicle.jsx` with steering & spinning front wheels, intensified brake/reverse taillights (`2.5` emissive), `Space` handbrake drift + `<SkidMarks>`, and `Shift` nitro surge + flames.

## [0.82.0] - 2026-11-20
### Added
- **Urban Street Grid & Banked Race-Track Generator (`sdk/world/CityRoadBuilder.jsx`, `raceTrackHelpers.jsx`, `BiomeStage.jsx`, `spawnSdk.jsx`, `compileGameCode.jsx`, `backend/validator_constants.py`, `backend/prompts.py`):**
  - Created `<CityGrid blocks={4} roadWidth={14} blockSize={36} />` rendering flat asphalt avenues with dashed centerlines (`createCityRoadTextures`), raised concrete sidewalks (`+0.25m`), intersection warm streetlamps, and aligned solid block buildings (`StudioProp`), leaving every street 100% clear for driving.
  - Created `<RaceTrack waypoints={...} width={16} onCheckpoint={...} />` (`buildRaceTrackGeometry`) building a continuous banked CatmullRom road ribbon with red/white safety curbs, continuous overlapping solid barrier colliders, and trigger checkpoint gates.
  - Added `flatGround` and `mode` (`city` | `racing` | `arena` | `exploration`) to `<BiomeStage>`, defaulting `flatGround={true}` (`amplitude={0}` + road-clearing `flatRadius` + suppressed central foliage) for city/racing/arena modes so hills never poke through roads or bury props.

## [0.81.0] - 2026-11-20
### Fixed
- **Solid Prop/Building Collision Enforcement & Wall-Sliding Physics (`useArenaPhysics.jsx`, `StudioProps.jsx`, `AutoNormalizeMesh.jsx`, `assetCatalog.jsx`, `SmartEntity.jsx`, `CityBlockWorld.jsx`, `PlayerController.jsx`, `runtimeRigHelpers.jsx`, `DrivableVehicle.jsx`):**
  - Added `registerObjectCollider` in `useArenaPhysics.jsx` to measure world-space `THREE.Box3` bounds automatically on mount/transform for every solid `<StudioProp>`, `<AssetCatalog>` / `<AutoNormalizeMesh>`, live `<SmartEntity>`, and all 64 `<CityBlockWorld>` buildings (explicitly skipping solid blocking on `solid={false}` pickups, coins, checkpoints, and grass).
  - Upgraded `resolveMovement(pos, radius, velocity, onCollide)` to a 2-pass iterative solver with nearest-face AABB push-out (smooth wall sliding without getting stuck or passing through), inward velocity damping on impact, and high-speed collision callbacks (`onCollide(other, impactSpeed)` + `setHardCollisionHandler` triggering `triggerCameraShake`, warm spark bursts, and impact sound).
  - Wired `<DrivableVehicle>` (`resolveMovement`, radius `1.25`) and `<PlayerController>` (`onCollide`) into the arena physics solver so cars and players bounce, slide, shake, and emit sparks instead of clipping through buildings or obstacles.

## [0.80.0] - 2026-11-20
### Added
- **Final Visual Polish Pass — High-Res PBR Maps, Hero Rim Lighting & 2s Poster Snapshot (`pbrMaterials.jsx`, `pbrNoise.jsx`, `SceneEnvironment.jsx`, `BiomeStage.jsx`, `ThumbnailCapturer.jsx`, `SandboxViewport.jsx`):**
  - Expanded `PBR_SURFACES` to 18 physical presets (`stone_bricks`, `grass_turf`, `wood_planks`, `sand_ripples`, `brushed_alloy`, etc.) with crisp brick mortar grooves, turf tufts, wood plank seams, `anisotropy = 8`, and async hydration of verified Three.js `r169` diffuse/bump/roughness maps (`brick_*`, `hardwood2_*`, `terrain/grasslight-big.jpg`).
  - Added player-tracking cool-sky **hero silhouette rim directional light** (`#BCE3FF` / `#93C5FD`) and soft ground `<ContactShadows>` (`resolution={128}`) underneath dynamic actors in both `SceneEnvironment.jsx` and `BiomeStage.jsx`.
  - Updated `ThumbnailCapturer.jsx` & `SandboxViewport.jsx` to auto-capture a clean HUD-free WebGL poster snapshot (`image/webp`, quality `0.86`) **2 seconds after gameplay starts** (`hasStarted && gameState === 'playing'`) and sync it to the Lobby gallery.

## [0.79.0] - 2026-11-20
### Added
- **1-Click Commercial Publishing, Website Embed & Standalone Export (`PublishModal.jsx`, `publishHelpers.jsx`, `useSceneEditorStore.jsx`, `GameHUD.jsx`, `App.jsx`):**
  - Added a prominent **"Publish & Export"** header CTA in `GameHUD.jsx` opening `PublishModal.jsx` with 3 tabs:
    - **Share Link:** Public `/play/{game_id}` link copy, direct open link, and deterministic editorial SVG QR/social preview card (`buildQrCells`).
    - **Website Embed (`<iframe>`):** Copyable responsive 16:9 or custom Width×Height `<iframe>` snippet with an interactive **"Hide Spawn.gg Watermark (Pro)"** toggle (`?embed=1&watermark=0`).
    - **Playable Build:** Generates and downloads a standalone `<slug>-playable.html` file containing the serialized `game_config` bundle (`window.__SPAWN_GAME_BUNDLE__`), HUD, and embedded Three.js player loader (`buildStandaloneHtml`).

## [0.78.0] - 2026-11-20
### Added
- **Interactive "Edit Mode" Toggle & 3D Scene Inspector (`SceneInspector.jsx`, `SandboxEditorRig.jsx`, `sceneEditUtils.jsx`, `useSceneEditorStore.jsx`, `GameHUD.jsx`, `GameCanvas.jsx`, `App.jsx`):**
  - Wired an **"Edit World" / "Play"** toggle button in `GameHUD.jsx` that freezes gameplay simulation (`useSafeFrame`, `useGameLoop`, `SmartEntity`, Rapier `<Physics>`) and enables free `OrbitControls` inspection + click-to-select 3D raycasting (`SandboxEditorRig.jsx`) with a subtle warm terracotta/ivory base selection ring (`#D96B27` / `#F6F4EF`).
  - Added right-docked floating **`SceneInspector.jsx`** providing real-time `Scale` (`0.3x–3.5x`), `Rotation Y` (`-180°–180°`), `Speed` & `HP` tuning for entities/player rigs (`SmartEntity.jsx`, `PlayerController.jsx`), curated warm material color swatches (`SWATCH_PALETTE`), and **`Duplicate`** (`SkeletonUtils.clone` + collider registration) / **`Delete`** actions.
  - Toggling back to **`Play`** resumes full gameplay seamlessly without resetting transforms or updated stats.

## [0.77.0] - 2026-11-20
### Added
- **40+ Multi-Genre 3D Studio Asset Library (`sdk/assets/`, `validator_constants.py`, `game_architect.py`, `prompts.py`, `spawnSdk.jsx`):**
  - Expanded `assetCatalog.jsx` + `StudioProps.jsx` with 4 categorized multi-mesh PBR packs alongside verified GLBs (`ASSET_MANIFEST`):
    - **Sci-Fi & Space (`scifiProps.jsx` + `studioPropParts.jsx`):** `starfighter`, `planetary_rover`, `laser_turret`, `cryo_pod`, `orbital_ring_gate`, `asteroid_cluster`, `helmet`, `crate`.
    - **Fantasy & Medieval (`fantasyProps.jsx`):** `knight_hero`, `goblin_enemy`, `skeleton_enemy`, `castle_keep`, `timber_tavern`, `crystal_shrine`, `catapult`, `treasure_chest`.
    - **Modern & Racing (`modernProps.jsx`):** `supercar`, `offroad_buggy`, `police_cruiser`, `truck`, `buggy`, `streetlamp`, `concrete_barrier`, `suspension_bridge`, `skyscraper_block`, `tokyo`.
    - **Nature & Survival (`natureProps.jsx`):** `pine_tree`, `palm_tree`, `stylized_oak`, `boulder`, `wooden_dock`, `campfire` (with animated flames & warm flickering `<pointLight>`), `ruins_pillar`.
  - Exposed the full `CATALOG_MANIFEST` to Stage 1 (`game_architect.py`) and Stage 2 (`prompts.py`) so every generated scene composes 15–30 grounded props and landmarks.

## [0.76.0] - 2026-11-20
### Added
- **Cinematic GPU Weather, Puddle Reflections & Dynamic Time-of-Day (`sdk/atmosphere/`, `BiomeStage.jsx`, `RealisticTerrain.jsx`, `AtmosphereRig.jsx`, `backend/game_architect.py`, `backend/ai_service.py`):**
  - Created `sdk/atmosphere/WeatherSystem.jsx` + `weatherPresets.jsx` supporting camera-frustum-wrapping `rain` (tilted `InstancedMesh` streaks), `snow`, rising `embers`, horizontal `sandstorm`, and pulsing `fireflies` (`Points` + radial sprite texture) at 60 FPS with zero per-frame allocations.
  - Added rain puddle specular & clearcoat boost (`wetness` uniform + procedural puddle patch roughness modulation) in `RealisticTerrain.jsx` when `weather="rain"`.
  - Created `sdk/atmosphere/PracticalLights.jsx` placing terrain-grounded warm iron lantern posts and subtly flickering point lights (`#FDBA74`, zero neon) during `midnight` and `golden_hour`.
  - Added `timeOfDay="dawn" | "noon" | "golden_hour" | "midnight"` + `weather` + `weatherIntensity` props to `<BiomeStage>`, adjusting sky dome angle (`AtmosphereRig` `skySunPos`), horizon tint, fog density, directional shadows, and practical lighting.
  - Updated Stage 1 Blueprint (`blueprint_schemas.py`, `game_architect.py`) and Stage 2 prompts (`prompts.py`, `ai_service.py`) so the AI automatically picks optimal `weather` + `time_of_day` pairs per prompt and exposed `WeatherSystem` / `PracticalLights` across `spawnSdk.jsx`, `compileGameCode.jsx`, and `validator_constants.py`.

## [0.75.0] - 2026-11-20
### Added
- **Verified Iterative Game Creation Engine & Studio Co-Pilot (`backend/code_validator.py`, `backend/validator_constants.py`, `backend/ai_service.py`, `backend/game_architect.py`, `backend/stream_routes.py`, `backend/database.py`, `StudioCopilotBar.jsx`, `gameApi.jsx`, `App.jsx`):**
  - Upgraded **Stage 1 Blueprint** (`blueprint_schemas.py`, `game_architect.py`) to explicitly select `biome_stage_theme` (`BiomeStage`), `player_controller_preset` (`PlayerController`), and `3+` `studio_entities` (`StudioProp` / `AssetCatalog` `.glb` assets) per prompt.
  - Created **Pre-Flight Code Validator** (`code_validator.py` + `validator_constants.py`) checking balanced braces/JSX tags, valid `spawnSdk` symbol usage, win/lose condition presence (`onWin`/`onGameOver`/`triggerVictory`/`triggerDefeat`/`completeObjective`), and banning React `setState` calls inside `useFrame`/`useGameLoop`, wired with automatic fast Python self-repair (`_repair_if_invalid`) in both generation and refinement paths.
  - Added **`POST /api/games/refine`** (`stream_routes.py`, `ai_service.py`, `database.py`) accepting `{ current_code, refinement_prompt, game_title, game_id }`, preserving working mechanics while applying user-requested upgrades and persisting updated code.
  - Added collapsible **`StudioCopilotBar.jsx`** inside the active game view (`App.jsx` + `refineGame` in `gameApi.jsx`) using the Warm Beige / Midnight Slate `#D96B27` design system with quick-prompt chips and live hot-swap recompilation.

## [0.74.0] - 2026-11-20
### Added
- **Deterministic Gameplay Runtime (`sdk/runtime/`, `BiomeStage.jsx`, `GameCanvas.jsx`, `spawnSdk.jsx`, `compileGameCode.jsx`, `backend/prompts.py`):**
  - Created `useArenaPhysics.jsx` providing `registerCollider`, `unregisterCollider`, `resolveMovement` (circle & AABB wall sliding + arena bounds), and deterministic `getTerrainHeight(x, z)` synced automatically to `<BiomeStage>`.
  - Created `PlayerController.jsx` + `runtimeRigHelpers.jsx` with 4 responsive presets: `third_person_action` (camera-relative WASD, 130ms coyote jump, Shift dash, click/F attack, `SkeletalActor` animation blending), `arcade_vehicle` (drive/steer, Space handbrake drift, Shift nitro, auto-upright recovery, terrain snapping), `flight_shooter` (pitch/yaw/roll banking, twin `<ProjectilePool>` cannons, auto-level assist, terrain floor clamp), and `tactical_isometric` (WASD + click-to-move waypoint, ground cursor targeting ring, ability cast).
  - Created `useMissionState.jsx` managing `phase` (`ready` -> `playing` -> `victory` | `defeat`), `score`, `hp`, `wave`, `objectivesCompleted`, `combo`, and automatic HUD/leaderboard/restart sync.
  - Created `GameRuntimeKit.jsx` barrel + `<ColliderBox>` & `<GameRuntimeProvider>`, exposed across `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.73.0] - 2026-11-20
### Added
- **Replaced SDK Asset & Biome World Layer (`sdk/assets/`, `spawnSdk.jsx`, `compileGameCode.jsx`, `backend/prompts.py`):**
  - Created `assetCatalog.jsx` + `AutoNormalizeMesh.jsx` providing a CORS-verified catalog of 11 real `.glb` assets (`RobotExpressive`, `Soldier`, `Fox`, `CesiumMilkTruck`, `Buggy`, `DamagedHelmet`, `Flamingo`, `Parrot`, `Horse`, `LittlestTokyo`, `CesiumMan`) with fixed `Buggy.glb` URL, `THREE.Box3` ground normalization (`y=0`), crossfaded animations, and `<ContactShadows>`.
  - Created `StudioProps.jsx` + `studioPropParts.jsx` rendering multi-part beveled/lathed/extruded PBR props (`tower`, `turret`, `sports_car`, `pine_tree`, `boulder`, `spaceship`, `treasure_chest`, `crate`) so zero props fall back to bare cubes/spheres.
  - Created `BiomeStage.jsx` + `biomePresets.jsx` offering 6 instant AAA visual themes (`sunset_canyon`, `alpine_meadow`, `cyber_dusk`, `tropical_archipelago`, `lunar_crater`, `obsidian_fortress`) combining high-detail PBR terrain (`segments={160}`, `repeat={[18,18]}`), multi-light `<Environment>` IBL, directional shadows, horizon fog, `<DynamicWater>`, and `<InstancedFoliage>`.
  - Exposed `StudioProp`, `BiomeStage`, `AssetCatalog`, and `AutoNormalizeMesh` in `spawnSdk.jsx`, `compileGameCode.jsx`, and `backend/prompts.py`.

## [0.72.0] - 2026-11-20
### Added
- **Two-Stage Deep AI Synthesis Pipeline (`backend/game_architect.py`, `backend/blueprint_schemas.py`, `backend/ai_service.py`, `backend/stream_routes.py`, `backend/prompts.py`, `backend/schemas.py`):**
  - **Stage 1 (`design_game_blueprint`, `thinking_budget: 8192`):** Produces a bespoke `GameBlueprint` dissecting `genre_and_camera`, at least 3 prompt-specific `unique_core_mechanics`, articulated `visual_art_direction` recipes, and `rules_and_progression` before code synthesis.
  - **Stage 2 (`generate_game_config`, `thinking_budget: 16384`, `max_output_tokens: 24576`, `temperature: 0.85`):** Synthesizes complete multi-system R3F `.jsx` worlds honoring 100% of the Stage 1 Blueprint, enforcing articulated multi-part `<group>` hierarchies, `60 FPS` ref physics, real collisions, and strictly zero neon colors.
  - Added `POST /api/generate-stream` SSE endpoint streaming real-time 3-step synthesis progress.
- **Studio-Grade Rendering, Tactile SDK & Build Progress UI (`PostFX.jsx`, `SceneEnvironment.jsx`, `gameFeel.jsx`, `HealthBar3D.jsx`, `spawnSdk.jsx`, `compileGameCode.jsx`, `gameApi.jsx`, `BuildProgressPill.jsx`, `PromptBar.jsx`, `App.jsx`):**
  - Enabled crash-proof `PostFX.jsx` (`PostFXBoundary` + `<EffectComposer multisampling={0} enableNormalPass={false}>`, `<Bloom mipmapBlur />`, `<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />`) and tightened `SceneEnvironment.jsx` `2048px` shadows (`[-32, 32]`) + warm/cool studio `<Environment>` reflections.
  - Added `useGameLoop` (dt clamping <= `0.05s` + automatic pause on PauseMenu / UpgradeModal / pre-start) and warm-editorial `<HealthBar3D>` world-space meters into `spawnSdk.jsx` & `compileGameCode.jsx`.
  - Added warm-editorial `BuildProgressPill.jsx` displaying live `"1/3 Designing game rules & mechanics..."` -> `"2/3 Sculpting 3D world & physics..."` -> `"3/3 Compiling & launching..."` progress in `PromptBar.jsx`.

## [0.71.0] - 2026-11-20
### Fixed
- **Rock-Solid Cross-Layout Movement & Arrow Controls (`useGameInput.jsx`, `DrivableVehicle.jsx`, `FlyableCraft.jsx`, `GameCanvas.jsx`, `TitleOverlay.jsx`):**
  - Replaced per-hook listeners with a singleton capture-phase global keyboard state (`globalKeys`) mapping physical `e.code` aliases (`KeyW`/`KeyA`/`KeyS`/`KeyD`/`Arrow*`/`Space`/`Shift*`) so WASD and Arrows respond instantaneously on every keyboard layout (including Hebrew/non-Latin macOS layouts) and can never be swallowed by focused HUD buttons.
  - Fixed `DrivableVehicle` & `FlyableCraft` JSX `position={position}` snapping back to `[0,0,0]` on parent re-renders, enabled low-speed steering (`Math.max(0.45, speedFactor)`), reset `useSettingsStore.isPaused` to `false` on every `runId`, and blurred active buttons on `TitleOverlay` PLAY click.

### Added
- **Unicorn Subway-Surfers Graphics & Motion Overhaul (`propTextures.jsx`, `StylizedTrain.jsx`, `StylizedObstacles.jsx`, `SubwayCorridor.jsx`, `corridorBanners.jsx`, `ArticulatedRunner.jsx`, `StudioBackdrop.jsx`):**
  - Created `propTextures.jsx` with procedural 512x256 diagonal red-and-white chevron barrier textures, 256x256 embossed 5-point golden star coin albedo+bump maps, and louvered metro train roof textures.
  - Upgraded `StylizedTrain` (golden-ochre cab, burgundy skirt, cream pinstripe, louvered slate roof, sky-blue windshields, Cyclops + twin headlights, ruby nose lamp), `LowHurdleProp` / `HighBarrierProp` (chevron boards + glowing beacons), and `StylizedCoinProp` (embossed spinning star coins).
  - Upgraded `SubwayCorridor` & `corridorBanners.jsx` with rose-sandstone sunlit ballast, gleaming clearcoat steel rails, arched vibrant facades, wind-swaying festival pennants & ribbons, striped station arches, and colorful market spice bowls.
  - Upgraded `ArticulatedRunner` with jump stretch, landing squash, auto-detected lateral banking lean (`±24°`), head look-into-turn, altitude-scaled drop shadow, and jump/land foley; brightened `StudioBackdrop` to Pixar/Subway-Surfers golden-hour lighting (`exposure: 1.15`, `sunIntensity: 2.75`, warm coral bounce).

## [0.70.1] - 2026-11-20
### Fixed
- **Compiler & Self-Healing Hardening (`compileGameCode.jsx`, `DynamicGameRunner.jsx`, `DrivableVehicle.jsx`, `FlyableCraft.jsx`, `gameFeel.jsx`):**
  - Sanitized stray `#` tuple syntax (`#[`, `#{`) and markdown code fences in `compileGameCode.jsx` (`prepareSource`), fixing Safari `SyntaxError: Invalid character: '#'`.
  - Replaced `healing` state with `healingRef` in `DynamicGameRunner.jsx` so `useEffect` no longer immediately triggers `onFatalError` while `POST /api/fix-code` is still running.
  - Wrapped `DrivableVehicle` and `FlyableCraft` in `forwardRef` so `vehicleRef.current.position` works for coin/objective checks, and accepted `THREE.Vector3` / `{x,y,z}` in `spawnFloatingNumber`.

## [0.70.0] - 2026-11-20
### Fixed
- **48× Generation Speedup (`backend/ai_service.py`, `backend/ai_helpers.py`):**
  - Diagnosed 4–5 minute hangs (`504 DEADLINE_EXCEEDED` on `gemini-3.8`/`3.7`/`3.6-flash` and `429` quota limits on `gemini-3.5-flash`).
  - Switched primary synthesis model to `gemini-3.5-flash-lite` (with fast failover to `gemini-3.1-flash-lite` and `gemini-3.5-flash`), dropped slow `response_schema` grammar compilation & thinking overhead in favor of `response_mime_type="application/json"` + `json_repair` + `sanitize_raw_config` (`backend/ai_helpers.py`), and lowered per-attempt timeout from `95s` to `28s`, cutting live 3D game generation from minutes down to **~5–7 seconds**.

## [0.69.0] - 2026-11-20
### Added
- **Unity-Grade 3D World & Character Prefab Kits (`sdk/worlds/`, `sdk/assets/ArticulatedRunner.jsx`, `sdk/props/`):**
  - Created `worldTextures.jsx` generating cached 512x512 architectural facade textures (arched/grid windows, mullions, warm plaster/brick, glossy window roughness & bump maps) and sunlit dashed wet-asphalt road textures.
  - Created `SubwayCorridor.jsx` + `corridorBanners.jsx`: infinite-scrolling sunlit 3-lane railway corridor with gravel ballast, instanced wooden railway sleepers, 6 brushed-steel rails, sandstone sidewalks, multi-story textured terracotta buildings with awnings & AC units, brick overpass arches, signal lights, and colorful swaying overhead festival banners.
  - Created `CityBlockWorld.jsx` + `cityTraffic.jsx`: GTA-style sunlit city grid with wet-asphalt avenues, raised sidewalks, textured towers & storefronts, street lamps, urban shade trees, and cruising clearcoat AI traffic cars.
  - Created `ArticulatedRunner.jsx` exposing the full IK running/jumping/sliding/banking/crash-stars articulated character rig to AI-generated games, and upgraded `StylizedTrain.jsx` & `StylizedObstacles.jsx` (vibrant clearcoat liveries, twin headlights, AC pods, auto-spinning embossed star coins) with `spawnSdk.jsx` & `compileGameCode.jsx` bindings.
- **Cinematic Lighting & Motion Feel (`StudioBackdrop.jsx`, `SmartCamera.jsx`):**
  - Brightened golden-hour sunlit lighting + cool rim fill and tightened `SmartCamera` hero follow framing (`distance=7.4`, `height=3.9`) with subtle banking roll on steer/strafe.

### Fixed
- **Bulletproof Gemini JSON Generation (`backend/ai_service.py`, `backend/prompts.py`, `backend/requirements.txt`):**
  - Installed `json-repair`, raised `max_output_tokens=32768`, added resilient JSON repair + automatic retry across fallback models on `JSONDecodeError` (fixing `Expecting ',' delimiter` errors on complex prompts like `"gta"`), and directed Gemini to compose our Unity-grade world & prop prefabs.

## [0.68.0] - 2026-11-20
### Fixed
- **Stuck Camera & Frozen Gameplay Recovery (`SmartCamera.jsx`, `cameraMath.jsx`, `compileGameCode.jsx`):**
  - Added `resolveCameraTarget` in `cameraMath.jsx` supporting React refs (`THREE.Object3D` world position / `.position`), arrays `[x,y,z]`, `{x,y,z}` objects, and functions; accepted `target`, `targetPosition`, and `targetRef` in `SmartCamera.jsx` and auto-synced custom targets into `motionBus.pos`/`vel` so `ObjectiveBeacon`, `SmartEntity`, and `MinimapHUD` track the player automatically. Ignored instanced foliage meshes in `avoidCameraCollision`.
  - Wrapped `useFrame` in `compileGameCode.jsx` (`useSafeFrame`) so AI-generated games wait until `hasStarted` (after clicking PLAY), cleanly pause when `isPaused` (Esc / Upgrade Draft) or after Victory/GameOver, and always receive clamped `dt <= 0.05`. Added the same start/pause guard to `SmartEntity.jsx`, `DrivableVehicle.jsx`, and `FlyableCraft.jsx`.
- **Invisible PBR Tracks & Input Compatibility (`compileGameCode.jsx`, `pbrMaterials.jsx`, `pbrNoise.jsx`, `MeshBuilder.jsx`, `RealisticTerrain.jsx`, `useGameInput.jsx`, `PropModel.jsx`, `SkeletalActor.jsx`, `UpgradeModal.jsx`):**
  - Added `SafeReact.createElement` in `compileGameCode.jsx` so `<mesh material={plainPbrProps}>` (from `usePbrMaterial` / `useStudioMaterial`) automatically binds a `<meshPhysicalMaterial>` child instead of rendering invisible meshes, and normalized scalar `repeat` values via `normRepeat`.
  - Upgraded `useGameInput.jsx` so `keys` works both directly (`keys.a`, `keys.ArrowLeft`, `keys.Space`, `keys[' ']`) and via `keys.current`, while preventing Space/Arrow scroll.
  - Hardened array `scale={[x,y,z]}` handling for `<ContactShadows>` in `PropModel.jsx` and `SkeletalActor.jsx`, and supported `item.desc || item.description` in `UpgradeModal.jsx`.
- **Prompt & Scenery Accuracy (`backend/prompts.py`, `backend/ai_service.py`):**
  - Updated `SDK_CONTEXT`, `ART_DIRECTION_RULES`, and `OUTDOOR_DETAIL_RULE` to enforce ref-based 60FPS `useFrame` movement (zero per-frame `setState`), real AABB/distance collision checks on every obstacle/collectible, explicit `<SmartCamera target={playerRef} />`, and theme-appropriate scenery (architectural tracks/tunnels/buildings for urban/subway worlds instead of forced lava/foliage).

## [0.67.0] - 2026-11-19
### Changed
- Migrated `backend/ai_service.py` to official `google-genai` SDK (`genai.Client(api_key=...)`, `client.aio.models.generate_content`) defaulting to `gemini-3.5-flash` with `response_schema=GameConfig`, `95s` timeout & automatic live failover across `gemini-3.8-flash`/`3.7`/`3.6`, supporting `AQ.*` Express/AI Studio keys cleanly with `load_dotenv()` initialized first in `backend/main.py`.
- Added `google-genai>=1.0.0` to `backend/requirements.txt` and updated `backend/schemas.py` default `model_id` (`gemini-3.8-flash`) + `docs/ARCHITECTURE.md`.

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
