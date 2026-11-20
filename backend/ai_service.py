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
from pydantic import ValidationError
from ai_helpers import parse_json_resilient, sanitize_raw_config
from blueprint_schemas import GameBlueprint, RefineResponse
from code_validator import validate_game_code
from game_architect import design_game_blueprint
from prompts import FIX_CODE_PROMPT, LEVEL_DESIGN_PROMPT, REFINE_PROMPT, REMIX_PROMPT
from schemas import FixCodeResponse, GameConfig

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)
logger = logging.getLogger("spawn.ai")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip() or "gemini-3.5-flash-lite"
_RAW_MODELS = [GEMINI_MODEL, "gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash"]
FALLBACK_MODELS = [m for i, m in enumerate(_RAW_MODELS) if m and m not in _RAW_MODELS[:i]]
OUTDOOR_DETAIL_RULE = (
    "SPATIAL & GAMEPLAY MANDATE: Use `<CityGrid />` or `<RaceTrack />` + `<BiomeStage flatGround />` for urban/driving/racing (aligning checkpoints/pickups/patrols strictly along road lines [-100,-50,0,50,100]), "
    "`getTerrainHeight(x,z)` for terrain props, `<ObjectiveBeacon />` directional waypoint, steering AI opponents, and `useMissionState` `onVictory`/`onDefeat` triggers."
)
StageCallback = Optional[Callable[[str, str, int], Awaitable[None]]]


def _require_client() -> genai.Client:
    load_dotenv(dotenv_path=ENV_PATH, override=False)
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        load_dotenv(dotenv_path=ENV_PATH, override=True)
        key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        msg = "GEMINI_API_KEY is missing or empty in backend/.env. Set a valid Gemini API key for live 3D generation."
        logger.error("[Spawn.gg AI] %s", msg)
        raise HTTPException(status_code=503, detail=msg)
    return genai.Client(api_key=key, http_options=types.HttpOptions(timeout=55000))


async def _call_gemini_json(
    prompt_text: str, client: genai.Client, thinking_budget: int = 16384, max_output_tokens: int = 24576, temperature: float = 0.85,
) -> tuple[Dict[str, Any], str]:
    last_exc: Exception | None = None
    for model_name in FALLBACK_MODELS:
        cfg_kwargs: Dict[str, Any] = {"temperature": temperature, "max_output_tokens": max_output_tokens, "response_mime_type": "application/json"}
        if thinking_budget > 0:
            cfg_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=thinking_budget)
        try:
            res = await asyncio.wait_for(
                client.aio.models.generate_content(model=model_name, contents=prompt_text, config=types.GenerateContentConfig(**cfg_kwargs)), timeout=48.0,
            )
            return parse_json_resilient(res.text or ""), model_name
        except Exception as exc:
            last_exc, msg = exc, str(exc)
            retryable = isinstance(exc, (asyncio.TimeoutError, json.JSONDecodeError, ValueError)) or any(c in msg for c in ("400", "404", "429", "503", "504", "UNAVAILABLE", "DEADLINE_EXCEEDED", "NOT_FOUND"))
            if retryable:
                logger.warning("[Stage 2 Synthesis] %s failed (%s) — failover.", model_name, msg[:95])
                continue
            raise HTTPException(status_code=502, detail=f"Gemini API Error: {exc}") from exc
    raise HTTPException(status_code=502, detail=f"Gemini API Error: {last_exc}") from last_exc


async def _repair_if_invalid(code: str, context: str, client: genai.Client) -> tuple[str, bool, list[str]]:
    report = validate_game_code(code)
    if report["passed"]:
        return code, True, []
    errs = "; ".join(report["errors"])
    logger.warning("[Pre-Flight Validator] Issues found (%s) — running fast self-repair.", errs)
    try:
        repair_prompt = f"{FIX_CODE_PROMPT}\n\nContext: {context}\nValidator Failures:\n- " + "\n- ".join(report["errors"]) + f"\n\nBroken Code:\n{code}"
        repaired_raw, _ = await _call_gemini_json(repair_prompt, client, thinking_budget=2048, max_output_tokens=16384, temperature=0.3)
        repaired_code = (repaired_raw.get("code") or "").strip()
        if repaired_code:
            recheck = validate_game_code(repaired_code)
            return repaired_code, bool(recheck["passed"]), list(recheck["errors"])
    except Exception as exc:
        logger.warning("[Pre-Flight Validator] Auto-repair failed: %s", str(exc)[:100])
    return code, False, list(report["errors"])


def _validate_live_config(raw: Dict[str, Any], model_name: str, blueprint: GameBlueprint | None = None) -> GameConfig:
    try:
        cfg = GameConfig.model_validate(sanitize_raw_config(raw))
        if not (cfg.code or "").strip():
            raise ValueError("Gemini output omitted executable JSX `code`.")
        cfg.generation_source, cfg.model_id, cfg.generation_error = "ai_live", model_name, None
        if blueprint is not None:
            cfg.blueprint = blueprint
        return cfg
    except (ValidationError, ValueError) as exc:
        logger.error("[Spawn.gg AI] Schema/code validation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI output validation failed: {exc}") from exc


async def generate_game_config(prompt: str, on_stage: StageCallback = None) -> GameConfig:
    client = _require_client()
    logger.info("[Two-Stage AI] Stage 1 Architect starting for: %s", prompt[:120])
    if on_stage:
        await on_stage("architect", "1/3 Designing game rules & mechanics...", 1)
    blueprint, _ = await design_game_blueprint(prompt, client)
    if on_stage:
        await on_stage("synthesis", "2/3 Sculpting 3D world & physics...", 2)
    prompt_text = f"{LEVEL_DESIGN_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\nSTAGE 1 BLUEPRINT:\n{blueprint.model_dump_json(indent=2)}\n\nUser Prompt: {prompt}"
    raw, model_name = await _call_gemini_json(prompt_text, client, thinking_budget=16384, max_output_tokens=24576, temperature=0.85)
    if on_stage:
        await on_stage("compile", "3/3 Validating & launching...", 3)
    cfg = _validate_live_config(raw, model_name, blueprint=blueprint)
    cfg.code, _, _ = await _repair_if_invalid(cfg.code or "", prompt, client)
    return cfg


async def remix_game_config(existing_config: Dict[str, Any], instruction: str, generated_code: str | None = None) -> GameConfig:
    client = _require_client()
    base_cfg = {**existing_config, **({"code": generated_code} if generated_code else {})}
    raw, model_name = await _call_gemini_json(
        f"{REMIX_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\nExisting:\n{json.dumps(base_cfg)}\n\nInstruction: {instruction}",
        client, thinking_budget=8192, max_output_tokens=24576, temperature=0.8,
    )
    cfg = _validate_live_config(raw, model_name)
    cfg.code, _, _ = await _repair_if_invalid(cfg.code or "", instruction, client)
    return cfg


async def refine_game_code(current_code: str, refinement_prompt: str, game_title: str = "Untitled 3D World") -> RefineResponse:
    client = _require_client()
    prompt_text = f"{REFINE_PROMPT}\n\nGame Title: {game_title}\nExisting Code:\n{current_code}\n\nRefinement Request: {refinement_prompt}"
    raw, _ = await _call_gemini_json(prompt_text, client, thinking_budget=8192, max_output_tokens=24576, temperature=0.75)
    updated_code = (raw.get("code") or "").strip()
    if not updated_code:
        raise HTTPException(status_code=502, detail="Refinement returned empty code.")
    final_code, passed, warnings = await _repair_if_invalid(updated_code, f"{game_title}: {refinement_prompt}", client)
    return RefineResponse(code=final_code, title=game_title, notes=str(raw.get("notes") or "Upgraded world mechanics."), validation_passed=passed, validation_warnings=warnings)


async def fix_generated_code(code: str, error: str, prompt: str = "") -> FixCodeResponse:
    client = _require_client()
    raw, _ = await _call_gemini_json(f"{FIX_CODE_PROMPT}\n\nOriginal Prompt: {prompt}\nRuntime Error:\n{error}\n\nBroken Code:\n{code}", client, thinking_budget=2048, max_output_tokens=16384, temperature=0.4)
    res = FixCodeResponse.model_validate(raw)
    res.code, _, _ = await _repair_if_invalid(res.code, prompt or "fix", client)
    return res
