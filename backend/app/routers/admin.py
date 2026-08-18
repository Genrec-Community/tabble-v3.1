from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
import os
import shutil
import hashlib
from datetime import datetime, timezone
from ..utils.pdf_generator import generate_bill_pdf, generate_multi_order_bill_pdf
from ..storage_adapter import get_storage_adapter

from ..database import (
    get_db,
    Order,
    Dish,
    OrderItem,
    Person,
    Settings,
    ChefAccount,
    Hotel,
    Table as TableModel,
    get_session_db,
    get_session_current_database,
    get_hotel_id_from_request,
)
from ..models.order import Order as OrderModel
from ..models.dish import Dish as DishModel, DishCreate, DishUpdate
from ..middleware import get_session_id

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get all orders with customer information
@router.get("/orders", response_model=List[OrderModel])
def get_all_orders(
    request: Request, status: str = None, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)

    query = db.query(Order).filter(Order.hotel_id == hotel_id)

    if status:
        query = query.filter(Order.status == status)

    # Order by most recent first
    orders = query.order_by(Order.created_at.desc()).all()

    # Load person information for each order
    for order in orders:
        if order.person_id:
            person = (
                db.query(Person)
                .filter(Person.hotel_id == hotel_id, Person.id == order.person_id)
                .first()
            )
            if person:
                # Add person information to the order
                order.person_name = person.display_name or person.username or person.email or 'Guest'
                order.visit_count = person.visit_count

        # Load dish information for each order item
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = (
                    db.query(Dish)
                    .filter(Dish.hotel_id == hotel_id, Dish.id == item.dish_id)
                    .first()
                )
                if dish:
                    item.dish = dish

    return orders


# Get all dishes (only visible ones)
@router.get("/api/dishes", response_model=List[DishModel])
def get_all_dishes(
    request: Request,
    is_offer: Optional[int] = None,
    is_special: Optional[int] = None,
    db: Session = Depends(get_session_database),
):
    hotel_id = get_hotel_id_from_request(request)

    query = db.query(Dish).filter(
        Dish.hotel_id == hotel_id, Dish.visibility == 1
    )  # Only visible dishes for this hotel

    if is_offer is not None:
        query = query.filter(Dish.is_offer == is_offer)

    if is_special is not None:
        query = query.filter(Dish.is_special == is_special)

    dishes = query.all()
    return dishes


# Get offer dishes (only visible ones)
@router.get("/api/offers", response_model=List[DishModel])
def get_offer_dishes(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    dishes = (
        db.query(Dish)
        .filter(Dish.hotel_id == hotel_id, Dish.is_offer == 1, Dish.visibility == 1)
        .all()
    )
    return dishes


# Get special dishes (only visible ones)
@router.get("/api/specials", response_model=List[DishModel])
def get_special_dishes(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    dishes = (
        db.query(Dish)
        .filter(Dish.hotel_id == hotel_id, Dish.is_special == 1, Dish.visibility == 1)
        .all()
    )
    return dishes


# Get dish by ID (only if visible)
@router.get("/api/dishes/{dish_id}", response_model=DishModel)
def get_dish(
    dish_id: int, request: Request, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)
    dish = (
        db.query(Dish)
        .filter(Dish.hotel_id == hotel_id, Dish.id == dish_id, Dish.visibility == 1)
        .first()
    )
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")
    return dish


# Get all categories
@router.get("/api/categories")
def get_all_categories(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    categories = (
        db.query(Dish.category).filter(Dish.hotel_id == hotel_id).distinct().all()
    )

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

    # Parse categories from JSON format and flatten into unique list
    import json

    unique_categories = set()

    for category_data in categories:
        category_str = category_data[0]
        if category_str:
            try:
                # Try to parse as JSON array
                category_list = json.loads(category_str)
                if isinstance(category_list, list):
                    unique_categories.update(category_list)
                else:
                    unique_categories.add(category_str)
            except (json.JSONDecodeError, TypeError):
                # If not JSON, treat as single category (backward compatibility)
                unique_categories.add(category_str)

    return sorted(list(unique_categories))


# Create new category
@router.post("/api/categories")
def create_category(
    request: Request,
    category_name: str = Form(...),
    db: Session = Depends(get_session_database),
):
    hotel_id = get_hotel_id_from_request(request)

    # Check if category already exists for this hotel
    existing_category = (
        db.query(Dish.category)
        .filter(Dish.hotel_id == hotel_id, Dish.category == category_name)
        .first()
    )
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    return {"message": "Category created successfully", "category": category_name}


# Create new dish
@router.post("/api/dishes", response_model=DishModel)
async def create_dish(
    request: Request,
    name: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(
        None
    ),  # Made optional since frontend sends 'categories'
    new_category: Optional[str] = Form(None),  # New field for custom category
    categories: Optional[str] = Form(None),  # JSON array of multiple categories
    price: float = Form(...),
    quantity: Optional[int] = Form(0),  # Made optional with default
    discount: Optional[float] = Form(0),  # Discount amount (percentage)
    is_offer: Optional[int] = Form(0),  # Whether this dish is part of offers
    is_special: Optional[int] = Form(0),  # Whether this dish is today's special
    is_vegetarian: Optional[int] = Form(
        1
    ),  # Optional with default: 1 = vegetarian, 0 = non-vegetarian
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database),
):
    hotel_id = get_hotel_id_from_request(request)

    # Handle categories - support both single and multiple categories
    import json

    final_category = None

    if categories:
        # Multiple categories provided as JSON array (primary method from frontend)
        try:
            category_list = json.loads(categories)
            final_category = json.dumps(category_list)  # Store as JSON string
        except json.JSONDecodeError:
            final_category = json.dumps([categories])  # Fallback to single category
    elif new_category:
        # Single new category
        final_category = json.dumps([new_category])
    elif category:
        # Single existing category (fallback)
        final_category = json.dumps([category])
    else:
        # Default category if nothing provided
        final_category = json.dumps(["General"])

    # Create dish object
    db_dish = Dish(
        hotel_id=hotel_id,
        name=name,
        description=description,
        category=final_category,
        price=price,
        quantity=quantity,
        discount=discount,
        is_offer=is_offer,
        is_special=is_special,
        is_vegetarian=is_vegetarian,
    )

    # Save dish to database
    db.add(db_dish)
    db.commit()
    db.refresh(db_dish)

    # Handle image upload if provided
    if image:
        # Get hotel info for organizing images
        from ..database import Hotel

        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        hotel_name_for_path = hotel.hotel_name if hotel else f"hotel_{hotel_id}"

        # Use storage adapter to upload image
        storage_adapter = get_storage_adapter()
        try:
            image_url = storage_adapter.upload_image(image, hotel_name_for_path, "dishes", db_dish.id)

            # Update dish with image path
            db_dish.image_path = image_url
            db.commit()
            db.refresh(db_dish)
        except Exception as e:
            print(f"Error uploading image: {e}")
            # Continue without image if upload fails

    return db_dish


# Update dish
@router.put("/api/dishes/{dish_id}", response_model=DishModel)
async def update_dish(
    dish_id: int,
    request: Request,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    new_category: Optional[str] = Form(None),  # New field for custom category
    categories: Optional[str] = Form(None),  # JSON array of multiple categories
    price: Optional[float] = Form(None),
    quantity: Optional[int] = Form(None),
    discount: Optional[float] = Form(None),  # Discount amount (percentage)
    is_offer: Optional[int] = Form(None),  # Whether this dish is part of offers
    is_special: Optional[int] = Form(None),  # Whether this dish is today's special
    is_vegetarian: Optional[int] = Form(None),  # 1 = vegetarian, 0 = non-vegetarian
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database),
):
    hotel_id = get_hotel_id_from_request(request)

    # Get existing dish for this hotel
    db_dish = (
        db.query(Dish).filter(Dish.hotel_id == hotel_id, Dish.id == dish_id).first()
    )
    if db_dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Update fields if provided
    if name:
        db_dish.name = name
    if description:
        db_dish.description = description

    # Handle categories - support both single and multiple categories
    import json

    if categories:
        # Multiple categories provided as JSON array
        try:
            category_list = json.loads(categories)
            db_dish.category = json.dumps(category_list)
        except json.JSONDecodeError:
            db_dish.category = json.dumps([categories])
    elif new_category:  # Use new category if provided
        db_dish.category = json.dumps([new_category])
    elif category:
        db_dish.category = json.dumps([category])

    if price:
        db_dish.price = price
    if quantity is not None:  # Allow 0 quantity
        db_dish.quantity = quantity
    if discount is not None:
        db_dish.discount = discount
    if is_offer is not None:
        db_dish.is_offer = is_offer
    if is_special is not None:
        db_dish.is_special = is_special
    if is_vegetarian is not None:
        db_dish.is_vegetarian = is_vegetarian

    # Handle image upload if provided
    if image:
        # Get hotel info for organizing images
        from ..database import Hotel
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        hotel_name_for_path = hotel.hotel_name if hotel else f"hotel_{hotel_id}"

        # Use storage adapter to upload image
        storage_adapter = get_storage_adapter()
        try:
            # Delete old image if it exists
            if db_dish.image_path:
                storage_adapter.delete_image(db_dish.image_path)

            # Upload new image
            image_url = storage_adapter.upload_image(image, hotel_name_for_path, "dishes", db_dish.id)
            db_dish.image_path = image_url
        except Exception as e:
            print(f"Error uploading image: {e}")
            # Continue without updating image if upload fails

    # Update timestamp
    db_dish.updated_at = datetime.now(timezone.utc)

    # Save changes
    db.commit()
    db.refresh(db_dish)

    return db_dish


# Soft delete dish (set visibility to 0)
@router.delete("/api/dishes/{dish_id}")
def delete_dish(
    dish_id: int, request: Request, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)

    db_dish = (
        db.query(Dish)
        .filter(Dish.hotel_id == hotel_id, Dish.id == dish_id, Dish.visibility == 1)
        .first()
    )
    if db_dish is None:
        raise HTTPException(status_code=404, detail="Dish not found")

    # Soft delete: set visibility to 0 instead of actually deleting
    db_dish.visibility = 0
    db_dish.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Dish deleted successfully"}


# Get order statistics
@router.get("/stats/orders")
def get_order_stats(request: Request, db: Session = Depends(get_session_database)):
    from sqlalchemy import func, and_

    hotel_id = get_hotel_id_from_request(request)

    # Get today's date range (start and end of today in UTC)
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_end = datetime.now(timezone.utc).replace(
        hour=23, minute=59, second=59, microsecond=999999
    )

    # Overall statistics
    total_orders = db.query(Order).filter(Order.hotel_id == hotel_id).count()
    pending_orders = (
        db.query(Order)
        .filter(Order.hotel_id == hotel_id, Order.status == "pending")
        .count()
    )
    completed_orders = (
        db.query(Order)
        .filter(Order.hotel_id == hotel_id, Order.status == "completed")
        .count()
    )
    payment_requested = (
        db.query(Order)
        .filter(Order.hotel_id == hotel_id, Order.status == "payment_requested")
        .count()
    )
    paid_orders = (
        db.query(Order)
        .filter(Order.hotel_id == hotel_id, Order.status == "paid")
        .count()
    )

    # Today's statistics
    total_orders_today = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            and_(Order.created_at >= today_start, Order.created_at <= today_end),
        )
        .count()
    )

    pending_orders_today = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.status == "pending",
            and_(Order.created_at >= today_start, Order.created_at <= today_end),
        )
        .count()
    )

    completed_orders_today = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.status == "completed",
            and_(Order.created_at >= today_start, Order.created_at <= today_end),
        )
        .count()
    )

    paid_orders_today = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.status == "paid",
            and_(Order.created_at >= today_start, Order.created_at <= today_end),
        )
        .count()
    )

    # Calculate today's revenue from paid orders
    revenue_today_query = (
        db.query(func.sum(Dish.price * OrderItem.quantity).label("revenue_today"))
        .join(OrderItem, Dish.id == OrderItem.dish_id)
        .join(Order, OrderItem.order_id == Order.id)
        .filter(Order.hotel_id == hotel_id)
        .filter(Order.status == "paid")
        .filter(and_(Order.created_at >= today_start, Order.created_at <= today_end))
    )

    revenue_today_result = revenue_today_query.first()
    revenue_today = (
        revenue_today_result.revenue_today if revenue_today_result.revenue_today else 0
    )

    return {
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "payment_requested": payment_requested,
        "paid_orders": paid_orders,
        "total_orders_today": total_orders_today,
        "pending_orders_today": pending_orders_today,
        "completed_orders_today": completed_orders_today,
        "paid_orders_today": paid_orders_today,
        "revenue_today": round(revenue_today, 2),
    }


# Mark order as paid (hotel admin — after generating the bill).
# Computes totals if missing, increments the customer's visit count (once),
# and frees the table slot when no other order is still active on it.
@router.put("/orders/{order_id}/paid")
def mark_order_paid(
    order_id: int, request: Request, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)

    db_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == order_id,
    ).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # The customer may have pressed "Get Bill" while the admin dashboard was
    # showing a stale order list — that merges every active order on the slot
    # into one bill and marks the others "merged". Resolve to the bill target
    # so marking the bill paid still succeeds instead of erroring with a 400.
    if db_order.status == "merged":
        bill_order = (
            db.query(Order)
            .filter(
                Order.hotel_id == hotel_id,
                Order.table_number == db_order.table_number,
                Order.slot_number == db_order.slot_number,
                Order.status.in_(["completed", "payment_requested"]),
                Order.id != db_order.id,
            )
            .order_by(Order.created_at.asc(), Order.id.asc())
            .first()
        )
        if bill_order is not None:
            db_order = bill_order
        else:
            return {"message": "Order was merged into another bill and is already settled"}

    if db_order.status == "paid":
        return {"message": "Order is already paid"}

    if db_order.status not in ("completed", "payment_requested"):
        raise HTTPException(
            status_code=400,
            detail="Only completed orders or orders waiting for the bill can be marked as paid",
        )

    # Make sure totals are stored so the bill is consistent
    from ..services.order_utils import compute_order_totals, free_slot_if_no_unpaid_orders

    if db_order.total_amount is None:
        compute_order_totals(db, db_order)

    # Claim the transition atomically so a double click or a second admin
    # tab can never pay the same order twice (which would double the visit
    # count and can surface as "database is locked" on commit).
    claimed = (
        db.query(Order)
        .filter(
            Order.id == db_order.id,
            Order.status.in_(["completed", "payment_requested"]),
        )
        .update(
            {
                Order.status: "paid",
                Order.updated_at: datetime.now(timezone.utc),
            },
            synchronize_session=False,
        )
    )
    if not claimed:
        db.rollback()
        return {"message": "Order is already paid"}

    # Increment visit count on payment — only counts completed payments
    if db_order.person_id:
        person = db.query(Person).filter(Person.id == db_order.person_id).first()
        if person:
            person.visit_count += 1
            person.last_visit = datetime.now(timezone.utc)

    # Free the slot (table_number + slot_number) when the bill is settled
    free_slot_if_no_unpaid_orders(db, db_order)

    db.commit()

    return {"message": "Order marked as paid"}


# Generate bill PDF for a single order
@router.get("/orders/{order_id}/bill")
def generate_bill(
    order_id: int, request: Request, db: Session = Depends(get_session_database)
):
    # Get hotel ID from request
    hotel_id = get_hotel_id_from_request(request)

    # Get order with all details (scoped to this hotel)
    db_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == order_id,
    ).first()
    if db_order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Load person information if available
    if db_order.person_id:
        person = db.query(Person).filter(Person.id == db_order.person_id).first()
        if person:
            db_order.person_name = person.display_name or person.username or person.email or 'Guest'

    # Load dish information for each order item
    for item in db_order.items:
        if not hasattr(item, "dish") or item.dish is None:
            dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
            if dish:
                item.dish = dish

    # Get hotel settings for this specific hotel
    settings = db.query(Settings).filter(Settings.hotel_id == hotel_id).first()
    if not settings:
        # Create default settings if none exist for this hotel
        settings = Settings(
            hotel_id=hotel_id,
            hotel_name="Tabble Hotel",
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Generate PDF
    pdf_buffer = generate_bill_pdf(db_order, settings)

    # Return PDF as a downloadable file
    filename = f"bill_order_{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Generate bill PDF for multiple orders
@router.post("/orders/multi-bill")
def generate_multi_bill(
    order_ids: List[int], request: Request, db: Session = Depends(get_session_database)
):
    if not order_ids:
        raise HTTPException(status_code=400, detail="No order IDs provided")

    orders = []

    # Get hotel ID from request
    hotel_id = get_hotel_id_from_request(request)

    # Get all orders with details (scoped to this hotel)
    for order_id in order_ids:
        db_order = db.query(Order).filter(
            Order.hotel_id == hotel_id,
            Order.id == order_id,
        ).first()
        if db_order is None:
            raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

        # Load person information if available
        if db_order.person_id:
            person = db.query(Person).filter(Person.id == db_order.person_id).first()
            if person:
                db_order.person_name = person.display_name or person.username or person.email or 'Guest'

        # Load dish information for each order item
        for item in db_order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

        orders.append(db_order)

    # Get hotel settings for this specific hotel
    settings = db.query(Settings).filter(Settings.hotel_id == hotel_id).first()
    if not settings:
        # Create default settings if none exist for this hotel
        settings = Settings(
            hotel_id=hotel_id,
            hotel_name="Tabble Hotel",
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Generate PDF for multiple orders
    pdf_buffer = generate_multi_order_bill_pdf(orders, settings)

    # Create a filename with all order IDs
    order_ids_str = "-".join([str(order_id) for order_id in order_ids])
    filename = (
        f"bill_orders_{order_ids_str}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# Merge two orders
@router.post("/orders/merge")
def merge_orders(
    source_order_id: int,
    target_order_id: int,
    request: Request,
    db: Session = Depends(get_session_database),
):
    # Get both orders (scoped to this hotel)
    hotel_id = get_hotel_id_from_request(request)
    source_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == source_order_id,
    ).first()
    target_order = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.id == target_order_id,
    ).first()

    if not source_order:
        raise HTTPException(
            status_code=404, detail=f"Source order {source_order_id} not found"
        )

    if not target_order:
        raise HTTPException(
            status_code=404, detail=f"Target order {target_order_id} not found"
        )

    # Check if both orders are completed or paid
    valid_statuses = ["completed", "paid"]
    if source_order.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Source order must be completed or paid, current status: {source_order.status}",
        )

    if target_order.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Target order must be completed or paid, current status: {target_order.status}",
        )

    # Move all items from source order to target order
    for item in source_order.items:
        # Update the order_id to point to the target order
        item.order_id = target_order.id

    # Update the target order's updated_at timestamp
    target_order.updated_at = datetime.now(timezone.utc)

    # Delete the source order (but keep its items which now belong to the target order)
    db.delete(source_order)

    # Commit changes
    db.commit()

    # Refresh the target order to include the new items
    db.refresh(target_order)

    return {
        "message": f"Orders merged successfully. Items from order #{source_order_id} have been moved to order #{target_order_id}"
    }


# Get orders for billing: completed (delivered, walk-in pay at counter),
# payment_requested (customer pressed "Get Bill"), and already paid (re-print)
@router.get("/orders/completed-for-billing", response_model=List[OrderModel])
def get_completed_orders_for_billing(
    request: Request, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)

    orders = (
        db.query(Order)
        .filter(
            Order.hotel_id == hotel_id,
            Order.status.in_(["completed", "payment_requested", "paid"]),
        )
        .order_by(Order.created_at.desc())
        .all()
    )

    # Load person information for each order
    for order in orders:
        if order.person_id:
            person = db.query(Person).filter(Person.id == order.person_id).first()
            if person:
                # Add person information to the order
                order.person_name = person.display_name or person.username or person.email or 'Guest'
                order.visit_count = person.visit_count

        # Load dish information for each order item
        for item in order.items:
            if not hasattr(item, "dish") or item.dish is None:
                dish = db.query(Dish).filter(Dish.id == item.dish_id).first()
                if dish:
                    item.dish = dish

    return orders


# ── Chef Account Management ──────────────────────────────────────────────────

class ChefCreateRequest(BaseModel):
    username: str
    password: str
    display_name: Optional[str] = None


class ChefUpdateRequest(BaseModel):
    password: Optional[str] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/chefs")
def list_chefs(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    chefs = db.query(ChefAccount).filter(ChefAccount.hotel_id == hotel_id).all()
    return [
        {
            "id": c.id,
            "username": c.username,
            "display_name": c.display_name,
            "is_active": c.is_active,
            "created_at": c.created_at,
        }
        for c in chefs
    ]


@router.post("/chefs")
def add_chef(payload: ChefCreateRequest, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    username = payload.username.lower().strip()

    existing = db.query(ChefAccount).filter(
        ChefAccount.hotel_id == hotel_id,
        ChefAccount.username == username,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This username is already taken for this hotel")

    # Hash password
    password_hash = hashlib.sha256(payload.password.encode()).hexdigest()

    chef = ChefAccount(
        hotel_id=hotel_id,
        username=username,
        password=password_hash,
        display_name=payload.display_name or username,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(chef)
    db.commit()
    db.refresh(chef)
    return {
        "id": chef.id,
        "username": chef.username,
        "display_name": chef.display_name,
        "is_active": chef.is_active
    }


@router.put("/chefs/{chef_id}")
def update_chef(chef_id: int, payload: ChefUpdateRequest, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    chef = db.query(ChefAccount).filter(
        ChefAccount.id == chef_id, ChefAccount.hotel_id == hotel_id
    ).first()
    if not chef:
        raise HTTPException(status_code=404, detail="Chef not found")

    if payload.password:
        chef.password = hashlib.sha256(payload.password.encode()).hexdigest()
    if payload.display_name is not None:
        chef.display_name = payload.display_name
    if payload.is_active is not None:
        chef.is_active = payload.is_active

    db.commit()
    db.refresh(chef)
    return {
        "id": chef.id,
        "username": chef.username,
        "display_name": chef.display_name,
        "is_active": chef.is_active
    }


@router.put("/chefs/{chef_id}/toggle")
def toggle_chef(chef_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    chef = db.query(ChefAccount).filter(
        ChefAccount.id == chef_id, ChefAccount.hotel_id == hotel_id
    ).first()
    if not chef:
        raise HTTPException(status_code=404, detail="Chef not found")
    chef.is_active = not chef.is_active
    db.commit()
    return {"id": chef.id, "username": chef.username, "is_active": chef.is_active}


@router.delete("/chefs/{chef_id}")
def remove_chef(chef_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    chef = db.query(ChefAccount).filter(
        ChefAccount.id == chef_id, ChefAccount.hotel_id == hotel_id
    ).first()
    if not chef:
        raise HTTPException(status_code=404, detail="Chef not found")
    db.delete(chef)
    db.commit()
    return {"message": f"Chef {chef.username} removed"}


# ── Super Admin - Hotel Management ───────────────────────────────────────────

class SuperAdminAuth(BaseModel):
    password: str


class HotelCreateRequest(BaseModel):
    name: str
    phone: str
    password: str
    address: Optional[str] = ""
    email: Optional[str] = ""


class HotelUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None


class HotelResponseModel(BaseModel):
    id: int
    name: str
    phone: str
    address: Optional[str]
    email: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_hotel(cls, hotel):
        """Convert Hotel DB model to response model"""
        return cls(
            id=hotel.id,
            name=hotel.hotel_name,
            phone=hotel.phone_number or '',
            address=hotel.address or '',
            email=hotel.email or '',
            created_at=hotel.created_at
        )


@router.post("/super/auth")
def verify_super_admin_password(auth: SuperAdminAuth, db: Session = Depends(get_db)):
    admin_password = os.getenv("ADMIN_PASSWORD", "adminoftabble")

    if auth.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid admin password")

    return {"success": True, "message": "Authentication successful"}


@router.get("/super/hotels", response_model=List[HotelResponseModel])
def get_all_hotels_super(db: Session = Depends(get_db)):
    hotels = db.query(Hotel).order_by(Hotel.created_at.desc()).all()
    return [HotelResponseModel.from_hotel(h) for h in hotels]


@router.get("/super/hotels/{hotel_id}/stats")
def get_hotel_stats_super(hotel_id: int, db: Session = Depends(get_db)):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # Count tables (distinct table numbers)
    total_tables = db.query(func.count(func.distinct(TableModel.table_number))).filter(
        TableModel.hotel_id == hotel_id
    ).scalar() or 0

    # Count menu items
    total_menu_items = db.query(func.count(Dish.id)).filter(
        Dish.hotel_id == hotel_id
    ).scalar() or 0

    # Count orders
    total_orders = db.query(func.count(Order.id)).filter(
        Order.hotel_id == hotel_id
    ).scalar() or 0

    # Count completed orders
    completed_orders = db.query(func.count(Order.id)).filter(
        Order.hotel_id == hotel_id,
        Order.status == "completed"
    ).scalar() or 0

    # Calculate total revenue
    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.hotel_id == hotel_id,
        Order.status == "completed"
    ).scalar() or 0

    return {
        "hotel_id": hotel_id,
        "hotel_name": hotel.hotel_name,
        "total_tables": total_tables,
        "total_menu_items": total_menu_items,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": float(total_revenue) if total_revenue else 0
    }


@router.get("/super/stats/overview")
def get_overview_stats_super(db: Session = Depends(get_db)):
    total_hotels = db.query(func.count(Hotel.id)).scalar() or 0
    total_tables = db.query(func.count(func.distinct(TableModel.table_number))).scalar() or 0
    total_menu_items = db.query(func.count(Dish.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "completed").scalar() or 0
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == "completed").scalar() or 0

    return {
        "total_hotels": total_hotels,
        "total_tables": total_tables,
        "total_menu_items": total_menu_items,
        "total_orders": total_orders,
        "completed_orders": completed_orders,
        "total_revenue": float(total_revenue) if total_revenue else 0
    }


@router.post("/super/hotels", response_model=HotelResponseModel)
def create_hotel_super(hotel: HotelCreateRequest, db: Session = Depends(get_db)):
    # Check if phone already exists
    existing = db.query(Hotel).filter(Hotel.phone_number == hotel.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Hotel with this phone number already exists")

    # Hash password
    password_hash = hashlib.sha256(hotel.password.encode()).hexdigest()

    new_hotel = Hotel(
        hotel_name=hotel.name,
        name=hotel.name,
        phone_number=hotel.phone,
        phone=hotel.phone,
        password=password_hash,
        address=hotel.address,
        email=hotel.email,
        created_at=datetime.now(timezone.utc)
    )

    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)

    return HotelResponseModel.from_hotel(new_hotel)


@router.put("/super/hotels/{hotel_id}", response_model=HotelResponseModel)
def update_hotel_super(hotel_id: int, hotel_update: HotelUpdateRequest, db: Session = Depends(get_db)):
    db_hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # Update fields if provided
    if hotel_update.name is not None:
        db_hotel.hotel_name = hotel_update.name
        db_hotel.name = hotel_update.name

    if hotel_update.phone is not None:
        # Check if phone already used by another hotel
        existing = db.query(Hotel).filter(
            Hotel.phone_number == hotel_update.phone,
            Hotel.id != hotel_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already in use by another hotel")
        db_hotel.phone_number = hotel_update.phone
        db_hotel.phone = hotel_update.phone

    if hotel_update.password is not None:
        # Hash new password
        db_hotel.password = hashlib.sha256(hotel_update.password.encode()).hexdigest()

    if hotel_update.address is not None:
        db_hotel.address = hotel_update.address

    if hotel_update.email is not None:
        db_hotel.email = hotel_update.email

    db.commit()
    db.refresh(db_hotel)

    return HotelResponseModel.from_hotel(db_hotel)


@router.delete("/super/hotels/{hotel_id}")
def delete_hotel_super(hotel_id: int, db: Session = Depends(get_db)):
    db_hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not db_hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    # Check if hotel has any active orders
    active_orders = db.query(Order).filter(
        Order.hotel_id == hotel_id,
        Order.status.in_(["pending", "preparing", "ready"])
    ).count()

    if active_orders > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete hotel with {active_orders} active orders. Complete or cancel them first."
        )

    # Delete associated data
    db.query(TableModel).filter(TableModel.hotel_id == hotel_id).delete()
    db.query(Dish).filter(Dish.hotel_id == hotel_id).delete()
    db.query(ChefAccount).filter(ChefAccount.hotel_id == hotel_id).delete()
    db.query(Settings).filter(Settings.hotel_id == hotel_id).delete()

    # Delete order items first (foreign key constraint)
    order_ids = [o.id for o in db.query(Order.id).filter(Order.hotel_id == hotel_id).all()]
    if order_ids:
        db.query(OrderItem).filter(OrderItem.order_id.in_(order_ids)).delete(synchronize_session=False)

    # Delete orders
    db.query(Order).filter(Order.hotel_id == hotel_id).delete()

    # Finally delete hotel
    hotel_name = db_hotel.hotel_name
    db.delete(db_hotel)
    db.commit()

    return {"success": True, "message": f"Hotel '{hotel_name}' and all associated data deleted successfully"}

