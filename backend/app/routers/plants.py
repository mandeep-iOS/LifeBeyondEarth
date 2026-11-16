from fastapi import APIRouter

from app.data import PLANTS
from app.models import PlantOut

router = APIRouter(prefix="/plants", tags=["plants"])


@router.get("", response_model=list[PlantOut])
def list_plants() -> list[PlantOut]:
    """Matches DataProvider<Plant>.fetch() on the iOS side — see
    RemotePlantProvider.fetch()."""
    return PLANTS
