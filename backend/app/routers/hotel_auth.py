from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timezone

from ..database import get_session_db, Hotel, get_hotel_id_from_request
from ..services import otp_service
from ..middleware import get_session_id
from pydantic import BaseModel

router = APIRouter(
    prefix="/hotel-auth",
    tags=["hotel-auth"],
    responses={404: {"description": "Not found"}},
)

# Dependency to get session-aware database
def get_session_database(request: Request):
    session_id = get_session_id(request)
    return next(get_session_db(session_id))

class HotelOtpRequest(BaseModel):
    action: str  # "offers" or "loyalty"

class HotelOtpVerifyRequest(BaseModel):
    action: str  # "offers" or "loyalty"
    otp_code: str
    token: str

# Send OTP to hotel's phone number for verification
@router.post("/send-otp", response_model=Dict[str, Any])
async def send_hotel_otp(
    otp_request: HotelOtpRequest, 
    request: Request, 
    db: Session = Depends(get_session_database)
):
    """
    Send OTP to hotel's phone number for verification before accessing offers/loyalty sections
    """
    try:
        hotel_id = get_hotel_id_from_request(request)
        if not hotel_id:
            raise HTTPException(status_code=400, detail="No hotel context set")

        # Get hotel information
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")
        
        if not hotel.phone_number:
            raise HTTPException(
                status_code=400, 
                detail="Hotel phone number not configured. Please contact administrator."
            )

        # Send OTP via our service
        token = await otp_service.send_otp(
            db=db,
            phone_number=hotel.phone_number,
            hotel_id=hotel_id
        )

        print(f"Hotel OTP sent to {hotel.hotel_name} ({hotel.phone_number}) for action: {otp_request.action}")

        return {
            "success": True,
            "message": f"Verification code sent to hotel phone number for {otp_request.action} access",
            "token": token,
            "masked_phone": f"****{hotel.phone_number[-4:]}" if len(hotel.phone_number) >= 4 else "****"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending hotel OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code"
        )

# Verify OTP for hotel authentication
@router.post("/verify-otp", response_model=Dict[str, Any])
def verify_hotel_otp(
    verify_request: HotelOtpVerifyRequest, 
    request: Request, 
    db: Session = Depends(get_session_database)
):
    """
    Verify OTP for hotel authentication to access offers/loyalty sections
    """
    try:
        hotel_id = get_hotel_id_from_request(request)
        if not hotel_id:
            raise HTTPException(status_code=400, detail="No hotel context set")

        # Get hotel information
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        print(f"Verifying hotel OTP for {hotel.hotel_name} - action: {verify_request.action}")

        # Verify OTP via our service
        otp_service.verify_otp(
            db=db,
            token=verify_request.token,
            otp=verify_request.otp_code,
            phone_number=hotel.phone_number
        )

        # Store verification in session (you might want to implement session storage)
        session_id = get_session_id(request)
        verification_key = f"hotel_verified_{verify_request.action}_{hotel_id}"
        
        # For now, we'll just return success. In a production system, you'd store this in Redis or session
        print(f"Hotel {hotel.hotel_name} successfully verified for {verify_request.action}")

        return {
            "success": True,
            "message": f"Hotel verified successfully for {verify_request.action} access",
            "action": verify_request.action,
            "hotel_name": hotel.hotel_name
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error verifying hotel OTP: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify OTP"
        )

# Check if hotel is verified for a specific action
@router.get("/check-verification/{action}", response_model=Dict[str, Any])
def check_hotel_verification(
    action: str,
    request: Request, 
    db: Session = Depends(get_session_database)
):
    """
    Check if hotel is verified for a specific action (offers/loyalty)
    """
    try:
        hotel_id = get_hotel_id_from_request(request)
        if not hotel_id:
            raise HTTPException(status_code=400, detail="No hotel context set")

        # Get hotel information
        hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
        if not hotel:
            raise HTTPException(status_code=404, detail="Hotel not found")

        # In a real implementation, you'd check session storage or Redis
        # For now, we'll return that verification is required
        return {
            "verified": False,
            "action": action,
            "hotel_name": hotel.hotel_name,
            "phone_configured": bool(hotel.phone_number)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking hotel verification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check verification status"
        )
