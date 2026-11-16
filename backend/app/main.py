from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.nasa_service import router as nasa_router
from app.routers import biodome, history, ml, planets, plants, predictions, simulation, trainer

app = FastAPI(
    title="Life Beyond Earth API",
    version="0.2.0",
    description="Backend for the LifeBeyondEarth apps (SwiftUI + web). Serves "
    "planet/plant data, the survival/robot/prediction engines (ports of the "
    "Swift engines), history & robot memory, and cached NASA data proxies.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(planets.router)
app.include_router(plants.router)
app.include_router(predictions.router)
app.include_router(simulation.router)
app.include_router(history.router)
app.include_router(nasa_router)
app.include_router(biodome.router)
app.include_router(trainer.router)
app.include_router(ml.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
