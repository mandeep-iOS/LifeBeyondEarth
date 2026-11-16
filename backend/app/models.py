"""
Pydantic response models. Field names are snake_case (idiomatic
Python) — the iOS APIClient is configured with
`.convertFromSnakeCase`, so these map automatically onto the
camelCase Swift DTOs (e.g. `radiation_tolerance` -> `radiationTolerance`)
with zero manual key-mapping on either side.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class PlanetOut(BaseModel):
    name: str
    temperature: int
    pressure: float
    radiation: int
    water_available: bool


class PlantOut(BaseModel):
    name: str
    cold_tolerance: int
    water_need: int
    radiation_tolerance: int


class ExplanationOut(BaseModel):
    title: str
    points: list[str]


class FactorOut(BaseModel):
    name: str
    planet_value: str
    plant_limit: str
    impact: int
    status: str  # "ok" | "threat" | "boost"


class PredictionOut(BaseModel):
    """The first four fields are the original contract used by the Swift
    MissionPredictionDTO. The rest are additive and ignored by it."""

    survival_prediction: int
    risk_level: str
    main_threat: str
    confidence: int
    reason: str | None = None
    explanation: ExplanationOut | None = None
    factors: list[FactorOut] | None = None


class PredictRequest(BaseModel):
    planet: str
    plant: str
    client_id: str = "default"
    use_memory: bool = True
    planet_data: PlanetOut | None = None  # inline world (e.g. NASA exoplanet)


class SimulateRequest(BaseModel):
    planet: str
    plant: str
    health: int = Field(100, ge=0, le=100)
    robot_energy: int = Field(100, ge=0, le=100)
    days: int = Field(1, ge=1, le=365)
    client_id: str = "default"
    use_memory: bool = True
    planet_data: PlanetOut | None = None  # inline world (e.g. NASA exoplanet)


class DayResultOut(BaseModel):
    day: int
    health_change: int
    new_health: int
    reason: str
    robot_action: str
    robot_energy_change: int
    new_robot_energy: int
    survival_probability: float
    survival_percentage: int
    status: str
    robot_status: str
    robot_mode: str
    robot_priority: str


class SimulateOut(BaseModel):
    planet: str
    plant: str
    days_simulated: int
    final: DayResultOut
    timeline: list[DayResultOut]


class RobotDecideRequest(BaseModel):
    planet: str
    health: int = Field(..., ge=0, le=100)
    robot_energy: int = Field(..., ge=0, le=100)
    client_id: str = "default"
    use_memory: bool = True
    planet_data: PlanetOut | None = None  # inline world (e.g. NASA exoplanet)


class RobotDecisionOut(BaseModel):
    action: str
    priority: str
    mode: str
    mode_title: str


class MemoryRecord(BaseModel):
    planet_name: str
    plant_name: str
    survival_score: int
    days_survived: int = 0
    mission_result: str = ""
    lesson_learned: str = ""


class MemoryIn(MemoryRecord):
    client_id: str = "default"


class MemoryOut(MemoryRecord):
    id: int
    created_at: datetime


class HistoryRecord(BaseModel):
    planet_name: str
    plant_name: str
    days_survived: int
    survival_score: int
    survival_probability: float
    robot_action: str = ""
    reason: str = ""
    status: str = ""
    difficulty_level: str = ""
    difficulty_explanation: str = ""


class HistoryIn(HistoryRecord):
    client_id: str = "default"


class HistoryOut(HistoryRecord):
    id: int
    created_at: datetime
