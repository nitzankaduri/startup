# Spawn.gg — System Architecture

## 1. Overview
**Spawn.gg** is a social, multi-genre AI prompt-to-3D-game platform designed around a minimalist, matte-dark studio interface and a deterministic, schema-driven 3D runtime supporting `platformer`, `arena_shooter`, `time_trial_racer`, and `survival_waves`.

## 2. Repository Layout

```text
startup/
├── GEMINI.md                  # Master engineering & design rules
├── CLAUDE.md                  # Identical master ruleset
├── render.yaml                # Render.com Blueprint (API + Static Web)
├── README.md                  # Local setup & Render deployment guide
├── docs/
│   ├── ARCHITECTURE.md        # System architecture (this file)
│   └── CHANGELOG.md           # Chronological project changelog
├── backend/
│   ├── main.py                # FastAPI app, CORS, REST endpoints & instant JSON /api/games/refine
│   ├── stream_routes.py       # POST /api/generate-stream SSE World Blueprint progress
│   ├── world_schemas.py       # Stylized Cartoon World JSON Blueprint (`sunny_city`, `tropical_beach`, `candy_sky`, `tokyo_festival`, `desert_canyon`)
│   ├── spatial_validator.py   # Python road/spawn anti-overlap, 3-lane passability check, curved coin arcs & 30-50 entity sanitizer
│   ├── dimension_routing.py   # Strict 2D/3D dimension enforcement (`2d_platformer`, `2d_topdown_action`, `2d_endless_dash`, `2d_space_arcade`)
│   ├── game_architect.py      # Fast Stylized Cartoon World Architect (<5s, Flash thinking_budget=0)
│   ├── genre_routing.py       # Bilingual Hebrew/English intent router across 4 modes & 4 goalTypes
│   ├── ai_service.py          # Single-pass Cartoon World synthesis & multilingual ~2s Co-Pilot JSON refinement
│   ├── blueprint_schemas.py   # Legacy/stage Pydantic GameBlueprint schemas
│   ├── schemas.py             # Pydantic GameConfig (with world_json), ScoreEntry, Thumbnail models
│   ├── database.py            # Async Motor MongoDB client + memory fallback (update_game_world_json & code)
│   ├── ai_helpers.py          # Resilient json_repair parser & GameConfig sanitizer
│   ├── prompts.py             # Multi-genre level-design & remix prompts
│   ├── presets.py             # Mode-aware deterministic fallback builder
│   ├── presets_modes.py       # Arena, Survival Waves, and Racer presets
│   ├── requirements.txt       # FastAPI, Uvicorn, Motor, Pydantic, httpx
│   ├── .env                   # Local env config (gitignored)
│   └── .env.example           # Environment variable template
└── frontend/
    ├── index.html             # Inter typography & dark matte root
    ├── scripts/
    │   ├── build_studio_pack.mjs  # Verified 14-model CC0 PBR art-pack downloader & GLB texture packer (>10KB)
    │   └── fetch_cartoon_assets.mjs # Legacy CC0 Kenney GLB fetcher w/ embedded colormap packing
    ├── public/assets/studio/      # Self-contained CC0 studio pack (hero_stylized, enemy_guard, enemy_monster, subway_locomotive/wagon, sports_car, police_cruiser, starfighter, buildings, street_lamp, tree, gold_coin, crate_prop)
    ├── public/models/             # Bundled CC0 .glb assets & Draco decoder
    ├── tailwind.config.js         # Warm editorial & midnight slate design tokens
    └── src/
        ├── App.jsx            # Lobby/Live Game router + /play/:id sync
        ├── index.css          # Tailwind directives & CSS variables
        ├── main.jsx           # React entry point
        ├── features/
        │   ├── lobby/
        │   │   ├── LobbyPage.jsx          # Seamless #FAF9F6 showcase lobby with staggered reveal & genre gallery
        │   │   ├── LobbyHero.jsx          # Editorial headline, subheadline & floating centerpiece prompt bar
        │   │   ├── HeroMeshBackground.jsx # Animated sunset apricot/coral/cream/sky-blue radial mesh gradient
        │   │   ├── lobbyHelpers.jsx       # Typing placeholder hook, genre detection & filter matching
        │   │   ├── Navbar.jsx             # Sticky translucent editorial navigation bar
        │   │   ├── PromptBar.jsx          # Floating 24px white prompt card, build progress & Spawn World CTA
        │   │   ├── BuildProgressPill.jsx  # Warm-editorial 1/3 -> 2/3 -> 3/3 Two-Stage synthesis progress bar
        │   │   ├── ShowcaseStrip.jsx      # Hanging architectural showcase cards
        │   │   ├── RecentGamesGrid.jsx    # Filterable Bento world grid
        │   │   └── GameCard.jsx           # 3D WebP card, genre/score/play badges, hover Play/Remix
        │   ├── sandbox/       # React Three Fiber & Rapier 3D runtime
        │   │   ├── kernel/
        │   │   │   ├── StudioRenderPipeline.js   # ACESFilmic HDR, PMREM studio HDRI map & 2048px player-tracking shadow frustum
        │   │   │   ├── StudioPostFX.jsx          # High-FPS EffectComposer (Bloom threshold 0.92/0.35 + SMAA + ACES Filmic)
        │   │   │   ├── StudioAssetRegistry.js    # Studio pack manifest, static-bounds normalization (-Z, y=0) & PBR material tuning
        │   │   │   ├── StudioEngineCore.js       # Studio GLB runtime bootstrap, normalizer & renderer configuration
        │   │   │   ├── WorldGenreDirector.js     # 5-genre world & rule generators (runner, sandbox, sky, pursuit, arena)
        │   │   │   ├── GameKernel.jsx            # High-FPS imperative R3F kernel driving all 5 GameSpec modes
        │   │   │   ├── OpenWorldBuilder.js       # 180x180 360-deg open-world street grid, blocks & AABB wall sliding
        │   │   │   ├── SandboxVehicleSystem.js   # Seamless F enter/exit vehicle hijack, 360-deg drive/drift & AI traffic
        │   │   │   ├── OpenWorldMissions.js      # 1-5 Wanted Heat Stars, destructible props & repeatable city missions
        │   │   │   ├── ModePhysics.js            # Data-driven movement, enemy AI & obstacle/ramming physics per mode
        │   │   │   ├── GoalEngine.js             # 4 distinct win engines: eliminate_targets, survive_waves, collect_and_escape, distance_race
        │   │   │   ├── ActionCameraRig.js        # Mode-aware camera rigs (chase, tactical isometric, banking flight, speed-FOV pursuit)
        │   │   │   ├── GameplayDirector.js       # Central entity lifecycle, boss AI, projectile & goal loop
        │   │   │   ├── DirectorSetup.js          # Mode normalization & initial entity spawning per GameSpec.mode
        │   │   │   ├── EntityMeshFactory.js      # Studio GLB model mounting w/ smooth sculpted Lathe/Extrude/Capsule fallbacks
        │   │   │   ├── ModelAssetLoader.js       # Cached GLTFLoader + StudioAssetRegistry delegation
        │   │   │   ├── SculptedFallbacks.js      # Beveled ExtrudeGeometry, LatheGeometry & CapsuleGeometry sculpted fallbacks
        │   │   │   ├── EntityShadowPool.jsx      # GPU-instanced ground contact shadows beneath enemies, bosses & vehicles
        │   │   │   ├── StudioVisualRig.jsx       # Player-tracking 2048px key sun, rim light, sky dome & StudioPostFX host
        │   │   │   └── PlayerMovementFeel.js     # Input buffering, squash-and-stretch, barrel rolls & drift lean
        │   │   ├── store/
        │   │   │   ├── useGameStore.jsx
        │   │   │   ├── gameStoreHelpers.jsx
        │   │   │   └── useSettingsStore.jsx   # Low/Balanced/Ultra quality, sensitivity, master volume & pause state
        │   │   ├── hooks/
        │   │   │   ├── useKeyboardInput.jsx
        │   │   │   └── touchInputState.jsx
        │   │   ├── assets/
        │   │   │   ├── CartoonAssetCatalog.js   # Stylized cartoon prefab + bundled/CC0 .glb catalog
        │   │   │   ├── StylizedEntity.jsx       # Auto Box3-grounded (y=0) .glb + cartoon prefab loader w/ ToonMaterial & Rapier collider
        │   │   │   ├── CartoonWorldPrefabs.jsx  # Subway train w/ graffiti decals, barriers (jump/slide) & pastel city buildings
        │   │   │   ├── CartoonActorPrefabs.jsx  # Stylized car/cruiser, gold coin/magnet/jetpack & articulated runner/guard
        │   │   │   ├── cartoonDecals.js         # CanvasTexture graffiti, striped shop awning & billboard generators
        │   │   │   ├── ModelCatalog.js          # Bundled /models/*.glb + CC0 CDN asset manifest & alias resolver
        │   │   │   ├── SmartModel.jsx           # Auto Box3-normalized .glb loader (y=0 grounded) + RigidBody collider
        │   │   │   ├── DetailedModelFallback.jsx # Multi-part PBR fallbacks (wheels, spoilers, glass windshields, taillights)
        │   │   │   ├── JuiceFX.jsx              # 240-instance GPU particle bursts (sparks, smoke, nitro, coins, explosions)
        │   │   │   └── juiceAudio.js            # Keypress-unlocked spatial Web Audio SFX (engine hum, drift, chime, thud)
        │   │   ├── gameplay/
        │   │   │   ├── CartoonPlayerRig.jsx     # Rapier 4-rig controller w/ height-scaled grounded blob shadow
        │   │   │   ├── CartoonVisualMesh.jsx    # Squash-and-stretch springs, limb/hoverboard bobbing, bumpy car suspension & #1E1B4B outlines
        │   │   │   ├── DynamicActionCamera.jsx  # Spring-arm follow cam w/ boost FOV kick, lane banking & combo/crash micro-shake
        │   │   │   ├── CartoonVFX.jsx           # Golden stars/rings, puffy dust clouds, speed lines & crash starbursts
        │   │   │   └── cartoonSfx.jsx           # Snappy keypress-unlocked Web Audio SFX (coin ding, whoosh jump, lane swipe, combo chime)
        │   │   ├── physics/
        │   │   │   ├── WorldPhysicsProvider.jsx # World <Physics gravity={[0, -22, 0]}> + StaticPhysicsBody colliders
        │   │   │   ├── PlayerRigController.jsx  # Rapier 4-rig controller (arcade_car, three_lane_runner, third_person_action, flight_combat)
        │   │   │   ├── rigHelpers.jsx           # Arcade car grip/drift/nitro & 3-lane runner step physics
        │   │   │   ├── actionFlightRigs.jsx     # Camera-relative 3rd-person action & 6-DOF flight combat physics
        │   │   │   ├── RigVisuals.jsx           # Warm-editorial PBR rig meshes, SpotLights & pooled twin-laser bolts
        │   │   │   └── ChaseCameraRig.jsx       # Spring-arm chase cam with FOV punch, corner tilt & collision micro-shake
        │   │   ├── sdk/
        │   │   │   ├── spawnSdk.jsx           # Atomic Game Building Blocks barrel
        │   │   │   ├── motionBus.jsx          # Zero-dependency telemetry, camera shake & physics motion bus
        │   │   │   ├── compileGameCode.jsx    # Sucrase JSX compiler, start/pause/edit-gated useFrame & R3F DOM crash guard
        │   │   │   ├── useGameInput.jsx       # Dual direct/.current keyboard map, pointer, mesh drag & ground raycast
        │   │   │   ├── SmartCamera.jsx        # Ref/array/fn target follow, motionBus sync, raycast push-in, shake & FOV
        │   │   │   ├── cameraMath.jsx         # resolveCameraTarget, smoothDamp, dampVec3 & avoidCameraCollision helpers
        │   │   │   ├── gameFeel.jsx           # useGameLoop (dt clamp + auto-pause), triggerHitStop & floating popups
        │   │   │   ├── HealthBar3D.jsx        # Warm-editorial world-space floating HP/posture/progress meter
        │   │   │   ├── RealisticPhysicsRig.jsx # Weighty momentum, inertia, suspension compression & weight transfer
        │   │   │   ├── SmokeTrail.jsx         # Soft alpha-blended billboard tire/thruster smoke plumes
        │   │   │   ├── MeshBuilder.jsx        # Multi-map PBR materials, ExtrudedShape, LatheObject, ParticleBurst, FloatingLabel
        │   │   │   ├── pbrNoise.jsx           # Seamless tileable fBm noise, 18 surface presets & Three.js r169 CDN map loader
        │   │   │   ├── pbrMaterials.jsx       # 512x512 MeshPhysicalMaterial maps (bricks/turf/sand/alloy/wood) w/ anisotropy=8
        │   │   │   ├── RealisticTerrain.jsx   # 128x128 terrain with multi-layer slope & elevation shader blending
        │   │   │   ├── StudioBackdrop.jsx     # ContactShadows, sunlight, Sky + Environment
        │   │   │   ├── ToonMaterialHelper.js  # 3-step DataTexture cel-shading, saturated palette & <Outlines #1E1B4B>
        │   │   │   ├── proceduralTextures.jsx
        │   │   │   ├── ProceduralTextures.js  # Cached offscreen canvas PBR maps (asphalt road, facade, grass/sand, brushed metal; anisotropy=8)
        │   │   │   ├── assets/
        │   │   │   │   ├── assetCatalog.jsx            # 40+ genre-categorized GLB + StudioProp catalog & ASSET_MANIFEST
        │   │   │   │   ├── AutoNormalizeMesh.jsx       # Box3 grounded auto-normalization, SkeletonUtils.clone & ContactShadows
        │   │   │   │   ├── StudioProps.jsx             # Pine, boulder, chest, crate & unified PROP_MAP (40+ assets/aliases)
        │   │   │   │   ├── studioPropParts.jsx         # Castle keep, sci-fi turret, supercar coupe & starfighter jet
        │   │   │   │   ├── scifiProps.jsx              # Planetary rover, cryo-pod, orbital ring gate & asteroid cluster
        │   │   │   │   ├── fantasyProps.jsx            # Knight hero, goblin/skeleton enemy, timber tavern, crystal shrine & catapult
        │   │   │   │   ├── modernProps.jsx             # Police cruiser, offroad buggy, streetlamp, concrete barrier, suspension bridge & skyscraper
        │   │   │   │   ├── natureProps.jsx             # Palm tree, stylized oak, wooden dock, flickering campfire & ruins pillar
        │   │   │   │   ├── BiomeStage.jsx              # 6 AAA biome stages with timeOfDay moods, practical lights, rain puddles & GPU weather
        │   │   │   │   ├── biomePresets.jsx            # Theme configs: sunset_canyon, alpine_meadow, cyber_dusk, tropical_archipelago, lunar_crater, obsidian_fortress
        │   │   │   │   ├── modelRegistry.jsx           # Backward-compatible re-export of GLB_ASSETS & resolveModelAsset
        │   │   │   │   ├── normalizeModelMetrics.jsx   # Box3 targetHeight auto-scaling & y=0 grounding
        │   │   │   │   ├── SkeletalActor.jsx           # SkeletonUtils.clone, ContactShadows & 0.15s crossFadeTo GLB rig
        │   │   │   │   ├── ArticulatedRunner.jsx       # Subway-Surfers grade articulated IK runner with banking, jump & slide dust
        │   │   │   │   ├── PropModel.jsx               # Auto-normalized GLB / StudioProp loader
        │   │   │   │   └── ProceduralAssetFallbacks.jsx # Multi-part StudioProp & character fallback wrapper
        │   │   │   ├── atmosphere/
        │   │   │   │   ├── WeatherSystem.jsx           # GPU rain streaks, snow, embers, sandstorm & fireflies camera-frustum volume
        │   │   │   │   ├── weatherPresets.jsx          # Weather configs, dawn/noon/golden_hour/midnight palettes & stage mood resolver
        │   │   │   │   └── PracticalLights.jsx         # Warm flickering lantern posts & point lights during midnight / golden_hour
        │   │   │   ├── world/
        │   │   │   │   ├── CityRoadBuilder.jsx         # Flat paved <CityGrid /> & banked spline <RaceTrack /> w/ curbs & barrier colliders
        │   │   │   │   └── raceTrackHelpers.jsx        # CatmullRom spline banked road & barrier geometry builder
        │   │   │   ├── worlds/
        │   │   │   │   ├── worldTextures.jsx           # 512x512 architectural facade (arched/grid windows) & dashed asphalt textures
        │   │   │   │   ├── corridorBanners.jsx         # Brick station overpasses, signal lights, festival pennants & market crates
        │   │   │   │   ├── SubwayCorridor.jsx          # Infinite scrolling sunlit 3-lane track corridor with ties, rails & buildings
        │   │   │   │   ├── cityTraffic.jsx             # Autonomous clearcoat cruising AI traffic cars with headlights
        │   │   │   │   └── CityBlockWorld.jsx          # GTA-style sunlit city grid with avenues, sidewalks, towers, lamps & trees
        │   │   │   ├── foliage/
        │   │   │   │   ├── InstancedFoliage.jsx        # GPU-instanced wind-swaying grass, flowers, shrubs & pebbles
        │   │   │   │   └── foliagePresets.jsx          # 6 biome palettes, terrain height sampler & tuft geometry
        │   │   │   ├── vfx/
        │   │   │   │   ├── DynamicWater.jsx            # Lightweight Fresnel sky-reflection & wave shader (+ GLSL lava)
        │   │   │   │   ├── waterShaders.jsx            # GLSL Fresnel sky-reflection, ripple & magma shaders
        │   │   │   │   ├── CombatVFX.jsx               # ProjectilePool tracer & raycast hit system
        │   │   │   │   └── ExplosionBurst.jsx          # Shockwave, debris, smoke, point-light flash & shake
        │   │   │   ├── ai/
        │   │   │   │   ├── SmartEntity.jsx             # Autonomous patrol/chase/turret/swarm/boss AI actor
        │   │   │   │   └── entitySteering.jsx          # Raycast obstacle avoidance & ancestor damage routing
        │   │   │   ├── vehicles/
        │   │   │   │   ├── DrivableVehicle.jsx         # Wheeled grip/drift/nitro sim, SpotLight headlights, brake lamps & skid marks
        │   │   │   │   ├── ArcadeCarVisual.jsx         # Animated GT body, steering wheels, SpotLights & nitro flames for PlayerController
        │   │   │   │   ├── VehicleHeadlights.jsx       # Twin bumper SpotLights + flickering warm nitro exhaust cones
        │   │   │   │   ├── SkidMarks.jsx               # Pooled handbrake drift tire decals
        │   │   │   │   └── FlyableCraft.jsx            # 6-DOF banking flight/hover rig with lead reticle
        │   │   │   ├── strategy/
        │   │   │   │   ├── GridBuilder.jsx             # Raycast snap-to-grid ghost, spring pop & dust burst builder
        │   │   │   │   └── useEconomy.jsx              # Resource gold/energy/wood state, upgrades & income popups
        │   │   │   ├── navigation/
        │   │   │   │   ├── ObjectiveBeacon.jsx         # 3D target beam, pulsing ring & offscreen pointer projection
        │   │   │   │   ├── ObjectivePointer.jsx        # Screen-edge directional target indicator arrows
        │   │   │   │   ├── MinimapHUD.jsx              # Top-down radar plotting player, enemies, coins & objectives
        │   │   │   │   └── radarBus.jsx                # Live radar blips & pointer state bus
        │   │   │   ├── progression/
        │   │   │   │   ├── RunProgression.jsx          # Live x2/x3/x5 combo streak meter, decaying timer & draft bus
        │   │   │   │   └── UpgradeModal.jsx            # 3-card warm-editorial upgrade draft overlay (click or 1/2/3)
        │   │   │   ├── props/
        │   │   │   │   ├── propTextures.jsx        # 512x256 chevron barrier, embossed star coin & louvered train roof textures
        │   │   │   │   ├── StylizedTrain.jsx       # Subway-Surfers golden/burgundy metro train with louvered roof & LED lights
        │   │   │   │   └── StylizedObstacles.jsx   # Chevron sawhorse hurdle, overhead barrier & spinning embossed star coin
        │   │   │   └── runtime/
        │   │   │       ├── GameRuntimeKit.jsx      # Runtime barrel, ColliderBox & GameRuntimeProvider
        │   │   │       ├── useArenaPhysics.jsx     # 2-pass AABB/sphere collider registry, registerObjectCollider, slide pushout & crash impacts
        │   │   │       ├── useMissionState.jsx     # Mission/wave/HP/objective state machine synced to HUD & win/loss
        │   │   │       ├── PlayerController.jsx    # 4 battle-tested presets: third_person_action, arcade_vehicle, flight_shooter, tactical_isometric
        │   │   │       └── runtimeRigHelpers.jsx   # Pure 60FPS step integrators for action, vehicle drift & 6-DOF flight
        │   │   ├── modes/
        │   │   │   ├── combatBus.jsx, ArenaCombatSystem.jsx
        │   │   │   ├── WaveSpawner.jsx, RacerController.jsx
        │   │   │   └── ArcadeRunnerRig.jsx, RunnerWorldStream.jsx, trackChunks.jsx
        │   │   └── components/
        │   │       ├── SandboxViewport.jsx, CanvasErrorBoundary.jsx, GameCanvas.jsx, WorldJsonScene.jsx, SubwayCorridorScene.jsx, worldEntityActors.jsx, DynamicGameRunner.jsx
        │   │       ├── SubwayToonArtDirector.jsx, StudioLightingRig.jsx, SceneEnvironment.jsx, AtmosphereRig.jsx, PostFX.jsx, SceneCleanup.jsx
        │   │       ├── CameraRig.jsx, MotionRig.jsx, SpeedEffects.jsx, ParticleSystem.jsx
        │   │       ├── PowerupSystem.jsx, HoverboardSystem.jsx, PowerupHUD.jsx
        │   │       ├── WorldScenery.jsx, WorldTrackDressing.jsx, BiomeTerrain.jsx, sceneryHelpers.jsx
        │   │       ├── ThumbnailCapturer.jsx, LeaderboardPanel.jsx
        │   │       ├── GameHUD.jsx, HUDModeWidgets.jsx, HudStatusPills.jsx, TitleOverlay.jsx, PauseMenu.jsx, TouchControls.jsx
        │   │       ├── PublishModal.jsx, publishHelpers.jsx # 1-Click Share Link/QR, Website <iframe> Embed & Playable .html Export
        │   │       ├── StudioCopilotBar.jsx  # Collapsible live multi-turn Vibe Refinement Co-Pilot bar
        │   │       ├── ParticleBursts.jsx, DashTrail.jsx
        │   │       ├── PlayerController.jsx, PlayerMesh.jsx, CharacterModel.jsx, VehicleMesh.jsx
        │   │       ├── AssetCatalog.jsx
        │   │       └── entities/       # 16 modular 3D entity components
        │   └── editor/
        │       ├── QuickEditDrawer.jsx  # Live physics tweaker & AI remix drawer
        │       ├── SceneInspector.jsx   # Floating right-docked 3D inspector (Scale, Rotation Y, Speed/HP, Tint, Duplicate/Delete)
        │       ├── SandboxEditorRig.jsx # Free OrbitControls + click-to-select 3D warm terracotta selection gizmo
        │       └── sceneEditUtils.jsx   # Raycast editable-ancestor filter, material cloning & SkeletonUtils duplicator
        └── shared/
            ├── api/gameApi.jsx         # Fetch client for FastAPI endpoints
            ├── audio/
            │   ├── soundEngine.jsx     # Action foley library + velocity motion audio
            │   └── audioLoops.jsx      # Web Audio engineHum, windRush & adaptive ambient bed
            ├── hooks/useTheme.jsx      # Light Beige / Dark Space Grey theme state
            └── components/             # Reusable matte UI primitives
```

## 3. Performance, Mobile & Social Subsystems
- **Subway Surfers Cartoon World Architect (`game_architect.py`, `ai_service.py`, `world_schemas.py`, `spatial_validator.py`, `stream_routes.py`):**
  - **Single-Pass Blueprint Synthesis (`design_world_blueprint`):** Uses `gemini-3.6-flash` with live multi-model failover (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`) to output `WorldBlueprintJSON` (`sunny_city`, `tropical_beach`, `candy_sky`, `tokyo_festival`, `desert_canyon`, plus `wild_west`), `signLabel`, `three_lane_track` / `city_grid` / `race_circuit` / `open_biome` layouts, and 32–48 rich entities (`subway_train`, `street_barrier`, `high_barrier`, `cartoon_car`, `police_cruiser`, `city_building`, `gold_coin`, `powerup_jetpack`, `powerup_magnet`, `jump_ramp`, `chaser_guard`).
  - **Spatial Passability & Anti-Overlap (`sanitize_world_json`):** Snaps 3-lane track actors to `[-3.2, 0.0, 3.2]`, flanks buildings cleanly at `X = ±12.5` without Z overlap, guarantees at least one survivable open lane per Z slice, deduplicates same-lane/slice colliders, and supplements parabolic jump-arc coin rows and rooftop ramps when needed.
  - **Live Studio Co-Pilot JSON Refinement (`POST /api/games/refine`, `StudioCopilotBar.jsx`):** Bilingual English/Hebrew ~2s World JSON patching (merging untouched fields seamlessly and persisting via `update_game_world_json`) rendered deterministically through `SandboxViewport.jsx` -> `GameCanvas.jsx` (`SubwayToonArtDirector`, `WorldJsonScene.jsx`, `CartoonPlayerRig.jsx`, `StylizedEntity.jsx`).
- **Stylized Toon Art Direction & Post-Processing (`SubwayToonArtDirector.jsx`, `ToonMaterialHelper.js`, `CartoonWorldPrefabs.jsx`, `CartoonActorPrefabs.jsx`):** Uses warm sun directional shadows (`2048x2048`), `#7DD3FC`/`#FDE68A` hemisphere bounce, `<Environment preset="park" />`, sky gradient dome, 3-band `DataTexture` cel-shading with `<Outlines thickness={0.03} color="#1E1B4B" />`, `CanvasTexture` decals, and `<EffectComposer multisampling={4}>` (`Bloom`, `BrightnessContrast`, `HueSaturation`, `ACES_FILMIC`).
- **Mobile Touch Controls (`TouchControls.jsx`, `touchInputState.jsx`):** Auto-detects coarse touch pointers and renders a matte thumb-joystick (left) and Jump/Dash/Fire buttons (right).
- **Live 3D Thumbnail Capture & Leaderboards (`ThumbnailCapturer.jsx`, `LeaderboardPanel.jsx`, `GameHUD.jsx`, `main.py`, `database.py`):** Captures WebP screenshots via `preserveDrawingBuffer: true`, computes dynamic `finalScore`, increments `plays_count` (`POST /api/games/{game_id}/play`), persists Top-10 sorted records (`POST /api/games/{game_id}/score` accepting `{ player_name, score, time_seconds }`), displays Top-5 leaderboards on both Victory and Run-Ended screens, and provides 1-click `/play/{id}` challenge link copying with confirmation toast.

## 4. Engineering Invariants
- **150-Line Hard Limit:** Every code file must remain strictly under 150 lines.
- **Pure `.jsx` Frontend:** Zero `.ts` or `.tsx` files in user code.
- **Dual-Theme Editorial Design System (`useTheme.jsx`):** Switchable between **Warm Beige Light Mode** (`#F6F4EF` canvas, `#FFFFFF` cards, `#EFECE4` chips, `#E6E2D8` borders, `#181715` text/CTAs, `#6E6A61` muted text) and **Midnight Blue-Black-Grey Dark Mode** (`#0A0D14` canvas, `#111622` cards, `#182032` chips, `#232E42` borders, `#F1F5F9` text/CTAs, `#94A3B8` muted text), paired with `#D96B27` terracotta accent. Zero neon colors or glow shadows.
