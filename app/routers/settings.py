from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from typing import Optional, List
import os
import shutil
import csv
from datetime import datetime, timezone
from ..storage_adapter import get_storage_adapter
from ..database_adapter import get_database_adapter

from ..database import (
    get_db, Settings, Hotel, switch_database, get_current_database,
    get_session_db, get_session_current_database, set_session_hotel_context,
    get_session_hotel_id, authenticate_hotel_session
)
from ..models.settings import Settings as SettingsModel, SettingsUpdate
from ..models.database_config import DatabaseEntry, DatabaseList, DatabaseSelectRequest, DatabaseSelectResponse
from ..middleware import get_session_id

router = APIRouter(
    prefix="/settings",
    tags=["settings"],
    responses={404: {"description": "Not found"}},
)


# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))


# Get available hotels from database
@router.get("/hotels", response_model=DatabaseList)
def get_hotels():
    try:
        # Get all hotels from database using the database adapter
        db_adapter = get_database_adapter()
        hotels = db_adapter.get_hotels()

        hotel_list = []
        for hotel in hotels:
            hotel_list.append(DatabaseEntry(
                database_name=hotel['hotel_name'],
                password="********"  # Don't expose actual passwords
            ))

        return {"databases": hotel_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading hotel configuration: {str(e)}")


# Legacy endpoint for backward compatibility
@router.get("/databases", response_model=DatabaseList)
def get_databases():
    return get_hotels()


# Get current hotel info
@router.get("/current-hotel")
def get_current_hotel(request: Request):
    session_id = get_session_id(request)
    hotel_id = get_session_hotel_id(session_id)
    if hotel_id:
        # Get hotel name from database using database adapter
        db_adapter = get_database_adapter()
        hotels = db_adapter.get_hotels()
        hotel = next((h for h in hotels if h.get("id") == hotel_id), None)
        if hotel:
            return {"hotel_name": hotel.get("hotel_name"), "hotel_id": hotel.get("id")}
    return {"hotel_name": None, "hotel_id": None}


# Legacy endpoint for backward compatibility
@router.get("/current-database")
def get_current_db(request: Request):
    session_id = get_session_id(request)
    return {"database_name": get_session_current_database(session_id)}


# Switch hotel
@router.post("/switch-hotel", response_model=DatabaseSelectResponse)
def select_hotel(request_data: DatabaseSelectRequest, request: Request):
    try:
        session_id = get_session_id(request)

        # Authenticate hotel using database adapter
        db_adapter = get_database_adapter()
        hotel_id = db_adapter.authenticate_hotel(request_data.database_name, request_data.password)

        if hotel_id:
            # Set hotel context for this session
            success = set_session_hotel_context(session_id, hotel_id)
            if success:
                return {
                    "success": True,
                    "message": f"Successfully switched to hotel: {request_data.database_name}"
                }
            else:
                raise HTTPException(status_code=500, detail="Failed to set hotel context")
        else:
            raise HTTPException(status_code=401, detail="Invalid hotel credentials")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error switching hotel: {str(e)}")


# Legacy endpoint for backward compatibility
@router.post("/switch-database", response_model=DatabaseSelectResponse)
def select_database(request_data: DatabaseSelectRequest, request: Request):
    return select_hotel(request_data, request)


# Get hotel settings
@router.get("/", response_model=SettingsModel)
def get_settings(request: Request, db: Session = Depends(get_session_database)):
    session_id = get_session_id(request)
    hotel_id = get_session_hotel_id(session_id)

    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    # Get settings for the current hotel
    settings = db.query(Settings).filter(Settings.hotel_id == hotel_id).first()

    if not settings:
        # Get hotel info for default settings
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        # Create default settings for this hotel
        settings = Settings(
            hotel_id=hotel_id,
            hotel_name=hotel.hotel_name,
            address="123 Main Street, City",
            contact_number="+1 123-456-7890",
            email="info@tabblehotel.com",
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


# Update hotel settings
@router.put("/", response_model=SettingsModel)
async def update_settings(
    request: Request,
    hotel_name: str = Form(...),
    address: Optional[str] = Form(None),
    contact_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    tax_id: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_session_database)
):
    session_id = get_session_id(request)
    hotel_id = get_session_hotel_id(session_id)

    if not hotel_id:
        raise HTTPException(status_code=400, detail="No hotel context set")

    # Get existing settings for this hotel or create new
    settings = db.query(Settings).filter(Settings.hotel_id == hotel_id).first()

    if not settings:
        settings = Settings(
            hotel_id=hotel_id,
            hotel_name=hotel_name,
            address=address,
            contact_number=contact_number,
            email=email,
            tax_id=tax_id,
        )
        db.add(settings)
    else:
        # Update fields
        settings.hotel_name = hotel_name
        settings.address = address
        settings.contact_number = contact_number
        settings.email = email
        settings.tax_id = tax_id

    # Handle logo upload if provided
    if logo:
        # Get hotel info for organizing logos
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        hotel_name_for_path = hotel.hotel_name if hotel else f"hotel_{hotel_id}"

        # Use storage adapter to upload logo
        storage_adapter = get_storage_adapter()
        try:
            # Delete old logo if it exists
            if settings.logo_path:
                storage_adapter.delete_image(settings.logo_path)

            # Upload new logo
            logo_url = storage_adapter.upload_image(logo, hotel_name_for_path, "logo")
            settings.logo_path = logo_url
        except Exception as e:
            print(f"Error uploading logo: {e}")
            # Continue without updating logo if upload fails

    # Update timestamp
    settings.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(settings)

    return settings
