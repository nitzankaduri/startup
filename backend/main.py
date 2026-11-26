import os
import uuid
from datetime import datetime, timezone
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from ai_service import fix_generated_code, generate_game_config, refine_world_json, remix_game_config
from database import (
    add_game_score, check_db_health, get_game_by_id, increment_plays_count,
    list_games, save_game, update_game_code, update_game_thumbnail, update_game_world_json,
)
from schemas import (
    FixCodeRequest, FixCodeResponse, GameRecord, GenerateRequest,
    GenerateResponse, RemixRequest, ScoreSubmitRequest, ThumbnailRequest,
)
from stream_routes import stream_router
from world_schemas import WorldRefineRequest, WorldRefineResponse

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
app = FastAPI(title="Spawn.gg API", version="0.2.0")
app.include_router(stream_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    db_ok = await check_db_health()
    has_ai_key = bool(os.getenv("GEMINI_API_KEY", "").strip())
    return {"status": "ok", "database": "connected" if db_ok else "memory_fallback", "ai_key_configured": has_ai_key}


@app.post("/api/generate", response_model=GenerateResponse)
@app.post("/api/games/generate", response_model=GenerateResponse)
async def generate_game(payload: GenerateRequest):
    game_config = await generate_game_config(payload.prompt, dimension=payload.dimension or "3d")
    game_id = str(uuid.uuid4())[:8]
    record = {
        "id": game_id,
        "title": game_config.title,
        "prompt": payload.prompt,
        "theme": game_config.world_json.theme if game_config.world_json else "custom",
        "game_config": game_config.model_dump(),
        "thumbnail": None,
        "scores": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_game(record)
    return GenerateResponse(id=game_id, title=game_config.title, game_config=game_config)


@app.post("/api/remix", response_model=GenerateResponse)
async def remix_game(payload: RemixRequest):
    existing = await get_game_by_id(payload.game_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Base game not found")
    updated_config = await remix_game_config(existing["game_config"], payload.instruction, payload.generated_code)
    new_id = str(uuid.uuid4())[:8]
    record = {
        "id": new_id,
        "title": updated_config.title,
        "prompt": f"{existing['prompt']} | Remix: {payload.instruction}",
        "theme": updated_config.world_json.theme if updated_config.world_json else existing.get("theme", "custom"),
        "game_config": updated_config.model_dump(),
        "thumbnail": None,
        "scores": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await save_game(record)
    return GenerateResponse(id=new_id, title=updated_config.title, game_config=updated_config)


@app.post("/api/games/refine", response_model=WorldRefineResponse)
async def refine_world(payload: WorldRefineRequest):
    spec = payload.currentSpec or payload.current_world_json
    prompt_txt = (payload.instruction or payload.refinement_prompt or "").strip()
    if not prompt_txt:
        raise HTTPException(status_code=422, detail="Provide instruction or refinement_prompt.")
    result = await refine_world_json(spec, prompt_txt, payload.game_title, payload.current_code)
    if payload.game_id:
        if result.world_json is not None:
            await update_game_world_json(payload.game_id, result.world_json.model_dump())
        elif result.code:
            await update_game_code(payload.game_id, result.code)
    return result


@app.post("/api/fix-code", response_model=FixCodeResponse)
async def fix_code(payload: FixCodeRequest):
    return await fix_generated_code(payload.code, payload.error, payload.prompt)


@app.get("/api/games", response_model=List[GameRecord])
async def get_games():
    return await list_games(limit=20)


@app.get("/api/games/{game_id}", response_model=GameRecord)
async def get_game(game_id: str):
    game = await get_game_by_id(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@app.post("/api/games/{game_id}/thumbnail")
async def save_thumbnail(game_id: str, payload: ThumbnailRequest):
    if not await update_game_thumbnail(game_id, payload.thumbnail):
        raise HTTPException(status_code=404, detail="Game not found")
    return {"status": "ok"}


@app.post("/api/games/{game_id}/play")
async def record_game_play(game_id: str):
    plays_count = await increment_plays_count(game_id)
    if plays_count is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"plays_count": plays_count}


@app.post("/api/games/{game_id}/score")
async def submit_score(game_id: str, payload: ScoreSubmitRequest):
    secs = payload.time_seconds if payload.time_seconds is not None else round((payload.time_ms or 0) / 1000, 2)
    ms = payload.time_ms if payload.time_ms is not None else int(secs * 1000)
    entry = {
        "player_name": payload.player_name.strip(),
        "score": payload.score,
        "time_seconds": secs,
        "time_ms": ms,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    scores = await add_game_score(game_id, entry)
    if scores is None:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"scores": scores}
