"""Integration tests — the full happy path over the API, exactly as the app drives it.

scan -> occupy -> order -> chef per-dish accept/reject -> complete -> get bill
-> PDF bill -> admin mark paid -> visit count + slot freed.
"""

import pytest

from conftest import create_order, demo_menu, demo_tables, dish_by_name, register_person


def _setup_order(client, headers, table_number=1, slot_number=1):
    person = register_person(client, headers, f"flow_user")
    menu = demo_menu(client, headers)
    dosa = dish_by_name(menu, "Masala Dosa")          # 80
    lassi = dish_by_name(menu, "Mango Lassi")          # 60
    order = create_order(
        client, headers, person["id"],
        table_number=table_number, slot_number=slot_number,
        items=[
            {"dish_id": dosa["id"], "quantity": 2, "remarks": None},
            {"dish_id": lassi["id"], "quantity": 1, "remarks": None},
        ],
    )
    dosa_item = next(i for i in order["items"] if i["dish_id"] == dosa["id"])
    lassi_item = next(i for i in order["items"] if i["dish_id"] == lassi["id"])
    return person, menu, order, dosa_item, lassi_item


class TestFullOrderFlow:
    def test_scan_then_occupy(self, client, headers):
        slot = demo_tables(client, headers)[0]
        assert slot["is_occupied"] is False

        r = client.get(f"/public/scan/{slot['qr_token']}")
        assert r.status_code == 200
        info = r.json()
        assert info["table_number"] == slot["table_number"]
        assert info["slot_number"] == slot["slot_number"]
        assert info["is_occupied"] is False

        r = client.put(f"/tables/number/{slot['table_number']}/occupy?slot_number={slot['slot_number']}", headers=headers)
        assert r.status_code == 200
        assert next(t for t in demo_tables(client, headers) if t["id"] == slot["id"])["is_occupied"] is True

        # A later scan of a slot with no linked order frees the stale session —
        # the next customer must be able to sit down even if the previous one
        # closed the browser. (With a live order the slot stays occupied.)
        info = client.get(f"/public/scan/{slot['qr_token']}").json()
        assert info["is_occupied"] is False
        assert next(t for t in demo_tables(client, headers) if t["id"] == slot["id"])["is_occupied"] is False

    def test_order_created_pending_and_occupies_slot(self, client, headers):
        person, _, order, _, _ = _setup_order(client, headers)
        assert order["status"] == "pending"
        assert all(i["status"] == "pending" for i in order["items"])
        assert order["person_id"] == person["id"]

        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is True
        assert slot["current_order_id"] == order["id"]

    def test_complete_blocked_while_items_pending(self, client, headers):
        _, _, order, _, _ = _setup_order(client, headers)
        r = client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        assert r.status_code == 400

    def test_per_dish_accept_and_reject(self, client, headers):
        _, _, order, dosa_item, lassi_item = _setup_order(client, headers)

        r = client.put(f"/chef/orders/{order['id']}/items/{dosa_item['id']}/accept", headers=headers)
        assert r.status_code == 200
        r = client.put(
            f"/chef/orders/{order['id']}/items/{lassi_item['id']}/reject",
            headers=headers, json={"reason": "Out of stock"},
        )
        assert r.status_code == 200

        accepted = client.get("/chef/orders/accepted", headers=headers).json()
        mine = next(o for o in accepted if o["id"] == order["id"])
        assert mine["status"] == "accepted"
        items = {i["dish_id"]: i for i in mine["items"]}
        assert items[dosa_item["dish_id"]]["status"] == "accepted"
        assert items[lassi_item["dish_id"]]["status"] == "rejected"
        assert items[lassi_item["dish_id"]]["rejection_reason"] == "Out of stock"

    def test_chef_sees_customer_identity(self, client, headers):
        person, _, order, _, _ = _setup_order(client, headers)
        pending = client.get("/chef/orders/pending", headers=headers).json()
        mine = next(o for o in pending if o["id"] == order["id"])
        assert mine["unique_id"] == order["unique_id"]
        assert mine["person_name"] == person["username"]

    def test_accept_all_then_complete(self, client, headers):
        _, _, order, dosa_item, lassi_item = _setup_order(client, headers)
        r = client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        assert r.status_code == 200

        r = client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        assert r.status_code == 200
        r = client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        assert r.status_code == 400  # double-complete

    def test_get_bill_sets_payment_requested_with_correct_totals(self, client, headers):
        _, _, order, dosa_item, lassi_item = _setup_order(client, headers)
        client.put(f"/chef/orders/{order['id']}/items/{dosa_item['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/items/{lassi_item['id']}/reject", headers=headers, json={"reason": "no"})
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)

        r = client.put(f"/customer/api/orders/{order['id']}/payment", headers=headers)
        assert r.status_code == 200
        assert r.json()["message"] == "Bill requested successfully"

        o = client.get(f"/customer/api/orders/{order['id']}", headers=headers).json()
        assert o["status"] == "payment_requested"
        assert o["subtotal_amount"] == 160.0   # 2x dosa (80) — lassi rejected & excluded
        assert o["total_amount"] == 160.0

        # Slot must stay occupied until the admin marks paid
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is True

    def test_bill_pdf_generated(self, client, headers):
        _, _, order, dosa_item, lassi_item = _setup_order(client, headers)
        client.put(f"/chef/orders/{order['id']}/items/{dosa_item['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/items/{lassi_item['id']}/reject", headers=headers, json={"reason": "no"})
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)

        r = client.get(f"/admin/orders/{order['id']}/bill", headers=headers)
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("application/pdf")
        body = r.content
        assert body.startswith(b"%PDF")
        assert len(body) > 1000  # real PDF, not empty

    def test_admin_marks_paid_frees_slot_and_counts_visit(self, client, headers):
        person, _, order, dosa_item, lassi_item = _setup_order(client, headers)
        client.put(f"/chef/orders/{order['id']}/items/{dosa_item['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/items/{lassi_item['id']}/reject", headers=headers, json={"reason": "no"})
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/customer/api/orders/{order['id']}/payment", headers=headers)

        r = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        assert r.status_code == 200
        r = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        assert r.status_code == 200  # idempotent "already paid"

        person_now = client.get(f"/customer/api/person/{person['id']}", headers=headers).json()
        assert person_now["visit_count"] == 1

        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False
        assert slot["current_order_id"] is None

    def test_completed_for_billing_includes_done_orders(self, client, headers):
        _, _, order, dosa_item, lassi_item = _setup_order(client, headers)
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)

        ids = [o["id"] for o in client.get("/admin/orders/completed-for-billing", headers=headers).json()]
        assert order["id"] in ids


class TestHotelIsolation:
    def test_orders_are_hotel_scoped(self, client, headers):
        import uuid as _uuid

        person, _, order, _, _ = _setup_order(client, headers)

        # Create a second hotel via the super admin endpoint
        name = f"iso_{_uuid.uuid4().hex[:6]}"
        r = client.post("/admin/super/hotels", json={
            "name": name, "phone": f"9{_uuid.uuid4().hex[:9]}", "password": "secret",
        })
        assert r.status_code == 200, r.text

        other_headers = {
            "x-session-id": f"test_{_uuid.uuid4().hex[:10]}",
            "x-hotel-name": name,
            "x-hotel-password": "secret",
            "Content-Type": "application/json",
        }

        # No tables of its own
        assert client.get("/tables/", headers=other_headers).json() == []
        # Can't see or touch demo's orders
        assert client.get("/admin/orders", headers=other_headers).json() == []
        assert client.put(f"/admin/orders/{order['id']}/paid", headers=other_headers).status_code == 404
        assert client.get(f"/customer/api/orders/{order['id']}", headers=other_headers).status_code == 404
        assert client.put(f"/chef/orders/{order['id']}/accept", headers=other_headers).status_code == 404

    def test_cancel_does_not_touch_other_hotel(self, client, headers):
        import uuid as _uuid

        person, _, order, _, _ = _setup_order(client, headers)
        name = f"iso2_{_uuid.uuid4().hex[:6]}"
        client.post("/admin/super/hotels", json={
            "name": name, "phone": f"9{_uuid.uuid4().hex[:9]}", "password": "secret",
        })
        other_headers = {
            "x-session-id": f"test_{_uuid.uuid4().hex[:10]}",
            "x-hotel-name": name,
            "x-hotel-password": "secret",
            "Content-Type": "application/json",
        }
        assert client.put(f"/customer/api/orders/{order['id']}/cancel", headers=other_headers).status_code == 404

        # Real hotel cancel works and frees only its own slot
        r = client.put(f"/customer/api/orders/{order['id']}/cancel", headers=headers)
        assert r.status_code == 200
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False

    def test_chef_login_flow(self, client, headers):
        # admin routes skip middleware validation; establish hotel context first
        # (mirrors the app: hotel login happens before reaching /admin)
        assert client.get("/tables/", headers=headers).status_code == 200

        r = client.post("/admin/chefs", headers=headers, json={
            "username": "sanjay", "password": "cook123", "display_name": "Chef Sanjay",
        })
        assert r.status_code == 200, r.text

        hotel_id = next(h["id"] for h in client.get("/public/hotels").json() if h["name"] == "demo")
        r = client.post("/chef/auth/login", json={
            "username": "sanjay", "password": "cook123", "hotel_id": hotel_id,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["display_name"] == "Chef Sanjay"
        assert data["hotel_id"] == hotel_id

        r = client.post("/chef/auth/login", json={
            "username": "sanjay", "password": "wrong", "hotel_id": hotel_id,
        })
        assert r.status_code == 401
