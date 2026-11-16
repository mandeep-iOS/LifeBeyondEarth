"""One simulated mission day, composed the way SimulationViewModel.simulateDay
composes SurvivalEngine + RobotDecisionEngine on the Swift side."""

from app.engines import robot, survival
from app.models import DayResultOut, MemoryRecord, PlanetOut, PlantOut


def run_day(
    day: int,
    planet: PlanetOut,
    plant: PlantOut,
    health: int,
    robot_energy: int,
    memories: list[MemoryRecord],
) -> DayResultOut:
    result = survival.simulate_day(planet, plant, health, robot_energy)
    new_health = result["new_health"]
    energy = result["new_robot_energy"]

    decision = robot.decide(planet, new_health, energy, memories)
    mode_title = decision["mode_title"]
    action = decision["action"]

    if 0 < energy <= 10:
        mode_title = "🔴 Emergency Power Mode"
        action += "\n⚠️ Robot power critical"
    if energy == 0:
        mode_title = "⚫ Robot Offline"
        action += "\n💀 Robot energy depleted"

    action += "\n" + result["robot_action"]

    if new_health <= 0:
        mode_title = "⚫ Mission Failed"

    return DayResultOut(
        day=day,
        health_change=result["health_change"],
        new_health=new_health,
        reason=result["reason"],
        robot_action=action,
        robot_energy_change=result["robot_energy_change"],
        new_robot_energy=energy,
        survival_probability=result["survival_probability"],
        survival_percentage=result["survival_percentage"],
        status=result["status"],
        robot_status=result["robot_status"],
        robot_mode=mode_title,
        robot_priority=decision["priority"],
    )
