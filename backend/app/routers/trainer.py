from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.engines import trainer

router = APIRouter(prefix="/trainer", tags=["trainer"])


class Allocation(BaseModel):
    shielding: float = Field(50, ge=0, le=100)
    heating: float = Field(50, ge=0, le=100)
    water: float = Field(50, ge=0, le=100)
    led: float = Field(50, ge=0, le=100)


class RunRequest(BaseModel):
    mission_id: str
    allocation: Allocation = Allocation()


@router.get("/missions")
def missions() -> dict:
    return {"missions": trainer.MISSIONS, "default_allocation": trainer.DEFAULT_ALLOCATION, "draw_kw": trainer.DRAW_KW}


@router.post("/run")
def run(req: RunRequest) -> dict:
    mission = trainer.get_mission(req.mission_id)
    if mission is None:
        raise HTTPException(404, f"Unknown mission '{req.mission_id}'")
    return trainer.simulate(mission, req.allocation.model_dump())
