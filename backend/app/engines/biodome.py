"""Autonomous multi-agent Bio-Dome Lab.

A human directive is parsed into (crop, world, site). Three agent groups then
run a deterministic mission: the Scout Bot picks reliable terrain, the Builder
Swarm assembles a pressurized dome, and the Manager SI cultivates the crop
inside the dome while a control crop is exposed outside. Crop health reuses
the SurvivalEngine port, so results stay consistent with /simulate.
"""

import re

from app.data import PLANETS, PLANTS, find_planet, find_plant
from app.engines.survival import simulate_day, status_for_health
from app.models import PlanetOut, PlantOut

SCOUT = "Recon-01"
BUILDERS = ("Mason-02", "Assembler-03")
MANAGER = "Commander-Prime SI"

PRESETS = [
    "Build a Red Romaine Lettuce bio-dome on Mars Jezero Crater and run outside surface exposure trials",
    "Establish a Space Cabbage bio-dome on the Moon at Shackleton Crater and compare it with outdoor controls",
    "Grow Dwarf Tomato inside a pressurized dome on Mars Utopia Planitia with outside surface exposure trials",
    "Deploy a Mizuna Mustard bio-dome on Mars Gale Crater and test control plants outside",
]

# World -> candidate landing sites: (name, reliability 0-100, terrain note).
SITES: dict[str, list[tuple[str, int, str]]] = {
    "mars": [
        ("Jezero Crater", 92, "ancient river delta, flat regolith, subsurface ice nearby"),
        ("Gale Crater", 88, "layered sediment, stable bedrock"),
        ("Utopia Planitia", 84, "buried water ice, wide flat plains"),
        ("Valles Marineris Rim", 41, "steep slopes and rockfall risk"),
    ],
    "moon": [
        ("Shackleton Crater", 90, "permanently shadowed ice, near-constant sunlit rim"),
        ("Mare Tranquillitatis", 85, "flat basaltic plain"),
        ("Tycho Ridge", 45, "boulder fields and steep terrain"),
    ],
}
GENERIC_SITES = [
    ("Equatorial Plain", 80, "lowest relief terrain surveyed"),
    ("Polar Basin", 70, "shielded, cold-trapped volatiles"),
    ("Highland Ridge", 40, "unstable slopes"),
]

CRISES = {
    "solar_flare": {
        "label": "Solar flare / energetic particle storm",
        "outside_damage": 28,
        "inside_damage": 6,
        "actions": [
            "Retract outside control-plant canopy and deploy radiation tarp",
            "Route water ballast to the dome shield layer",
            "Shelter builder swarm inside the airlock",
            "Switch grow lights to low-power photoperiod",
        ],
    },
    "dust_storm": {
        "label": "Global dust storm",
        "outside_damage": 20,
        "inside_damage": 8,
        "actions": [
            "Seal dome airlocks and filters",
            "Shift power to battery reserve and cut grow lights to 40%",
            "Park Recon-01 in a lee-side shelter",
            "Dispatch Mason-02 to clear panels after the storm",
        ],
    },
    "dome_breach": {
        "label": "Dome pressure breach",
        "outside_damage": 5,
        "inside_damage": 35,
        "actions": [
            "Isolate the breached segment with emergency bulkheads",
            "Dispatch Assembler-03 to patch the shell with sealant",
            "Re-pressurize from reserve tanks and verify seal",
            "Move seedlings to the sealed central module",
        ],
    },
}

THREAT_MULTIPLIER = {"quiet": 0.6, "low": 0.8, "moderate": 1.0, "high": 1.3, "severe": 1.6}


def _plain(name: str) -> str:
    """Name without the leading emoji, lowercased."""
    return "".join(ch for ch in name if ch.isalnum() or ch in " -").strip().lower()


DESTINATION_WORDS = (
    "moon", "lunar", "planet", "crater", "exoplanet", "titan", "europa", "ganymede", "callisto", "enceladus",
    "ceres", "io", "triton", "kepler", "trappist", "proxima", "outpost", "colony", "surface",
)
FARMING_WORDS = (
    "crop", "plant", "farm", "grow", "cultivat", "harvest", "garden", "seed", "greenhouse", "dome", "veggie",
    "lettuce", "cabbage", "tomato", "mizuna", "mustard", "romaine", "agricultur", "food",
)
INVALID_DIRECTIVE_MESSAGE = (
    "Commander-Prime SI could not understand this directive. Please specify a valid planet "
    "(e.g. Mars, Moon) and crop (e.g. Red Romaine Lettuce), or choose one of the NASA presets."
)


CROP_WORDS = ("lettuce", "romaine", "cabbage", "tomato", "mizuna", "mustard", "cactus", "moss", "grass", "tree")
# Named destinations only; generic words like "planet" or "surface" do not count.
NAMED_DESTINATIONS = (
    "moon", "lunar", "titan", "europa", "ganymede", "callisto", "enceladus", "ceres", "triton",
    "kepler", "trappist", "proxima",
)


def _has_destination(text: str) -> bool:
    names = [_plain(p.name) for p in PLANETS if _plain(p.name) != "earth"]
    names += [site[0].lower() for sites in SITES.values() for site in sites]
    words = set(re.findall(r"[a-z0-9-]+", text))
    return any(n in text for n in names) or any(w in words for w in NAMED_DESTINATIONS)


def _has_crop(text: str) -> bool:
    names = [_plain(c.name) for c in PLANTS]
    words = set(re.findall(r"[a-z]+", text))
    return any(n in text for n in names) or any(w in words for w in CROP_WORDS)


def validate_directive(directive: str, planet: str | None = None, crop: str | None = None) -> str | None:
    """Returns an error message unless the directive names BOTH a recognized
    destination and a recognized crop (or is an explicit preset), else None."""
    text = directive.lower().strip()
    if directive.strip() in PRESETS:
        return None
    has_world = _has_destination(text) or bool(planet and find_planet(planet))
    has_crop = _has_crop(text) or bool(crop and find_plant(crop))
    return None if has_world and has_crop else INVALID_DIRECTIVE_MESSAGE


def parse_directive(directive: str, planet: str | None = None, crop: str | None = None) -> tuple[PlanetOut, PlantOut, list, tuple | None]:
    text = directive.lower()
    world = None
    if planet:
        world = next((p for p in PLANETS if planet.lower() in p.name.lower()), None)
    if world is None:
        world = next((p for p in PLANETS if _plain(p.name) in text), None)
    world = world or next(p for p in PLANETS if _plain(p.name) == "mars")

    plant = None
    if crop:
        plant = next((c for c in PLANTS if crop.lower() in c.name.lower()), None)
    if plant is None:
        plant = next((c for c in PLANTS if _plain(c.name) in text), None)
    if plant is None:
        keyword = next((k for k in ("cabbage", "tomato", "mizuna", "mustard") if k in text), "lettuce")
        keyword = "mizuna" if keyword == "mustard" else keyword
        plant = next(c for c in PLANTS if keyword in c.name.lower())

    sites = SITES.get(_plain(world.name), GENERIC_SITES)
    requested = next((s for s in sites if s[0].lower() in text), None)
    return world, plant, sites, requested


def dome_interior(planet: PlanetOut, shield: float = 0.15) -> PlanetOut:
    """Habitable dome climate: heated, pressurized, irrigated, radiation-shielded."""
    return PlanetOut(
        name=f"Dome on {planet.name}",
        temperature=22,
        pressure=70.0,
        radiation=int(planet.radiation * shield),
        water_available=True,
    )


def run_days(planet: PlanetOut, crop: PlantOut, days: int) -> list[dict]:
    dome = dome_interior(planet)
    inside, outside = 100, 100
    energy_in, energy_out = 100, 100
    rows = []
    for day in range(1, days + 1):
        a = simulate_day(dome, crop, inside, energy_in)
        b = simulate_day(planet, crop, outside, energy_out)
        inside, outside = a["new_health"], b["new_health"]
        # Solar panels recharge the cultivation robots each sol.
        energy_in = min(100, a["new_robot_energy"] + 4)
        energy_out = min(100, b["new_robot_energy"] + 4)
        rows.append(
            {
                "day": day,
                "inside_health": inside,
                "outside_health": outside,
                "inside_status": status_for_health(inside),
                "outside_status": status_for_health(outside),
                "outside_reason": b["reason"],
            }
        )
    return rows


def execute(directive: str, planet: str | None = None, crop: str | None = None, days: int = 10) -> dict:
    world, plant, sites, requested = parse_directive(directive, planet, crop)
    ranked = sorted(sites, key=lambda s: -s[1])
    chosen = requested if requested and requested[1] >= 60 else ranked[0]
    site_name = chosen[0]

    survey = [{"site": n, "reliability": r, "note": note, "selected": n == site_name} for n, r, note in ranked]
    steps: list[dict] = []
    telemetry: list[dict] = []

    def step(phase: str, agent: str, role: str, action: str, progress: int) -> None:
        steps.append({"index": len(steps), "phase": phase, "agent": agent, "role": role, "action": action, "progress": progress})

    def report(phase: str, message: str, level: str = "info") -> None:
        telemetry.append({"index": len(telemetry), "to": "NASA Mission Control", "phase": phase, "level": level, "message": message})

    step("scouting", SCOUT, "Scout Bot", f"Surveying {len(survey)} candidate sites on {world.name}", 50)
    step("scouting", SCOUT, "Scout Bot", f"Selected {site_name} (reliability {chosen[1]}%): {chosen[2]}", 100)
    report("scouting", f"Landing site {site_name} confirmed at {chosen[1]}% terrain reliability.")

    stages = (
        (25, "Anchoring foundation ring"),
        (50, "Erecting pressure shell"),
        (75, "Sealing and inflating dome"),
        (100, "Installing grow racks, water loop and radiation shield"),
    )
    for pct, label in stages:
        step("construction", BUILDERS[0], "Builder Swarm", label, pct)
        step("construction", BUILDERS[1], "Builder Swarm", f"Assembler support: {label[0].lower()}{label[1:]}", pct)
    report("construction", "Pressurized dome shell complete: 70 kPa, 22 °C, 85% radiation shielding.")

    timeline = run_days(world, plant, days)
    final = timeline[-1]
    step("cultivation", MANAGER, "Manager SI", f"Planting {plant.name} inside the dome", 10)
    step("cultivation", MANAGER, "Manager SI", f"Planting control {plant.name} outside on the surface", 30)
    step(
        "cultivation",
        MANAGER,
        "Manager SI",
        f"Monitoring {days} sols of growth: inside {final['inside_health']}% vs outside {final['outside_health']}%",
        100,
    )
    report("cultivation", f"Sol {days}: inside-dome health {final['inside_health']}%, outside control {final['outside_health']}%.")

    gap = final["inside_health"] - final["outside_health"]
    verdict = (
        f"The dome protected {plant.name} by {gap} health points versus open-surface exposure on {world.name}."
        if gap > 0
        else f"{plant.name} tolerated {world.name} surface conditions; the dome gave no measurable advantage."
    )
    report("complete", verdict, "success")

    return {
        "directive": directive,
        "planet": world.name,
        "crop": plant.name,
        "site": site_name,
        "agents": [
            {"id": SCOUT, "role": "Scout Bot", "task": "Terrain reconnaissance"},
            {"id": BUILDERS[0], "role": "Builder Swarm", "task": "Dome shell construction"},
            {"id": BUILDERS[1], "role": "Builder Swarm", "task": "Systems assembly"},
            {"id": MANAGER, "role": "Manager SI", "task": "Cultivation & emergency command"},
        ],
        "site_survey": survey,
        "steps": steps,
        "timeline": timeline,
        "final": {"inside_health": final["inside_health"], "outside_health": final["outside_health"], "verdict": verdict},
        "telemetry": telemetry,
    }


def emergency(
    planet: str,
    crop: str,
    crisis: str,
    inside_health: int,
    outside_health: int,
    threat_level: str = "moderate",
    space_weather_source: str = "fallback",
) -> dict:
    spec = CRISES[crisis]
    mult = THREAT_MULTIPLIER.get(threat_level, 1.0) if crisis == "solar_flare" else 1.0
    in_dmg = int(spec["inside_damage"] * mult)
    out_dmg = int(spec["outside_damage"] * mult)
    # The autonomous response halves interior losses.
    new_inside = max(0, inside_health - in_dmg // 2)
    new_outside = max(0, outside_health - out_dmg)
    severity = "critical" if crisis == "dome_breach" or mult >= 1.3 else "major" if mult >= 1.0 else "minor"
    basis = f"NASA DONKI threat level: {threat_level}, source: {space_weather_source}" if crisis == "solar_flare" else "onboard sensors"
    assessment = (
        f"{MANAGER} assessed '{spec['label']}' on {planet} ({severity}; {basis}). "
        f"Unmitigated interior damage {in_dmg}%; outside control plants lose {out_dmg}%."
    )
    return {
        "crisis": crisis,
        "label": spec["label"],
        "severity": severity,
        "threat_level": threat_level,
        "space_weather_source": space_weather_source,
        "assessment": assessment,
        "actions": spec["actions"],
        "before": {"inside_health": inside_health, "outside_health": outside_health},
        "after": {"inside_health": new_inside, "outside_health": new_outside},
        "telemetry": {
            "to": "NASA Mission Control",
            "level": "urgent",
            "message": (
                f"URGENT: {spec['label']} at {planet} bio-dome ({crop}). {MANAGER} executed {len(spec['actions'])} "
                f"survival actions. Inside {new_inside}%, outside {new_outside}%."
            ),
        },
    }


# ---------------------------------------------------------------------------
# Named robotics squad and the A.C.E. (Autonomous Continuity & Escalation) protocol
# ---------------------------------------------------------------------------

SQUAD = [
    {"id": "B.I.O.M.E.", "name": "Biosphere Intelligence & Operations Management Engine", "role": "Head SI", "icon": "brain",
     "bio": "Head Super Intelligence. Plans the mission, validates directives and commands every robot in the squad.",
     "milestone": "Directive validated. Mission plan locked; all units, report to your stations.",
     "hazard": "Hazard detected. Re-prioritising power and tasking the squad to protect the crop."},
    {"id": "F.L.O.R.A.", "name": "Field Landscape Observation & Reconnaissance Agent", "role": "Field Supervisor", "icon": "radar",
     "bio": "Field Supervisor. Surveys terrain, supervises construction and steps up as Acting Mission Director on failover.",
     "milestone": "Landing site confirmed. Terrain is stable and the ice survey is promising.",
     "hazard": "Surface conditions degrading. Pulling every unit back inside the safe perimeter."},
    {"id": "S.P.R.O.U.T.", "name": "Seedling Planting, Rooting & Outdoor Upkeep Tender", "role": "Planter", "icon": "sprout",
     "bio": "Plants seeds, thins seedlings and tends the control crop on the surface.",
     "milestone": "First seeds are in the regolith. Germination watch has begun.",
     "hazard": "Control crop is under stress. Covering seedlings and moving them to the central module."},
    {"id": "H.Y.D.R.O.", "name": "Hydration, Yield & Drainage Regulation Operator", "role": "Water & Nutrients", "icon": "droplets",
     "bio": "Runs the water loop, nutrient dosing and humidity control.",
     "milestone": "Water loop primed and nutrient mix balanced at target.",
     "hazard": "Water pressure drifting. Isolating the loop and switching to reserve tanks."},
    {"id": "A.E.G.I.S.", "name": "Atmospheric & Environmental Guard Integrity System", "role": "Safety & Shielding", "icon": "shield",
     "bio": "Guards dome pressure, radiation shielding and airlocks. Acting Supervisor during an A.C.E. failover.",
     "milestone": "Dome sealed at 70 kPa with radiation shield online.",
     "hazard": "Breach or radiation spike. Sealing bulkheads and sheltering all units."},
    {"id": "L.U.M.E.N.", "name": "Light, Utility & Mission Energy Navigator", "role": "Power & Lighting", "icon": "zap",
     "bio": "Manages solar output, batteries and grow-light photoperiods.",
     "milestone": "Solar array tracking the sun; grow lights on schedule.",
     "hazard": "Power budget critical. Cutting non-essential loads and dimming grow lights."},
]

ACE_THRESHOLD = 15
ACE_ACTING_DIRECTOR = "F.L.O.R.A."
ACE_ACTING_SUPERVISOR = "A.E.G.I.S."
ACE_SNAPSHOT_BADGE = "Encrypted Telemetry Snapshot Cloned (0ms Downtime / Zero Conflict)"
ACE_RESEARCH_ROLE = "Advanced Predictive Research & Orbital Optimization"
DEFAULT_SIGNAL_LAG_MIN = 14.0  # one-way Mars-Earth light delay, order of magnitude


def squad() -> list[dict]:
    return SQUAD


def failover(
    battery_pct: int,
    planet: str = "🔴 Mars",
    crop: str = "🥬 Red Romaine Lettuce",
    inside_health: int = 100,
    outside_health: int = 100,
    signal_lag_min: float = DEFAULT_SIGNAL_LAG_MIN,
    recharge: bool = False,
) -> dict:
    """A.C.E. Protocol: below 15% battery, B.I.O.M.E. hands active control to
    F.L.O.R.A. (Acting Mission Director) with A.E.G.I.S. as Acting Supervisor.
    Because NASA approval cannot arrive within the Earth signal lag, SI
    autonomously overrides. Recharging restores B.I.O.M.E. and syncs the
    black-box record to NASA."""
    triggered = battery_pct < ACE_THRESHOLD and not recharge
    stamp = f"{planet} bio-dome ({crop})"
    snapshot = [
        f"Snapshot sealed: battery {battery_pct}%, crop health inside {inside_health}% / outside {outside_health}%.",
        "Encrypting telemetry snapshot (AES-256-GCM) for continuity transfer.",
        f"Transferring snapshot B.I.O.M.E. → {ACE_ACTING_DIRECTOR}: checksum verified.",
        f"{ACE_ACTING_DIRECTOR} acknowledged; {ACE_ACTING_SUPERVISOR} assumed Acting Supervisor.",
    ]
    if recharge:
        return {
            "triggered": False,
            "status": "restored",
            "battery_pct": 100,
            "threshold": ACE_THRESHOLD,
            "active_control": {"from": ACE_ACTING_DIRECTOR, "to": "B.I.O.M.E."},
            "acting_supervisor": None,
            "transfer_log": [
                "Battery restored to 100%. B.I.O.M.E. rebooted and passed integrity self-test.",
                f"Active Control returned: {ACE_ACTING_DIRECTOR} → B.I.O.M.E.",
                "Black-box records (decisions, telemetry, overrides) compiled for audit.",
                f"B.I.O.M.E. assigned to {ACE_RESEARCH_ROLE}.",
                f"All offline/failover logs synced to NASA Mission Control for {stamp}.",
            ],
            "alert": None,
            "snapshot_badge": None,
            "biome_assignment": ACE_RESEARCH_ROLE,
            "synced_to_nasa": True,
            "dialogue": [{"agent": "B.I.O.M.E.", "message": "Power restored. Resuming command; black-box log synced to NASA."}],
        }
    if not triggered:
        return {
            "triggered": False,
            "status": "nominal",
            "battery_pct": battery_pct,
            "threshold": ACE_THRESHOLD,
            "active_control": {"from": "B.I.O.M.E.", "to": "B.I.O.M.E."},
            "acting_supervisor": None,
            "transfer_log": [],
            "alert": None,
            "snapshot_badge": None,
            "biome_assignment": None,
            "synced_to_nasa": False,
            "dialogue": [],
        }
    return {
        "triggered": True,
        "status": "failover",
        "battery_pct": battery_pct,
        "threshold": ACE_THRESHOLD,
        "active_control": {"from": "B.I.O.M.E.", "to": f"{ACE_ACTING_DIRECTOR} Acting Mission Director"},
        "acting_supervisor": ACE_ACTING_SUPERVISOR,
        "transfer_log": snapshot,
        "alert": {
            "level": "urgent",
            "title": "NASA Ground Control Approval vs. Earth Signal Lag: SI Autonomous Override",
            "message": (
                f"Battery {battery_pct}% (<{ACE_THRESHOLD}%). NASA Ground Control approval would take about "
                f"{round(signal_lag_min * 2)} min round trip, longer than the remaining power window. "
                f"{ACE_ACTING_DIRECTOR} (Acting Mission Director) executes an SI Autonomous Override: "
                "non-essential loads shed, life support and grow lights preserved. Ground Control notified."
            ),
            "signal_lag_min": signal_lag_min,
            "approval": "pending",
            "override": True,
        },
        "snapshot_badge": ACE_SNAPSHOT_BADGE,
        "biome_assignment": None,
        "handover_record": (
            f"A.C.E. handover logged to NASA: B.I.O.M.E. (battery {battery_pct}%) -> {ACE_ACTING_DIRECTOR} "
            f"(Acting Manager); {ACE_ACTING_SUPERVISOR} promoted to Acting Supervisor; {stamp}."
        ),
        "synced_to_nasa": False,
        "dialogue": [
            {"agent": "L.U.M.E.N.", "message": SQUAD[5]["hazard"]},
            {"agent": "F.L.O.R.A.", "message": "A.C.E. engaged. I have the conn as Acting Mission Director."},
            {"agent": "A.E.G.I.S.", "message": "Acting Supervisor confirmed. Dome integrity holding."},
        ],
    }
