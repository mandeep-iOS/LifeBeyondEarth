"""Port of MissionRecommendationEngine.swift, AIConfidenceCalculator.swift
and AIMissionPredictionEngine.swift, plus structured explainability
`factors` that the Swift engine only exposes as text."""

from app.models import (
    ExplanationOut,
    FactorOut,
    MemoryRecord,
    PlanetOut,
    PlantOut,
    PredictionOut,
)


def _planet_memories(memories: list[MemoryRecord], planet: PlanetOut) -> list[MemoryRecord]:
    return [m for m in memories if m.planet_name == planet.name]


def _memory_adjustment(
    memories: list[MemoryRecord], planet: PlanetOut, plant: PlantOut
) -> int:
    delta = 0
    for m in _planet_memories(memories, planet):
        if m.plant_name == plant.name:
            if m.survival_score >= 70:
                delta += 15
            elif m.survival_score < 30:
                delta -= 20
    return delta


def calculate_score(
    planet: PlanetOut, plant: PlantOut, memories: list[MemoryRecord]
) -> int:
    score = 100
    if planet.temperature < plant.cold_tolerance:
        score -= 25
    if planet.radiation > plant.radiation_tolerance:
        score -= 30
    if not planet.water_available:
        score -= plant.water_need // 2
    score += _memory_adjustment(memories, planet, plant)
    return max(0, min(100, score))


def calculate_confidence(
    planet: PlanetOut,
    plant: PlantOut,
    base_score: int,
    memories: list[MemoryRecord],
) -> int:
    relevant = [
        m
        for m in memories
        if m.planet_name == planet.name and m.plant_name == plant.name
    ]
    if not relevant:
        return min(80, base_score)

    successful = sum(1 for m in relevant if m.survival_score >= 70)
    success_rate = successful * 100 // len(relevant)
    return min(95, base_score + 10 + success_rate // 10)


def determine_threat(planet: PlanetOut, plant: PlantOut) -> str:
    if planet.radiation > plant.radiation_tolerance:
        return "☢ Radiation"
    if not planet.water_available:
        return "💧 Water shortage"
    if planet.temperature < plant.cold_tolerance:
        return "❄ Extreme temperature"
    return "🌎 Environment stable"


def risk_level(survival: int) -> str:
    if survival >= 80:
        return "🟢 Low"
    if survival >= 50:
        return "🟡 Medium"
    return "🔴 High"


def generate_reason(
    planet: PlanetOut, plant: PlantOut, memories: list[MemoryRecord]
) -> str:
    reasons = [
        "☢ Radiation risk"
        if planet.radiation > plant.radiation_tolerance
        else "🛡 Radiation tolerance good",
        "💧 Water available" if planet.water_available else "💧 Low water dependency",
    ]
    count = len(_planet_memories(memories, planet))
    if count > 0:
        reasons.append(f"🧠 Learned from {count} previous mission(s)")
    return "\n".join(reasons)


def _swift_bool(value: bool) -> str:
    return "true" if value else "false"


def create_explanation(
    planet: PlanetOut, plant: PlantOut, memories: list[MemoryRecord]
) -> ExplanationOut:
    points = [
        f"☢ Radiation\nPlanet:\n{planet.radiation}\nPlant tolerance:\n{plant.radiation_tolerance}",
        f"💧 Water\nRequirement:\n{plant.water_need}\nAvailable:\n{_swift_bool(planet.water_available)}",
        f"❄ Temperature\nPlanet:\n{planet.temperature}\nTolerance:\n{plant.cold_tolerance}",
    ]

    previous = _planet_memories(memories, planet)
    if not previous:
        points.append(
            "🧠 Robot Memory\nNo previous missions available.\n"
            "SI used environmental analysis only."
        )
    else:
        successful = sum(1 for m in previous if m.survival_score >= 70)
        points.append(
            "🧠 Robot Memory\nPrevious missions analyzed:\n"
            f"{len(previous)}\nSuccessful missions:\n{successful}\n"
            "SI improved decision using history."
        )

    return ExplanationOut(title=f"Why SI selected {plant.name}", points=points)


def build_factors(
    planet: PlanetOut, plant: PlantOut, memories: list[MemoryRecord]
) -> list[FactorOut]:
    """Per-factor score impact; impacts sum to (score - 100) before clamping."""
    temp_bad = planet.temperature < plant.cold_tolerance
    rad_bad = planet.radiation > plant.radiation_tolerance
    water_bad = not planet.water_available
    mem_delta = _memory_adjustment(memories, planet, plant)

    return [
        FactorOut(
            name="Temperature",
            planet_value=str(planet.temperature),
            plant_limit=str(plant.cold_tolerance),
            impact=-25 if temp_bad else 0,
            status="threat" if temp_bad else "ok",
        ),
        FactorOut(
            name="Radiation",
            planet_value=str(planet.radiation),
            plant_limit=str(plant.radiation_tolerance),
            impact=-30 if rad_bad else 0,
            status="threat" if rad_bad else "ok",
        ),
        FactorOut(
            name="Water",
            planet_value=_swift_bool(planet.water_available),
            plant_limit=str(plant.water_need),
            impact=-(plant.water_need // 2) if water_bad else 0,
            status="threat" if water_bad else "ok",
        ),
        FactorOut(
            name="Robot Memory",
            planet_value=str(len(_planet_memories(memories, planet))),
            plant_limit="-",
            impact=mem_delta,
            status="threat" if mem_delta < 0 else ("boost" if mem_delta > 0 else "ok"),
        ),
    ]


def predict(
    planet: PlanetOut, plant: PlantOut, memories: list[MemoryRecord] | None = None
) -> PredictionOut:
    memories = memories or []
    survival = calculate_score(planet, plant, memories)
    return PredictionOut(
        survival_prediction=survival,
        risk_level=risk_level(survival),
        main_threat=determine_threat(planet, plant),
        confidence=calculate_confidence(planet, plant, survival, memories),
        reason=generate_reason(planet, plant, memories),
        explanation=create_explanation(planet, plant, memories),
        factors=build_factors(planet, plant, memories),
    )


def recommend(
    planet: PlanetOut, plants: list[PlantOut], memories: list[MemoryRecord] | None = None
) -> tuple[PlantOut, PredictionOut] | None:
    """MissionRecommendationEngine.recommend: best plant (first wins ties,
    like Swift's strict `>`), or None for an empty list."""
    if not plants:
        return None
    memories = memories or []
    best_plant, best_score = plants[0], 0
    for plant in plants:
        score = calculate_score(planet, plant, memories)
        if score > best_score:
            best_plant, best_score = plant, score
    return best_plant, predict(planet, best_plant, memories)
