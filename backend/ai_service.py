from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Awaitable, Callable, Dict, Optional
from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types
from ai_helpers import parse_json_resilient
from code_validator import validate_game_code
from game_architect import build_fallback_cartoon_world, design_world_blueprint, refine_world_fallback, validate_world_dict
from genre_routing import apply_refine_keywords
from prompts import FIX_CODE_PROMPT, REFINE_PROMPT
from schemas import FixCodeResponse, GameConfig
from spatial_validator import world_json_to_game_config
from world_schemas import WorldRefineResponse

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)
logger = logging.getLogger("spawn.ai")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
_RAW_MODELS = [GEMINI_MODEL, "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.5-flash"]
FALLBACK_MODELS = [m for i, m in enumerate(_RAW_MODELS) if m and m not in _RAW_MODELS[:i]]
StageCallback = Optional[Callable[[str, str, int], Awaitable[None]]]

WORLD_REFINE_PROMPT = """Patch the 3D Cartoon World JSON Blueprint for live Studio Co-Pilot chat tweaks (~2s). Understand English & Hebrew naturally:
- Support switching `mode` and `goalType` live when requested:
  * "הפוך את זה לקרב זירה" / "arena fight" / "zombie waves" -> `mode="arena_action"`, `goalType="survive_waves"`, `worldLayout="open_biome"`, `playerRig="third_person_action"`, `canShoot=true`, `enemiesShoot=true`
  * "תעביר לחלל" / "space shooter" / "flying dragon" -> `mode="sky_shooter"`, `goalType="eliminate_targets"`, `worldLayout="open_biome"`, `playerRig="flight_combat"`, `playerType="starfighter"`, `obstacleType="asteroid"`, `enemyType="alien_ufo"`, `canShoot=true`
  * "מרדף משטרתי" / "car race" -> `mode="vehicle_pursuit"`, `goalType="distance_race"`, `worldLayout="city_grid"`, `playerRig="arcade_car"`, `playerType="sports_car"`, `obstacleType="police_car"`, `enemyType="rival_car"`
  * "סאבוויי" / "subway runner" -> `mode="endless_runner"`, `goalType="collect_and_escape"`, `worldLayout="three_lane_track"`, `playerRig="three_lane_runner"`
  * "עולם פתוח" / "ג'י טי איי" / "GTA" / "open world" / "heist" -> `mode="open_world_sandbox"`, `goalType="open_world_missions"`, `worldLayout="city_grid"`, `playerRig="third_person_action"`, `canShoot=true`, `vehiclesEnabled=true`, `wantedSystem=true`
  * "הוסף רכבות מהירות" / "add fast trains" -> speed=18, moving_train obstacles; "חוף טרופי" / "tropical beach" -> `theme="tropical_beach"`
- Valid `mode`: endless_runner | sky_shooter | vehicle_pursuit | arena_action | open_world_sandbox
- Valid `goalType`: eliminate_targets | survive_waves | collect_and_escape | distance_race | open_world_missions
- Valid `theme`: sunny_city | tropical_beach | candy_sky | tokyo_festival | desert_canyon | wild_west
- Return ONLY JSON: {"world_json": { ...full updated blueprint... }, "notes": "Short confirmation in user's language or English"}"""


def _require_client() -> genai.Client:
    load_dotenv(dotenv_path=ENV_PATH, override=False)
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        load_dotenv(dotenv_path=ENV_PATH, override=True)
        key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is missing or empty in backend/.env.")
    return genai.Client(api_key=key, http_options=types.HttpOptions(timeout=25000))


async def _call_fast_json(prompt_text: str, client: genai.Client, max_tokens: int = 4096, temperature: float = 0.65) -> tuple[Dict[str, Any], str]:
    last_exc: Exception | None = None
    for model_name in FALLBACK_MODELS:
        cfg = types.GenerateContentConfig(temperature=temperature, max_output_tokens=max_tokens, response_mime_type="application/json")
        try:
            res = await asyncio.wait_for(client.aio.models.generate_content(model=model_name, contents=prompt_text, config=cfg), timeout=16.0)
            return parse_json_resilient(res.text or ""), model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            if isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "UNAVAILABLE", "DEADLINE_EXCEEDED", "NOT_FOUND")):
                logger.warning("[Fast AI] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise HTTPException(status_code=502, detail=f"Gemini API Error: {exc}") from exc
    raise HTTPException(status_code=502, detail=f"Gemini API Error: {last_exc}") from last_exc


async def generate_game_config(prompt: str, on_stage: StageCallback = None) -> GameConfig:
    if on_stage:
        await on_stage("architect", "1/3 Designing 3D world blueprint...", 1)
    try:
        client = _require_client()
        world, model_name = await design_world_blueprint(prompt, client)
    except HTTPException:
        world, model_name = build_fallback_cartoon_world(prompt), "fallback-cartoon-architect"
    if on_stage:
        await on_stage("validation", "2/3 Enforcing spatial road & collider rules...", 2)
    cfg = world_json_to_game_config(world, model_name)
    if on_stage:
        await on_stage("compile", "3/3 Launching world...", 3)
    return cfg


async def refine_world_json(
    current_world_json: Dict[str, Any] | None,
    refinement_prompt: str,
    game_title: str = "Untitled 3D World",
    current_code: str | None = None,
) -> WorldRefineResponse:
    if current_world_json:
        try:
            client = _require_client()
            prompt_text = f"{WORLD_REFINE_PROMPT}\n\nTitle: {game_title}\nCurrent World JSON:\n{json.dumps(current_world_json)}\n\nRefinement: {refinement_prompt}"
            raw, _ = await _call_fast_json(prompt_text, client, max_tokens=2048, temperature=0.55)
            patch = raw.get("world_json") if isinstance(raw.get("world_json"), dict) else raw
            base_patched = apply_refine_keywords({**current_world_json, **patch}, instruction=refinement_prompt)
            updated = validate_world_dict(base_patched, prompt=refinement_prompt or game_title)
            return WorldRefineResponse(world_json=updated, title=updated.title, notes=str(raw.get("notes") or "World refined!"))
        except Exception as exc:
            logger.warning("[Refine Fallback] %s", str(exc)[:90])
            updated = refine_world_fallback(current_world_json, refinement_prompt)
            return WorldRefineResponse(world_json=updated, title=updated.title, notes="Updated live GameSpec!")

    client = _require_client()

    if current_code:
        raw, _ = await _call_fast_json(f"{REFINE_PROMPT}\n\nTitle: {game_title}\nCode:\n{current_code}\n\nRequest: {refinement_prompt}", client, max_tokens=8192)
        updated_code = (raw.get("code") or "").strip()
        if not updated_code:
            raise HTTPException(status_code=502, detail="Refinement returned empty payload.")
        return WorldRefineResponse(code=updated_code, title=game_title, notes=str(raw.get("notes") or "Code refined."))
    raise HTTPException(status_code=422, detail="Provide current_world_json or current_code for refinement.")


async def remix_game_config(existing_config: Dict[str, Any], instruction: str, generated_code: str | None = None) -> GameConfig:
    client = _require_client()
    base_world = existing_config.get("world_json") or {"title": existing_config.get("title", "Spawn World"), "worldLayout": "open_biome", "playerRig": "third_person_action"}
    prompt_text = f"{WORLD_REFINE_PROMPT}\n\nRemix Instruction: {instruction}\nBase World JSON:\n{json.dumps(base_world)}"
    raw, model_name = await _call_fast_json(prompt_text, client, max_tokens=4096, temperature=0.7)
    candidate = raw.get("world_json") if isinstance(raw.get("world_json"), dict) else raw
    updated = validate_world_dict(candidate, prompt=instruction)
    return world_json_to_game_config(updated, model_name)


async def fix_generated_code(code: str, error: str, prompt: str = "") -> FixCodeResponse:
    client = _require_client()
    raw, _ = await _call_fast_json(f"{FIX_CODE_PROMPT}\n\nPrompt: {prompt}\nError:\n{error}\n\nCode:\n{code}", client, max_tokens=8192, temperature=0.35)
    res = FixCodeResponse.model_validate(raw)
    report = validate_game_code(res.code)
    if not report["passed"]:
        logger.warning("[Fix Code] Residual validator notes: %s", report["errors"])
    return res
