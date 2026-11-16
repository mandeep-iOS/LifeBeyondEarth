import httpx

from app import nasa_service


def test_health_and_cors(client):
    r = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert r.json() == {"status": "ok"}
    assert r.headers["access-control-allow-origin"] == "*"


def test_catalog(client):
    assert len(client.get("/planets").json()) == 10
    assert len(client.get("/plants").json()) == 8


def test_predict_get_keeps_swift_dto_contract(client):
    body = client.get("/predict", params={"planet": "Mars", "plant": "Cactus"}).json()
    for key in ("survival_prediction", "risk_level", "main_threat", "confidence"):
        assert key in body
    assert body["survival_prediction"] == 35


def test_predict_post_has_explanation_and_factors(client):
    body = client.post("/predict", json={"planet": "Mars", "plant": "Cactus"}).json()
    assert body["explanation"]["title"] == "Why SI selected 🌵 Cactus"
    assert [f["name"] for f in body["factors"]] == ["Temperature", "Radiation", "Water", "Robot Memory"]


def test_unknown_names_404(client):
    assert client.get("/predict", params={"planet": "Xyz", "plant": "Cactus"}).status_code == 404
    assert client.post("/simulate", json={"planet": "Mars", "plant": "Nope"}).status_code == 404


def test_simulate_single_and_multi_day(client):
    one = client.post("/simulate", json={"planet": "Mars", "plant": "Cactus"}).json()
    assert one["final"]["new_health"] == 75
    assert one["final"]["new_robot_energy"] == 71
    assert one["final"]["robot_mode"] == "🟡 Support Mode"

    many = client.post("/simulate", json={"planet": "Mars", "plant": "Cactus", "days": 30}).json()
    assert many["days_simulated"] == len(many["timeline"]) < 30  # plant dies early
    assert many["final"]["new_health"] == 0
    assert many["final"]["robot_mode"] == "⚫ Mission Failed"


def test_robot_decide(client):
    r = client.post("/robot/decide", json={"planet": "Earth", "health": 100, "robot_energy": 100})
    assert r.json()["mode"] == "monitoring"


def test_memory_feeds_engines_and_history_roundtrip(client):
    m = client.post(
        "/memory",
        json={"planet_name": "🔴 Mars", "plant_name": "🌵 Cactus", "survival_score": 10},
    )
    assert m.status_code == 201
    assert len(client.get("/memory").json()) == 1
    assert len(client.get("/memory", params={"client_id": "other"}).json()) == 0

    p = client.post("/predict", json={"planet": "Mars", "plant": "Cactus"}).json()
    assert p["survival_prediction"] == 15  # 35 - 20
    p = client.post("/predict", json={"planet": "Mars", "plant": "Cactus", "use_memory": False}).json()
    assert p["survival_prediction"] == 35

    d = client.post("/robot/decide", json={"planet": "Mars", "health": 100, "robot_energy": 100}).json()
    assert d["mode"] == "emergency"

    h = client.post(
        "/history",
        json={
            "planet_name": "🔴 Mars", "plant_name": "🌵 Cactus", "days_survived": 3,
            "survival_score": 20, "survival_probability": 0.2,
        },
    )
    assert h.status_code == 201
    rows = client.get("/history").json()
    assert len(rows) == 1 and rows[0]["days_survived"] == 3


# ------------------------------------------------------------------- NASA

def test_nasa_fallback_when_upstream_down(client, monkeypatch):
    async def boom(url, params):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(nasa_service, "_get_json", boom)
    for path in ("/nasa/power", "/nasa/exoplanets", "/nasa/mars-photos", "/nasa/osdr"):
        body = client.get(path).json()
        assert body["source"] == "fallback", path
    assert client.get("/nasa/osdr").json()["studies"][0]["accession"].startswith("OSD-")


def test_nasa_live_then_cached(client, monkeypatch):
    calls = []

    async def fake(url, params):
        calls.append(url)
        return {"properties": {"parameter": {"T2M": {"20240101": 10.0, "20240102": 20.0, "20240103": -999}}}}

    monkeypatch.setattr(nasa_service, "_get_json", fake)
    first = client.get("/nasa/power").json()
    second = client.get("/nasa/power").json()
    assert first["source"] == "live" and second["source"] == "cache"
    assert first["summary"]["avg_temp_c"] == 15.0
    assert len(calls) == 1


def test_nasa_default_key(monkeypatch):
    monkeypatch.delenv("NASA_API_KEY", raising=False)
    assert nasa_service.api_key() == "DEMO_KEY"


def test_space_weather_fallback_and_threat_level(client, monkeypatch):
    async def boom(*a, **k):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(nasa_service, "_get_json", boom)
    body = client.get("/nasa/space-weather").json()
    assert body["source"] == "fallback"
    assert body["threat_level"] == "severe"
    assert body["alerts"]


def test_new_nasa_crops_present(client):
    names = [p["name"] for p in client.get("/plants").json()]
    for crop in ("Red Romaine Lettuce", "Space Cabbage", "Mizuna Mustard", "Dwarf Tomato"):
        assert any(crop in n for n in names)


def test_biodome_execute_runs_all_agents(client):
    body = client.post(
        "/biodome/execute",
        json={"directive": "Build a Red Romaine Lettuce bio-dome on Mars Jezero Crater and run outside surface exposure trials"},
    ).json()
    assert body["site"] == "Jezero Crater"
    assert "Lettuce" in body["crop"]
    agents = {s["agent"] for s in body["steps"]}
    assert {"Recon-01", "Mason-02", "Assembler-03", "Commander-Prime SI"} <= agents
    assert body["final"]["inside_health"] > body["final"]["outside_health"]
    assert body["telemetry"]


def test_biodome_emergency_alerts_nasa(client, monkeypatch):
    async def boom(*a, **k):
        raise httpx.ConnectError("offline")

    monkeypatch.setattr(nasa_service, "_get_json", boom)
    body = client.post("/biodome/emergency", json={"crisis": "solar_flare", "inside_health": 90, "outside_health": 60}).json()
    assert body["after"]["outside_health"] < 60
    assert body["telemetry"]["level"] == "urgent"
    assert body["actions"]


def test_biodome_rejects_gibberish_directive(client):
    r = client.post("/biodome/execute", json={"directive": "kdsfhakdasfh983492874987324"})
    assert r.status_code == 422
    assert "planet" in r.json()["detail"]


def test_ace_failover_triggers_below_threshold(client):
    r = client.post("/biodome/failover", json={"battery_pct": 10}).json()
    assert r["triggered"] and r["acting_supervisor"] == "A.E.G.I.S."
    assert "F.L.O.R.A." in r["active_control"]["to"] and r["alert"]["override"]
    assert client.post("/biodome/failover", json={"battery_pct": 40}).json()["status"] == "nominal"


def test_ace_recharge_syncs_black_box(client):
    r = client.post("/biodome/failover", json={"battery_pct": 5, "recharge": True}).json()
    assert r["status"] == "restored" and r["synced_to_nasa"] and r["active_control"]["to"] == "B.I.O.M.E."


def test_biodome_squad_roster(client):
    ids = [m["id"] for m in client.get("/biodome/squad").json()["squad"]]
    assert ids == ["B.I.O.M.E.", "F.L.O.R.A.", "S.P.R.O.U.T.", "H.Y.D.R.O.", "A.E.G.I.S.", "L.U.M.E.N."]
