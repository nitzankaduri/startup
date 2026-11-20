import asyncio
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from ai_service import generate_game_config, refine_game_code
from blueprint_schemas import RefineRequest, RefineResponse
from database import save_game, update_game_code
from schemas import GenerateRequest, GenerateResponse

stream_router = APIRouter()


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


@stream_router.post("/api/games/refine", response_model=RefineResponse)
async def refine_game_endpoint(payload: RefineRequest):
    result = await refine_game_code(payload.current_code, payload.refinement_prompt, payload.game_title)
    if payload.game_id:
        await update_game_code(payload.game_id, result.code)
    return result


@stream_router.post("/api/generate-stream")
async def generate_game_stream(payload: GenerateRequest):
    queue: asyncio.Queue[str | None] = asyncio.Queue()

    async def on_stage(stage: str, label: str, step: int):
        await queue.put(_sse("progress", {"stage": stage, "label": label, "step": step, "total": 3}))

    async def worker():
        try:
            game_config = await generate_game_config(payload.prompt, on_stage=on_stage)
            game_id = str(uuid.uuid4())[:8]
            record = {
                "id": game_id,
                "title": game_config.title,
                "prompt": payload.prompt,
                "theme": "custom",
                "game_config": game_config.model_dump(),
                "thumbnail": None,
                "scores": [],
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            await save_game(record)
            resp = GenerateResponse(id=game_id, title=game_config.title, game_config=game_config)
            await queue.put(_sse("result", resp.model_dump()))
        except HTTPException as exc:
            await queue.put(_sse("error", {"detail": exc.detail, "status_code": exc.status_code}))
        except Exception as exc:
            await queue.put(_sse("error", {"detail": str(exc), "status_code": 502}))
        finally:
            await queue.put(None)

    asyncio.create_task(worker())

    async def event_generator():
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
