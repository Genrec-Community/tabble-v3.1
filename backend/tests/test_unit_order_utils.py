"""Unit tests for backend/app/services/order_utils.py — pure business logic, no DB."""

from types import SimpleNamespace

import pytest

from app.services.order_utils import (
    compute_order_totals,
    free_slot_if_no_unpaid_orders,
    recompute_order_status,
    served_items,
)


def item(status="pending", price=100.0, quantity=1):
    return SimpleNamespace(status=status, price=price, quantity=quantity,
                           dish=SimpleNamespace(price=price), id=len(str(status)))


def order_with(*items_, person_id=None):
    return SimpleNamespace(items=list(items_), status="pending", person_id=person_id,
                           hotel_id=1, table_number=1, slot_number=1, updated_at=None, id=1)


class TestServedItems:
    def test_excludes_rejected(self):
        accepted, pending, rejected = item("accepted"), item("pending"), item("rejected")
        result = served_items(order_with(accepted, pending, rejected))
        assert result == [accepted, pending]

    def test_all_rejected_is_empty(self):
        assert served_items(order_with(item("rejected"))) == []


class TestRecomputeOrderStatus:
    def test_all_pending(self):
        o = order_with(item("pending"), item("pending"))
        recompute_order_status(o)
        assert o.status == "pending"

    def test_any_accepted_wins(self):
        o = order_with(item("accepted"), item("pending"), item("rejected"))
        recompute_order_status(o)
        assert o.status == "accepted"

    def test_all_rejected(self):
        o = order_with(item("rejected"), item("rejected"))
        recompute_order_status(o)
        assert o.status == "rejected"

    def test_mixed_accepted_and_rejected(self):
        o = order_with(item("accepted"), item("rejected"))
        recompute_order_status(o)
        assert o.status == "accepted"

    def test_empty_order_is_noop(self):
        o = order_with()
        recompute_order_status(o)
        assert o.status == "pending"  # untouched


class _FakeQuery:
    """Chainable fake: filter/order_by are no-ops, first/count return configured values."""

    def __init__(self, first_result=None, count_result=0, all_result=None):
        self._first = first_result
        self._count = count_result
        self._all = all_result or []

    def filter(self, *a, **k):
        return self

    def order_by(self, *a, **k):
        return self

    def first(self):
        return self._first

    def count(self):
        return self._count

    def all(self):
        return self._all


class _FakeSession:
    """A session stub: configurable per-model lookup results."""

    def __init__(self, person=None, loyalty=None, offer=None, unpaid_orders=0, slot=None):
        self._person = person
        self._loyalty = loyalty
        self._offer = offer
        self._unpaid_orders = unpaid_orders
        self._slot = slot

    def query(self, model):
        name = getattr(model, "__name__", "")
        if name == "Person":
            return _FakeQuery(first_result=self._person)
        if name == "LoyaltyProgram":
            return _FakeQuery(first_result=self._loyalty)
        if name == "SelectionOffer":
            return _FakeQuery(first_result=self._offer)
        if name == "Order":
            return _FakeQuery(count_result=self._unpaid_orders)
        if name == "Table":
            return _FakeQuery(first_result=self._slot)
        return _FakeQuery()


class TestComputeOrderTotals:
    def test_rejected_items_excluded_and_snapshot_price_used(self):
        o = order_with(item("accepted", price=80.0, quantity=2), item("rejected", price=999.0, quantity=1))
        db = _FakeSession()
        result = compute_order_totals(db, o)
        assert result.subtotal_amount == 160.0
        assert result.total_amount == 160.0
        assert result.selection_offer_discount_amount == 0.0

    def test_price_falls_back_to_dish_price(self):
        o = SimpleNamespace(
            items=[SimpleNamespace(status="accepted", price=None, quantity=3,
                                   dish=SimpleNamespace(price=50.0))],
            person_id=None, hotel_id=1, updated_at=None,
        )
        result = compute_order_totals(_FakeSession(), o)
        assert result.subtotal_amount == 150.0

    def test_loyalty_discount_applied(self):
        o = order_with(item("accepted", price=100.0, quantity=2), person_id=5)
        person = SimpleNamespace(visit_count=1)
        loyalty = SimpleNamespace(discount_percentage=10.0)
        db = _FakeSession(person=person, loyalty=loyalty)
        result = compute_order_totals(db, o)
        assert result.loyalty_discount_amount == 20.0
        assert result.total_amount == 180.0

    def test_no_discount_without_person(self):
        o = order_with(item("accepted", price=100.0, quantity=2), person_id=None)
        db = _FakeSession(person=SimpleNamespace(visit_count=1),
                          loyalty=SimpleNamespace(discount_percentage=10.0))
        result = compute_order_totals(db, o)
        assert result.loyalty_discount_amount == 0.0
        assert result.total_amount == 200.0

    def test_selection_offer_discount_applied(self):
        o = order_with(item("accepted", price=100.0, quantity=2))
        db = _FakeSession(offer=SimpleNamespace(discount_amount=25.0))
        result = compute_order_totals(db, o)
        assert result.selection_offer_discount_amount == 25.0
        assert result.total_amount == 175.0

    def test_total_never_negative(self):
        # 100% discount would give exactly 0; a discount >= subtotal must not go negative
        o = order_with(item("accepted", price=10.0, quantity=1), person_id=5)
        db = _FakeSession(person=SimpleNamespace(visit_count=1),
                          loyalty=SimpleNamespace(discount_percentage=100.0))
        result = compute_order_totals(db, o)
        assert result.total_amount == 0.0


class TestFreeSlotIfNoUnpaidOrders:
    def test_frees_slot_when_no_other_unpaid_orders(self):
        o = order_with(item("accepted"))
        slot = SimpleNamespace(is_occupied=True, current_order_id=7)
        db = _FakeSession(unpaid_orders=0, slot=slot)
        free_slot_if_no_unpaid_orders(db, o)
        assert slot.is_occupied is False
        assert slot.current_order_id is None

    def test_keeps_slot_when_other_order_still_active(self):
        o = order_with(item("accepted"))
        slot = SimpleNamespace(is_occupied=True, current_order_id=7)
        db = _FakeSession(unpaid_orders=1, slot=slot)
        free_slot_if_no_unpaid_orders(db, o)
        assert slot.is_occupied is True
        assert slot.current_order_id == 7

    def test_noop_when_no_table_row(self):
        free_slot_if_no_unpaid_orders(_FakeSession(unpaid_orders=0, slot=None),
                                      order_with(item("accepted")))
