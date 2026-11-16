"""Machine-learning survival model for the trained SI.

A regressor is trained on physics-generated planet/plant samples (labelled by
the deterministic prediction engine) plus real mission rows from the SQLite
history table. Ridge and GradientBoosting are compared on a held-out split and
the better one is cached. Permutation importance explains what drives survival.
"""

import threading

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from app import db
from app.data import find_planet, find_plant
from app.engines.prediction import calculate_score
from app.models import PlanetOut, PlantOut

SEED = 42
N_SYNTHETIC = 2500
FEATURES = [
    "Planet temperature",
    "Atmospheric pressure",
    "Radiation level",
    "Water available",
    "Plant cold tolerance",
    "Plant water need",
    "Plant radiation tolerance",
    "Temperature margin",
    "Radiation margin",
]

_lock = threading.Lock()
_cache: dict = {}


def featurize(planet: PlanetOut, plant: PlantOut) -> list[float]:
    return [
        float(planet.temperature),
        float(np.log10(1.0 + max(planet.pressure, 0.0))),
        float(planet.radiation),
        1.0 if planet.water_available else 0.0,
        float(plant.cold_tolerance),
        float(plant.water_need),
        float(plant.radiation_tolerance),
        float(planet.temperature - plant.cold_tolerance),
        float(plant.radiation_tolerance - planet.radiation),
    ]


def _synthetic(rng: np.random.Generator) -> tuple[list[list[float]], list[float]]:
    X, y = [], []
    for _ in range(N_SYNTHETIC):
        planet = PlanetOut(
            name="synthetic",
            temperature=int(rng.integers(-230, 60)),
            pressure=float(10 ** rng.uniform(-3, 3)),
            radiation=int(rng.integers(0, 101)),
            water_available=bool(rng.integers(0, 2)),
        )
        plant = PlantOut(
            name="synthetic",
            cold_tolerance=int(rng.integers(-35, 10)),
            water_need=int(rng.integers(10, 100)),
            radiation_tolerance=int(rng.integers(5, 60)),
        )
        X.append(featurize(planet, plant))
        y.append(float(calculate_score(planet, plant, [])))
    return X, y


def _history_rows() -> tuple[list[list[float]], list[float]]:
    X, y = [], []
    try:
        with db.connect() as conn:
            rows = conn.execute("SELECT planet_name, plant_name, survival_score FROM history").fetchall()
    except Exception:
        return X, y
    for r in rows:
        planet, plant = find_planet(r["planet_name"]), find_plant(r["plant_name"])
        if planet and plant:
            X.append(featurize(planet, plant))
            y.append(float(r["survival_score"]))
    return X, y


def _train() -> dict:
    rng = np.random.default_rng(SEED)
    X, y = _synthetic(rng)
    hx, hy = _history_rows()
    # Real missions are weighted up so they are not drowned out by synthetic data.
    weights = [1.0] * len(X) + [5.0] * len(hx)
    X, y = X + hx, y + hy
    X_arr, y_arr, w_arr = np.array(X), np.array(y), np.array(weights)
    Xtr, Xte, ytr, yte, wtr, _ = train_test_split(X_arr, y_arr, w_arr, test_size=0.2, random_state=SEED)

    candidates = {
        "Ridge": make_pipeline(StandardScaler(), Ridge(alpha=1.0)),
        "GradientBoosting": GradientBoostingRegressor(n_estimators=200, max_depth=3, learning_rate=0.1, random_state=SEED),
    }
    best_name, best_model, best_r2 = "", None, -np.inf
    for name, model in candidates.items():
        if name == "Ridge":
            model.fit(Xtr, ytr, ridge__sample_weight=wtr)
        else:
            model.fit(Xtr, ytr, sample_weight=wtr)
        r2 = r2_score(yte, model.predict(Xte))
        if r2 > best_r2:
            best_name, best_model, best_r2 = name, model, r2

    pred = np.clip(best_model.predict(Xte), 0, 100)
    perm = permutation_importance(best_model, Xte, yte, n_repeats=5, random_state=SEED)
    raw = np.clip(perm.importances_mean, 0, None)
    total = raw.sum() or 1.0
    importances = sorted(
        ({"feature": f, "importance": round(float(v / total), 4)} for f, v in zip(FEATURES, raw)),
        key=lambda d: d["importance"],
        reverse=True,
    )
    return {
        "model": best_model,
        "meta": {
            "model_name": best_name,
            "r2": round(float(r2_score(yte, pred)), 4),
            "mae": round(float(mean_absolute_error(yte, pred)), 2),
            "samples": int(len(X_arr)),
            "history_samples": len(hx),
            "importances": importances,
        },
    }


def get_model() -> dict:
    """Trains lazily and retrains only when the number of history rows changes."""
    hist_count = len(_history_rows()[0])
    with _lock:
        if _cache.get("hist_count") != hist_count:
            _cache.update(_train())
            _cache["hist_count"] = hist_count
        return _cache


def importance() -> dict:
    return dict(get_model()["meta"])


def predict(planet: PlanetOut, plant: PlantOut) -> dict:
    state = get_model()
    score = float(state["model"].predict(np.array([featurize(planet, plant)]))[0])
    meta = state["meta"]
    return {
        "planet": planet.name,
        "plant": plant.name,
        "predicted_score": int(round(max(0.0, min(100.0, score)))),
        "model_name": meta["model_name"],
        "r2": meta["r2"],
        "mae": meta["mae"],
        "importances": meta["importances"],
    }


def reset_cache() -> None:
    with _lock:
        _cache.clear()

