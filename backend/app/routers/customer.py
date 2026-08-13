from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from ..database import get_db, Dish, Order, OrderItem, Person, get_session_db, get_hotel_id_from_request
from ..models.dish import Dish as DishModel
from ..models.order import OrderCreate, Order as OrderModel
from ..models.user import (
    PersonCreate,
    PersonLogin,
    Person as PersonModel,
)
from ..middleware import get_session_id
from ..firebase_config import verify_firebase_token


class GoogleAuthRequest(BaseModel):
    id_token: str
    table_number: int
    slot_number: int = 1

router = APIRouter(
    prefix="/customer",
    tags=["customer"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get all dishes for menu (only visible ones)
@router.get("/api/menu", response_model=List[DishModel])
def get_menu(request: Request, category: str = None, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    if category:
        # Filter dishes that contain the specified category in their JSON array
        import json
        all_dishes = db.query(Dish).filter(
            Dish.hotel_id == hotel_id,
            Dish.visibility == 1
        ).all()

        filtered_dishes = []
        for dish in all_dishes:
            try:
                dish_categories = json.loads(dish.category) if dish.category else []
                if isinstance(dish_categories, list) and category in dish_categories:
                    filtered_dishes.append(dish)
                elif isinstance(dish_categories, str) and dish_categories == category:
                    filtered_dishes.append(dish)
            except (json.JSONDecodeError, TypeError):
                # Backward compatibility: treat as single category
                if dish.category == category:
                    filtered_dishes.append(dish)

        return filtered_dishes
    else:
        dishes = db.query(Dish).filter(
            Dish.hotel_id == hotel_id,
            Dish.visibility == 1
        ).all()
        return dishes


# Get offer dishes (only visible ones)
@router.get("/api/offers", response_model=List[DishModel])
def get_offers(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    dishes = db.query(Dish).filter(
        Dish.hotel_id == hotel_id,
        Dish.is_offer == 1,
        Dish.visibility == 1
    ).all()
    return dishes


# Get special dishes (only visible ones)
@router.get("/api/specials", response_model=List[DishModel])
def get_specials(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    dishes = db.query(Dish).filter(
        Dish.hotel_id == hotel_id,
        Dish.is_special == 1,
        Dish.visibility == 1
    ).all()
    return dishes


# Get all dish categories (only from visible dishes)
@router.get("/api/categories")
def get_categories(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    categories = db.query(Dish.category).filter(
        Dish.hotel_id == hotel_id,
        Dish.visibility == 1
    ).distinct().all()

    # Parse JSON categories and flatten them
    import json
    unique_categories = set()

    for category_tuple in categories:
        category_str = category_tuple[0]
        if category_str:
            try:
                # Try to parse as JSON array
                category_list = json.loads(category_str)
                if isinstance(category_list, list):
                    unique_categories.update(category_list)
                else:
                    unique_categories.add(category_str)
            except (json.JSONDecodeError, TypeError):
                # If not JSON, treat as single category
                unique_categories.add(category_str)

    return sorted(list(unique_categories))


# Register a new user or update existing user
@router.post("/api/register", response_model=PersonModel)
def register_user(user: PersonCreate, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    # Check if user already exists for this hotel
    db_user = db.query(Person).filter(
        Person.hotel_id == hotel_id,
        Person.username == user.username
    ).first()

    if db_user:
        # Update existing user's last visit time (visit count updated only when order is placed)
        db_user.last_visit = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_user)
        return db_user
    else:
        # Create new user (visit count will be incremented when first order is placed)
        db_user = Person(
            hotel_id=hotel_id,
            username=user.username,
            password=user.password,  # In a real app, you should hash this password
            visit_count=0,
            last_visit=datetime.now(timezone.utc),
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


# Login user
@router.post("/api/login", response_model=Dict[str, Any])
def login_user(user_data: PersonLogin, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    # Find user by username for this hotel
    db_user = db.query(Person).filter(
        Person.hotel_id == hotel_id,
        Person.username == user_data.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username"
        )

    # Check password (in a real app, you would verify hashed passwords)
    if db_user.password != user_data.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password"
        )

    # Update last visit time (but not visit count - that's only updated when order is placed)
    db_user.last_visit = datetime.now(timezone.utc)
    db.commit()

    # Return user info and a success message
    return {
        "user": {
            "id": db_user.id,
            "username": db_user.username,
            "visit_count": db_user.visit_count,
        },
        "message": "Login successful",
    }


# Create new order
@router.post("/api/orders", response_model=OrderModel)
def create_order(
    order: OrderCreate, request: Request, person_id: int = Query(None), db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)

    # If person_id is not provided but we have a username/password, try to find or create the user
    if not person_id and hasattr(order, "username") and hasattr(order, "password"):
        db_user = db.query(Person).filter(
            Person.hotel_id == hotel_id,
            Person.username == order.username
        ).first()
        if db_user:
            # Just update last_visit — visit_count increments only on payment
            db_user.last_visit = datetime.now(timezone.utc)
            db.commit()
            person_id = db_user.id
        else:
            db_user = Person(
                hotel_id=hotel_id,
                username=order.username,
                password=order.password,
                visit_count=0,
                last_visit=datetime.now(timezone.utc),
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            person_id = db_user.id
    elif person_id:
        # Just update last_visit — visit_count increments only on payment
        db_user = db.query(Person).filter(
            Person.hotel_id == hotel_id,
            Person.id == person_id
        ).first()
        if db_user:
            db_user.last_visit = datetime.now(timezone.utc)
            db.commit()

    # Create order
    db_order = Order(
        hotel_id=hotel_id,
        table_number=order.table_number,
        slot_number=order.slot_number,
        unique_id=order.unique_id,
        person_id=person_id,
        status="pending",
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    # Mark the slot as occupied
    from ..database import Table

    db_table = db.query(Table).filter(
        Table.hotel_id == hotel_id,
        Table.table_number == order.table_number,
        Table.slot_number == order.slot_number,
    ).first()
    if db_table:
        db_table.is_occupied = True
        db_table.current_order_id = db_order.id
        db.commit()

    # Create order items
    for item in order.items:
        # Get the dish to include its information and verify it belongs to this hotel
        dish = db.query(Dish).filter(
            Dish.hotel_id == hotel_id,
            Dish.id == item.dish_id
        ).first()
        if not dish:
            continue  # Skip if dish doesn't exist or doesn't belong to this hotel

        db_item = OrderItem(
            hotel_id=hotel_id,
            order_id=db_order.id,
            dish_id=item.dish_id,
            quantity=item.quantity,
            price=dish.price,  # Store price at time of order
            remarks=item.remarks,
        )
        db.add(db_item)

    db.commit()
    db.refresh(db_order)

    return db_order


# Get order status
@router.get("/api/orders/{order_id}", response_model=OrderModel)
def get_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    # Use joinedload to load the dish relationship for each order item
    order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == order_id
    ).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Explicitly load dish information for each order item
    for item in order.items:
        if not hasattr(item, "dish") or item.dish is None:
            dish = db.query(Dish).filter(
                Dish.hotel_id == hotel_id,
                Dish.id == item.dish_id
            ).first()
            if dish:
                item.dish = dish

    return order


# Get orders by person_id
@router.get("/api/person/{person_id}/orders", response_model=List[OrderModel])
def get_person_orders(person_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    # Get all orders for a specific person in this hotel
    orders = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.person_id == person_id
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    # Explicitly load dish information for each order item
    for order in orders:
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(
                    Dish.hotel_id == hotel_id,
                    Dish.id == item.dish_id
                ).first()
                if dish:
                    item.dish = dish

    return orders


# Request the bill for an order (customer presses "Get Bill").
# This only marks the order as payment_requested — the hotel generates the
# bill PDF and marks it paid from the admin dashboard.
@router.put("/api/orders/{order_id}/payment")
def request_payment(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    try:
        # Check if order exists and is not already paid
        db_order = db.query(Order).filter(
            Order.hotel_id == hotel_id,
            Order.id == order_id
        ).first()
        if db_order is None:
            raise HTTPException(status_code=404, detail="Order not found")

        # Check if order is already paid
        if db_order.status == "paid":
            return {"message": "Order is already paid"}

        # An order that was consolidated into the session's single bill — the
        # request already succeeded via its merged sibling. Idempotent no-op.
        if db_order.status == "merged":
            return {"message": "Bill requested successfully", "order_id": order_id}

        # Check if order is completed (ready for payment)
        if db_order.status != "completed":
            raise HTTPException(
                status_code=400,
                detail="Order must be completed before the bill can be requested"
            )

        # Combine every delivered-but-unpaid order on the same slot into a
        # single bill, so ordering multiple times before paying produces ONE
        # bill for the user (admin sees one row, one PDF, one mark-as-paid).
        from ..services.order_utils import merge_orders_for_bill

        merged = merge_orders_for_bill(db, hotel_id, db_order.table_number, db_order.slot_number)
        if merged is not None and merged.id != db_order.id:
            db_order = merged  # the requested order was absorbed into the bill

        # Compute and store the totals now so the bill is stable
        from ..services.order_utils import compute_order_totals

        compute_order_totals(db, db_order)
        db_order.status = "payment_requested"
        db_order.updated_at = datetime.now(timezone.utc)

        # Commit the transaction
        db.commit()
        db.refresh(db_order)

        return {"message": "Bill requested successfully", "order_id": db_order.id}

    except HTTPException:
        # Re-raise HTTP exceptions
        db.rollback()
        raise
    except Exception as e:
        # Handle any other exceptions
        db.rollback()
        print(f"Error processing payment for order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing payment: {str(e)}"
        )


# Cancel order
@router.put("/api/orders/{order_id}/cancel")
def cancel_order(order_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    db_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == order_id
    ).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order is in pending status (not accepted or completed)
    if db_order.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Only pending orders can be cancelled. Orders that have been accepted by the chef cannot be cancelled."
        )

    # Update order status to cancelled
    current_time = datetime.now(timezone.utc)
    db_order.status = "cancelled"
    db_order.updated_at = current_time

    # Mark the table as free if this was the current order (scoped to hotel + slot)
    from ..database import Table

    db_table = db.query(Table).filter(
        Table.hotel_id == hotel_id,
        Table.table_number == db_order.table_number,
        Table.slot_number == db_order.slot_number,
    ).first()
    if db_table and db_table.current_order_id == db_order.id:
        db_table.is_occupied = False
        db_table.current_order_id = None
        db_table.updated_at = current_time

    db.commit()

    return {"message": "Order cancelled successfully"}


# Get person details
@router.get("/api/person/{person_id}", response_model=PersonModel)
def get_person(person_id: int, request: Request, db: Session = Depends(get_session_database)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


# Google Sign-In for customers
@router.post("/api/auth/google")
def google_auth(payload: GoogleAuthRequest, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)

    try:
        claims = verify_firebase_token(payload.id_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    google_uid = claims["uid"]
    email = claims.get("email", "")
    display_name = claims.get("name", "") or email.split("@")[0]
    photo_url = claims.get("picture", "")

    # Find existing person by google_uid for this hotel
    person = db.query(Person).filter(
        Person.hotel_id == hotel_id,
        Person.google_uid == google_uid
    ).first()

    is_new_user = False
    if not person:
        is_new_user = True
        person = Person(
            hotel_id=hotel_id,
            google_uid=google_uid,
            email=email,
            display_name=display_name,
            username=display_name,
            photo_url=photo_url,
            visit_count=0,
            last_visit=datetime.now(timezone.utc),
        )
        db.add(person)
    else:
        # Update profile info in case it changed in Google
        person.display_name = display_name
        person.email = email
        person.photo_url = photo_url
        person.last_visit = datetime.now(timezone.utc)

    db.commit()
    db.refresh(person)

    return {
        "user_id": person.id,
        "display_name": person.display_name,
        "email": person.email,
        "photo_url": person.photo_url,
        "visit_count": person.visit_count,
        "is_new_user": is_new_user,
    }
    return person
