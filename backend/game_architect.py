import asyncio
import json
import logging
import os
from typing import Any, Dict, Tuple
from google import genai
from google.genai import types
from ai_helpers import parse_json_resilient
from dimension_routing import enforce_dimension_spec, is_2d_puzzle_prompt, normalize_dimension
from genre_routing import apply_mode_alignment, apply_refine_keywords, infer_spec_from_prompt
from spatial_validator import sanitize_world_json
from world_schemas import WorldBlueprintJSON

logger = logging.getLogger("spawn.architect")

WORLD_ARCHITECT_PROMPT = """You are the Lead 3D Technical Artist & Game Designer at Spawn.gg.
NEVER default everything to endless_runner. Pick the exact `mode` and `goalType` matching the User Prompt (English or Hebrew):
- Flying / space / jets / dragons / birds / sky combat -> `mode`: "sky_shooter", `goalType`: "eliminate_targets", `targetCount`: 15, `worldLayout`: "open_biome", `playerRig`: "flight_combat", `canShoot`: true, `enemiesShoot`: true
- Fighting / zombies / monsters / swords / arena / shooting enemies -> `mode`: "arena_action", `goalType`: "survive_waves", `waveCount`: 3, `worldLayout`: "open_biome", `playerRig`: "third_person_action", `canShoot`: true, `enemiesShoot`: true
- Cars / racing / police chase / driving / motorcycles -> `mode`: "vehicle_pursuit", `goalType`: "distance_race", `targetDistance`: 1500, `worldLayout`: "city_grid", `playerRig`: "arcade_car", `canShoot`: false
- GTA / open world / city exploration / heist / free roam -> `mode`: "open_world_sandbox", `goalType`: "open_world_missions", `targetCount`: 4, `worldLayout`: "city_grid", `playerRig`: "third_person_action", `canShoot`: true, `enemiesShoot`: true, `vehiclesEnabled`: true, `wantedSystem`: true
- Running / subway / parkour / jumping over trains/obstacles -> `mode`: "endless_runner", `goalType`: "collect_and_escape", `targetCount`: 25, `worldLayout`: "three_lane_track", `playerRig`: "three_lane_runner"

Output tailored `themeId` ("subway_trains" | "space_shooter" | "pirate_island" | "police_pursuit" | "cyber_arena" | "lava_dragon"), `playerType`, `obstacleType`, `enemyType`, `collectibleType`, `palette` ({"sky","ground","track","primary","secondary","accent"}), `powerupsEnabled`: ["shield","triple_shot","magnet","jetpack_boost"], `speed`, localized `title` & `objectiveText`, plus `entities` & `rules`.
For creative characters/creatures/bosses (e.g. monkey/dragon/flying burger), ALSO output custom `playerParts[]`, `enemyParts[]`, `obstacleParts[]` (`{shape:"box"|"sphere"|"cylinder"|"cone"|"torus", pos:[x,y,z], scale:[x,y,z], rot:[x,y,z], color, anim?:"flap"|"spin"|"bob"|"wheel"}`) & `bossConfig`: `{"bossName","hp","parts":[...]}`.
Return strict JSON only."""


def _fast_models() -> list[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
    chain = [primary, "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    return [m for i, m in enumerate(chain) if m and m not in chain[:i]]


def validate_world_dict(raw: Dict[str, Any], prompt: str = "", dimension: str | None = None) -> WorldBlueprintJSON:
    merged = apply_mode_alignment(raw, prompt=prompt)
    enforced = enforce_dimension_spec(merged, dimension or raw.get("dimension"), prompt=prompt)
    return WorldBlueprintJSON.model_validate(sanitize_world_json(enforced, prompt=prompt))


def build_fallback_cartoon_world(prompt: str = "", dimension: str = "3d") -> WorldBlueprintJSON:
    return validate_world_dict(infer_spec_from_prompt(prompt), prompt=prompt, dimension=dimension)


def refine_world_fallback(current_spec: Dict[str, Any], instruction: str = "") -> WorldBlueprintJSON:
    """Fast deterministic Hebrew/English GameSpec refinement fallback (~1ms)."""
    patched = apply_refine_keywords(current_spec, instruction=instruction)
    return validate_world_dict(patched, prompt=instruction or patched.get("title") or "", dimension=patched.get("dimension"))


async def design_world_blueprint(prompt: str, client: genai.Client, dimension: str = "3d") -> Tuple[WorldBlueprintJSON, str]:
    dim = normalize_dimension(dimension, prompt)
    if is_2d_puzzle_prompt(prompt):
        return build_fallback_cartoon_world(prompt, dimension="2d"), "deterministic-2d-puzzle-architect"
    dim_hint = (
        "DIMENSION=2D: Force `dimension: \"2d\"` and pick `mode` strictly from 2d_grid_puzzle | 2d_platformer | 2d_topdown_action | 2d_endless_dash | 2d_space_arcade with `gravity2d` and `parallaxTheme`."
        if dim == "2d" else
        "DIMENSION=3D: Force `dimension: \"3d\"` and pick `mode` strictly from endless_runner | open_world_sandbox | sky_shooter | vehicle_pursuit | arena_action."
    )
    prompt_text = f"{WORLD_ARCHITECT_PROMPT}\n{dim_hint}\n\nUser Prompt: {prompt}"
    last_exc: Exception | None = None
    for model_name in _fast_models():
        config = types.GenerateContentConfig(temperature=0.72, max_output_tokens=2048, response_mime_type="application/json")
        try:
            res = await asyncio.wait_for(client.aio.models.generate_content(model=model_name, contents=prompt_text, config=config), timeout=8.0)
            world = validate_world_dict(parse_json_resilient(res.text or ""), prompt=prompt, dimension=dim)
            return world, model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            if isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "NOT_FOUND", "UNAVAILABLE", "DEADLINE_EXCEEDED")):
                logger.warning("[Cartoon Architect] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise
    logger.warning("[Cartoon Architect] All live models failed (%s) — using deterministic Cartoon World fallback.", last_exc)
    return build_fallback_cartoon_world(prompt, dimension=dim), "fallback-cartoon-architect"
