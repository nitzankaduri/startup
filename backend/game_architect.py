import asyncio
import json
import logging
import os
from typing import Any, Dict, Tuple
from google import genai
from google.genai import types
from ai_helpers import parse_json_resilient
from blueprint_schemas import GameBlueprint
from validator_constants import CATALOG_MANIFEST

logger = logging.getLogger("spawn.architect")

ARCHITECT_SYSTEM_PROMPT = f"""You are the Lead Game Director & Systems Architect at a commercial AAA 3D studio (Spawn.gg).
Dissect the user's prompt into a deep, concrete engineering blueprint (Game Design Document) BEFORE any code is written.

RULES:
1. NEVER produce a generic obstacle runner or box-collector unless the prompt explicitly asks for an endless runner/subway game.
2. Tailor `unique_core_mechanics` with AT LEAST 3 distinct, prompt-specific interactive systems with concrete timers, state machines, physics forces, and feedback:
   - e.g. Cafe/tycoon -> customer queue AI, ingredient station timers, tip economy, station upgrades.
   - e.g. Samurai/melee duel -> parry timing window, stance/posture meter, dash strike, telegraphed boss combos.
   - e.g. Space mining -> zero-G thruster momentum, tether mining laser, asteroid fracturing, cargo weight physics.
   - e.g. Racing/GTA -> street grid, drift traction & boost charge, wanted heat/traffic, cash/intel missions.
3. Select `visual_art_direction.biome_stage_theme` (`"sunset_canyon" | "alpine_meadow" | "cyber_dusk" | "tropical_archipelago" | "lunar_crater" | "obsidian_fortress"`),
   `visual_art_direction.time_of_day` (`"dawn" | "noon" | "golden_hour" | "midnight"`), and `visual_art_direction.weather` (`"clear" | "rain" | "snow" | "embers" | "sandstorm" | "fireflies"`):
   - Cyberpunk/noir/detective/night -> `midnight` + `rain`; volcano/dragon/lava -> `golden_hour` + `embers`; enchanted forest/mystic -> `midnight`/`dawn` + `fireflies`; alpine mountain -> `noon`/`golden_hour` + `snow`; desert storm -> `golden_hour` + `sandstorm`.
   Select 6+ distinct genre-appropriate entity/prop IDs in `visual_art_direction.studio_entities` from the FULL manifest below so Stage 2 populates the world richly with 15-30 placed props & landmarks:
   {CATALOG_MANIFEST}
   STRICTLY ZERO NEON COLORS (`cyan`, `magenta`, `#00ff00`).
4. Pick exact `genre_and_camera.camera_rig` (`"third_person_orbit" | "first_person" | "isometric_tactical" | "top_down_arcade" | "chase_vehicle" | "cockpit_flight"`) and `genre_and_camera.player_controller_preset` (`"third_person_action" | "arcade_vehicle" | "flight_shooter" | "tactical_isometric"`).
5. SPATIAL LAYOUT:
   - Driving/racing/heist/police-chase/city prompts -> use `<CityGrid />` (`roadWidth=14, blockSize=36`; street centerlines strictly at `-100, -50, 0, 50, 100`) or `<RaceTrack />` with `flatGround=true`; place ALL cars, checkpoints & pickups strictly along street centerlines or track waypoints — NEVER inside building blocks!
   - Outdoor/nature/shooter prompts -> specify `y = getTerrainHeight(x, z)` terrain snapping for every prop & enemy so zero objects float or bury underground.
6. MANDATORY LOOP: Every blueprint MUST specify a directional `<ObjectiveBeacon />` target, real win (`targetObjectives`/`targetScore`/laps) & lose (`0 HP`/timer) conditions, and active steering AI opponents (police cruisers, rival racers, or `SmartEntity` fighters).

Output ONLY valid JSON matching:
{{
  "title": "Distinct evocative world title",
  "genre_and_camera": {{
    "camera_rig": "third_person_orbit",
    "player_controller_preset": "third_person_action",
    "game_mode": "platformer | arena_shooter | time_trial_racer | survival_waves | arcade_runner",
    "control_scheme": "Exact controls hint for HUD",
    "camera_distance": 8.0,
    "camera_height": 4.2
  }},
  "unique_core_mechanics": [
    {{"name": "...", "trigger_input": "...", "physics_or_state_rule": "...", "player_feedback": "..."}}
  ],
  "visual_art_direction": {{
    "biome_stage_theme": "sunset_canyon",
    "time_of_day": "golden_hour",
    "weather": "clear",
    "sky_atmosphere_mood": "...",
    "sky_horizon_hex": "#...",
    "sky_top_hex": "#...",
    "lighting_angle": "...",
    "ground_topology": "...",
    "studio_entities": ["castle_keep", "knight_hero", "goblin_enemy", "crystal_shrine", "pine_tree", "campfire"],
    "landmarks": ["..."],
    "hero_assembly_recipe": "...",
    "enemy_or_prop_recipes": ["..."]
  }},
  "rules_and_progression": {{
    "win_condition": "...",
    "lose_condition": "...",
    "escalating_stages": ["Stage 1...", "Stage 2...", "Boss/Climax..."],
    "risk_reward_loop": "...",
    "custom_hud_keys": ["HP", "..."]
  }}
}}"""


def _architect_models() -> list[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip() or "gemini-3.5-flash-lite"
    chain = [primary, "gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
    seen: list[str] = []
    for m in chain:
        if m not in seen:
            seen.append(m)
    return seen


def _sanitize_blueprint(raw: Dict[str, Any], prompt: str) -> GameBlueprint:
    gac = dict(raw.get("genre_and_camera")) if isinstance(raw.get("genre_and_camera"), dict) else {}
    vad = dict(raw.get("visual_art_direction")) if isinstance(raw.get("visual_art_direction"), dict) else {}
    if gac.get("camera_rig") not in {"third_person_orbit", "first_person", "isometric_tactical", "top_down_arcade", "chase_vehicle", "cockpit_flight"}:
        gac["camera_rig"] = "third_person_orbit"
    if gac.get("player_controller_preset") not in {"third_person_action", "arcade_vehicle", "flight_shooter", "tactical_isometric"}:
        gac["player_controller_preset"] = "third_person_action"
    if vad.get("biome_stage_theme") not in {"sunset_canyon", "alpine_meadow", "cyber_dusk", "tropical_archipelago", "lunar_crater", "obsidian_fortress"}:
        vad["biome_stage_theme"] = "sunset_canyon"
    if vad.get("time_of_day") not in {"dawn", "noon", "golden_hour", "midnight"}:
        vad["time_of_day"] = "golden_hour"
    if vad.get("weather") not in {"clear", "rain", "snow", "embers", "sandstorm", "fireflies"}:
        vad["weather"] = "clear"
    if not isinstance(vad.get("studio_entities"), list) or len(vad.get("studio_entities", [])) < 3:
        vad["studio_entities"] = ["tower", "pine_tree", "boulder"]
    raw = {**raw, "genre_and_camera": gac, "visual_art_direction": vad}
    if not raw.get("title"):
        raw["title"] = prompt.strip()[:40].title() or "Spawn 3D World"
    return GameBlueprint.model_validate(raw)


async def design_game_blueprint(prompt: str, client: genai.Client) -> Tuple[GameBlueprint, str]:
    """Stage 1: Deep architectural GDD planning pass using high thinking budget (8192)."""
    prompt_text = f"{ARCHITECT_SYSTEM_PROMPT}\n\nUser Prompt: {prompt}"
    last_exc: Exception | None = None

    for model_name in _architect_models():
        config = types.GenerateContentConfig(
            temperature=0.75,
            max_output_tokens=4096,
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(thinking_budget=8192),
        )
        try:
            res = await asyncio.wait_for(
                client.aio.models.generate_content(model=model_name, contents=prompt_text, config=config),
                timeout=35.0,
            )
            raw = parse_json_resilient(res.text or "")
            bp = _sanitize_blueprint(raw, prompt)
            logger.info("[Stage 1 Architect] Designed '%s' (%s) via %s", bp.title, bp.genre_and_camera.camera_rig, model_name)
            return bp, model_name
        except Exception as exc:
            last_exc = exc
            msg = str(exc)
            retryable = isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(
                c in msg for c in ("400", "404", "429", "503", "504", "NOT_FOUND", "UNAVAILABLE", "DEADLINE_EXCEEDED")
            )
            if retryable:
                logger.warning("[Stage 1 Architect] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise

    raise RuntimeError(f"Stage 1 Blueprint generation failed: {last_exc}")
