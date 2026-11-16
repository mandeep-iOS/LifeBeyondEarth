"""Parity tests: expected values are hand-derived from the Swift sources
(SurvivalEngine, RobotDecisionEngine, MissionRecommendationEngine,
AIConfidenceCalculator, AIMissionPredictionEngine)."""

import pytest

from app.data import find_planet, find_plant
from app.engines import prediction, robot, survival
from app.models import MemoryRecord

MARS = find_planet("Mars")
EARTH = find_planet("Earth")
MERCURY = find_planet("Mercury")
CACTUS = find_plant("Cactus")
MOSS = find_plant("Moss")
TREE = find_plant("Tree")


def mem(planet, plant, score):
    return MemoryRecord(planet_name=planet.name, plant_name=plant.name, survival_score=score)


# ---------------------------------------------------------- SurvivalEngine

def test_mars_cactus_day_one():
    # damage: 5*1.8=9, radiation max(5,30//5)=6*1.8=10, water 1*1.8=1, pressure 3*1.8=5
    r = survival.simulate_day(MARS, CACTUS, 100, 100)
    assert r["health_change"] == -25
    assert r["new_health"] == 75
    # cost: 8 + 9 + 6 + 4, + 2 daily
    assert r["robot_energy_change"] == -29
    assert r["new_robot_energy"] == 71
    assert r["reason"] == (
        "❄️ Temperature too low, ☢ Radiation exposure, 💧 Water shortage, 🌫 Extreme low pressure"
    )
    assert r["status"] == "🟡 Moderate survival condition"
    assert r["survival_percentage"] == 75


def test_earth_halves_damage_and_stable_reason():
    r = survival.simulate_day(EARTH, MOSS, 100, 100)
    assert r["health_change"] == 0
    assert r["reason"] == "Environment stable"
    assert r["robot_action"] == "🤖 Monitoring environment"
    assert r["new_robot_energy"] == 98


def test_unlisted_planets_take_realistic_damage():
    for name in ("Mercury", "Venus", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"):
        r = survival.simulate_day(find_planet(name), TREE, 100, 100)
        assert r["health_change"] < 0, name
        assert r["new_robot_energy"] < 98, name
    assert "🔥 Extreme heat" in survival.simulate_day(find_planet("Venus"), TREE, 100, 100)["reason"]
    assert "🗜 Crushing pressure" in survival.simulate_day(find_planet("Jupiter"), TREE, 100, 100)["reason"]


def test_emergency_support_and_robot_offline():
    r = survival.simulate_day(MARS, CACTUS, 60, 30)
    # 60-25=35 (<50), energy 30-27=3 (<20) so no emergency repair; daily -2 -> 1
    assert (r["new_health"], r["new_robot_energy"]) == (35, 1)
    assert "⚠️ Robot power critical" in r["robot_action"]

    r = survival.simulate_day(EARTH, CACTUS, 40, 100)
    # Earth/Cactus: only water shortage? Earth has water -> no damage; health 40 <50 -> +1
    assert r["new_health"] == 41
    assert "Emergency support activated (+1% health, -10% energy)" in r["robot_action"]
    assert r["new_robot_energy"] == 88


def test_health_clamped_at_zero():
    r = survival.simulate_day(MARS, CACTUS, 10, 100)
    assert r["new_health"] == 0
    assert r["status"] == "🔴 Plant extinct"


# ------------------------------------------------------------- Prediction

def test_mars_cactus_prediction_no_memory():
    p = prediction.predict(MARS, CACTUS)
    assert p.survival_prediction == 35  # 100-25-30-10
    assert p.confidence == 35  # min(80, base)
    assert p.risk_level == "🔴 High"
    assert p.main_threat == "☢ Radiation"
    assert [f.impact for f in p.factors] == [-25, -30, -10, 0]
    assert p.explanation.title == "Why SI selected 🌵 Cactus"
    assert p.explanation.points[2] == "❄ Temperature\nPlanet:\n-63\nTolerance:\n-10"
    assert "No previous missions available." in p.explanation.points[3]


def test_earth_moss_stable_caps_confidence_at_80():
    p = prediction.predict(EARTH, MOSS)
    assert (p.survival_prediction, p.confidence) == (100, 80)
    assert p.risk_level == "🟢 Low"
    assert p.main_threat == "🌎 Environment stable"
    assert p.reason == "🛡 Radiation tolerance good\n💧 Water available"


def test_memory_adjusts_score_confidence_and_reason():
    memories = [mem(MARS, CACTUS, 90), mem(MARS, CACTUS, 10), mem(MARS, MOSS, 90)]
    p = prediction.predict(MARS, CACTUS, memories)
    # +15 -20 on top of 35 -> 30
    assert p.survival_prediction == 30
    # 1 of 2 successes -> rate 50 -> 30 + 10 + 5
    assert p.confidence == 45
    assert p.reason.endswith("🧠 Learned from 3 previous mission(s)")
    assert "Previous missions analyzed:\n3\nSuccessful missions:\n2" in p.explanation.points[3]
    assert [f.impact for f in p.factors][-1] == -5
    assert sum(f.impact for f in p.factors) == p.survival_prediction - 100


def test_confidence_capped_at_95():
    memories = [mem(EARTH, MOSS, 95)] * 3
    assert prediction.predict(EARTH, MOSS, memories).confidence == 95


def test_recommend_picks_best_and_handles_empty():
    best, _ = prediction.recommend(MARS, [TREE, CACTUS, MOSS])
    assert best.name == CACTUS.name  # Mars: Cactus 35 > Moss 20 > Tree 0
    assert prediction.recommend(MARS, []) is None


# ---------------------------------------------------------- RobotDecision

@pytest.mark.parametrize(
    "planet,health,energy,memories,mode,priority",
    [
        (MARS, 100, 0, [], "offline", "Critical"),
        (MARS, 100, 19, [], "power_saving", "High"),
        (MARS, 19, 100, [], "emergency", "Critical"),
        (MARS, 100, 100, [mem(MARS, CACTUS, 10)], "emergency", "Critical"),
        (MARS, 100, 100, [], "support", "High"),
        (EARTH, 100, 100, [], "monitoring", "Low"),
    ],
)
def test_robot_modes(planet, health, energy, memories, mode, priority):
    d = robot.decide(planet, health, energy, memories)
    assert (d["mode"], d["priority"]) == (mode, priority)


def test_robot_text_matches_swift():
    d = robot.decide(MARS, 100, 100, [mem(MARS, CACTUS, 55)])
    assert d["action"] == (
        "💧 Activating water recycling system.\n🧠 Memory:\n"
        "Previous best mission:\n55%\nsurvival achieved."
    )
    d = robot.decide(EARTH, 100, 100, [])
    assert d["action"] == (
        "🤖 Monitoring ecosystem conditions.\n🧠 Memory:\nNo previous mission data available"
    )
    assert d["mode_title"] == "🟢 Monitoring Mode"
