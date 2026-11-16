"""Port of SurvivalEngine.swift + PlanetDifficultyModifier.swift +
the status helpers on SimulationResult.swift."""

from dataclasses import dataclass

from app.models import PlanetOut, PlantOut


HEAT_LIMIT = 45
PRESSURE_LIMIT = 300.0


@dataclass(frozen=True)
class DifficultyModifier:
    health_damage_multiplier: float
    robot_energy_multiplier: float
    emergency_support_multiplier: float


def difficulty_for(planet: PlanetOut) -> DifficultyModifier:
    # Swift strips exactly these three emoji, then lowercases/trims.
    name = planet.name.lower()
    for emoji in ("🔴", "🌙", "🌍"):
        name = name.replace(emoji, "")
    name = name.strip(" \t")

    if name == "earth":
        return DifficultyModifier(0.5, 0.5, 0.5)
    if name == "moon":
        return DifficultyModifier(2.0, 1.0, 1.0)
    if name == "mars":
        return DifficultyModifier(1.8, 0.8, 1.2)
    # Unknown worlds (outer planets, NASA exoplanets): scale stress by how far
    # the temperature is from Earth's and by radiation.
    temp_extremity = min(1.0, abs(planet.temperature - 15.0) / 250.0)
    return DifficultyModifier(
        1.0 + temp_extremity * 0.5 + planet.radiation / 200.0,
        1.0 + temp_extremity * 0.5,
        1.0,
    )


def status_for_health(health: int) -> str:
    if health >= 80:
        return "🟢 Excellent survival condition"
    if health >= 50:
        return "🟡 Moderate survival condition"
    if health >= 1:
        return "🟠 Critical condition"
    return "🔴 Plant extinct"


def robot_status_for_energy(energy: int) -> str:
    if energy >= 70:
        return "🔋 Robot systems optimal"
    if energy >= 30:
        return "⚠️ Robot energy decreasing"
    if energy >= 1:
        return "🚨 Robot energy critical"
    return "💀 Robot offline"


def simulate_day(
    planet: PlanetOut,
    plant: PlantOut,
    current_health: int,
    current_robot_energy: int,
) -> dict:
    mod = difficulty_for(planet)
    health = current_health
    energy = current_robot_energy
    health_change = 0
    energy_change = 0
    reasons: list[str] = []
    actions: list[str] = []

    def apply(base_damage: int, base_cost: int, reason: str, action: str) -> None:
        nonlocal health_change, energy, energy_change
        # Swift's Int(Double) truncates toward zero, as int() does.
        health_change -= int(base_damage * mod.health_damage_multiplier)
        reasons.append(reason)
        actions.append(action)
        cost = int(base_cost * mod.robot_energy_multiplier)
        energy = max(0, energy - cost)
        energy_change -= cost

    if planet.temperature < plant.cold_tolerance:
        # Deeper cold below the plant's tolerance hurts more (outer planets).
        apply(max(5, (plant.cold_tolerance - planet.temperature) // 20), 10, "❄️ Temperature too low", "🔥 Robot increasing heat support")

    if planet.temperature > HEAT_LIMIT:
        apply(
            max(5, (planet.temperature - HEAT_LIMIT) // 10),
            10,
            "🔥 Extreme heat",
            "🧊 Robot activating cooling system",
        )

    if planet.pressure > PRESSURE_LIMIT:
        apply(
            5 + int(planet.pressure - PRESSURE_LIMIT) // 500,
            8,
            "🗜 Crushing pressure",
            "🛠 Robot reinforcing habitat",
        )

    if planet.radiation > plant.radiation_tolerance:
        diff = planet.radiation - plant.radiation_tolerance
        apply(
            max(5, diff // 5),
            12,
            "☢ Radiation exposure",
            "🛡 Robot activating radiation shield",
        )

    if not planet.water_available:
        apply(
            plant.water_need // 20,
            8,
            "💧 Water shortage",
            "💧 Robot managing water supply",
        )

    if planet.pressure < 1:
        apply(3, 6, "🌫 Extreme low pressure", "⚙️ Robot stabilizing environment")

    health = max(0, min(100, health + health_change))

    if 0 < health < 50 and energy >= 20:
        repair, cost = 1, 10
        health = min(100, health + repair)
        health_change += repair
        energy = max(0, energy - cost)
        energy_change -= cost
        actions.append(
            f"🤖 Emergency support activated (+{repair}% health, -{cost}% energy)"
        )

    daily_cost = 2
    energy = max(0, energy - daily_cost)
    energy_change -= daily_cost

    if 0 < energy <= 10:
        actions.append("⚠️ Robot power critical")
    if energy == 0:
        actions.append("💀 Robot offline")

    probability = health / 100.0

    return {
        "health_change": health_change,
        "new_health": health,
        "reason": ", ".join(reasons) if reasons else "Environment stable",
        "robot_action": "\n".join(actions) if actions else "🤖 Monitoring environment",
        "robot_energy_change": energy_change,
        "new_robot_energy": energy,
        "survival_probability": probability,
        "survival_percentage": int(probability * 100),
        "status": status_for_health(health),
        "robot_status": robot_status_for_energy(energy),
    }
