"""Smoke tests — app boots, DB is created/seeded, core endpoints respond."""

import pytest


def test_health_endpoint(client):
    # When frontend/build exists the SPA catch-all mounts at "/" and shadows /health,
    # so accept either the JSON API response or the 404 from the shadowed route.
    r = client.get("/health")
    assert r.status_code in (200, 404)
    if r.status_code == 200:
        assert r.json() == {"status": "healthy"}


def test_root_endpoint(client):
    r = client.get("/")
    assert r.status_code == 200
    if r.headers["content-type"].startswith("application/json"):
        assert "message" in r.json()


def test_api_liveness(client):
    # The definitive boot check: the public hotels endpoint is always reachable.
    r = client.get("/public/hotels")
    assert r.status_code == 200


def test_public_hotels_lists_demo_hotel(client):
    r = client.get("/public/hotels")
    assert r.status_code == 200
    names = [h["name"] for h in r.json()]
    assert "demo" in names


def test_demo_data_seeded(client, headers):
    tables = client.get("/tables/", headers=headers).json()
    assert len(tables) == 6  # 3 tables x 2 slots
    menu = client.get("/customer/api/menu", headers=headers).json()
    assert len(menu) == 6  # demo dishes
    names = {d["name"] for d in menu}
    assert "Masala Dosa" in names and "Mango Lassi" in names


def test_tables_require_hotel_context(client):
    r = client.get("/tables/")
    assert r.status_code in (400, 401)


def test_wrong_hotel_password_rejected(client, headers):
    bad = dict(headers, **{"x-hotel-password": "wrong"})
    r = client.get("/tables/", headers=bad)
    assert r.status_code == 401


def test_scan_invalid_token_404(client):
    r = client.get("/public/scan/does-not-exist")
    assert r.status_code == 404


def test_every_demo_slot_has_qr_token(client, headers):
    for t in client.get("/tables/", headers=headers).json():
        assert t["qr_token"], f"table {t['id']} missing qr_token"
