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
from game_architect import design_world_blueprint, validate_world_dict
from prompts import FIX_CODE_PROMPT, REFINE_PROMPT
from schemas import FixCodeResponse, GameConfig
from spatial_validator import world_json_to_game_config
from world_schemas import WorldRefineResponse

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)
logger = logging.getLogger("spawn.ai")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip() or "gemini-3.1-flash-lite"
_RAW_MODELS = [GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.0-flash"]
FALLBACK_MODELS = [m for i, m in enumerate(_RAW_MODELS) if m and m not in _RAW_MODELS[:i]]
StageCallback = Optional[Callable[[str, str, int], Awaitable[None]]]

WORLD_REFINE_PROMPT = """Patch the 3D Cartoon World JSON Blueprint for live Studio Co-Pilot chat tweaks (~2s). Understand English & Hebrew naturally:
- Examples:
  * "הוסף רכבות מהירות" / "add fast trains" -> insert moving `modelId="subway_train"`, `kind="obstacle"`, `behavior="moving_train"`, `speed=18` on clear lane slices
  * "הפוך את העולם לחוף טרופי" / "tropical beach" -> set `theme="tropical_beach"`, add `tree` palms & sunny coins
  * "תן לי ג'טפאק" / "give me a jetpack" -> add `modelId="powerup_jetpack"`, `kind="powerup"` directly ahead of player + high arc of `gold_coin`
- Valid `theme`: sunny_city | tropical_beach | candy_sky | tokyo_festival | desert_canyon | wild_west
- Valid `modelId`: subway_train, train_ramp, street_barrier, high_barrier, cartoon_car, police_cruiser, city_building, gold_coin, powerup_magnet, powerup_jetpack, cartoon_character, chaser_guard, tree, rock, spaceship
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
        cfg = types.GenerateContentConfig(temperature=temperature, max_output_tokens=max_tokens, response_mime_type="application/json", thinking_config=types.ThinkingConfig(thinking_budget=0))
        try:
            res = await asyncio.wait_for(client.aio.models.generate_content(model=model_name, contents=prompt_text, config=cfg), timeout=12.0)
            return parse_json_resilient(res.text or ""), model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            if isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "UNAVAILABLE", "DEADLINE_EXCEEDED", "NOT_FOUND")):
                logger.warning("[Fast AI] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise HTTPException(status_code=502, detail=f"Gemini API Error: {exc}") from exc
    raise HTTPException(status_code=502, detail=f"Gemini API Error: {last_exc}") from last_exc


async def generate_game_config(prompt: str, on_stage: StageCallback = None) -> GameConfig:
    client = _require_client()
    if on_stage:
        await on_stage("architect", "1/3 Designing 3D world blueprint...", 1)
    world, model_name = await design_world_blueprint(prompt, client)
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
    client = _require_client()
    if current_world_json:
        prompt_text = f"{WORLD_REFINE_PROMPT}\n\nTitle: {game_title}\nCurrent World JSON:\n{json.dumps(current_world_json)}\n\nRefinement: {refinement_prompt}"
        raw, _ = await _call_fast_json(prompt_text, client, max_tokens=4096, temperature=0.55)
        candidate = raw.get("world_json") if isinstance(raw.get("world_json"), dict) else raw
        updated = validate_world_dict(candidate, prompt=game_title)
        return WorldRefineResponse(world_json=updated, title=updated.title, notes=str(raw.get("notes") or "World JSON refined."))

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
