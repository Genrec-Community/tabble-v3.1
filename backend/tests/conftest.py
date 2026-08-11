"""Shared test fixtures.

Every test runs against its own throwaway SQLite database (fresh temp file)
with DEMO_MODE seeding the `demo` hotel, 6 dishes and 3 tables x 2 slots.
The real backend/Tabble.db is never touched.

Run with:  python -m pytest tests/ -v   (from backend/, using .venv)
"""
import os
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def _rebind_database(monkeypatch, db_path):
    """Point every module-level engine/session reference at db_path."""
    import app.database as database

    url = database.sqlite_url(db_path)

    monkeypatch.setattr(database, "DATABASE_PATH", db_path)
    monkeypatch.setattr(database, "DATABASE_URL", url)
    monkeypatch.setattr(database, "CURRENT_DATABASE", "Tabble.db")

    engine = database.create_engine(url, connect_args={"check_same_thread": False})
    monkeypatch.setattr(database, "engine", engine)
    session_factory = database.sessionmaker(autocommit=False, autoflush=False, bind=engine)
    monkeypatch.setattr(database, "session_factory", session_factory)
    monkeypatch.setattr(database, "SessionLocal", database.scoped_session(session_factory))

    database.db_manager.sessions.clear()
    return engine


def _rebind_captured_engine(monkeypatch, engine):
    """Modules that did `from ..database import engine` keep a stale reference."""
    import app.routers.chef as chef_mod
    import app.routers.public as public_mod

    monkeypatch.setattr(chef_mod, "engine", engine)
    monkeypatch.setattr(public_mod, "engine", engine)


@pytest.fixture()
def client(tmp_path, monkeypatch):
    """FastAPI TestClient isolated on a fresh temp DB, demo hotel seeded."""
    os.environ["DEMO_MODE"] = "true"

    engine = _rebind_database(monkeypatch, tmp_path / "Tabble.db")

    from app.main import app  # create_tables() runs against the temp engine
    from fastapi.testclient import TestClient

    _rebind_captured_engine(monkeypatch, engine)

    import app.database as database
    database.create_tables()  # re-run migrations + demo seed on the fresh temp DB

    with TestClient(app) as test_client:
        yield test_client

    engine.dispose()
    database.db_manager.sessions.clear()


@pytest.fixture()
def headers():
    """Session headers authenticated as the demo hotel."""
    import uuid

    return {
        "x-session-id": f"test_{uuid.uuid4().hex[:10]}",
        "x-hotel-name": "demo",
        "x-hotel-password": "demo123",
        "Content-Type": "application/json",
    }


def demo_tables(client, headers):
    """The 6 seeded slot rows for the demo hotel."""
    return client.get("/tables/", headers=headers).json()


def demo_menu(client, headers):
    return client.get("/customer/api/menu", headers=headers).json()


def dish_by_name(menu, name):
    return next(d for d in menu if d["name"] == name)


def register_person(client, headers, username):
    r = client.post(
        "/customer/api/register",
        headers=headers,
        json={"username": username, "password": "pass123", "table_number": 1},
    )
    assert r.status_code == 200, r.text
    return r.json()


def create_order(client, headers, person_id, table_number=1, slot_number=1, items=None, unique_id=None):
    import uuid

    if items is None:
        raise ValueError("items required")
    payload = {
        "table_number": table_number,
        "slot_number": slot_number,
        "unique_id": unique_id or f"cart_{uuid.uuid4().hex[:8]}",
        "items": items,
    }
    r = client.post(f"/customer/api/orders?person_id={person_id}", headers=headers, json=payload)
    assert r.status_code == 200, r.text
    return r.json()
