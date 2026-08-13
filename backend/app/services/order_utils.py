# Shared order helpers used across customer / chef / admin routers
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from ..database import LoyaltyProgram, Order, Person, SelectionOffer, Table


def served_items(order):
    """Order items that will actually be served/billed (rejected ones are excluded)."""
    return [item for item in order.items if item.status != "rejected"]


def recompute_order_status(order):
    """Derive the order-level status from the per-dish item statuses.

    Rule:
    - at least one item accepted  -> accepted (partially or fully accepted)
    - otherwise any item pending  -> pending (chef still deciding)
    - otherwise (all items rejected) -> rejected
    """
    if not order.items:
        return

    item_statuses = [item.status for item in order.items]
    if "accepted" in item_statuses:
        order.status = "accepted"
    elif "pending" in item_statuses:
        order.status = "pending"
    else:
        order.status = "rejected"
    order.updated_at = datetime.now(timezone.utc)


def compute_order_totals(db: Session, db_order):
    """Compute subtotal (excluding rejected items, using the stored price snapshot)
    and apply loyalty + selection-offer discounts. Writes the amounts onto the order.
    Returns the order for convenience."""
    subtotal = 0.0
    for item in db_order.items:
        if item.status == "rejected":
            continue
        unit_price = item.price if item.price is not None else (
            item.dish.price if item.dish else 0
        )
        subtotal += float(unit_price) * item.quantity

    loyalty_discount_amount = 0.0
    loyalty_discount_percentage = 0.0
    selection_offer_discount_amount = 0.0

    if db_order.person_id:
        person = db.query(Person).filter(Person.id == db_order.person_id).first()
        if person:
            loyalty_tier = (
                db.query(LoyaltyProgram)
                .filter(
                    LoyaltyProgram.hotel_id == db_order.hotel_id,
                    LoyaltyProgram.visit_count == person.visit_count,
                    LoyaltyProgram.is_active == True,
                )
                .first()
            )
            if loyalty_tier:
                loyalty_discount_percentage = loyalty_tier.discount_percentage or 0
                loyalty_discount_amount = subtotal * (loyalty_discount_percentage / 100)

    selection_offer = (
        db.query(SelectionOffer)
        .filter(
            SelectionOffer.hotel_id == db_order.hotel_id,
            SelectionOffer.min_amount <= subtotal,
            SelectionOffer.is_active == True,
        )
        .order_by(SelectionOffer.min_amount.desc())
        .first()
    )
    if selection_offer:
        selection_offer_discount_amount = selection_offer.discount_amount or 0

    final_total = max(0.0, subtotal - loyalty_discount_amount - selection_offer_discount_amount)

    db_order.subtotal_amount = round(subtotal, 2)
    db_order.loyalty_discount_amount = round(loyalty_discount_amount, 2)
    db_order.loyalty_discount_percentage = loyalty_discount_percentage
    db_order.selection_offer_discount_amount = round(selection_offer_discount_amount, 2)
    db_order.total_amount = round(final_total, 2)
    db_order.updated_at = datetime.now(timezone.utc)
    return db_order


def free_slot_if_no_unpaid_orders(db: Session, db_order):
    """Free the table slot (table_number + slot_number) when no other order on the
    same slot is still unpaid / active. Safe no-op otherwise."""
    unpaid_slot_orders = db.query(Order).filter(
        Order.hotel_id == db_order.hotel_id,
        Order.table_number == db_order.table_number,
        Order.slot_number == db_order.slot_number,
        Order.status.notin_(["paid", "cancelled", "merged"]),
        Order.id != db_order.id,
    ).count()

    if unpaid_slot_orders > 0:
        return

    slot = (
        db.query(Table)
        .filter(
            Table.hotel_id == db_order.hotel_id,
            Table.table_number == db_order.table_number,
            Table.slot_number == db_order.slot_number,
        )
        .first()
    )
    if slot:
        slot.is_occupied = False
        slot.current_order_id = None
        slot.updated_at = datetime.now(timezone.utc)


def merge_orders_for_bill(db: Session, hotel_id: int, table_number: int, slot_number: int):
    """Consolidate every delivered-but-unpaid order on a slot into one bill.

    When a customer orders multiple times before paying, each placement used to
    create a separate Order (and thus a separate bill). This moves the items of
    all but the earliest billable order onto the earliest one and marks the
    rest as ``merged`` so the whole session settles as a single bill.

    Returns the surviving bill order (or None if nothing to bill)."""
    orders = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.table_number == table_number,
            Order.slot_number == slot_number,
            Order.status.in_(["completed", "payment_requested"]),
        )
        .order_by(Order.created_at.asc(), Order.id.asc())
        .all()
    )
    if not orders:
        return None

    target = orders[0]
    merged_ids = []
    for src in orders[1:]:
        for item in list(src.items):
            item.order_id = target.id
        src.status = "merged"
        src.updated_at = datetime.now(timezone.utc)
        merged_ids.append(src.id)

    if merged_ids:
        compute_order_totals(db, target)
        slot = (
            db.query(Table)
            .filter(
                Table.hotel_id == hotel_id,
                Table.table_number == table_number,
                Table.slot_number == slot_number,
            )
            .first()
        )
        if slot and slot.current_order_id in merged_ids:
            slot.current_order_id = target.id
        db.commit()

    return target
