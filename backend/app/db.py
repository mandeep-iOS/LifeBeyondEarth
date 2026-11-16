"""Lightweight SQLite storage (stdlib sqlite3) for history and robot memory."""

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from app.models import (
    HistoryIn,
    HistoryOut,
    MemoryIn,
    MemoryOut,
    MemoryRecord,
)

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "lifebeyondearth.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    mission_key TEXT NOT NULL DEFAULT '1042',
    planet_name TEXT NOT NULL,
    plant_name TEXT NOT NULL,
    days_survived INTEGER NOT NULL,
    survival_score INTEGER NOT NULL,
    survival_probability REAL NOT NULL,
    robot_action TEXT NOT NULL DEFAULT '',
    reason TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '',
    difficulty_level TEXT NOT NULL DEFAULT '',
    difficulty_explanation TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    mission_key TEXT NOT NULL DEFAULT '1042',
    planet_name TEXT NOT NULL,
    plant_name TEXT NOT NULL,
    survival_score INTEGER NOT NULL,
    days_survived INTEGER NOT NULL DEFAULT 0,
    mission_result TEXT NOT NULL DEFAULT '',
    lesson_learned TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_history_client ON history(client_id);
CREATE INDEX IF NOT EXISTS idx_history_mission_client ON history(mission_key, client_id);
CREATE INDEX IF NOT EXISTS idx_memory_client ON memory(client_id);
CREATE INDEX IF NOT EXISTS idx_memory_mission_client ON memory(mission_key, client_id);
"""


def db_path() -> Path:
    # Read per call so tests (and deployments) can redirect the file.
    return Path(os.environ.get("LBE_DB_PATH", DEFAULT_DB))


@contextmanager
def connect():
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SCHEMA)
        # Backward compatibility migration: add mission_key column if it doesn't exist
        # This handles existing databases gracefully
        try:
            conn.execute("ALTER TABLE history ADD COLUMN mission_key TEXT NOT NULL DEFAULT '1042'")
        except sqlite3.OperationalError:
            pass  # Column already exists
        try:
            conn.execute("ALTER TABLE memory ADD COLUMN mission_key TEXT NOT NULL DEFAULT '1042'")
        except sqlite3.OperationalError:
            pass  # Column already exists
        yield conn
        conn.commit()
    finally:
        conn.close()


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def add_history(item: HistoryIn, mission_key: str = "1042") -> HistoryOut:
    with connect() as conn:
        created = _now()
        cur = conn.execute(
            """INSERT INTO history (client_id, mission_key, planet_name, plant_name, days_survived,
               survival_score, survival_probability, robot_action, reason, status,
               difficulty_level, difficulty_explanation, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                item.client_id,
                mission_key,
                item.planet_name,
                item.plant_name,
                item.days_survived,
                item.survival_score,
                item.survival_probability,
                item.robot_action,
                item.reason,
                item.status,
                item.difficulty_level,
                item.difficulty_explanation,
                created,
            ),
        )
        row_id = cur.lastrowid
    data = item.model_dump(exclude={"client_id"})
    return HistoryOut(id=row_id, created_at=created, **data)


def list_history(client_id: str, mission_key: str = "1042", limit: int = 100) -> list[HistoryOut]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM history WHERE client_id = ? AND mission_key = ? ORDER BY id DESC LIMIT ?",
            (client_id, mission_key, limit),
        ).fetchall()
    return [
        HistoryOut(**{k: r[k] for k in r.keys() if k != "client_id" and k != "mission_key"}) for r in rows
    ]


def add_memory(item: MemoryIn, mission_key: str = "1042") -> MemoryOut:
    with connect() as conn:
        created = _now()
        cur = conn.execute(
            """INSERT INTO memory (client_id, mission_key, planet_name, plant_name, survival_score,
               days_survived, mission_result, lesson_learned, created_at)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                item.client_id,
                mission_key,
                item.planet_name,
                item.plant_name,
                item.survival_score,
                item.days_survived,
                item.mission_result,
                item.lesson_learned,
                created,
            ),
        )
        row_id = cur.lastrowid
    data = item.model_dump(exclude={"client_id"})
    return MemoryOut(id=row_id, created_at=created, **data)


def list_memory(client_id: str, mission_key: str = "1042") -> list[MemoryOut]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM memory WHERE client_id = ? AND mission_key = ? ORDER BY id DESC",
            (client_id, mission_key),
        ).fetchall()
    return [MemoryOut(**{k: r[k] for k in r.keys() if k != "client_id" and k != "mission_key"}) for r in rows]


def load_memories(client_id: str, mission_key: str = "1042") -> list[MemoryRecord]:
    return [
        MemoryRecord(**m.model_dump(exclude={"id", "created_at"}))
        for m in list_memory(client_id, mission_key)
    ]
