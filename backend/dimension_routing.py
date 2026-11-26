from __future__ import annotations

from typing import Any, Dict

MODES_3D = {"endless_runner", "open_world_sandbox", "sky_shooter", "vehicle_pursuit", "arena_action"}
PUZZLE_KEYS = ("2048", "פאזל", "לוח", "מיזוג", "טטריס", "סודוקו", "אריחים", "puzzle", "merge", "tile", "grid", "tetris", "sudoku", "board")

MODES_2D: Dict[str, Dict[str, Any]] = {
    "2d_grid_puzzle": {
        "dimension": "2d", "mode": "2d_grid_puzzle", "goalType": "collect_and_escape", "targetCount": 2048,
        "gridSize": 4, "targetTile": 2048, "playerType": "runner_kid", "obstacleType": "street_barrier",
        "enemyType": "chaser_guard", "collectibleType": "gold_coin", "theme": "sunny_city", "signLabel": "2048",
        "parallaxTheme": "warm_editorial_grid", "objectiveText": "Merge Tiles to 2048",
        "canShoot": False, "enemiesShoot": False, "speed": 10.0, "jumpPower": 12.0, "gravity2d": 0.0,
        "palette": {"sky": "#F6F4EF", "ground": "#EFECE4", "track": "#E6E2D8", "primary": "#D96B27", "secondary": "#F59E0B", "accent": "#181715"},
    },
    "2d_platformer": {
        "dimension": "2d", "mode": "2d_platformer", "goalType": "collect_and_escape", "targetCount": 20,
        "playerType": "runner_kid", "obstacleType": "street_barrier", "enemyType": "chaser_guard", "collectibleType": "gold_coin",
        "theme": "sunny_city", "signLabel": "PLATFORM", "parallaxTheme": "urban_dusk", "objectiveText": "Collect 20 Coins & Reach Goal",
        "canShoot": True, "enemiesShoot": False, "speed": 11.0, "jumpPower": 14.5, "gravity2d": 28.0,
        "palette": {"sky": "#E2E8F0", "ground": "#334155", "track": "#475569", "primary": "#D96B27", "secondary": "#F59E0B", "accent": "#1E293B"},
    },
    "2d_topdown_action": {
        "dimension": "2d", "mode": "2d_topdown_action", "goalType": "survive_waves", "waveCount": 3,
        "playerType": "knight", "obstacleType": "lava_pillar", "enemyType": "skeleton", "collectibleType": "star",
        "theme": "desert_canyon", "signLabel": "SURVIVAL", "parallaxTheme": "topdown_grid", "objectiveText": "Survive 3 Enemy Waves",
        "canShoot": True, "enemiesShoot": True, "speed": 10.5, "jumpPower": 12.0, "gravity2d": 0.0,
        "palette": {"sky": "#1E293B", "ground": "#334155", "track": "#0F172A", "primary": "#10B981", "secondary": "#F59E0B", "accent": "#E11D48"},
    },
    "2d_endless_dash": {
        "dimension": "2d", "mode": "2d_endless_dash", "goalType": "distance_race", "targetDistance": 1200,
        "playerType": "runner_kid", "obstacleType": "street_barrier", "enemyType": "chaser_guard", "collectibleType": "gold_coin",
        "theme": "candy_sky", "signLabel": "DASH", "parallaxTheme": "warm_rhythm", "objectiveText": "Dash 1,200m on the Beat",
        "canShoot": False, "enemiesShoot": False, "speed": 14.5, "jumpPower": 15.0, "gravity2d": 32.0,
        "palette": {"sky": "#F6F4EF", "ground": "#181715", "track": "#2E2C28", "primary": "#D96B27", "secondary": "#F59E0B", "accent": "#334155"},
    },
    "2d_space_arcade": {
        "dimension": "2d", "mode": "2d_space_arcade", "goalType": "eliminate_targets", "targetCount": 18,
        "playerType": "starfighter", "obstacleType": "asteroid", "enemyType": "alien_ufo", "collectibleType": "energy_orb",
        "theme": "tokyo_festival", "signLabel": "INVADERS", "parallaxTheme": "retro_stars", "objectiveText": "Clear 18 Space Invaders",
        "canShoot": True, "enemiesShoot": True, "speed": 13.5, "jumpPower": 12.0, "gravity2d": 0.0,
        "palette": {"sky": "#0A0D14", "ground": "#111622", "track": "#182032", "primary": "#38BDF8", "secondary": "#F59E0B", "accent": "#EF4444"},
    },
}

MAP_3D_TO_2D = {"sky_shooter": "2d_space_arcade", "arena_action": "2d_topdown_action", "open_world_sandbox": "2d_topdown_action", "vehicle_pursuit": "2d_endless_dash", "endless_runner": "2d_endless_dash"}
MAP_2D_TO_3D = {"2d_space_arcade": "sky_shooter", "2d_topdown_action": "arena_action", "2d_endless_dash": "endless_runner", "2d_platformer": "endless_runner", "2d_grid_puzzle": "arena_action"}


def is_2d_puzzle_prompt(prompt: str = "") -> bool:
    p = (prompt or "").lower()
    return any(k in p for k in PUZZLE_KEYS)


def normalize_dimension(raw_dim: str | None, prompt: str = "") -> str:
    if is_2d_puzzle_prompt(prompt):
        return "2d"
    return "2d" if str(raw_dim or "3d").strip().lower() == "2d" else "3d"


def infer_2d_mode(prompt: str = "", mode_3d: str = "endless_runner") -> str:
    if is_2d_puzzle_prompt(prompt):
        return "2d_grid_puzzle"
    p = (prompt or "").lower()
    if any(k in p for k in ("space", "invader", "ufo", "galaga", "arcade", "חלל", "חללית")):
        return "2d_space_arcade"
    if any(k in p for k in ("zombie", "top-down", "topdown", "top down", "survival", "shooter", "זירה", "זומב")):
        return "2d_topdown_action"
    if any(k in p for k in ("rhythm", "dash", "beat", "subway", "runner", "geometry", "קצב", "ריצה")):
        return "2d_endless_dash"
    if any(k in p for k in ("platform", "mario", "cyber", "jump", "side", "פלטפורמה", "קפיצ")):
        return "2d_platformer"
    return MAP_3D_TO_2D.get(mode_3d, "2d_platformer")


def enforce_dimension_spec(raw: Dict[str, Any], dimension: str | None, prompt: str = "") -> Dict[str, Any]:
    """Guarantees spec.dimension and spec.mode strictly belong to either the 2D or 3D engine."""
    puzzle = is_2d_puzzle_prompt(prompt) or str(raw.get("mode") or "") == "2d_grid_puzzle"
    dim = "2d" if puzzle else normalize_dimension(dimension or raw.get("dimension"), prompt)
    spec = dict(raw or {})
    spec["dimension"] = dim
    cur_mode = str(spec.get("mode") or "")

    if dim == "2d":
        target = "2d_grid_puzzle" if puzzle else (cur_mode if cur_mode in MODES_2D else infer_2d_mode(prompt, cur_mode))
        base = MODES_2D[target]
        merged = {**base, **spec, "dimension": "2d", "mode": target, "archetype": target}
        if target == "2d_grid_puzzle":
            is_heb = any("\u0590" <= c <= "\u05ff" for c in (prompt or ""))
            merged["title"] = spec.get("title") if (spec.get("title") and "subway" not in str(spec.get("title")).lower()) else ("אתגר 2048" if is_heb else "2048 Tile Merge")
            merged["objectiveText"] = "מזג אריחים עד 2048" if is_heb else base["objectiveText"]
            merged["gridSize"] = max(3, min(6, int(spec.get("gridSize") or 4)))
            merged["targetTile"] = max(64, int(spec.get("targetTile") or 2048))
        elif not spec.get("goalType") or spec.get("mode") != target:
            merged["goalType"] = base["goalType"]
            merged["objectiveText"] = base["objectiveText"]
        merged["gravity2d"] = float(spec.get("gravity2d") if spec.get("gravity2d") is not None else base["gravity2d"])
        merged["parallaxTheme"] = str(spec.get("parallaxTheme") or base["parallaxTheme"])
        return merged

    if cur_mode not in MODES_3D:
        spec["mode"] = MAP_2D_TO_3D.get(cur_mode, "endless_runner")
        spec["archetype"] = spec["mode"]
    return spec
