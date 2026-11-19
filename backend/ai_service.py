import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict
from dotenv import load_dotenv
from fastapi import HTTPException
from google import genai
from google.genai import types
from pydantic import ValidationError
from prompts import FIX_CODE_PROMPT, LEVEL_DESIGN_PROMPT, REMIX_PROMPT
from schemas import FixCodeResponse, GameConfig

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

logger = logging.getLogger("spawn.ai")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip() or "gemini-3.5-flash"
FALLBACK_MODELS = [GEMINI_MODEL] + [m for m in ("gemini-3.5-flash", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.6-flash") if m != GEMINI_MODEL]

OUTDOOR_DETAIL_RULE = (
    "OUTDOOR MICRO-DETAIL MANDATE: Every outdoor scene MUST render `<InstancedFoliage count={800} biome=\"...\" />` "
    "(plus `MeshPhysicalMaterial` presets via `usePbrMaterial` / `createPhysicalMaterial` / `useStudioMaterial` such as "
    "`automotive_paint`, `architectural_glass`, `wet_asphalt`, `polished_marble`, `foliage_leaf`) and Fresnel-reflective "
    "`<DynamicWater type=\"ocean|river|lake|harbor\" />` whenever water or wet docks appear."
)

DIRECTOR_PACING_MANDATE = (
    "DIRECTOR PACING & JUICE MANDATE: Design with 3-act studio pacing: "
    "(1) Wire `triggerHitStop`, `spawnFloatingNumber`, `triggerCameraShake`, and `triggerUpgradeDraft` "
    "(opening the 3-card upgrade modal after clearing Wave 1 or reaching Checkpoint 2). "
    "(2) Include interactive environmental props (destructible crates/barrels triggering `ExplosionBurst`, "
    "collectible energy cores, and elevated vantage platforms/ramps). "
    "(3) Build to an escalating climax featuring an armored Boss `<SmartEntity behavior=\"boss\" />` "
    "with telegraphed AoE attacks guarding the final `<ObjectiveBeacon />` extraction/goal."
)


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
    return genai.Client(api_key=key, http_options=types.HttpOptions(timeout=95000))


async def _call_gemini_json(
    prompt_text: str,
    client: genai.Client,
    response_schema: Any = GameConfig,
    thinking_budget: int = 2048,
    max_output_tokens: int = 16384,
    temperature: float = 0.9,
) -> tuple[Dict[str, Any], str]:
    config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        response_mime_type="application/json",
        response_schema=response_schema,
        thinking_config=types.ThinkingConfig(thinking_budget=thinking_budget),
    )
    last_exc = None
    for model_name in FALLBACK_MODELS:
        try:
            res = await asyncio.wait_for(
                client.aio.models.generate_content(model=model_name, contents=prompt_text, config=config),
                timeout=95.0,
            )
            return json.loads((res.text or "").strip()), model_name
        except Exception as exc:
            last_exc = exc
            msg = str(exc)
            if isinstance(exc, asyncio.TimeoutError) or any(c in msg for c in ("503", "504", "429", "404", "UNAVAILABLE", "DEADLINE_EXCEEDED", "NOT_FOUND")):
                logger.warning("[Spawn.gg AI] Model %s failed (%s) — trying next model.", model_name, msg[:100])
                continue
            logger.error("[Spawn.gg AI] Gemini request/parse failed on %s: %s", model_name, exc)
            raise HTTPException(status_code=502, detail=f"Gemini API Error: {exc}") from exc
    logger.error("[Spawn.gg AI] All Gemini models failed: %s", last_exc)
    raise HTTPException(status_code=502, detail=f"Gemini API Error: {last_exc}") from last_exc


def _validate_live_config(raw: Dict[str, Any], model_name: str = GEMINI_MODEL) -> GameConfig:
    try:
        cfg = GameConfig.model_validate(raw)
        if not (cfg.code or "").strip():
            raise ValueError("Gemini output omitted executable JSX `code`.")
        cfg.generation_source = "ai_live"
        cfg.model_id = model_name
        cfg.generation_error = None
        return cfg
    except (ValidationError, ValueError) as exc:
        logger.error("[Spawn.gg AI] Schema/code validation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI output validation failed: {exc}") from exc


async def generate_game_config(prompt: str) -> GameConfig:
    client = _require_client()
    logger.info("[Spawn.gg AI] Live synthesis (%s) for prompt: %s", GEMINI_MODEL, prompt[:120])
    raw, model_name = await _call_gemini_json(
        f"{LEVEL_DESIGN_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\n{DIRECTOR_PACING_MANDATE}\n\nUser prompt: {prompt}",
        client,
        response_schema=GameConfig,
        thinking_budget=2048,
        max_output_tokens=16384,
        temperature=0.9,
    )
    return _validate_live_config(raw, model_name)


async def remix_game_config(
    existing_config: Dict[str, Any],
    instruction: str,
    generated_code: str | None = None,
) -> GameConfig:
    client = _require_client()
    base_cfg = dict(existing_config)
    if generated_code:
        base_cfg["code"] = generated_code
    prompt_text = (
        f"{REMIX_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\n{DIRECTOR_PACING_MANDATE}\n\n"
        f"Existing game_config & code:\n{json.dumps(base_cfg)}\n\nUser instruction: {instruction}"
    )
    raw, model_name = await _call_gemini_json(prompt_text, client, response_schema=GameConfig, thinking_budget=2048)
    return _validate_live_config(raw, model_name)


async def fix_generated_code(code: str, error: str, prompt: str = "") -> FixCodeResponse:
    client = _require_client()
    prompt_text = f"{FIX_CODE_PROMPT}\n\nOriginal Prompt: {prompt}\nRuntime/Compile Error:\n{error}\n\nBroken Code:\n{code}"
    raw, _ = await _call_gemini_json(prompt_text, client, response_schema=FixCodeResponse, thinking_budget=1024)
    return FixCodeResponse.model_validate(raw)
