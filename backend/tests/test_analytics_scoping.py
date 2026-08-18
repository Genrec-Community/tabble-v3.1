"""Analytics and admin stats must be scoped to the signed-in hotel.

Regression: analytics.py queried the shared DB globally, so every hotel's
dashboard/analytics showed data merged across ALL hotels. These tests pin
that every analytics endpoint (and GET /admin/stats/orders) only returns
data for the hotel whose credentials authenticated the request.
"""

import uuid

from conftest import create_order, demo_menu, dish_by_name, register_person


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


def _paid_order_with_dish(client, headers, dish_price):
    """Register a person, create a dish, order it, complete it, pay it."""
    person = register_person(client, headers, f"cust_{uuid.uuid4().hex[:6]}")
    # Form endpoint: strip the JSON Content-Type from the fixture headers
    form_headers = {k: v for k, v in headers.items() if k != "Content-Type"}
    r = client.post(
        "/admin/api/dishes",
        data={
            "name": f"Scoped Dish {uuid.uuid4().hex[:6]}",
            "category": "Scoped",
            "price": str(dish_price),
        },
        headers=form_headers,
    )
    assert r.status_code == 200, r.text
    dish = r.json()

    order = create_order(client, headers, person["id"],
                         items=[{"dish_id": dish["id"], "quantity": 1, "remarks": None}])
    client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
    client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
    r = client.put(f"/admin/orders/{order['id']}/paid", headers=headers)
    assert r.status_code == 200, r.text
    return order, dish


class TestAnalyticsHotelScoping:
    def test_dashboard_scoped_to_hotel(self, client, headers):
        # demo hotel: one paid order for a seeded dish
        person = register_person(client, headers, "demo_analytics_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        # second hotel: a more expensive paid order of its own dish
        other = _make_hotel(client, "other")
        _paid_order_with_dish(client, other, 250.0)

        demo_stats = client.get("/analytics/dashboard", headers=headers).json()
        other_stats = client.get("/analytics/dashboard", headers=other).json()

        assert demo_stats["total_orders"] == 1
        assert demo_stats["total_sales"] == dosa["price"]
        assert demo_stats["total_dishes"] == len(menu)

        assert other_stats["total_orders"] == 1
        assert other_stats["total_sales"] == 250.0
        assert other_stats["total_dishes"] == 1
        assert other_stats["total_customers"] == 1

    def test_top_dishes_and_sales_by_category_scoped(self, client, headers):
        person = register_person(client, headers, "dish_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        other_order, other_dish = _paid_order_with_dish(client, other, 500.0)

        demo_dishes = client.get("/analytics/top-dishes", headers=headers).json()
        other_dishes = client.get("/analytics/top-dishes", headers=other).json()

        assert [d["name"] for d in demo_dishes] == [dosa["name"]]
        assert [d["name"] for d in other_dishes] == [other_dish["name"]]

        demo_cats = client.get("/analytics/sales-by-category", headers=headers).json()
        other_cats = client.get("/analytics/sales-by-category", headers=other).json()
        assert sum(c["total_ordered"] for c in demo_cats) == 1
        assert sum(c["total_ordered"] for c in other_cats) == 1

    def test_top_customers_scoped(self, client, headers):
        person = register_person(client, headers, "customer_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        _paid_order_with_dish(client, other, 300.0)

        demo_customers = client.get("/analytics/top-customers", headers=headers).json()
        other_customers = client.get("/analytics/top-customers", headers=other).json()

        assert [c["username"] for c in demo_customers] == [person["username"]]
        assert len(other_customers) == 1
        assert other_customers[0]["username"] != person["username"]

    def test_sales_over_time_and_chef_performance_scoped(self, client, headers):
        person = register_person(client, headers, "time_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        _paid_order_with_dish(client, other, 400.0)

        demo_series = client.get("/analytics/sales-over-time", headers=headers).json()
        other_series = client.get("/analytics/sales-over-time", headers=other).json()
        assert sum(d["order_count"] for d in demo_series) == 1
        assert sum(d["order_count"] for d in other_series) == 1

        demo_chef = client.get("/analytics/chef-performance", headers=headers).json()
        other_chef = client.get("/analytics/chef-performance", headers=other).json()
        assert demo_chef["total_completed_orders"] == 1
        assert other_chef["total_completed_orders"] == 1

    def test_table_utilization_and_customer_frequency_scoped(self, client, headers):
        person = register_person(client, headers, "table_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        _paid_order_with_dish(client, other, 350.0)

        demo_tables = client.get("/analytics/table-utilization", headers=headers).json()
        other_tables = client.get("/analytics/table-utilization", headers=other).json()
        # demo hotel has 3 seeded tables (6 slots); the other hotel has none
        assert len(demo_tables) == 3
        assert other_tables == []

        demo_freq = client.get("/analytics/customer-frequency", headers=headers).json()
        other_freq = client.get("/analytics/customer-frequency", headers=other).json()
        assert sum(b["customer_count"] for b in demo_freq) == 1
        assert sum(b["customer_count"] for b in other_freq) == 1

    def test_feedback_analysis_scoped(self, client, headers):
        person = register_person(client, headers, "feedback_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        other_order, _ = _paid_order_with_dish(client, other, 275.0)

        r = client.post("/feedback/", headers=headers,
                        json={"order_id": order["id"], "rating": 5, "comment": "great", "person_id": person["id"]})
        assert r.status_code == 200, r.text
        r = client.post("/feedback/", headers=other,
                        json={"order_id": other_order["id"], "rating": 2, "comment": "meh", "person_id": None})
        assert r.status_code == 200, r.text

        demo_fb = client.get("/analytics/feedback-analysis", headers=headers).json()
        other_fb = client.get("/analytics/feedback-analysis", headers=other).json()

        assert demo_fb["total_feedback"] == 1
        assert demo_fb["average_rating"] == 5.0
        assert other_fb["total_feedback"] == 1
        assert other_fb["average_rating"] == 2.0


class TestAdminStatsHotelScoping:
    def test_order_stats_scoped_to_hotel(self, client, headers):
        person = register_person(client, headers, "stats_scope_user")
        menu = demo_menu(client, headers)
        dosa = dish_by_name(menu, "Masala Dosa")
        order = create_order(client, headers, person["id"],
                             items=[{"dish_id": dosa["id"], "quantity": 1, "remarks": None}])
        client.put(f"/chef/orders/{order['id']}/accept", headers=headers)
        client.put(f"/chef/orders/{order['id']}/complete", headers=headers)
        client.put(f"/admin/orders/{order['id']}/paid", headers=headers)

        other = _make_hotel(client, "other")
        _paid_order_with_dish(client, other, 150.0)

        demo_stats = client.get("/admin/stats/orders", headers=headers).json()
        other_stats = client.get("/admin/stats/orders", headers=other).json()

        assert demo_stats["total_orders"] == 1
        assert demo_stats["paid_orders"] == 1
        assert demo_stats["revenue_today"] == dosa["price"]

        assert other_stats["total_orders"] == 1
        assert other_stats["paid_orders"] == 1
        assert other_stats["revenue_today"] == 150.0
