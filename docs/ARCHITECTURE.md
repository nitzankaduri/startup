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
│   ├── main.py                # FastAPI app, CORS, REST endpoints
│   ├── schemas.py             # Pydantic GameConfig, ScoreEntry, Thumbnail models
│   ├── database.py            # Async Motor MongoDB client + memory fallback
│   ├── ai_service.py          # Gemini JSON level generator & remix co-pilot
│   ├── prompts.py             # Multi-genre level-design & remix prompts
│   ├── presets.py             # Mode-aware deterministic fallback builder
│   ├── presets_modes.py       # Arena, Survival Waves, and Racer presets
│   ├── requirements.txt       # FastAPI, Uvicorn, Motor, Pydantic, httpx
│   ├── .env                   # Local env config (gitignored)
│   └── .env.example           # Environment variable template
└── frontend/
    ├── index.html             # Inter typography & dark matte root
    ├── tailwind.config.js     # Matte dark color tokens
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
        │   │   ├── PromptBar.jsx          # Floating 24px white prompt card, quick-chips & Spawn World CTA
        │   │   ├── ShowcaseStrip.jsx      # Hanging architectural showcase cards
        │   │   ├── RecentGamesGrid.jsx    # Filterable Bento world grid
        │   │   └── GameCard.jsx           # 3D WebP card, genre/score/play badges, hover Play/Remix
        │   ├── sandbox/       # React Three Fiber & Rapier 3D runtime
        │   │   ├── store/
        │   │   │   ├── useGameStore.jsx
        │   │   │   ├── gameStoreHelpers.jsx
        │   │   │   └── useSettingsStore.jsx   # Low/Balanced/Ultra quality, sensitivity, master volume & pause state
        │   │   ├── hooks/
        │   │   │   ├── useKeyboardInput.jsx
        │   │   │   └── touchInputState.jsx
        │   │   ├── sdk/
        │   │   │   ├── spawnSdk.jsx           # Atomic Game Building Blocks barrel + motionBus
        │   │   │   ├── compileGameCode.jsx    # Sucrase JSX sandbox compiler with Atomic SDK scope
        │   │   │   ├── useGameInput.jsx       # Keyboard, pointer, mesh drag & ground raycast
        │   │   │   ├── SmartCamera.jsx        # Pivot raycast wall push-in, rotational trauma shake, Perlin breathing & FOV
        │   │   │   ├── cameraMath.jsx         # smoothDamp, dampVec3 & avoidCameraCollision helpers
        │   │   │   ├── gameFeel.jsx           # Hit-stop time-dilation controller & floating world-space damage/score popups
        │   │   │   ├── RealisticPhysicsRig.jsx # Weighty momentum, inertia, suspension compression & weight transfer
        │   │   │   ├── SmokeTrail.jsx         # Soft alpha-blended billboard tire/thruster smoke plumes
        │   │   │   ├── MeshBuilder.jsx        # Multi-map PBR materials, ExtrudedShape, LatheObject, ParticleBurst, FloatingLabel
        │   │   │   ├── pbrNoise.jsx           # Seamless tileable fBm noise & 13 physical surface presets
        │   │   │   ├── pbrMaterials.jsx       # 512x512 MeshPhysicalMaterial albedo/normal/roughness synthesizer
        │   │   │   ├── RealisticTerrain.jsx   # 128x128 terrain with multi-layer slope & elevation shader blending
        │   │   │   ├── StudioBackdrop.jsx     # ContactShadows, sunlight, Sky + Environment
        │   │   │   ├── proceduralTextures.jsx
        │   │   │   ├── assets/
        │   │   │   │   ├── modelRegistry.jsx           # Curated CORS-enabled GLB URLs, targetHeight & preloadAllRegistryModels
        │   │   │   │   ├── normalizeModelMetrics.jsx   # Box3 targetHeight auto-scaling & y=0 grounding
        │   │   │   │   ├── SkeletalActor.jsx           # SkeletonUtils.clone, ContactShadows & 0.15s crossFadeTo GLB rig
        │   │   │   │   ├── PropModel.jsx               # GLB vehicle/prop loader with normalized scale & shadows
        │   │   │   │   └── ProceduralAssetFallbacks.jsx # Multi-map PBR offline procedural fallbacks
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
        │   │   │   │   ├── DrivableVehicle.jsx         # Wheeled grip/drift sim, suspension roll/pitch & headlights
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
        │   │   │   └── props/
        │   │   │       ├── StylizedTrain.jsx
        │   │   │       └── StylizedObstacles.jsx
        │   │   ├── modes/
        │   │   │   ├── combatBus.jsx, ArenaCombatSystem.jsx
        │   │   │   ├── WaveSpawner.jsx, RacerController.jsx
        │   │   │   └── ArcadeRunnerRig.jsx, RunnerWorldStream.jsx, trackChunks.jsx
        │   │   └── components/
        │   │       ├── SandboxViewport.jsx, CanvasErrorBoundary.jsx, GameCanvas.jsx, DynamicGameRunner.jsx
        │   │       ├── SceneEnvironment.jsx, AtmosphereRig.jsx, PostFX.jsx, SceneCleanup.jsx
        │   │       ├── CameraRig.jsx, MotionRig.jsx, SpeedEffects.jsx, ParticleSystem.jsx
        │   │       ├── PowerupSystem.jsx, HoverboardSystem.jsx, PowerupHUD.jsx
        │   │       ├── WorldScenery.jsx, WorldTrackDressing.jsx, BiomeTerrain.jsx, sceneryHelpers.jsx
        │   │       ├── ThumbnailCapturer.jsx, LeaderboardPanel.jsx
        │   │       ├── GameHUD.jsx, HUDModeWidgets.jsx, TitleOverlay.jsx, PauseMenu.jsx, TouchControls.jsx
        │   │       ├── ParticleBursts.jsx, DashTrail.jsx
        │   │       ├── PlayerController.jsx, PlayerMesh.jsx, CharacterModel.jsx, VehicleMesh.jsx
        │   │       ├── AssetCatalog.jsx
        │   │       └── entities/       # 16 modular 3D entity components
        │   └── editor/
        │       └── QuickEditDrawer.jsx # Live physics tweaker & AI remix
        └── shared/
            ├── api/gameApi.jsx         # Fetch client for FastAPI endpoints
            ├── audio/
            │   ├── soundEngine.jsx     # Action foley library + velocity motion audio
            │   └── audioLoops.jsx      # Web Audio engineHum, windRush & adaptive ambient bed
            ├── hooks/useTheme.jsx      # Light Beige / Dark Space Grey theme state
            └── components/             # Reusable matte UI primitives
```

## 3. Performance, Mobile & Social Subsystems
- **AI Bespoke Game Synthesis & Self-Healing (`ai_service.py`, `prompts.py`, `main.py`):** Authenticates via official `google-genai` (`genai.Client(api_key=...)`) targeting `gemini-3.5-flash` (with live failover across `3.8`/`3.7`/`3.6` and `45s` per-attempt timeout) using `temperature: 0.9`, `max_output_tokens: 16384`, `thinking_budget: 6144`, and `response_mime_type: "application/json"`. Strictly rejects missing `GEMINI_API_KEY` (`HTTP 503`) or malformed/empty JSX outputs (`HTTP 502`) with zero silent fallback to canned templates, displaying `"AI Live Synthesized"` vs `"Fallback: <reason>"` transparently via `SynthesisStatusPill` (`HUDModeWidgets.jsx`). Enforces `OUTDOOR_DETAIL_RULE`, `DIRECTOR_PACING_MANDATE` (`triggerHitStop`, `spawnFloatingNumber`, `triggerCameraShake`, `triggerUpgradeDraft` after Wave 1 / Checkpoint 2, interactive crates/barrels, energy cores, elevated vantage points, and an armored `boss` climax guarding the final `ObjectiveBeacon`), and Pre-Output QA verification across the complete AAA stack (`SkeletalActor`, `PropModel`, `SmartEntity`, `DynamicWater`, `InstancedFoliage`, `ProjectilePool`, `ExplosionBurst`, `DrivableVehicle`, `FlyableCraft`, `GridBuilder`, `useEconomy`, `ObjectiveBeacon`, `RunProgression`, `RealisticTerrain`, `pbrMaterials`, `<Sky>` + `<Environment>`, `PostFX`, `RealisticPhysicsRig`). Includes `POST /api/fix-code` (`fix_generated_code` with `thinkingBudget: 2048`) for automatic compile/runtime self-healing.
- **Photorealistic PBR & Post-Processing Pipeline (`GameCanvas.jsx`, `SceneEnvironment.jsx`, `AtmosphereRig.jsx`, `PostFX.jsx`, `SceneCleanup.jsx`):** Uses `ACESFilmicToneMapping`, soft `PCFShadowMap` (`2048 -> 1024`, player-following `[-35, 35]` frustum, `shadow-bias={-0.0003}`, `shadow-normalBias={0.025}`), Drei `<Sky>` + volumetric sun-glare god-ray halo & horizon haze dome (`AtmosphereRig.jsx`), cached `256px` (`frames={1}`) PMREM `<Environment>` with `<Lightformer>` sky/sun/ground panels, and crash-proof `PostFX.jsx` (`<EffectComposer multisampling={0}>`, `<Bloom>`, `<ToneMapping.ACES_FILMIC>`) scaled by `Low` | `Balanced` | `Ultra` presets in `useSettingsStore`.
- **Mobile Touch Controls (`TouchControls.jsx`, `touchInputState.jsx`):** Auto-detects coarse touch pointers and renders a matte thumb-joystick (left) and Jump/Dash/Fire buttons (right).
- **Live 3D Thumbnail Capture & Leaderboards (`ThumbnailCapturer.jsx`, `LeaderboardPanel.jsx`, `GameHUD.jsx`, `main.py`, `database.py`):** Captures WebP screenshots via `preserveDrawingBuffer: true`, computes dynamic `finalScore`, increments `plays_count` (`POST /api/games/{game_id}/play`), persists Top-10 sorted records (`POST /api/games/{game_id}/score` accepting `{ player_name, score, time_seconds }`), displays Top-5 leaderboards on both Victory and Run-Ended screens, and provides 1-click `/play/{id}` challenge link copying with confirmation toast.

## 4. Engineering Invariants
- **150-Line Hard Limit:** Every code file must remain strictly under 150 lines.
- **Pure `.jsx` Frontend:** Zero `.ts` or `.tsx` files in user code.
- **Dual-Theme Editorial Design System (`useTheme.jsx`):** Switchable between **Warm Beige Light Mode** (`#F6F4EF` canvas, `#FFFFFF` cards, `#EFECE4` chips, `#E6E2D8` borders, `#181715` text/CTAs, `#6E6A61` muted text) and **Midnight Blue-Black-Grey Dark Mode** (`#0A0D14` canvas, `#111622` cards, `#182032` chips, `#232E42` borders, `#F1F5F9` text/CTAs, `#94A3B8` muted text), paired with `#D96B27` terracotta accent. Zero neon colors or glow shadows.
