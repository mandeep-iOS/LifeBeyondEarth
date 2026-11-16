from fastapi import HTTPException

from app.data import find_planet, find_plant
from app.models import PlanetOut, PlantOut


def planet_or_404(name: str, inline: PlanetOut | None = None) -> PlanetOut:
    if inline is not None:
        return inline
    planet = find_planet(name)
    if planet is None:
        raise HTTPException(status_code=404, detail=f"Unknown planet: {name}")
    return planet


def plant_or_404(name: str) -> PlantOut:
    plant = find_plant(name)
    if plant is None:
        raise HTTPException(status_code=404, detail=f"Unknown plant: {name}")
    return plant
