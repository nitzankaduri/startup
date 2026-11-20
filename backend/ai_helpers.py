import json
import logging
from typing import Any, Dict
from json_repair import loads as repair_json_loads

logger = logging.getLogger("spawn.ai")
VALID_MODES = {"platformer", "arena_shooter", "time_trial_racer", "survival_waves", "arcade_runner"}
VALID_CAMS = {"follow", "first_person", "isometric", "orbit", "side_scroller"}


def parse_json_resilient(raw_text: str) -> Dict[str, Any]:
    text = (raw_text or "").strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("[Spawn.gg AI] Standard JSON parse failed — applying json_repair.")
        data = repair_json_loads(text)
    if not isinstance(data, dict):
        raise ValueError("Gemini output did not decode to a JSON object.")
    return data


def _clamp(val: Any, lo: float, hi: float, default: float) -> float:
    try:
        return max(lo, min(hi, float(val)))
    except (TypeError, ValueError):
        return default


def sanitize_raw_config(raw: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(raw)
    if out.get("game_mode") not in VALID_MODES:
        out["game_mode"] = "platformer"
    if out.get("camera_mode") not in VALID_CAMS:
        out["camera_mode"] = "follow"
    rules = out.get("rules") if isinstance(out.get("rules"), dict) else {}
    out["rules"] = {
        "time_limit_sec": int(_clamp(rules.get("time_limit_sec"), 15, 600, 120)),
        "target_kills": int(_clamp(rules.get("target_kills"), 1, 100, 8)),
        "waves_count": int(_clamp(rules.get("waves_count"), 1, 20, 3)),
        "player_hp": int(_clamp(rules.get("player_hp"), 20, 500, 100)),
    }
    pl = out.get("player") if isinstance(out.get("player"), dict) else {}
    out["player"] = {
        "speed": _clamp(pl.get("speed"), 2.0, 20.0, 9.5),
        "jump_force": _clamp(pl.get("jump_force"), 3.0, 25.0, 10.5),
        "color": str(pl.get("color") or "#D6D1C8"),
    }
    env = out.get("environment") if isinstance(out.get("environment"), dict) else {}
    out["environment"] = {
        "sky_color": str(env.get("sky_color") or "#F2DEC8"),
        "fog_color": str(env.get("fog_color") or "#F2DEC8"),
        "ambient_intensity": _clamp(env.get("ambient_intensity"), 0.1, 2.0, 0.9),
        "ground_color": str(env.get("ground_color") or "#383532"),
    }
    out["entities"] = []
    goal = out.get("goal")
    if not isinstance(goal, dict) or not isinstance(goal.get("position"), list) or len(goal["position"]) != 3:
        out["goal"] = {"position": [0.0, 2.5, -24.0]}
    return out
