import json
import logging
import os
from pathlib import Path
from typing import Any, Dict
import httpx
from dotenv import load_dotenv
from fastapi import HTTPException
from pydantic import ValidationError
from prompts import FIX_CODE_PROMPT, LEVEL_DESIGN_PROMPT, REMIX_PROMPT
from schemas import FixCodeResponse, GameConfig

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=False)

logger = logging.getLogger("spawn.ai")
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO)

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

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


def _require_api_key() -> str:
    if not os.getenv("GEMINI_API_KEY", "").strip():
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key or key == "your_gemini_api_key_here":
        msg = "GEMINI_API_KEY is missing or empty in backend/.env. Set a valid Gemini API key for live 3D generation."
        logger.error("[Spawn.gg AI] %s", msg)
        raise HTTPException(status_code=503, detail=msg)
    return key


def _extract_json_text(data: Dict[str, Any]) -> str:
    parts = data["candidates"][0]["content"]["parts"]
    for part in reversed(parts):
        if "text" in part and not part.get("thought"):
            return part["text"]
    return parts[-1]["text"]


async def _call_gemini_json(
    prompt_text: str,
    api_key: str,
    thinking_budget: int = 6144,
    max_output_tokens: int = 16384,
    temperature: float = 0.9,
) -> Dict[str, Any]:
    headers = {"Content-Type": "application/json", "x-goog-api-key": api_key}
    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_output_tokens,
            "thinkingConfig": {"thinkingBudget": thinking_budget},
            "responseMimeType": "application/json",
        },
    }
    try:
        async with httpx.AsyncClient(timeout=75.0) as client:
            res = await client.post(GEMINI_ENDPOINT, json=payload, headers=headers)
            if res.status_code >= 400:
                error_text = res.text.strip()
                logger.error("[Spawn.gg AI] Gemini HTTP %s error: %s", res.status_code, error_text)
                raise HTTPException(status_code=502, detail=f"Gemini API Error ({res.status_code}): {error_text}")
            raw_text = _extract_json_text(res.json())
            return json.loads(raw_text)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[Spawn.gg AI] Gemini request/parse failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Gemini API Error: {exc}") from exc


def _validate_live_config(raw: Dict[str, Any]) -> GameConfig:
    try:
        cfg = GameConfig.model_validate(raw)
        if not (cfg.code or "").strip():
            raise ValueError("Gemini output omitted executable JSX `code`.")
        cfg.generation_source = "ai_live"
        cfg.model_id = GEMINI_MODEL
        cfg.generation_error = None
        return cfg
    except (ValidationError, ValueError) as exc:
        logger.error("[Spawn.gg AI] Schema/code validation failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"AI output validation failed: {exc}") from exc


async def generate_game_config(prompt: str) -> GameConfig:
    api_key = _require_api_key()
    logger.info("[Spawn.gg AI] Live synthesis (%s) for prompt: %s", GEMINI_MODEL, prompt[:120])
    raw = await _call_gemini_json(
        f"{LEVEL_DESIGN_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\n{DIRECTOR_PACING_MANDATE}\n\nUser prompt: {prompt}",
        api_key,
        thinking_budget=6144,
        max_output_tokens=16384,
        temperature=0.9,
    )
    return _validate_live_config(raw)


async def remix_game_config(
    existing_config: Dict[str, Any],
    instruction: str,
    generated_code: str | None = None,
) -> GameConfig:
    api_key = _require_api_key()
    base_cfg = dict(existing_config)
    if generated_code:
        base_cfg["code"] = generated_code
    prompt_text = (
        f"{REMIX_PROMPT}\n\n{OUTDOOR_DETAIL_RULE}\n\n{DIRECTOR_PACING_MANDATE}\n\n"
        f"Existing game_config & code:\n{json.dumps(base_cfg)}\n\nUser instruction: {instruction}"
    )
    raw = await _call_gemini_json(prompt_text, api_key, thinking_budget=6144, max_output_tokens=16384, temperature=0.9)
    return _validate_live_config(raw)


async def fix_generated_code(code: str, error: str, prompt: str = "") -> FixCodeResponse:
    api_key = _require_api_key()
    prompt_text = f"{FIX_CODE_PROMPT}\n\nOriginal Prompt: {prompt}\nRuntime/Compile Error:\n{error}\n\nBroken Code:\n{code}"
    raw = await _call_gemini_json(prompt_text, api_key, thinking_budget=2048)
    return FixCodeResponse.model_validate(raw)
