import asyncio
import json
import logging
import os
from typing import Any, Dict, Tuple
from google import genai
from google.genai import types
from ai_helpers import parse_json_resilient
from creature_blueprints import POWERUPS_ALL, match_creative_creature_spec
from spatial_validator import sanitize_world_json
from world_schemas import WorldBlueprintJSON

logger = logging.getLogger("spawn.architect")

WORLD_ARCHITECT_PROMPT = """You are the Lead 3D Technical Artist & Game Designer at Spawn.gg.
Map EVERY detail of the User Prompt (English or Hebrew) into a tailored 3D game JSON Blueprint:
- `themeId`: "subway_trains" | "space_shooter" | "pirate_island" | "police_pursuit" | "cyber_arena" | "lava_dragon"
- `mode`: "endless_runner" | "sky_shooter" | "vehicle_pursuit" | "arena_action"
- `playerType`, `obstacleType`, `enemyType`, `collectibleType`, `palette`: {"sky","ground","track","primary","secondary","accent"}
- For creative characters/creatures/bosses (e.g. monkey/dragon/flying burger), ALSO output custom `playerParts[]`, `enemyParts[]`, `obstacleParts[]` (`{shape:"box"|"sphere"|"cylinder"|"cone"|"torus", pos:[x,y,z], scale:[x,y,z], rot:[x,y,z], color, anim?:"flap"|"spin"|"bob"|"wheel"}`) & `bossConfig`: `{"bossName","hp","parts":[...]}`.
- Include `powerupsEnabled`: ["shield","triple_shot","magnet","jetpack_boost"], `enemiesShoot` (bool), `canShoot` (bool), `speed`, localized `title` & `objectiveText`, plus `entities` & `rules`.
Return strict JSON only."""


def _fast_models() -> list[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
    chain = [primary, "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    return [m for i, m in enumerate(chain) if m and m not in chain[:i]]


def infer_spec_from_prompt(prompt: str = "") -> Dict[str, Any]:
    """Deterministic Hebrew + English keyword detector mapping prompt words to unified GameSpec fields."""
    creative = match_creative_creature_spec(prompt)
    if creative:
        return creative
    p = (prompt or "").lower()
    if any(k in p for k in ("סאבוו", "סאבוי", "רכבת", "רכבות", "subway", "surf", "train", "metro")):
        return {
            "themeId": "subway_trains", "mode": "endless_runner", "playerType": "runner_kid", "obstacleType": "subway_train",
            "enemyType": "chaser_guard", "collectibleType": "gold_coin", "theme": "sunny_city", "signLabel": "SUBWAY",
            "worldLayout": "three_lane_track", "playerRig": "three_lane_runner", "objectiveText": "Collect 30 Coins",
            "canShoot": False, "speed": 13.0, "palette": {"sky": "#0284C7", "ground": "#4ADE80", "track": "#78350F", "primary": "#10B981", "secondary": "#F59E0B", "accent": "#E11D48"},
        }
    if any(k in p for k in ("חלל", "חללי", "space", "starfighter", "fly", "alien", "ufo", "dogfight")):
        return {
            "themeId": "space_shooter", "mode": "sky_shooter", "playerType": "starfighter", "obstacleType": "asteroid",
            "enemyType": "alien_ufo", "collectibleType": "energy_orb", "theme": "tokyo_festival", "signLabel": "SPACE",
            "worldLayout": "open_biome", "playerRig": "flight_combat", "objectiveText": "Defeat 15 Alien UFOs",
            "canShoot": True, "speed": 16.0, "palette": {"sky": "#0F172A", "ground": "#1E293B", "track": "#334155", "primary": "#38BDF8", "secondary": "#6366F1", "accent": "#F59E0B"},
        }
    if any(k in p for k in ("פיראט", "כריש", "אי", "חוף", "pirate", "shark", "island", "beach", "aloha")):
        return {
            "themeId": "pirate_island", "mode": "endless_runner", "playerType": "pirate", "obstacleType": "pirate_barrel",
            "enemyType": "shark", "collectibleType": "gem", "theme": "tropical_beach", "signLabel": "ALOHA",
            "worldLayout": "three_lane_track", "playerRig": "three_lane_runner", "objectiveText": "Collect 30 Gems",
            "canShoot": True, "speed": 12.5, "palette": {"sky": "#0EA5E9", "ground": "#FCD34D", "track": "#92400E", "primary": "#D96B27", "secondary": "#0EA5E9", "accent": "#E11D48"},
        }
    if any(k in p for k in ("משטר", "מכוני", "מרדף", "מירוץ", "police", "car", "race", "gta", "drift")):
        return {
            "themeId": "police_pursuit", "mode": "vehicle_pursuit", "playerType": "sports_car", "obstacleType": "police_car",
            "enemyType": "rival_car", "collectibleType": "gold_coin", "theme": "sunny_city", "signLabel": "CHASE",
            "worldLayout": "city_grid", "playerRig": "arcade_car", "objectiveText": "Collect 30 Coins",
            "canShoot": False, "speed": 16.0, "palette": {"sky": "#0284C7", "ground": "#64748B", "track": "#334155", "primary": "#EF4444", "secondary": "#1E293B", "accent": "#0EA5E9"},
        }
    if any(k in p for k in ("דרקון", "מפלצ", "אביר", "זירה", "זומב", "cyber", "lava", "dragon", "arena", "knight", "zombie")):
        is_cyber = any(k in p for k in ("cyber", "סייבר", "זומב", "zombie"))
        return {
            "themeId": "cyber_arena" if is_cyber else "lava_dragon", "mode": "arena_action", "playerType": "knight",
            "obstacleType": "lava_pillar", "enemyType": "skeleton", "collectibleType": "star", "theme": "desert_canyon", "signLabel": "ARENA",
            "worldLayout": "open_biome", "playerRig": "third_person_action", "objectiveText": "Defeat 15 Enemies",
            "canShoot": True, "speed": 12.0, "palette": {"sky": "#7C2D12", "ground": "#9A3412", "track": "#451A03", "primary": "#F59E0B", "secondary": "#EA580C", "accent": "#EF4444"},
        }
    return {**infer_spec_from_prompt("subway surf"), "powerupsEnabled": POWERUPS_ALL}


def validate_world_dict(raw: Dict[str, Any], prompt: str = "") -> WorldBlueprintJSON:
    defaults = infer_spec_from_prompt(prompt)
    merged = {**defaults, **raw}
    if isinstance(raw.get("palette"), dict):
        merged["palette"] = {**defaults["palette"], **raw["palette"]}
    return WorldBlueprintJSON.model_validate(sanitize_world_json(merged, prompt=prompt))


def build_fallback_cartoon_world(prompt: str = "") -> WorldBlueprintJSON:
    return validate_world_dict({"entities": []}, prompt=prompt)


def refine_world_fallback(current_spec: Dict[str, Any], instruction: str = "") -> WorldBlueprintJSON:
    """Fast deterministic Hebrew/English GameSpec refinement fallback (~1ms)."""
    spec = dict(current_spec or {})
    p = (instruction or "").lower()
    if any(k in p for k in ("סאבוו", "רכבת", "רכבות", "subway", "train")):
        spec.update({"themeId": "subway_trains", "obstacleType": "subway_train", "mode": "endless_runner", "playerType": "runner_kid", "enemyType": "chaser_guard", "theme": "sunny_city"})
    elif any(k in p for k in ("חלל", "חללי", "space", "ufo", "starfighter")):
        spec.update({"themeId": "space_shooter", "mode": "sky_shooter", "playerType": "starfighter", "obstacleType": "asteroid", "enemyType": "alien_ufo", "canShoot": True})
    elif any(k in p for k in ("חוף", "טרופי", "פיראט", "beach", "tropical", "pirate", "island")):
        spec.update({"theme": "tropical_beach", "themeId": "pirate_island", "obstacleType": "pirate_barrel", "playerType": "pirate", "signLabel": "ALOHA"})
    elif any(k in p for k in ("משטר", "מכוני", "police", "car", "race")):
        spec.update({"themeId": "police_pursuit", "mode": "vehicle_pursuit", "playerType": "sports_car", "obstacleType": "police_car", "enemyType": "rival_car"})
    if any(k in p for k in ("מהיר", "מהר", "fast", "faster", "speed", "boost")):
        spec["speed"] = min(24.0, round(float(spec.get("speed") or 12.0) * 1.35, 1))
    if any(k in p for k in ("יותר", "צפוף", "more", "dense", "harder")):
        spec["spawnRate"] = min(2.0, round(float(spec.get("spawnRate") or 1.0) + 0.4, 2))
    if any(k in p for k in ("קפיצ", "double jump", "jump")):
        mech = dict(spec.get("mechanics") or {}); mech["doubleJump"] = True; spec["mechanics"] = mech; spec["jumpPower"] = 15.0
    if any(k in p for k in ("שקיעה", "sunset")):
        spec["theme"] = "desert_canyon"; spec["lightingPreset"] = "sunset"
    if any(k in p for k in ("ירי", "לייזר", "תותח", "shoot", "laser", "blaster", "cannon", "weapon")):
        spec["canShoot"] = True
    return validate_world_dict(spec, prompt=spec.get("title") or instruction)


async def design_world_blueprint(prompt: str, client: genai.Client) -> Tuple[WorldBlueprintJSON, str]:
    prompt_text = f"{WORLD_ARCHITECT_PROMPT}\n\nUser Prompt: {prompt}"
    last_exc: Exception | None = None
    for model_name in _fast_models():
        config = types.GenerateContentConfig(temperature=0.72, max_output_tokens=2048, response_mime_type="application/json")
        try:
            res = await asyncio.wait_for(client.aio.models.generate_content(model=model_name, contents=prompt_text, config=config), timeout=8.0)
            world = validate_world_dict(parse_json_resilient(res.text or ""), prompt=prompt)
            return world, model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            if isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "NOT_FOUND", "UNAVAILABLE", "DEADLINE_EXCEEDED")):
                logger.warning("[Cartoon Architect] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise
    logger.warning("[Cartoon Architect] All live models failed (%s) — using deterministic Cartoon World fallback.", last_exc)
    return build_fallback_cartoon_world(prompt), "fallback-cartoon-architect"
