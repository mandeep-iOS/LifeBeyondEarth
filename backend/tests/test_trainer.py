def run(client, mission, **alloc):
    return client.post("/trainer/run", json={"mission_id": mission, "allocation": alloc}).json()


def test_missions_listed(client):
    ms = client.get("/trainer/missions").json()["missions"]
    assert [m["rank"] for m in ms] == ["Cadet", "Specialist", "Commander"]


def test_unknown_mission_404(client):
    assert client.post("/trainer/run", json={"mission_id": "nope"}).status_code == 404


def test_shielding_beats_no_shielding_in_flare(client):
    shielded = run(client, "commander-solar-flare", shielding=90, heating=40, water=40, led=50)
    bare = run(client, "commander-solar-flare", shielding=0, heating=40, water=40, led=50)
    assert shielded["timeline"][-1]["health"] > bare["timeline"][-1]["health"]
    assert shielded["timeline"][10]["radiation_damage"] < bare["timeline"][10]["radiation_damage"]


def test_overdraw_drains_battery_and_fails(client):
    r = run(client, "specialist-mars-dust", shielding=100, heating=100, water=100, led=100)
    assert r["timeline"][-1]["battery"] == 0 and r["passed"] is False


def test_balanced_cadet_passes_and_telemetry_present(client):
    r = run(client, "cadet-lunar", shielding=40, heating=60, water=50, led=50)
    assert r["passed"] is True
    assert {"o2_kg_day", "kcal", "pressure_kpa", "solar_kw"} <= r["timeline"][0].keys()
