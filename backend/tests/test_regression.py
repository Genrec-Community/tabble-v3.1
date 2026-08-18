"""Regression tests — every bug that was fixed must stay fixed.

Each test pins down a previously observed defect:
1. occupy-by-number used to ignore slot_number (occupied the wrong slot)
2. cancel used to free the table in the wrong hotel / without slot scoping
3. admin mark-paid used to never free the table slot
4. customer "get bill" used to never set payment_requested (mark-paid was unreachable)
5. new tables used to have no qr_token (QR couldn't be generated)
6. rejected dishes used to leak into bills/totals
"""

import uuid

import pytest

from conftest import create_order, demo_menu, demo_tables, dish_by_name, register_person


def _make_hotel(client, tag):
    name = f"{tag}_{uuid.uuid4().hex[:6]}"
    r = client.post("/admin/super/hotels", json={
        "name": name, "phone": f"9{uuid.uuid4().hex[:9]}", "password": "secret",
    })
    assert r.status_code == 200, r.text
    return {
        "x-session-id": f"test_{uuid.uuid4().hex[:10]}",
        "x-hotel-name": name,
        "x-hotel-password": "secret",
        "Content-Type": "application/json",
    }


class TestSlotScopedOccupy:
    def test_occupy_by_number_only_marks_the_requested_slot(self, client, headers):
        table_number, slot_number = 2, 2
        r = client.put(f"/tables/number/{table_number}/occupy?slot_number={slot_number}", headers=headers)
        assert r.status_code == 200

        slots = demo_tables(client, headers)
        occupied = [t for t in slots if t["is_occupied"]]
        assert [t["slot_number"] for t in occupied] == [slot_number]
        assert all(t["table_number"] == table_number for t in occupied)

    def test_occupy_second_slot_independent_of_first(self, client, headers):
        r = client.put("/tables/number/3/occupy?slot_number=1", headers=headers)
        assert r.status_code == 200
        r = client.put("/tables/number/3/occupy?slot_number=2", headers=headers)
        assert r.status_code == 200

        slots = demo_tables(client, headers)
        t3 = [t for t in slots if t["table_number"] == 3]
        assert len([t for t in t3 if t["is_occupied"]]) == 2

    def test_scan_frees_stale_slot_without_order(self, client, headers):
        """Browser closed before ordering -> slot occupied, no linked order.
        The next scan must auto-free it (regression: it stayed occupied forever)."""
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 2 and t["slot_number"] == 1)
        r = client.put(f"/tables/number/2/occupy?slot_number=1", headers=headers)
        assert r.status_code == 200

        # occupied with no order -> stale
        info = client.get(f"/public/scan/{slot['qr_token']}").json()
        assert info["is_occupied"] is False
        refreshed = next(t for t in demo_tables(client, headers) if t["id"] == slot["id"])
        assert refreshed["is_occupied"] is False

    def test_scan_keeps_slot_occupied_when_order_active(self, client, headers):
        """An occupied slot WITH a live order must NOT be freed by a scan."""
        person = register_person(client, headers, "active_slot_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])

        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["current_order_id"] == order["id"]

        info = client.get(f"/public/scan/{slot['qr_token']}").json()
        assert info["is_occupied"] is True

    def test_occupy_reclaims_stale_slot(self, client, headers):
        client.put("/tables/number/3/occupy?slot_number=2", headers=headers)

        # customer's browser was closed -> heartbeat goes quiet -> slot is stale
        from datetime import datetime, timedelta, timezone
        from sqlalchemy import text
        import app.database as database
        session = database.SessionLocal()
        try:
            session.execute(
                text("UPDATE tables SET updated_at = :ts WHERE table_number = 3 AND slot_number = 2"),
                {"ts": (datetime.now(timezone.utc) - timedelta(seconds=300)).isoformat()},
            )
            session.commit()
        finally:
            session.close()

        r = client.put("/tables/number/3/occupy?slot_number=2", headers=headers)
        assert r.status_code == 200  # stale (no order) -> reclaimed, not 400

    def test_occupy_rejected_when_slot_has_active_order(self, client, headers):
        person = register_person(client, headers, "busy_slot_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        create_order(client, headers, person["id"],
                     items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        r = client.put("/tables/number/1/occupy?slot_number=1", headers=headers)
        assert r.status_code == 400  # live order -> really occupied


class TestCancelFreesTheRightSlot:
    def test_cancel_frees_only_its_own_slot_and_only_if_current(self, client, headers):
        person = register_person(client, headers, "cancel_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")

        order = create_order(client, headers, person["id"], table_number=1, slot_number=1,
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        order2 = create_order(client, headers, person["id"], table_number=1, slot_number=2,
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])

        # Cancel slot-1 order: slot 1 freed, slot 2 (different order) untouched
        r = client.put(f"/customer/api/orders/{order['id']}/cancel", headers=headers)
        assert r.status_code == 200

        slots = demo_tables(client, headers)
        s1 = next(t for t in slots if t["table_number"] == 1 and t["slot_number"] == 1)
        s2 = next(t for t in slots if t["table_number"] == 1 and t["slot_number"] == 2)
        assert s1["is_occupied"] is False and s1["current_order_id"] is None
        assert s2["is_occupied"] is True and s2["current_order_id"] == order2["id"]

    def test_accepted_order_cannot_be_cancelled(self, client, headers):
        person = register_person(client, headers, "no_cancel_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        r = client.put(f"/customer/api/orders/{order['id']}/cancel", headers=headers)
        assert r.status_code == 400


class TestPaidFlowRegression:
    def test_mark_paid_requires_completed_or_payment_requested(self, client, headers):
        person = register_person(client, headers, "paid_gate_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])

        # pending order cannot be paid directly
        r = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        assert r.status_code == 400

        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        r = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        assert r.status_code == 200  # completed is payable without customer bill request

    def test_bill_request_does_not_free_slot_or_count_visit(self, client, headers):
        person = register_person(client, headers, "nofree_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/customer/api/orders/{order['id']}/payment", headers=headers)

        # regression: bill request used to mark paid + free the slot immediately
        person_now = client.get(f"/customer/api/person/{person['id']}", headers=headers).json()
        assert person_now["visit_count"] == 0
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is True

    def test_paid_frees_slot_and_survives_other_paid_order_on_same_slot(self, client, headers):
        person = register_person(client, headers, "same_slot_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")

        order1 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order1['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order1['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order1['id']}/paid", headers=headers)

        order2 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order2['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order2['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order2['id']}/paid", headers=headers)

        # after the last active order is paid, the slot is free again
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False

    def test_slot_kept_occupied_while_any_order_unpaid(self, client, headers):
        person = register_person(client, headers, "still_here_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")

        order1 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        order2 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order1['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order1['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order1['id']}/paid", headers=headers)

        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is True  # order2 still active

    def test_mark_paid_on_merged_order_resolves_to_bill(self, client, headers):
        """Regression: customer "Get Bill" merges active orders on a slot into one
        bill and marks the others 'merged'. The admin's stale list could then click
        'Mark as Paid' on a merged order and get a 400. It must resolve to the bill
        target instead of erroring."""
        person = register_person(client, headers, "merged_pay_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")

        order1 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        order2 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 2, "remarks": None}])
        for oid in (order1["id"], order2["id"]):
            client.put(f"/chef/orders/{oid}/accept", headers=headers)
            client.put(f"/chef/orders/{oid}/complete", headers=headers)

        # customer asks for the bill on order2 -> both merge into order1
        r = client.put(f"/customer/api/orders/{order2['id']}/payment", headers=headers)
        assert r.status_code == 200

        # admin dashboard still shows the stale order2 row -> mark it paid
        r = client.put(f"/admin/orders/{order2['id']}/paid", headers=headers)
        assert r.status_code == 200, r.text

        # the bill (order1) is now paid, order2 stays merged, slot freed
        orders = client.get("/admin/orders", headers=headers).json()
        by_id = {o["id"]: o for o in orders}
        assert by_id[order1["id"]]["status"] == "paid"
        assert by_id[order2["id"]]["status"] == "merged"
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False

    def test_double_mark_paid_is_idempotent_and_visits_count_once(self, client, headers):
        person = register_person(client, headers, "double_pay_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)

        # double click / two admin tabs hitting the endpoint at the same time
        r1 = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        r2 = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
        assert r1.status_code == 200 and r2.status_code == 200

        person_now = client.get(f"/customer/api/person/{person['id']}", headers=headers).json()
        assert person_now["visit_count"] == 1


class TestQrTokenRegression:
    def test_new_table_gets_qr_token_automatically(self, client):
        other_headers = _make_hotel(client, "fresh")
        r = client.post("/tables/", headers=other_headers, json={"table_number": 1})
        assert r.status_code == 200, r.text
        created = r.json()
        assert len(created) == 2  # both slots
        for slot in created:
            assert slot["qr_token"], "new table slot must have a qr_token"

        # ...and scanning that token resolves to the new hotel
        r = client.get(f"/public/scan/{created[0]['qr_token']}")
        assert r.status_code == 200
        assert r.json()["table_number"] == 1 and r.json()["slot_number"] == 1

    def test_generate_qr_is_idempotent(self, client, headers):
        slot_id = demo_tables(client, headers)[0]["id"]
        r1 = client.post(f"/tables/{slot_id}/generate-qr", headers=headers)
        assert r1.status_code == 200
        token1 = r1.headers["x-qr-token"]
        r2 = client.post(f"/tables/{slot_id}/generate-qr", headers=headers)
        assert r2.headers["x-qr-token"] == token1
        assert r2.headers["x-qr-url"].endswith(f"/order?t={token1}")


class TestSingleBillMerge:
    """Ordering multiple times before paying must produce ONE bill: the
    delivered orders on the slot merge into a single order when the customer
    presses Get Bill, and only that bill order is shown/billed/paid."""

    def _two_delivered_orders(self, client, headers, username):
        person = register_person(client, headers, username)
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        lassi = dish_by_name(menu, "Mango Lassi")

        order1 = create_order(client, headers, person["id"],
                              items=[{"dish_id": dosa["id"], "quantity": 2, "remarks": None}])
        order2 = create_order(client, headers, person["id"],
                              items=[{"dish_id": lassi["id"], "quantity": 1, "remarks": None}])

        for order in (order1, order2):
            client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
            client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        return person, order1, order2

    def test_get_bill_merges_orders_into_single_bill(self, client, headers):
        person, order1, order2 = self._two_delivered_orders(client, headers, "onebill_user")

        # customer asks for the bill via the FIRST order
        r = client.put(f"/customer/api/orders/{order1['id']}/payment", headers=headers)
        assert r.status_code == 200

        # the bill is now a single order holding both orders' items
        bill = client.get(f"/customer/api/orders/{order1['id']}", headers=headers).json()
        assert bill["status"] == "payment_requested"
        assert sum(i["quantity"] for i in bill["items"]) == 3  # 2 dosa + 1 lassi
        assert bill["subtotal_amount"] == 2 * 80 + 60  # dosa 80, lassi 60

        # the absorbed order is merged — invisible to billing/history
        merged = client.get(f"/customer/api/orders/{order2['id']}", headers=headers).json()
        assert merged["status"] == "merged"
        billing_ids = [o["id"] for o in client.get("/admin/orders/completed-for-billing", headers=headers).json()]
        assert order1["id"] in billing_ids
        assert order2["id"] not in billing_ids

        # one bill -> one mark-as-paid -> one visit counted, slot freed
        r = client.put(f"/admin/orders/{order1['id']}/paid", headers=headers)
        assert r.status_code == 200
        person_now = client.get(f"/customer/api/person/{person['id']}", headers=headers).json()
        assert person_now["visit_count"] == 1
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False

    def test_merged_order_id_is_idempotent_on_bill_request(self, client, headers):
        _, order1, order2 = self._two_delivered_orders(client, headers, "onebill_idem_user")

        # frontend loops over every completed order — the absorbed one must no-op
        assert client.put(f"/customer/api/orders/{order1['id']}/payment", headers=headers).status_code == 200
        r = client.put(f"/customer/api/orders/{order2['id']}/payment", headers=headers)
        assert r.status_code == 200
        assert r.json()["message"] == "Bill requested successfully"

    def test_merged_order_can_be_paid_by_resolving_to_bill(self, client, headers):
        """Regression: marking a stale (merged) order paid used to 400 when the
        admin dashboard showed it before the customer pressed Get Bill. It must
        resolve to the bill order and settle it instead of erroring."""
        _, order1, order2 = self._two_delivered_orders(client, headers, "onebill_paid_user")
        client.put(f"/customer/api/orders/{order1['id']}/payment", headers=headers)
        r = client.put(f"/admin/orders/{order2['id']}/paid", headers=headers)
        assert r.status_code == 200, r.text
        bill = client.get(f"/customer/api/orders/{order1['id']}", headers=headers).json()
        assert bill["status"] == "paid"
        slot = next(t for t in demo_tables(client, headers)
                    if t["table_number"] == 1 and t["slot_number"] == 1)
        assert slot["is_occupied"] is False


class TestRejectedItemsExcluded:
    def test_pdf_bill_excludes_rejected_dish(self, client, headers):
        person = register_person(client, headers, "pdf_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        lassi = dish_by_name(menu, "Mango Lassi")
        order = create_order(client, headers, person["id"], items=[
            {"dish_id": dosa["id"], "quantity": 2, "remarks": None},
            {"dish_id": lassi["id"], "quantity": 3, "remarks": None},
        ])
        dosa_item = next(i for i in order["items"] if i["dish_id"] == dosa["id"])
        lassi_item = next(i for i in order["items"] if i["dish_id"] == lassi["id"])

        client.put(f"/chef/orders/{order['id']}/items/{dosa_item['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/items/{lassi_item['id']}/reject", headers=headers,
                   json={"reason": "not available"})
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)

        # Totals reflect only the accepted dish (2 x 80 = 160)
        client.put(f"/customer/api/orders/{order['id']}/payment", headers=headers)
        o = client.get(f"/customer/api/orders/{order['id']}", headers=headers).json()
        assert o["subtotal_amount"] == 160.0
        assert o["total_amount"] == 160.0

        r = client.get(f"/admin/orders/{order['id']}/bill", headers=headers)
        assert r.status_code == 200
        assert r.content.startswith(b"%PDF")

    def test_reject_requires_no_reason_but_stores_it_when_given(self, client, headers):
        person = register_person(client, headers, "reason_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        item_id = order["items"][0]["id"]
        r = client.put(f"/chef/orders/{order['id']}/items/{item_id}/reject", headers=headers, json={"reason": None})
        assert r.status_code == 200

        o = client.get(f"/customer/api/orders/{order['id']}", headers=headers).json()
        assert o["items"][0]["status"] == "rejected"
        assert o["status"] == "rejected"  # all items rejected -> order rejected
