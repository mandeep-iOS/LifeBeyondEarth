from fastapi import APIRouter

from app.data import PLANETS
from app.models import PlanetOut

router = APIRouter(prefix="/planets", tags=["planets"])


@router.get("", response_model=list[PlanetOut])
def list_planets() -> list[PlanetOut]:
    """Matches DataProvider<Planet>.fetch() on the iOS side — see
    RemotePlanetProvider.fetch()."""
    return PLANETS
