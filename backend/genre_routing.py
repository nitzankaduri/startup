from __future__ import annotations

from typing import Any, Dict
from creature_blueprints import POWERUPS_ALL, match_creative_creature_spec

MODE_DEFAULTS: Dict[str, Dict[str, Any]] = {
    "sky_shooter": {
        "themeId": "space_shooter", "mode": "sky_shooter", "goalType": "eliminate_targets", "targetCount": 15,
        "playerType": "starfighter", "obstacleType": "asteroid", "enemyType": "alien_ufo", "collectibleType": "energy_orb",
        "theme": "tokyo_festival", "signLabel": "SPACE", "worldLayout": "open_biome", "playerRig": "flight_combat",
        "objectiveText": "Defeat 15 Alien UFOs", "canShoot": True, "enemiesShoot": True, "speed": 16.0,
        "palette": {"sky": "#0F172A", "ground": "#1E293B", "track": "#334155", "primary": "#38BDF8", "secondary": "#6366F1", "accent": "#F59E0B"},
    },
    "arena_action": {
        "themeId": "lava_dragon", "mode": "arena_action", "goalType": "survive_waves", "waveCount": 3,
        "playerType": "knight", "obstacleType": "lava_pillar", "enemyType": "skeleton", "collectibleType": "star",
        "theme": "desert_canyon", "signLabel": "ARENA", "worldLayout": "open_biome", "playerRig": "third_person_action",
        "objectiveText": "Survive 3 Waves + Boss", "canShoot": True, "enemiesShoot": True, "speed": 12.0,
        "palette": {"sky": "#7C2D12", "ground": "#44403C", "track": "#451A03", "primary": "#F59E0B", "secondary": "#EA580C", "accent": "#EF4444"},
    },
    "vehicle_pursuit": {
        "themeId": "police_pursuit", "mode": "vehicle_pursuit", "goalType": "distance_race", "targetDistance": 1500,
        "playerType": "sports_car", "obstacleType": "police_car", "enemyType": "rival_car", "collectibleType": "gold_coin",
        "theme": "sunny_city", "signLabel": "CHASE", "worldLayout": "city_grid", "playerRig": "arcade_car",
        "objectiveText": "Reach 1,500m", "canShoot": False, "enemiesShoot": False, "speed": 18.0,
        "palette": {"sky": "#0284C7", "ground": "#64748B", "track": "#334155", "primary": "#EF4444", "secondary": "#1E293B", "accent": "#0EA5E9"},
    },
    "endless_runner": {
        "themeId": "subway_trains", "mode": "endless_runner", "goalType": "collect_and_escape", "targetCount": 25,
        "playerType": "runner_kid", "obstacleType": "subway_train", "enemyType": "chaser_guard", "collectibleType": "gold_coin",
        "theme": "sunny_city", "signLabel": "SUBWAY", "worldLayout": "three_lane_track", "playerRig": "three_lane_runner",
        "objectiveText": "Collect 25 Coins", "canShoot": False, "enemiesShoot": False, "speed": 13.0,
        "palette": {"sky": "#0284C7", "ground": "#4ADE80", "track": "#78350F", "primary": "#10B981", "secondary": "#F59E0B", "accent": "#E11D48"},
    },
    "open_world_sandbox": {
        "themeId": "police_pursuit", "mode": "open_world_sandbox", "goalType": "open_world_missions", "targetCount": 4,
        "playerType": "runner_kid", "obstacleType": "police_car", "enemyType": "chaser_guard", "collectibleType": "gold_coin",
        "theme": "sunny_city", "signLabel": "METRO CITY", "worldLayout": "city_grid", "playerRig": "third_person_action",
        "objectiveText": "Complete 4 City Missions", "canShoot": True, "enemiesShoot": True, "vehiclesEnabled": True, "wantedSystem": True, "speed": 12.0,
        "palette": {"sky": "#0284C7", "ground": "#334155", "track": "#1E293B", "primary": "#D96B27", "secondary": "#F59E0B", "accent": "#EF4444"},
    },
}

SANDBOX_KEYS = ("גי טי איי", "ג'י טי איי", "gta", "עולם פתוח", "עיר פתוחה", "חופשי", "שוד", "open world", "sandbox", "city", "free roam", "heist", "open city", "מאפיה")
SKY_KEYS = ("חלל", "חללית", "טיסה", "דרקון", "ציפור", "מטוס", "space", "fly", "jet", "dragon", "bird", "starfighter", "alien", "ufo", "dogfight", "wing")
ARENA_KEYS = ("זירה", "מפלצות", "מפלצ", "זומבים", "זומב", "קרב", "יריות", "אביר", "חרב", "גלים", "arena", "fight", "shoot", "survive", "zombie", "monster", "knight", "sword", "cyber", "wave", "combat", "battle")
VEHICLE_KEYS = ("מרוץ", "מירוץ", "מכוניות", "מכונית", "מרדף", "משטרה", "נהיגה", "אופנוע", "car", "race", "drift", "chase", "police", "drive", "moto", "motorcycle", "highway", "vehicle")
RUNNER_KEYS = ("סאבוויי", "סאבוו", "סאבוי", "ריצה", "רכבות", "רכבת", "מכשולים", "פארקור", "פיראט", "כריש", "חוף", "run", "subway", "parkour", "surf", "train", "metro", "runner", "pirate", "shark")


def detect_intent_mode(text: str) -> str | None:
    p = (text or "").lower()
    if any(k in p for k in SANDBOX_KEYS):
        return "open_world_sandbox"
    if any(k in p for k in SKY_KEYS):
        return "sky_shooter"
    if any(k in p for k in ARENA_KEYS):
        return "arena_action"
    if any(k in p for k in VEHICLE_KEYS):
        return "vehicle_pursuit"
    if any(k in p for k in RUNNER_KEYS):
        return "endless_runner"
    return None


def infer_spec_from_prompt(prompt: str = "") -> Dict[str, Any]:
    """Deterministic Hebrew + English intent router mapping prompts across all 4 modes & 4 goal types."""
    creative = match_creative_creature_spec(prompt)
    if creative:
        return {**creative, "powerupsEnabled": POWERUPS_ALL}
    p = (prompt or "").lower()
    mode = detect_intent_mode(p) or "endless_runner"
    spec = {**MODE_DEFAULTS[mode], "powerupsEnabled": POWERUPS_ALL}
    if mode == "endless_runner" and any(k in p for k in ("פיראט", "כריש", "אי", "חוף", "pirate", "shark", "island", "beach", "aloha")):
        spec.update({
            "themeId": "pirate_island", "playerType": "pirate", "obstacleType": "pirate_barrel", "enemyType": "shark",
            "collectibleType": "gem", "theme": "tropical_beach", "signLabel": "ALOHA", "objectiveText": "Collect 25 Gems",
            "canShoot": True, "palette": {"sky": "#0EA5E9", "ground": "#FCD34D", "track": "#92400E", "primary": "#D96B27", "secondary": "#0EA5E9", "accent": "#E11D48"},
        })
    elif mode == "arena_action" and any(k in p for k in ("cyber", "סייבר", "זומב", "zombie")):
        spec["themeId"] = "cyber_arena"
    elif mode == "open_world_sandbox" and any("\u0590" <= c <= "\u05ff" for c in p):
        spec["objectiveText"] = "השלם 4 משימות בעיר"
    return spec


def apply_mode_alignment(raw: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    """Aligns defaults to the chosen mode so LLM mode decisions never leak runner layouts/rigs."""
    defaults = infer_spec_from_prompt(prompt)
    chosen_mode = raw.get("mode") if raw.get("mode") in MODE_DEFAULTS else defaults["mode"]
    mode_base = MODE_DEFAULTS[chosen_mode]
    base = {**defaults, **mode_base} if chosen_mode != defaults["mode"] else defaults
    merged = {**base, **raw}
    if isinstance(raw.get("palette"), dict):
        merged["palette"] = {**base["palette"], **raw["palette"]}
    return merged


def apply_refine_keywords(current_spec: Dict[str, Any], instruction: str = "") -> Dict[str, Any]:
    """Applies live Hebrew/English mode, goalType, theme & physics patches for Co-Pilot refinement."""
    spec = dict(current_spec or {})
    p = (instruction or "").lower()
    target_mode = detect_intent_mode(p)
    if target_mode and target_mode != spec.get("mode"):
        spec.update(MODE_DEFAULTS[target_mode])
    if any(k in p for k in ("משימות", "missions", "heist", "שוד")) or target_mode == "open_world_sandbox":
        if spec.get("mode") == "open_world_sandbox":
            spec.update({"goalType": "open_world_missions", "vehiclesEnabled": True, "wantedSystem": True, "canShoot": True})
    if any(k in p for k in ("גלים", "גל", "waves", "wave", "survive")):
        spec["goalType"] = "survive_waves"; spec["waveCount"] = int(spec.get("waveCount") or 3)
    elif any(k in p for k in ("מרחק", "מטר", "distance", "meters")):
        spec["goalType"] = "distance_race"; spec["targetDistance"] = int(spec.get("targetDistance") or 1500)
    elif any(k in p for k in ("אסוף", "מטבעות", "יהלומים", "collect", "coins", "gems", "relics")):
        spec["goalType"] = "collect_and_escape"; spec["targetCount"] = int(spec.get("targetCount") or 25)
    elif any(k in p for k in ("חסל", "הבס", "אויבים", "eliminate", "defeat", "kills")):
        spec["goalType"] = "eliminate_targets"; spec["targetCount"] = int(spec.get("targetCount") or 15)
    if any(k in p for k in ("חוף", "טרופי", "beach", "tropical")):
        spec.update({"theme": "tropical_beach", "signLabel": "ALOHA"})
    elif any(k in p for k in ("שקיעה", "sunset")):
        spec.update({"theme": "desert_canyon", "lightingPreset": "sunset"})
    if any(k in p for k in ("מהיר", "מהר", "fast", "faster", "speed", "boost")):
        spec["speed"] = min(24.0, round(float(spec.get("speed") or 12.0) * 1.35, 1))
    if any(k in p for k in ("יותר", "צפוף", "more", "dense", "harder")):
        spec["spawnRate"] = min(2.0, round(float(spec.get("spawnRate") or 1.0) + 0.4, 2))
    if any(k in p for k in ("קפיצ", "double jump", "jump")):
        mech = dict(spec.get("mechanics") or {}); mech["doubleJump"] = True; spec["mechanics"] = mech; spec["jumpPower"] = 15.0
    if any(k in p for k in ("ירי", "לייזר", "תותח", "shoot", "laser", "blaster", "cannon", "weapon")):
        spec["canShoot"] = True
    return spec
