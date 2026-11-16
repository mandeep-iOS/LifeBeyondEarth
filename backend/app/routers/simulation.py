from fastapi import APIRouter, Header

from app import db
from app.engines import robot as robot_engine
from app.engines.mission import run_day
from app.models import (
    DayResultOut,
    RobotDecideRequest,
    RobotDecisionOut,
    SimulateOut,
    SimulateRequest,
)
from app.routers._common import planet_or_404, plant_or_404

router = APIRouter(tags=["simulation"])


@router.post("/simulate", response_model=SimulateOut)
def simulate(
    body: SimulateRequest,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> SimulateOut:
    """Runs 1..N mission days (stops early if the plant dies), using the
    same SurvivalEngine + RobotDecisionEngine rules as the SwiftUI app."""
    planet = planet_or_404(body.planet, body.planet_data)
    plant = plant_or_404(body.plant)
    memories = db.load_memories(body.client_id, x_mission_key) if body.use_memory else []

    health, energy = body.health, body.robot_energy
    timeline: list[DayResultOut] = []
    for day in range(1, body.days + 1):
        result = run_day(day, planet, plant, health, energy, memories)
        timeline.append(result)
        health, energy = result.new_health, result.new_robot_energy
        if health <= 0:
            break

    return SimulateOut(
        planet=planet.name,
        plant=plant.name,
        days_simulated=len(timeline),
        final=timeline[-1],
        timeline=timeline,
    )


@router.post("/robot/decide", response_model=RobotDecisionOut)
def robot_decide(
    body: RobotDecideRequest,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> RobotDecisionOut:
    planet = planet_or_404(body.planet, body.planet_data)
    memories = db.load_memories(body.client_id, x_mission_key) if body.use_memory else []
    return RobotDecisionOut(
        **robot_engine.decide(planet, body.health, body.robot_energy, memories)
    )
