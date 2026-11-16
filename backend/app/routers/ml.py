from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data import find_planet, find_plant
from app.engines import ml
from app.models import PlanetOut

router = APIRouter(prefix="/ml", tags=["ml"])


class MlPredictRequest(BaseModel):
    planet: str
    plant: str
    planet_data: PlanetOut | None = None


@router.post("/predict")
def predict(body: MlPredictRequest) -> dict:
    planet = body.planet_data or find_planet(body.planet)
    plant = find_plant(body.plant)
    if planet is None or plant is None:
        raise HTTPException(status_code=404, detail="Unknown planet or plant")
    return ml.predict(planet, plant)


@router.get("/importance")
def importance() -> dict:
    return ml.importance()
