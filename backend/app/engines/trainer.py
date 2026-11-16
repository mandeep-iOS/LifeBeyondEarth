"""Junior Astronaut Mission Trainer: power-allocation trade-off model.

Mirrored in web-app/src/api/trainer.ts (offline fallback) - keep both in sync.
"""
from __future__ import annotations

SYSTEMS = ("shielding", "heating", "water", "led")
# Max draw (kW) per subsystem when allocated 100%.
DRAW_KW = {"shielding": 3.0, "heating": 3.0, "water": 2.0, "led": 4.0}
CREW_O2_KG_DAY = 3.36  # 4 astronauts
DEFAULT_ALLOCATION = {"shielding": 50, "heating": 50, "water": 50, "led": 50}

MISSIONS = [
    {
        "id": "cadet-lunar", "rank": "Cadet", "title": "Lunar Outpost", "emoji": "🌙",
        "planet": "🌙 Moon", "days": 14, "solar_kw": 8.0, "radiation": 45, "cold": 70,
        "dust": [0, 0], "flare": [0, 0],
        "briefing": "Keep a lettuce crop alive through the lunar night cycle on a stable power grid.",
        "objectives": [{"metric": "health", "op": ">=", "value": 60, "label": "Plant health ≥ 60%"},
                       {"metric": "battery", "op": ">=", "value": 20, "label": "Battery ≥ 20%"}],
    },
    {
        "id": "specialist-mars-dust", "rank": "Specialist", "title": "Mars Dust Storm", "emoji": "🔴",
        "planet": "🔴 Mars", "days": 20, "solar_kw": 7.0, "radiation": 55, "cold": 85,
        "dust": [6, 14], "flare": [0, 0],
        "briefing": "A global dust storm cuts solar output by 70%. Ration power without losing the crop or the water loop.",
        "objectives": [{"metric": "health", "op": ">=", "value": 50, "label": "Plant health ≥ 50%"},
                       {"metric": "battery", "op": ">", "value": 0, "label": "Battery never depleted"},
                       {"metric": "water", "op": ">=", "value": 25, "label": "Water reserve ≥ 25%"}],
    },
    {
        "id": "commander-solar-flare", "rank": "Commander", "title": "Solar Flare Crisis", "emoji": "☀️",
        "planet": "🔴 Mars", "days": 25, "solar_kw": 7.5, "radiation": 60, "cold": 60,
        "dust": [0, 0], "flare": [8, 12],
        "briefing": "An X-class flare floods the dome with radiation. Surge shielding, then recover the harvest.",
        "objectives": [{"metric": "health", "op": ">=", "value": 70, "label": "Plant health ≥ 70%"},
                       {"metric": "battery", "op": ">=", "value": 15, "label": "Battery ≥ 15%"},
                       {"metric": "pressure", "op": ">=", "value": 85, "label": "Dome pressure ≥ 85 kPa"}],
    },
]


def get_mission(mission_id: str) -> dict | None:
    return next((m for m in MISSIONS if m["id"] == mission_id), None)


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _in(day: int, window: list[int]) -> bool:
    return window[0] <= day <= window[1] and window[1] > 0


def simulate(mission: dict, allocation: dict[str, float]) -> dict:
    """Run the full mission with a constant allocation (per-day overrides via list)."""
    return simulate_schedule(mission, [allocation] * mission["days"])


def simulate_schedule(mission: dict, schedule: list[dict[str, float]]) -> dict:
    health, battery, water, biomass = 100.0, 100.0, 100.0, 0.0
    timeline, min_battery = [], 100.0
    for i, alloc in enumerate(schedule, start=1):
        a = {k: _clamp(float(alloc.get(k, 0))) for k in SYSTEMS}
        dust = _in(i, mission["dust"])
        flare = _in(i, mission["flare"])
        solar = mission["solar_kw"] * (0.3 if dust else 1.0)
        demand = sum(DRAW_KW[k] * a[k] / 100 for k in SYSTEMS)
        battery = _clamp(battery + (solar - demand) * 2.0)
        brownout = battery <= 0 and solar < demand
        eff = {k: a[k] * (0.3 if brownout else 1.0) for k in SYSTEMS}

        radiation = mission["radiation"] * (3.0 if flare else 1.0)
        rad_damage = radiation * (1 - 0.92 * eff["shielding"] / 100) * 0.07
        cold_damage = max(0.0, mission["cold"] - eff["heating"] * 1.1) * 0.05
        recovery = 45 + 50 * eff["water"] / 100
        water = _clamp(water - 6 * (1 - recovery / 100) + (1.0 if recovery > 80 else 0))
        thirst_damage = max(0.0, 30 - water) * 0.15
        growth = 3.2 * (0.15 + 0.85 * eff["led"] / 100) * (0.5 + 0.5 * water / 100)
        health = _clamp(health + growth - rad_damage - cold_damage - thirst_damage)

        maturity = min(1.0, i / max(1, mission["days"] * 0.6))
        biomass += health / 100 * (0.2 + 0.8 * eff["led"] / 100) * maturity
        o2 = round(4.2 * health / 100 * (0.4 + 0.6 * eff["led"] / 100), 2)
        kcal = round(3000 * health / 100 * (0.3 + 0.7 * eff["led"] / 100) * maturity)
        pressure = round(101.3 - 18 * max(0.0, 1 - o2 / CREW_O2_KG_DAY) - (4 if flare and eff["shielding"] < 50 else 0), 1)
        pressure = min(pressure, 101.3)
        min_battery = min(min_battery, battery)
        timeline.append({
            "day": i, "health": round(health, 1), "battery": round(battery, 1), "water": round(water, 1),
            "o2_kg_day": o2, "kcal": kcal, "pressure_kpa": pressure, "solar_kw": round(solar, 2),
            "demand_kw": round(demand, 2), "radiation_damage": round(rad_damage, 2),
            "water_recovery_pct": round(recovery), "brownout": brownout, "dust": dust, "flare": flare,
            "event": "☀️ Solar flare" if flare else "🌪️ Dust storm" if dust else None,
        })
    final = timeline[-1]
    metrics = {"health": final["health"], "battery": final["battery"], "water": final["water"],
               "pressure": final["pressure_kpa"]}
    results = []
    for o in mission["objectives"]:
        v = min_battery if o["metric"] == "battery" and o["op"] == ">" else metrics[o["metric"]]
        passed = v > o["value"] if o["op"] == ">" else v >= o["value"]
        results.append({**o, "actual": round(v, 1), "passed": passed})
    return {"mission": mission["id"], "timeline": timeline, "objectives": results,
            "passed": all(r["passed"] for r in results), "total_kcal": sum(t["kcal"] for t in timeline)}
