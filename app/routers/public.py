from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import sessionmaker
from ..database import engine, Table as TableModel, Hotel

router = APIRouter(
    prefix="/public",
    tags=["public"],
)


@router.get("/scan/{qr_token}")
def scan_qr_token(qr_token: str):
    """Resolve a QR token to hotel + table + slot context. No auth required."""
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        table = db.query(TableModel).filter(TableModel.qr_token == qr_token).first()
        if not table:
            raise HTTPException(status_code=404, detail="Invalid or expired QR code")

        hotel = db.query(Hotel).filter(Hotel.id == table.hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        return {
            "hotel_name": hotel.hotel_name,
            "table_number": table.table_number,
            "slot_number": table.slot_number,
            "hotel_id": hotel.id,
            "is_occupied": table.is_occupied,
        }
    finally:
        db.close()
