from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import hashlib

from ..database import Dish, Order, OrderItem, get_session_db, get_hotel_id_from_request, engine, Hotel, ChefAccount, Person, db_manager
from ..models.order import Order as OrderModel
from ..middleware import get_session_id
from ..services.order_utils import recompute_order_status


class ChefLoginRequest(BaseModel):
    username: str
    password: str
    hotel_id: int


class ItemRejectRequest(BaseModel):
    reason: Optional[str] = None


router = APIRouter(
    prefix="/chef",
    tags=["chef"],
    responses={404: {"description": "Not found"}},
)


# Chef Login — username/password authentication
@router.post("/auth/login")
def chef_login(payload: ChefLoginRequest, request: Request):
    # Hash the password
    password_hash = hashlib.sha256(payload.password.encode()).hexdigest()

    # Look up chef account by username and hotel
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        chef = db.query(ChefAccount).filter(
            ChefAccount.username == payload.username,
            ChefAccount.hotel_id == payload.hotel_id,
            ChefAccount.is_active == True,
        ).first()

        if not chef or chef.password != password_hash:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )

        hotel = db.query(Hotel).filter(Hotel.id == chef.hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        # Set hotel context for this session
        session_id = get_session_id(request)
        db_manager.set_hotel_context(session_id, chef.hotel_id)

        return {
            "chef_id": chef.id,
            "hotel_id": chef.hotel_id,
            "hotel_name": hotel.hotel_name,
            "display_name": chef.display_name or chef.username,
            "username": chef.username,
        }
    finally:
        db.close()


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


def _load_order_details(db: Session, order):
    """Attach customer name + dish details so the chef can track who ordered what."""
    if order.person_id:
        person = db.query(Person).filter(Person.id == order.person_id).first()
        if person:
            order.person_name = person.display_name or person.username or person.email or 'Guest'
    for item in order.items:
        if not hasattr(item, "dish") or item.dish is None:
            dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
            if dish:
                item.dish = dish
    return order


def _load_orders_details(db: Session, orders):
    for order in orders:
        _load_order_details(db, order)
    return orders


def _get_order(db: Session, hotel_id: int, order_id: int) -> Order:
    db_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == order_id
    ).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return db_order


def _get_item(db: Session, hotel_id: int, order_id: int, item_id: int) -> OrderItem:
    db_order = _get_order(db, hotel_id, order_id)
    db_item = db.query(OrderItem).filter(
        OrderItem.id == item_id,
        OrderItem.order_id == db_order.id,
        OrderItem.hotel_id == hotel_id,
    ).first()
    if db_item is None:
        raise HTTPException(status_code=404, detail="Order item not found")
    return db_item


# Add an API endpoint to get completed orders count
@router.get("/api/completed-orders-count")
def get_completed_orders_count(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    completed_orders = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.status == "completed"
    ).count()
    return {"count": completed_orders}

# Get pending orders (orders that need to be accepted)
@router.get("/orders/pending", response_model=List[OrderModel])
def get_pending_orders(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    orders = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.status == "pending"
    ).all()
    return _load_orders_details(db, orders)

# Get accepted orders (orders that have been accepted but not completed)
@router.get("/orders/accepted", response_model=List[OrderModel])
def get_accepted_orders(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    orders = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.status == "accepted"
    ).all()
    return _load_orders_details(db, orders)

# Accept a whole order (accepts every pending dish in it)
@router.put("/orders/{order_id}/accept")
def accept_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    db_order = _get_order(db, hotel_id, order_id)

    if db_order.status not in ("pending", "accepted"):
        raise HTTPException(status_code=400, detail="Order is not in a pending state")

    for item in db_order.items:
        if item.status == "pending":
            item.status = "accepted"

    recompute_order_status(db_order)
    db.commit()

    return {"message": "Order accepted successfully"}

# Accept a single dish of an order
@router.put("/orders/{order_id}/items/{item_id}/accept")
def accept_order_item(order_id: int, item_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    db_item = _get_item(db, hotel_id, order_id, item_id)

    if db_item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending dishes can be accepted")

    db_item.status = "accepted"
    db_item.rejection_reason = None
    recompute_order_status(db_item.order)
    db.commit()

    return {"message": "Dish accepted successfully"}

# Reject a single dish of an order
@router.put("/orders/{order_id}/items/{item_id}/reject")
def reject_order_item(
    order_id: int,
    item_id: int,
    request: Request,
    payload: Optional[ItemRejectRequest] = None,
    db: Session = Depends(get_session_database),
):
    hotel_id = get_hotel_id_from_request(request)
    db_item = _get_item(db, hotel_id, order_id, item_id)

    if db_item.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending dishes can be rejected")

    reason = payload.reason if payload else None
    db_item.status = "rejected"
    db_item.rejection_reason = reason
    recompute_order_status(db_item.order)
    db.commit()

    return {"message": "Dish rejected", "reason": reason}

# Mark order as completed (only orders with no pending dishes can be completed)
@router.put("/orders/{order_id}/complete")
def complete_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    db_order = _get_order(db, hotel_id, order_id)

    if db_order.status != "accepted":
        raise HTTPException(status_code=400, detail="Order must be accepted before it can be completed")

    pending_items = [item for item in db_order.items if item.status == "pending"]
    if pending_items:
        raise HTTPException(
            status_code=400,
            detail="All dishes must be accepted or rejected before the order can be completed",
        )

    db_order.status = "completed"
    db_order.updated_at = datetime.now(timezone.utc)

    db.commit()

    return {"message": "Order marked as completed"}
