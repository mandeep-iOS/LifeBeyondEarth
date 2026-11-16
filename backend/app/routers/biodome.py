from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import nasa_service
from app.engines import biodome

router = APIRouter(prefix="/biodome", tags=["biodome"])


class ExecuteRequest(BaseModel):
    directive: str = Field(min_length=3, max_length=500)
    planet: str | None = None
    crop: str | None = None
    days: int = Field(10, ge=1, le=60)


class EmergencyRequest(BaseModel):
    planet: str = "🔴 Mars"
    crop: str = "🥬 Red Romaine Lettuce"
    crisis: Literal["solar_flare", "dust_storm", "dome_breach"] = "solar_flare"
    inside_health: int = Field(100, ge=0, le=100)
    outside_health: int = Field(100, ge=0, le=100)


class FailoverRequest(BaseModel):
    battery_pct: int = Field(12, ge=0, le=100)
    planet: str = "🔴 Mars"
    crop: str = "🥬 Red Romaine Lettuce"
    inside_health: int = Field(100, ge=0, le=100)
    outside_health: int = Field(100, ge=0, le=100)
    signal_lag_min: float = Field(biodome.DEFAULT_SIGNAL_LAG_MIN, ge=0, le=60)
    recharge: bool = False


@router.get("/squad")
def squad() -> dict:
    return {"squad": biodome.squad()}


@router.post("/failover")
def failover(body: FailoverRequest) -> dict:
    """A.C.E. Protocol (Autonomous Continuity & Escalation)."""
    return biodome.failover(**body.model_dump())


@router.get("/presets")
def presets() -> dict:
    return {"presets": biodome.PRESETS}


@router.post("/execute")
def execute(body: ExecuteRequest) -> dict:
    """Runs the Scout -> Builder -> Manager SI mission for a human directive."""
    error = biodome.validate_directive(body.directive, body.planet, body.crop)
    if error:
        raise HTTPException(status_code=422, detail=error)
    return biodome.execute(body.directive, body.planet, body.crop, body.days)


@router.post("/emergency")
async def emergency(body: EmergencyRequest) -> dict:
    """Commander-Prime SI evaluates a crisis (solar flares use live NASA DONKI
    space weather) and returns survival actions plus an urgent NASA alert."""
    weather = await nasa_service.space_weather(days=30)
    return biodome.emergency(
        body.planet,
        body.crop,
        body.crisis,
        body.inside_health,
        body.outside_health,
        weather.get("threat_level", "moderate"),
        weather.get("source", "fallback"),
    )
