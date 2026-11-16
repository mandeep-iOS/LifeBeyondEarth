from fastapi import APIRouter, Query, Header

from app import db
from app.engines import prediction
from app.models import PredictionOut, PredictRequest
from app.routers._common import planet_or_404, plant_or_404

router = APIRouter(tags=["predictions"])


def _run(planet: str, plant: str, client_id: str, use_memory: bool, mission_key: str = "1042", inline=None) -> PredictionOut:
    memories = db.load_memories(client_id, mission_key) if use_memory else []
    return prediction.predict(planet_or_404(planet, inline), plant_or_404(plant), memories)


@router.get("/predict", response_model=PredictionOut)
def predict_get(
    planet: str = Query(..., description="Planet name, e.g. 'Mars'"),
    plant: str = Query(..., description="Plant name, e.g. 'Cactus'"),
    client_id: str = "default",
    use_memory: bool = True,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> PredictionOut:
    """Backward-compatible route used by the SwiftUI RemotePredictionProvider.
    Same scoring as the on-device AIMissionPredictionEngine; extra
    explainability fields are additive."""
    return _run(planet, plant, client_id, use_memory, x_mission_key)


@router.post("/predict", response_model=PredictionOut)
def predict_post(
    body: PredictRequest,
    x_mission_key: str = Header("1042", alias="X-Mission-Key")
) -> PredictionOut:
    """Survival prediction with explanation text and per-factor impacts."""
    return _run(body.planet, body.plant, body.client_id, body.use_memory, x_mission_key, body.planet_data)
