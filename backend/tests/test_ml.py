import pytest

from app.data import find_planet, find_plant
from app.engines import biodome, ml


@pytest.fixture(autouse=True)
def fresh_model():
    ml.reset_cache()
    yield
    ml.reset_cache()


def test_model_quality_and_importances():
    meta = ml.importance()
    assert meta["r2"] > 0.8
    assert 0 <= meta["mae"] < 15
    imps = meta["importances"]
    assert len(imps) == len(ml.FEATURES)
    assert abs(sum(i["importance"] for i in imps) - 1.0) < 0.05
    assert imps == sorted(imps, key=lambda i: i["importance"], reverse=True)


def test_predict_ranks_hostile_below_friendly():
    lettuce = find_plant("Red Romaine Lettuce")
    earth = ml.predict(find_planet("Earth"), lettuce)["predicted_score"]
    mars = ml.predict(find_planet("Mars"), lettuce)["predicted_score"]
    assert 0 <= mars <= 100
    assert earth > mars


def test_api_endpoints(client):
    r = client.post("/ml/predict", json={"planet": "Mars", "plant": "Space Cabbage"})
    assert r.status_code == 200
    assert {"predicted_score", "r2", "mae", "importances"} <= r.json().keys()
    assert client.get("/ml/importance").json()["importances"]
    assert client.post("/ml/predict", json={"planet": "Nowhere", "plant": "Moss"}).status_code == 404


@pytest.mark.parametrize("text", [
    "grow food", "asdf mars", "Build a dome on Mars", "lettuce please", "plant something on a surface",
])
def test_incomplete_directives_rejected(text):
    assert biodome.validate_directive(text) == biodome.INVALID_DIRECTIVE_MESSAGE


@pytest.mark.parametrize("text", [
    "Grow tomato on Mars", "Establish Space Cabbage dome at Shackleton Crater", *biodome.PRESETS,
])
def test_complete_directives_accepted(text):
    assert biodome.validate_directive(text) is None
