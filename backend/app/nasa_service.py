"""Cached proxy to public NASA data sources, mounted under /nasa/*.

Every route returns {"source": "live" | "cache" | "fallback", ...}. If the
upstream call fails (offline, rate limit, API retired) the route serves a
small static seed instead, so the apps always have something to show.
Keys come from the environment (.env): NASA_API_KEY, default DEMO_KEY.
"""

import os
import time
from typing import Any, Awaitable, Callable

import httpx
from dotenv import load_dotenv
from datetime import date, timedelta

from fastapi import APIRouter, Query

load_dotenv()

CACHE_TTL_SECONDS = int(os.environ.get("NASA_CACHE_TTL", "3600"))
HTTP_TIMEOUT = float(os.environ.get("NASA_HTTP_TIMEOUT", "15"))

router = APIRouter(prefix="/nasa", tags=["nasa"])

_cache: dict[str, tuple[float, Any]] = {}


def api_key() -> str:
    return os.environ.get("NASA_API_KEY") or "DEMO_KEY"


def clear_cache() -> None:
    _cache.clear()


async def cached(
    key: str,
    fetch: Callable[[], Awaitable[Any]],
    fallback: Callable[[], Any],
) -> dict:
    now = time.monotonic()
    hit = _cache.get(key)
    if hit and now - hit[0] < CACHE_TTL_SECONDS:
        return {"source": "cache", **hit[1]}
    try:
        data = await fetch()
    except Exception as exc:  # network, HTTP status, or parse failure
        return {"source": "fallback", "note": f"upstream unavailable: {type(exc).__name__}", **fallback()}
    _cache[key] = (now, data)
    return {"source": "live", **data}


async def _get_json(url: str, params: dict) -> Any:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()


# ---------------------------------------------------------------- POWER

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Approximate long-term climate of classic Mars/Moon analog sites.
ANALOG_SITES = [
    {"name": "Atacama Desert, Chile", "lat": -24.5, "lon": -69.25, "analog_for": "Mars (aridity)", "avg_temp_c": 16.0, "solar_kwh_m2_day": 7.5, "precip_mm_day": 0.0},
    {"name": "Devon Island, Canada", "lat": 75.4, "lon": -89.0, "analog_for": "Mars (cold, polar desert)", "avg_temp_c": -15.0, "solar_kwh_m2_day": 2.4, "precip_mm_day": 0.2},
    {"name": "McMurdo Dry Valleys, Antarctica", "lat": -77.5, "lon": 162.5, "analog_for": "Mars (cold, hyper-arid)", "avg_temp_c": -20.0, "solar_kwh_m2_day": 3.0, "precip_mm_day": 0.0},
    {"name": "Mauna Kea, Hawaii", "lat": 19.8, "lon": -155.5, "analog_for": "Moon (regolith, low humidity)", "avg_temp_c": 3.0, "solar_kwh_m2_day": 6.5, "precip_mm_day": 0.3},
]


def _power_fallback(lat: float, lon: float) -> dict:
    nearest = min(ANALOG_SITES, key=lambda s: (s["lat"] - lat) ** 2 + (s["lon"] - lon) ** 2)
    return {"latitude": lat, "longitude": lon, "analog_sites": ANALOG_SITES, "nearest_seed": nearest}


@router.get("/power")
async def power(
    lat: float = Query(-24.5, ge=-90, le=90, description="Default: Atacama Desert"),
    lon: float = Query(-69.25, ge=-180, le=180),
    start: str = Query("20240101", pattern=r"^\d{8}$"),
    end: str = Query("20240131", pattern=r"^\d{8}$"),
) -> dict:
    """NASA POWER daily climate for an Earth analog site: temperature (T2M),
    solar irradiance (ALLSKY_SFC_SW_DWN) and precipitation (PRECTOTCORR)."""

    async def fetch() -> dict:
        raw = await _get_json(
            POWER_URL,
            {
                "parameters": "T2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR",
                "community": "RE",
                "latitude": lat,
                "longitude": lon,
                "start": start,
                "end": end,
                "format": "JSON",
            },
        )
        params = raw["properties"]["parameter"]

        def mean(series: dict) -> float | None:
            vals = [v for v in series.values() if v != -999]
            return round(sum(vals) / len(vals), 2) if vals else None

        return {
            "latitude": lat,
            "longitude": lon,
            "start": start,
            "end": end,
            "summary": {
                "avg_temp_c": mean(params.get("T2M", {})),
                "avg_solar_kwh_m2_day": mean(params.get("ALLSKY_SFC_SW_DWN", {})),
                "avg_precip_mm_day": mean(params.get("PRECTOTCORR", {})),
            },
            "daily": params,
        }

    return await cached(f"power:{lat}:{lon}:{start}:{end}", fetch, lambda: _power_fallback(lat, lon))


# ----------------------------------------------------- Exoplanet Archive

TAP_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync"

EXOPLANET_SEEDS = [
    {"name": "TRAPPIST-1 e", "host": "TRAPPIST-1", "equilibrium_temp_k": 251, "radius_earth": 0.92, "orbit_au": 0.029, "discovery_year": 2017},
    {"name": "Proxima Centauri b", "host": "Proxima Cen", "equilibrium_temp_k": 234, "radius_earth": 1.07, "orbit_au": 0.0485, "discovery_year": 2016},
    {"name": "Kepler-442 b", "host": "Kepler-442", "equilibrium_temp_k": 233, "radius_earth": 1.34, "orbit_au": 0.409, "discovery_year": 2015},
    {"name": "LHS 1140 b", "host": "LHS 1140", "equilibrium_temp_k": 226, "radius_earth": 1.73, "orbit_au": 0.0875, "discovery_year": 2017},
]


@router.get("/exoplanets")
async def exoplanets(
    limit: int = Query(10, ge=1, le=50),
    min_temp_k: int = Query(180, ge=0, le=5000),
    max_temp_k: int = Query(320, ge=0, le=5000),
    max_radius_earth: float = Query(2.0, gt=0, le=30),
) -> dict:
    """Rocky, temperate exoplanet candidates from the NASA Exoplanet Archive
    (TAP, table `ps`), filtered by equilibrium temperature and radius."""

    query = (
        f"select top {limit} pl_name,hostname,pl_eqt,pl_rade,pl_orbsmax,disc_year "
        "from ps where default_flag=1 "
        f"and pl_eqt between {min_temp_k} and {max_temp_k} "
        f"and pl_rade is not null and pl_rade <= {max_radius_earth} "
        "order by disc_year desc"
    )

    async def fetch() -> dict:
        rows = await _get_json(TAP_URL, {"query": query, "format": "json"})
        return {
            "count": len(rows),
            "planets": [
                {
                    "name": r["pl_name"],
                    "host": r["hostname"],
                    "equilibrium_temp_k": r["pl_eqt"],
                    "radius_earth": r["pl_rade"],
                    "orbit_au": r["pl_orbsmax"],
                    "discovery_year": r["disc_year"],
                }
                for r in rows
            ],
        }

    def fallback() -> dict:
        seeds = [
            s for s in EXOPLANET_SEEDS
            if min_temp_k <= s["equilibrium_temp_k"] <= max_temp_k and s["radius_earth"] <= max_radius_earth
        ][:limit]
        return {"count": len(seeds), "planets": seeds}

    key = f"exo:{limit}:{min_temp_k}:{max_temp_k}:{max_radius_earth}"
    return await cached(key, fetch, fallback)


# ------------------------------------------------------- Mars Rover Photos

MARS_URL = "https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos"

MARS_PHOTO_SEEDS = [
    {
        "id": 102693,
        "sol": 1000,
        "rover": "Curiosity",
        "camera": "FHAZ",
        "earth_date": "2015-05-30",
        "img_src": "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/01000/opgs/edr/fcam/FLB_486265257EDR_F0481570FHAZ00323M_.JPG",
    }
]


@router.get("/mars-photos")
async def mars_photos(
    rover: str = Query("curiosity", pattern="^(curiosity|opportunity|spirit|perseverance)$"),
    sol: int = Query(1000, ge=0),
    camera: str | None = Query(None, max_length=10),
    limit: int = Query(12, ge=1, le=50),
) -> dict:
    """Mars Rover Photos API (api.nasa.gov). The upstream service is
    frequently unavailable, in which case a static seed photo is returned."""

    async def fetch() -> dict:
        params: dict[str, Any] = {"sol": sol, "api_key": api_key()}
        if camera:
            params["camera"] = camera
        raw = await _get_json(MARS_URL.format(rover=rover), params)
        photos = [
            {
                "id": p["id"],
                "sol": p["sol"],
                "rover": p["rover"]["name"],
                "camera": p["camera"]["name"],
                "earth_date": p["earth_date"],
                "img_src": p["img_src"],
            }
            for p in raw["photos"][:limit]
        ]
        return {"count": len(photos), "photos": photos}

    def fallback() -> dict:
        return {"count": len(MARS_PHOTO_SEEDS), "photos": MARS_PHOTO_SEEDS}

    return await cached(f"mars:{rover}:{sol}:{camera}:{limit}", fetch, fallback)


# --------------------------------------------------------- GeneLab / OSDR

OSDR_URL = "https://osdr.nasa.gov/osdr/data/search"
OSDR_STUDY_URL = "https://osdr.nasa.gov/bio/repo/data/studies/{accession}"

OSDR_SEEDS = [
    {"accession": "OSD-971", "title": "Genetic alterations of the putrescine metabolic pathway attenuate plant responses to spaceflight", "organism": "Arabidopsis thaliana"},
    {"accession": "OSD-615", "title": "Glycome profiling and immunohistochemistry uncover changes in cell walls of Arabidopsis thaliana roots during spaceflight: APEX 03-1", "organism": "Arabidopsis thaliana"},
    {"accession": "OSD-205", "title": "HSFA2 functions in the physiological adaptation of undifferentiated plant cells to spaceflight microgravity environment", "organism": "Arabidopsis thaliana"},
    {"accession": "OSD-772", "title": "PH-04 Chile Peppers in Space", "organism": "Capsicum annuum"},
]
for _s in OSDR_SEEDS:
    _s["url"] = OSDR_STUDY_URL.format(accession=_s["accession"])


@router.get("/osdr")
async def osdr(
    term: str = Query("plant spaceflight", min_length=2, max_length=100),
    limit: int = Query(6, ge=1, le=25),
) -> dict:
    """Plant-in-space study references from NASA GeneLab / OSDR, used as
    scientific evidence behind the survival predictions."""

    async def fetch() -> dict:
        raw = await _get_json(OSDR_URL, {"term": term, "type": "cgene", "size": limit})
        studies = []
        for hit in raw["hits"]["hits"]:
            src = hit["_source"]
            accession = src.get("Accession")
            studies.append(
                {
                    "accession": accession,
                    "title": src.get("Study Title"),
                    "organism": src.get("organism"),
                    "url": OSDR_STUDY_URL.format(accession=accession),
                }
            )
        return {"count": len(studies), "studies": studies}

    def fallback() -> dict:
        return {"count": len(OSDR_SEEDS[:limit]), "studies": OSDR_SEEDS[:limit]}

    return await cached(f"osdr:{term}:{limit}", fetch, fallback)


# ------------------------------------------------------ DONKI space weather

DONKI_URL = "https://api.nasa.gov/DONKI/{kind}"

DONKI_SEEDS = [
    {"id": "2024-05-14T17:26:00-FLR-001", "type": "Solar Flare", "class": "X8.7", "begin_time": "2024-05-14T16:46Z", "peak_time": "2024-05-14T17:26Z", "source_region": "AR3664", "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
    {"id": "2024-05-11T01:23:00-FLR-001", "type": "Solar Flare", "class": "X5.8", "begin_time": "2024-05-11T01:10Z", "peak_time": "2024-05-11T01:23Z", "source_region": "AR3664", "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
    {"id": "2024-05-10T07:31:00-SEP-001", "type": "Solar Energetic Particle", "class": "S3", "begin_time": "2024-05-10T07:31Z", "peak_time": None, "source_region": "AR3664", "link": "https://kauai.ccmc.gsfc.nasa.gov/DONKI/"},
]


def _flare_rank(flare_class: str | None) -> int:
    """C=1, M=2, X=3 (plus 1 for X5+); unknown classes rank 0."""
    if not flare_class:
        return 0
    letter = flare_class[0].upper()
    base = {"A": 0, "B": 0, "C": 1, "M": 2, "X": 3}.get(letter, 0)
    try:
        if letter == "X" and float(flare_class[1:]) >= 5:
            base += 1
    except ValueError:
        pass
    return base


def _space_weather_summary(alerts: list[dict]) -> dict:
    rank = 0
    for a in alerts:
        r = _flare_rank(a["class"]) if a["type"] == "Solar Flare" else 3
        rank = max(rank, r)
    level = ["quiet", "low", "moderate", "high", "severe"][min(rank, 4)]
    radiation_multiplier = [1.0, 1.1, 1.3, 1.6, 2.0][min(rank, 4)]
    headline = (
        f"{len(alerts)} DONKI alert(s); peak threat level: {level}"
        if alerts
        else "No recent solar flare or particle events reported"
    )
    return {
        "count": len(alerts),
        "threat_level": level,
        "radiation_multiplier": radiation_multiplier,
        "summary": headline,
        "alerts": alerts,
    }


@router.get("/space-weather")
async def space_weather(days: int = Query(30, ge=1, le=30)) -> dict:
    """NASA DONKI (Space Weather Database) solar flares and solar energetic
    particle events for the last `days` days, with a derived threat level
    that the Bio-Dome emergency logic uses as its radiation multiplier."""

    async def fetch() -> dict:
        end = date.today()
        params = {
            "startDate": (end - timedelta(days=days)).isoformat(),
            "endDate": end.isoformat(),
            "api_key": api_key(),
        }
        flares = await _get_json(DONKI_URL.format(kind="FLR"), params)
        seps = await _get_json(DONKI_URL.format(kind="SEP"), params)
        alerts = [
            {
                "id": f.get("flrID"),
                "type": "Solar Flare",
                "class": f.get("classType"),
                "begin_time": f.get("beginTime"),
                "peak_time": f.get("peakTime"),
                "source_region": f.get("sourceLocation") or str(f.get("activeRegionNum") or ""),
                "link": f.get("link"),
            }
            for f in flares
        ] + [
            {
                "id": s.get("sepID"),
                "type": "Solar Energetic Particle",
                "class": None,
                "begin_time": s.get("eventTime"),
                "peak_time": None,
                "source_region": "",
                "link": s.get("link"),
            }
            for s in seps
        ]
        alerts.sort(key=lambda a: a["begin_time"] or "", reverse=True)
        return _space_weather_summary(alerts[:20])

    return await cached(f"donki:{days}", fetch, lambda: _space_weather_summary(DONKI_SEEDS))
