from fastapi import APIRouter, Query, Header

from app import db
from app.models import HistoryIn, HistoryOut, MemoryIn, MemoryOut

router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[HistoryOut])
def get_history(
    client_id: str = "default",
    limit: int = Query(100, ge=1, le=1000),
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> list[HistoryOut]:
    return db.list_history(client_id, x_mission_key, limit)


@router.post("/history", response_model=HistoryOut, status_code=201)
def post_history(
    body: HistoryIn,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> HistoryOut:
    return db.add_history(body, x_mission_key)


@router.get("/memory", response_model=list[MemoryOut])
def get_memory(
    client_id: str = "default",
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> list[MemoryOut]:
    return db.list_memory(client_id, x_mission_key)


@router.post("/memory", response_model=MemoryOut, status_code=201)
def post_memory(
    body: MemoryIn,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> MemoryOut:
    return db.add_memory(body, x_mission_key)
