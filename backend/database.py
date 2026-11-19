import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/spawngg")
DB_NAME = os.getenv("MONGO_DB_NAME", "spawngg")

_client: Optional[AsyncIOMotorClient] = None
_memory_store: List[Dict[str, Any]] = []


def _get_collection():
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    return _client[DB_NAME]["games"]


async def check_db_health() -> bool:
    try:
        col = _get_collection()
        await col.database.command("ping")
        return True
    except Exception:
        return False


async def save_game(record: Dict[str, Any]) -> Dict[str, Any]:
    doc = {
        "id": record["id"],
        "title": record["title"],
        "prompt": record["prompt"],
        "theme": record.get("theme", "custom"),
        "game_config": record["game_config"],
        "thumbnail": record.get("thumbnail"),
        "plays_count": record.get("plays_count", 0),
        "scores": record.get("scores", []),
        "created_at": record.get("created_at", datetime.now(timezone.utc).isoformat()),
    }
    try:
        col = _get_collection()
        await col.insert_one({**doc})
    except Exception:
        _memory_store.insert(0, doc)
    return doc


async def list_games(limit: int = 20) -> List[Dict[str, Any]]:
    try:
        col = _get_collection()
        cursor = col.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)
    except Exception:
        return list(_memory_store[:limit])


async def get_game_by_id(game_id: str) -> Optional[Dict[str, Any]]:
    try:
        col = _get_collection()
        return await col.find_one({"id": game_id}, {"_id": 0})
    except Exception:
        for item in _memory_store:
            if item["id"] == game_id:
                return item
        return None


async def update_game_thumbnail(game_id: str, thumbnail: str) -> bool:
    try:
        col = _get_collection()
        res = await col.update_one({"id": game_id}, {"$set": {"thumbnail": thumbnail}})
        return res.matched_count > 0
    except Exception:
        for item in _memory_store:
            if item["id"] == game_id:
                item["thumbnail"] = thumbnail
                return True
        return False


async def increment_plays_count(game_id: str) -> Optional[int]:
    try:
        col = _get_collection()
        res = await col.find_one_and_update(
            {"id": game_id},
            {"$inc": {"plays_count": 1}},
            return_document=True,
            projection={"_id": 0, "plays_count": 1},
        )
        return res.get("plays_count", 1) if res else None
    except Exception:
        for item in _memory_store:
            if item["id"] == game_id:
                item["plays_count"] = int(item.get("plays_count", 0)) + 1
                return item["plays_count"]
        return None


async def add_game_score(game_id: str, entry: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    game = await get_game_by_id(game_id)
    if not game:
        return None
    scores = list(game.get("scores") or [])
    scores.append(entry)
    scores.sort(key=lambda s: (-s.get("score", 0), s.get("time_seconds", s.get("time_ms", 0) / 1000)))
    top_scores = scores[:10]

    try:
        col = _get_collection()
        await col.update_one({"id": game_id}, {"$set": {"scores": top_scores}})
    except Exception:
        for item in _memory_store:
            if item["id"] == game_id:
                item["scores"] = top_scores
                break
    return top_scores
