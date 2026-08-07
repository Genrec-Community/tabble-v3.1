from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid
import io
import os

from ..database import get_db, Table as TableModel, Order, get_session_db, get_hotel_id_from_request
from ..models.table import Table, TableCreate, TableUpdate, TableStatus
from ..middleware import get_session_id
from ..utils.network import get_frontend_url

router = APIRouter(
    prefix="/tables",
    tags=["tables"],
    responses={404: {"description": "Not found"}},
)


def _max_tables_per_hotel() -> int:
    """Return the physical-table limit for this POC installation."""
    try:
        return max(1, int(os.getenv("POC_MAX_TABLES_PER_HOTEL", "1")))
    except ValueError:
        return 1


def _ensure_table_capacity(db: Session, hotel_id: int, requested_tables: int) -> None:
    """Keep the POC constrained to its configured number of physical tables."""
    from sqlalchemy import func, distinct

    existing_tables = db.query(func.count(distinct(TableModel.table_number))).filter(
        TableModel.hotel_id == hotel_id
    ).scalar() or 0
    limit = _max_tables_per_hotel()
    if existing_tables + requested_tables > limit:
        raise HTTPException(
            status_code=400,
            detail=(
                f"This POC supports {limit} physical table{'s' if limit != 1 else ''} per hotel. "
                "Remove an unused table before creating another."
            ),
        )


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get all tables
@router.get("/", response_model=List[Table])
def get_all_tables(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    return db.query(TableModel).filter(TableModel.hotel_id == hotel_id).order_by(TableModel.table_number).all()


# Get table by ID
@router.get("/{table_id}", response_model=Table)
def get_table(table_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table


# Get table by table number
@router.get("/number/{table_number}", response_model=Table)
def get_table_by_number(table_number: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = (
        db.query(TableModel).filter(
            TableModel.table_number == table_number, TableModel.hotel_id == hotel_id
        ).first()
    )
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    return db_table


# Create new table (creates both slot 1 and slot 2 automatically)
@router.post("/", response_model=List[Table])
def create_table(table: TableCreate, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    existing = db.query(TableModel).filter(
        TableModel.hotel_id == hotel_id,
        TableModel.table_number == table.table_number,
        TableModel.slot_number == 1,
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Table {table.table_number} already exists for this hotel",
        )

    _ensure_table_capacity(db, hotel_id, requested_tables=1)

    new_slots = []
    for slot in (1, 2):
        db_slot = TableModel(
            hotel_id=hotel_id,
            table_number=table.table_number,
            slot_number=slot,
            is_occupied=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(db_slot)
        new_slots.append(db_slot)

    db.commit()
    for s in new_slots:
        db.refresh(s)
    return new_slots


# Update table
@router.put("/{table_id}", response_model=Table)
def update_table(
    table_id: int, table_update: TableUpdate, request: Request, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Update fields if provided
    if table_update.is_occupied is not None:
        db_table.is_occupied = table_update.is_occupied
    if table_update.current_order_id is not None:
        db_table.current_order_id = table_update.current_order_id

    db_table.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_table)
    return db_table


# Delete table (deletes ALL slots for the physical table number)
@router.delete("/number/{table_number}")
def delete_table_by_number(table_number: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    slots = db.query(TableModel).filter(
        TableModel.table_number == table_number,
        TableModel.hotel_id == hotel_id
    ).all()
    if not slots:
        raise HTTPException(status_code=404, detail="Table not found")

    if any(s.is_occupied for s in slots):
        raise HTTPException(status_code=400, detail="Cannot delete a table with an occupied slot")

    for s in slots:
        db.delete(s)
    db.commit()
    return {"message": f"Table {table_number} and all its slots deleted successfully"}


# Delete table (deletes ALL slots for the physical table number)
@router.delete("/{table_id}")
def delete_table(table_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Check if table is currently occupied
    if db_table.is_occupied:
        raise HTTPException(
            status_code=400, detail="Cannot delete a table that is currently occupied"
        )

    db.delete(db_table)
    db.commit()
    return {"message": "Table deleted successfully"}


# Get table status (counts physical tables, not slots)
@router.get("/status/summary", response_model=TableStatus)
def get_table_status(request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    from sqlalchemy import func, distinct
    total_tables = db.query(func.count(distinct(TableModel.table_number))).filter(
        TableModel.hotel_id == hotel_id
    ).scalar() or 0

    # A physical table is "occupied" if any of its slots is occupied
    occupied_table_numbers = db.query(distinct(TableModel.table_number)).filter(
        TableModel.hotel_id == hotel_id,
        TableModel.is_occupied == True
    ).all()
    occupied_tables = len(occupied_table_numbers)
    free_tables = total_tables - occupied_tables

    return {
        "total_tables": total_tables,
        "occupied_tables": occupied_tables,
        "free_tables": free_tables,
    }


# Set table as occupied
@router.put("/{table_id}/occupy", response_model=Table)
def set_table_occupied(
    table_id: int, order_id: int = None, request: Request = None, db: Session = Depends(get_session_database)
):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Check if table is already occupied
    if db_table.is_occupied:
        raise HTTPException(status_code=400, detail="Table is already occupied")

    # Update table status
    db_table.is_occupied = True

    # Link to order if provided
    if order_id:
        # Verify order exists for this hotel
        order = db.query(Order).filter(
            Order.id == order_id, Order.hotel_id == hotel_id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        db_table.current_order_id = order_id

    db_table.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_table)
    return db_table


# Set table as free
@router.put("/{table_id}/free", response_model=Table)
def set_table_free(table_id: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Check if table is already free
    if not db_table.is_occupied:
        raise HTTPException(status_code=400, detail="Table is already free")

    # Update table status
    db_table.is_occupied = False
    db_table.current_order_id = None
    db_table.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_table)
    return db_table


# Set table as occupied by table number and slot
@router.put("/number/{table_number}/occupy", response_model=Table)
def set_table_occupied_by_number(table_number: int, request: Request, slot_number: int = 1, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.table_number == table_number,
        TableModel.slot_number == slot_number,
        TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table slot not found")

    db_table.is_occupied = True
    db_table.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_table)
    return db_table


# Set table as free by table number and slot
@router.put("/number/{table_number}/free", response_model=Table)
def set_table_free_by_number(table_number: int, request: Request, slot_number: int = 1, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.table_number == table_number,
        TableModel.slot_number == slot_number,
        TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table slot not found")

    db_table.is_occupied = False
    db_table.current_order_id = None
    db_table.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(db_table)
    return db_table


# Create multiple tables at once (each table gets 2 slots)
@router.post("/batch", response_model=List[Table])
def create_tables_batch(num_tables: int, request: Request, db: Session = Depends(get_session_database)):
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")
    if num_tables <= 0:
        raise HTTPException(status_code=400, detail="Number of tables must be greater than 0")

    _ensure_table_capacity(db, hotel_id, requested_tables=num_tables)

    highest_table = (
        db.query(TableModel)
        .filter(TableModel.hotel_id == hotel_id)
        .order_by(TableModel.table_number.desc())
        .first()
    )
    start_number = (highest_table.table_number + 1) if highest_table else 1

    new_slots = []
    for i in range(start_number, start_number + num_tables):
        for slot in (1, 2):
            db_slot = TableModel(
                hotel_id=hotel_id,
                table_number=i,
                slot_number=slot,
                is_occupied=False,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(db_slot)
            new_slots.append(db_slot)

    db.commit()
    for s in new_slots:
        db.refresh(s)
    return new_slots


def _generate_qr_image(url: str) -> bytes:
    """Generate QR code PNG bytes for a URL."""
    import qrcode
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@router.post("/{table_id}/generate-qr")
def generate_qr(table_id: int, request: Request, db: Session = Depends(get_session_database)):
    """Generate a permanent QR code for a table. Idempotent — returns existing QR if already generated."""
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")

    if not db_table.qr_token:
        db_table.qr_token = str(uuid.uuid4())
        db_table.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_table)

    frontend_url = get_frontend_url()
    qr_url = f"{frontend_url}/order?t={db_table.qr_token}"
    png_bytes = _generate_qr_image(qr_url)

    response = StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")
    response.headers["x-qr-token"] = db_table.qr_token
    response.headers["x-qr-url"] = qr_url
    return response


@router.get("/{table_id}/qr-image")
def get_qr_image(table_id: int, request: Request, db: Session = Depends(get_session_database)):
    """Return the QR code PNG for a table that already has one."""
    hotel_id = get_hotel_id_from_request(request)
    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    db_table = db.query(TableModel).filter(
        TableModel.id == table_id, TableModel.hotel_id == hotel_id
    ).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
    if not db_table.qr_token:
        raise HTTPException(status_code=400, detail="QR code not yet generated for this table")

    frontend_url = get_frontend_url()
    qr_url = f"{frontend_url}/order?t={db_table.qr_token}"
    png_bytes = _generate_qr_image(qr_url)

    response = StreamingResponse(io.BytesIO(png_bytes), media_type="image/png")
    response.headers["x-qr-token"] = db_table.qr_token
    response.headers["x-qr-url"] = qr_url
    return response
