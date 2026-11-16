"""Port of RobotDecisionEngine.swift and RobotMemoryManager's queries.

Memories are passed in explicitly (the Swift singleton keeps them in
RAM; the server loads them from SQLite per client).
"""

from app.models import MemoryRecord, PlanetOut

MODE_TITLES = {
    "monitoring": "🟢 Monitoring Mode",
    "support": "🟡 Support Mode",
    "emergency": "🔴 Emergency Mode",
    "power_saving": "🔋 Power Saving Mode",
    "offline": "⚫ Robot Offline",
}


def _for_planet(memories: list[MemoryRecord], planet: PlanetOut) -> list[MemoryRecord]:
    return [m for m in memories if m.planet_name == planet.name]


def previous_best_score(memories: list[MemoryRecord], planet: PlanetOut) -> int:
    scores = [m.survival_score for m in _for_planet(memories, planet)]
    return max(scores) if scores else 0


def has_previous_failure(memories: list[MemoryRecord], planet: PlanetOut) -> bool:
    return any(m.survival_score < 30 for m in _for_planet(memories, planet))


def learn_lesson(memories: list[MemoryRecord], planet: PlanetOut) -> str:
    if not _for_planet(memories, planet):
        return "No previous mission data available"
    best = previous_best_score(memories, planet)
    return f"Previous best mission:\n{best}%\nsurvival achieved."


def decide(
    planet: PlanetOut,
    health: int,
    robot_energy: int,
    memories: list[MemoryRecord] | None = None,
) -> dict:
    memories = memories or []
    lesson = learn_lesson(memories, planet)
    memory_block = f"🧠 Memory:\n{lesson}"

    def result(action: str, priority: str, mode: str) -> dict:
        return {
            "action": action,
            "priority": priority,
            "mode": mode,
            "mode_title": MODE_TITLES[mode],
        }

    if robot_energy <= 0:
        return result(
            f"💀 Robot battery depleted.\nMission data preserved.\n{memory_block}",
            "Critical",
            "offline",
        )

    if robot_energy < 20:
        return result(
            f"🔋 Reducing non-essential systems\nto preserve energy.\n{memory_block}",
            "High",
            "power_saving",
        )

    if health < 20:
        return result(
            f"🚨 Maximum survival protocol activated.\n{memory_block}",
            "Critical",
            "emergency",
        )

    if has_previous_failure(memories, planet) and planet.radiation > 70:
        best = previous_best_score(memories, planet)
        return result(
            "🧠 Previous mission failure detected.\n"
            "☢ Increasing radiation protection priority.\n"
            f"📊 Previous survival:\n{best}%",
            "Critical",
            "emergency",
        )

    if not planet.water_available:
        return result(
            f"💧 Activating water recycling system.\n{memory_block}", "High", "support"
        )

    if planet.radiation > 70:
        return result(
            f"🛡 Radiation protection system active.\n{memory_block}", "High", "support"
        )

    if planet.temperature < -40:
        return result(
            f"🔥 Increasing thermal protection.\n{memory_block}", "Medium", "support"
        )

    return result(
        f"🤖 Monitoring ecosystem conditions.\n{memory_block}", "Low", "monitoring"
    )
