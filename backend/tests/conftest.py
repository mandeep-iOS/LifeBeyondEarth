import pytest
from fastapi.testclient import TestClient

from app import nasa_service
from app.main import app


@pytest.fixture(autouse=True)
def isolated_state(tmp_path, monkeypatch):
    monkeypatch.setenv("LBE_DB_PATH", str(tmp_path / "test.db"))
    nasa_service.clear_cache()


@pytest.fixture
def client():
    return TestClient(app)
