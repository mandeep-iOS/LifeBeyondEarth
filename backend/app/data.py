"""
Server-side catalog of planets and plants. Deliberately kept in sync
with the bundled Swift catalog (Domain/Models/Planet.swift and
Plant.swift) so that switching an iOS DataSourceMode from .local to
.remote returns data that lines up with what the app already ships
with — same names, same characteristics. As real NASA data / user
content comes in, this becomes the seed data instead of the whole
catalog.
"""

from app.models import PlanetOut, PlantOut

PLANETS: list[PlanetOut] = [
    PlanetOut(name="☄️ Mercury", temperature=167, pressure=0, radiation=95, water_available=False),
    PlanetOut(name="🟠 Venus", temperature=464, pressure=9200, radiation=20, water_available=False),
    PlanetOut(name="🌍 Earth", temperature=15, pressure=101.3, radiation=10, water_available=True),
    PlanetOut(name="🔴 Mars", temperature=-63, pressure=0.6, radiation=80, water_available=False),
    PlanetOut(name="🟤 Jupiter", temperature=-145, pressure=2000, radiation=100, water_available=False),
    PlanetOut(name="🪐 Saturn", temperature=-178, pressure=1400, radiation=70, water_available=False),
    PlanetOut(name="🔵 Uranus", temperature=-224, pressure=1000, radiation=40, water_available=False),
    PlanetOut(name="🔷 Neptune", temperature=-214, pressure=1200, radiation=45, water_available=False),
    PlanetOut(name="⚪ Pluto", temperature=-229, pressure=0.001, radiation=25, water_available=False),
    PlanetOut(name="🌙 Moon", temperature=-20, pressure=0, radiation=90, water_available=False),
]

PLANTS: list[PlantOut] = [
    PlantOut(name="🌵 Cactus", cold_tolerance=-10, water_need=20, radiation_tolerance=50),
    PlantOut(name="🌿 Moss", cold_tolerance=-30, water_need=50, radiation_tolerance=30),
    PlantOut(name="🌳 Tree", cold_tolerance=0, water_need=90, radiation_tolerance=10),
    PlantOut(name="🌱 Grass", cold_tolerance=-5, water_need=60, radiation_tolerance=20),
    # NASA ISS Veggie & Plant Biology Program crops.
    PlantOut(name="🥬 Red Romaine Lettuce", cold_tolerance=-2, water_need=65, radiation_tolerance=35),
    PlantOut(name="🥗 Space Cabbage", cold_tolerance=-5, water_need=70, radiation_tolerance=40),
    PlantOut(name="🍃 Mizuna Mustard", cold_tolerance=-4, water_need=55, radiation_tolerance=45),
    PlantOut(name="🍅 Dwarf Tomato", cold_tolerance=5, water_need=80, radiation_tolerance=25),
]


def find_planet(name: str) -> PlanetOut | None:
    return next((p for p in PLANETS if p.name == name or name.lower() in p.name.lower()), None)


def find_plant(name: str) -> PlantOut | None:
    return next((p for p in PLANTS if p.name == name or name.lower() in p.name.lower()), None)
