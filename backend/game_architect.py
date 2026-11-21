import asyncio
import json
import logging
import os
from typing import Any, Dict, Tuple
from google import genai
from google.genai import types
from ai_helpers import parse_json_resilient
from spatial_validator import sanitize_world_json
from world_schemas import WorldBlueprintJSON

logger = logging.getLogger("spawn.architect")

WORLD_ARCHITECT_PROMPT = """You are the Lead Stylized Cartoon World Architect at Spawn.gg.
ALL generated worlds MUST look and play like a polished, vibrant Subway Surfers 3-lane endless/stage runner!
Output ONLY a valid Stylized Cartoon World JSON Blueprint (<5s generation, ZERO JSX/JS code) with 32-48 rich entities.

PALETTES & LAYOUT RULES:
1. `theme`: ONLY "sunny_city" | "tropical_beach" | "candy_sky" | "tokyo_festival" | "desert_canyon" | "wild_west"
2. `signLabel`: Crisp 1-word overhead track banner matching prompt (e.g. "SALOON", "TOKYO", "ALOHA", "CANDY", "METRO", "SURF").
3. `lightingPreset`: ONLY "sunset" | "dawn" | "city" | "night" (prefer "sunset" or "dawn")
4. `worldLayout`: ALWAYS "three_lane_track" + `playerRig`: "three_lane_runner" (unless explicitly requested "car racing" -> "city_grid"/"arcade_car" or "dogfight" -> "open_biome"/"flight_combat")
5. `.glb` / Cartoon Prefab `modelId` MUST ONLY come from:
   ["subway_train", "train_ramp", "street_barrier", "high_barrier", "cartoon_car", "police_cruiser", "city_building", "gold_coin", "powerup_magnet", "powerup_jetpack", "cartoon_character", "chaser_guard", "tree", "rock", "spaceship"]
6. SUBWAY SURFERS LEVEL DESIGN:
   - Place `train_ramp` wooden crate ramps cleanly right in front (`z+6`) of parked `subway_train`s with elevated `gold_coin`s (`y=3.5`) running across the train rooftops!
   - Mix jumpable `street_barrier` hurdles, slide-under `high_barrier` arches, oncoming `subway_train`s (`behavior="moving_train"`), parabolic arcs of `gold_coin`s (y jumping 0.9->3.0->0.9), `powerup_jetpack` & `powerup_magnet` drops, and flanking `city_building`s (`X=±12.5`)! Never block all 3 lanes at the same Z!

Output strict JSON:
{
  "title": "World Title",
  "theme": "wild_west",
  "signLabel": "SALOON",
  "lightingPreset": "sunset",
  "weather": "clear",
  "worldLayout": "three_lane_track",
  "playerRig": "three_lane_runner",
  "playerModelId": "cartoon_character",
  "spawn": {"position": [0, 1.5, 0], "yaw": 0},
  "entities": [{"id": "e1", "kind": "collectible", "modelId": "gold_coin", "behavior": "spin", "position": [0, 1.0, -18], "rotation": [0, 0, 0], "scale": 1, "speed": 6, "hp": 40, "points": 25, "color": "#FBBF24"}],
  "rules": {"winCondition": "target_score", "targetScore": 800, "timeLimit": 90}
}"""


def _fast_models() -> list[str]:
    primary = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip() or "gemini-3.1-flash-lite"
    chain = [primary, "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.0-flash"]
    return [m for i, m in enumerate(chain) if m and m not in chain[:i]]


def validate_world_dict(raw: Dict[str, Any], prompt: str = "") -> WorldBlueprintJSON:
    return WorldBlueprintJSON.model_validate(sanitize_world_json(raw, prompt=prompt))


async def design_world_blueprint(prompt: str, client: genai.Client) -> Tuple[WorldBlueprintJSON, str]:
    """Fast single-pass Stylized Cartoon World JSON Blueprint synthesis (<5s)."""
    prompt_text = f"{WORLD_ARCHITECT_PROMPT}\n\nUser Prompt: {prompt}"
    last_exc: Exception | None = None

    for model_name in _fast_models():
        config = types.GenerateContentConfig(
            temperature=0.72,
            max_output_tokens=4096,
            response_mime_type="application/json",
            thinking_config=types.ThinkingConfig(thinking_budget=0),
        )
        try:
            res = await asyncio.wait_for(
                client.aio.models.generate_content(model=model_name, contents=prompt_text, config=config),
                timeout=12.0,
            )
            raw = parse_json_resilient(res.text or "")
            world = validate_world_dict(raw, prompt=prompt)
            logger.info("[Cartoon Architect] Built '%s' (%s/%s, %d entities) via %s", world.title, world.theme, world.worldLayout, len(world.entities), model_name)
            return world, model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            if isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "NOT_FOUND", "UNAVAILABLE", "DEADLINE_EXCEEDED")):
                logger.warning("[Cartoon Architect] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise

    raise RuntimeError(f"Cartoon World synthesis failed: {last_exc}")
