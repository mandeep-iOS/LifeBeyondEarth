# LifeBeyondEarth backend

FastAPI service backing the LifeBeyondEarth iOS app's Remote providers.

## Run it

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then check it's alive:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/planets
curl http://127.0.0.1:8000/plants
curl "http://127.0.0.1:8000/predict?planet=Mars&plant=Cactus"
```

Interactive docs (Swagger UI) are auto-generated at
http://127.0.0.1:8000/docs once the server is running.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/planets`, `/plants` | catalog (`RemotePlanetProvider` / `RemotePlantProvider`) |
| GET | `/predict?planet=&plant=` | Swift-compatible; extra `reason`/`explanation`/`factors` fields are additive |
| POST | `/predict` | same engine, JSON body `{planet, plant, client_id?, use_memory?}` |
| POST | `/simulate` | `{planet, plant, health?, robot_energy?, days?}` -> per-day timeline |
| POST | `/robot/decide` | `{planet, health, robot_energy}` -> action/priority/mode |
| GET/POST | `/history`, `/memory` | SQLite (`data/lifebeyondearth.db`, override with `LBE_DB_PATH`); scoped by `client_id` |
| GET | `/nasa/power`, `/nasa/exoplanets`, `/nasa/mars-photos`, `/nasa/osdr` | cached proxies with static fallback; `source` = live/cache/fallback |
| GET | `/nasa/space-weather` | NASA DONKI flares/SEP alerts + threat level |
| POST | `/biodome/execute`, `/biodome/emergency` | autonomous Bio-Dome Lab mission + SI emergency override |
| GET | `/health` | |

Engines in `app/engines/` are ports of the Swift engines; `tests/` pins
their outputs to values derived from the Swift code. Copy `.env.example`
to `.env` to set `NASA_API_KEY` (defaults to `DEMO_KEY`).
Run tests: `python -m pytest`.

## Talking to it from the iOS Simulator

The Simulator shares your Mac's network, so `http://127.0.0.1:8000`
(the default in `APIEnvironment.local`) works with no extra setup —
`localhost`/loopback addresses are exempt from iOS's App Transport
Security by default.

Testing on a **physical device** requires your Mac's LAN IP instead
of `127.0.0.1` (e.g. `http://192.168.1.23:8000`), and — since that's
no longer a loopback address — an ATS exception added in Xcode's
Info settings for local development. Don't ship that exception in a
release build.

## Notes

- The Mars Rover Photos API (api.nasa.gov) currently returns an error, so
  `/nasa/mars-photos` serves its static seed.
- The SwiftUI app still uses its own on-device engines; Remote mode only
  uses `/planets`, `/plants`, `/predict`.
