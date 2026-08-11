"""Heartbeat + stale-slot reclaim — the "customer closed the browser" fix.

The customer app heartbeats its slot every ~20s while browsing. If the
browser is closed before ordering, heartbeats stop and the slot must free
itself automatically (no pagehide event is guaranteed on mobile), instead of
staying occupied until someone scans the QR again.

Rules:
- heartbeat only refreshes occupied slots, never occupies/frees them
- a slot whose heartbeat is older than the TTL AND has no unpaid orders is
  reclaimed on the next read (GET /tables/) or occupy
- a slot with a live unpaid order is NEVER reclaimed, no matter how stale
"""
import uuid

from conftest import create_order, demo_menu, demo_tables, dish_by_name, register_person


def _age_slot(client, headers, table_number, slot_number, seconds=300):
    """Re-age a slot's updated_at so it looks abandoned."""
    from datetime import datetime, timedelta, timezone
    from sqlalchemy import text

    import app.database as database

    session = database.SessionLocal()
    try:
        session.execute(
            text(
                "UPDATE tables SET updated_at = :ts "
                "WHERE hotel_id = (SELECT id FROM hotels WHERE hotel_name = 'demo') "
                "AND table_number = :tn AND slot_number = :sn"
            ),
            {
                "ts": (datetime.now(timezone.utc) - timedelta(seconds=seconds)).isoformat(),
                "tn": table_number,
                "sn": slot_number,
            },
        )
        session.commit()
    finally:
        session.close()


class TestHeartbeat:
    def test_heartbeat_keeps_occupied_slot_alive(self, client, headers):
        client.put("/tables/number/2/occupy?slot_number=1", headers=headers)
        _age_slot(client, headers, 2, 1, seconds=300)

        r = client.put("/tables/number/2/heartbeat?slot_number=1", headers=headers)
        assert r.status_code == 200

        # re-age would make it stale, but the heartbeat kept it fresh -> no reclaim
        slots = demo_tables(client, headers)
        s = next(t for t in slots if t["table_number"] == 2 and t["slot_number"] == 1)
        assert s["is_occupied"] is True

    def test_heartbeat_does_not_occupy_a_free_slot(self, client, headers):
        r = client.put("/tables/number/2/heartbeat?slot_number=2", headers=headers)
        assert r.status_code == 200
        slots = demo_tables(client, headers)
        s = next(t for t in slots if t["table_number"] == 2 and t["slot_number"] == 2)
        assert s["is_occupied"] is False

    def test_heartbeat_requires_hotel_context(self, client):
        r = client.put("/tables/number/2/heartbeat?slot_number=1")
        assert r.status_code == 400


class TestStaleReclaim:
    def test_browser_closed_without_order_frees_slot_on_read(self, client, headers):
        """The exact user complaint: close the browser before ordering and the
        table stays occupied. With the heartbeat TTL the slot must self-heal."""
        client.put("/tables/number/2/occupy?slot_number=1", headers=headers)
        _age_slot(client, headers, 2, 1, seconds=300)

        slots = demo_tables(client, headers)  # admin view — self-heals
        s = next(t for t in slots if t["table_number"] == 2 and t["slot_number"] == 1)
        assert s["is_occupied"] is False
        assert s["current_order_id"] is None

    def test_status_summary_self_heals_stale_slot(self, client, headers):
        """The admin dashboard reads /tables/status/summary — its occupied
        count must also drop once a slot's heartbeat goes quiet."""
        client.put("/tables/number/2/occupy?slot_number=1", headers=headers)
        _age_slot(client, headers, 2, 1, seconds=300)

        r = client.get("/tables/status/summary", headers=headers)
        assert r.status_code == 200
        assert r.json()["occupied_tables"] == 0

        slots = demo_tables(client, headers)
        s = next(t for t in slots if t["table_number"] == 2 and t["slot_number"] == 1)
        assert s["is_occupied"] is False

    def test_stale_slot_with_unpaid_order_never_reclaimed(self, client, headers):
        """A customer who ordered but hasn't paid keeps the table occupied
        even after closing the browser — only payment frees the slot."""
        person = register_person(client, headers, "owes_money")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        assert order["status"] == "pending"

        _age_slot(client, headers, 1, 1, seconds=300)
        slots = demo_tables(client, headers)
        s = next(t for t in slots if t["table_number"] == 1 and t["slot_number"] == 1)
        assert s["is_occupied"] is True
        assert s["current_order_id"] == order["id"]

    def test_stale_slot_without_order_is_reclaimed_by_occupy(self, client, headers):
        client.put("/tables/number/3/occupy?slot_number=1", headers=headers)
        _age_slot(client, headers, 3, 1, seconds=300)

        r = client.put("/tables/number/3/occupy?slot_number=1", headers=headers)
        assert r.status_code == 200  # stale -> reclaimed, not 400

    def test_fresh_slot_without_order_keeps_heartbeat_alive(self, client, headers):
        """An actively browsing customer (recent heartbeat) must NOT be
        displaced by a second scanner."""
        client.put("/tables/number/3/occupy?slot_number=2", headers=headers)

        # heartbeat brings the slot back to life even after going quiet
        _age_slot(client, headers, 3, 2, seconds=300)
        client.put("/tables/number/3/heartbeat?slot_number=2", headers=headers)
        r = client.put("/tables/number/3/occupy?slot_number=2", headers=headers)
        assert r.status_code == 400  # still alive

        # without the heartbeat the slot would have been reclaimed
        _age_slot(client, headers, 3, 2, seconds=300)
        r = client.put("/tables/number/3/occupy?slot_number=2", headers=headers)
        assert r.status_code == 200  # abandoned -> reclaimed

    def test_reclaim_scoped_to_hotel(self, client, headers):
        from test_regression import _make_hotel

        other = _make_hotel(client, f"heartbeat_{uuid.uuid4().hex[:6]}")
        client.post("/tables/", headers=other, json={"table_number": 1})

        client.put("/tables/number/1/occupy?slot_number=1", headers=other)
        _age_slot(client, other, 1, 1, seconds=300)

        # reading the demo hotel's tables must not free the other hotel's slot
        demo_tables(client, headers)
        slots = client.get("/tables/", headers=other).json()
        s = next(t for t in slots if t["table_number"] == 1 and t["slot_number"] == 1)
        assert s["is_occupied"] is True  # untouched by demo hotel reads
