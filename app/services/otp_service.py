import os
import random
import httpx
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from ..database import OtpRequest

FAST2SMS_API_KEY = os.getenv(
    "FAST2SMS_API_KEY", "xsQLJrKrV6KgXOYBWPHNzCCESeEAkJWPX8lSBhuKMEZ8i1dK8TBPdSDb2U0N"
)
OTP_EXPIRY_MINUTES = 5
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
DEMO_OTP = "11111"


def _generate_otp() -> str:
    if DEMO_MODE:
        return DEMO_OTP
    return str(random.randint(10000, 99999)).zfill(5)


async def _send_sms_otp(phone_number: str, otp: str):
    if DEMO_MODE:
        print(f"[DEMO MODE] OTP for {phone_number}: {otp} (SMS skipped)")
        return

    url = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "variables_values": otp,
        "route": "otp",
        "numbers": phone_number,
    }
    headers = {"authorization": FAST2SMS_API_KEY}

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            print(f"Dispatching OTP to {phone_number} via Fast2SMS...")
            response = await client.post(url, data=payload, headers=headers)
            raw_text = response.text
            response.raise_for_status()
            response_data = response.json()
            print(f"[Fast2SMS RAW RESPONSE] {raw_text}")
            print(f"[Fast2SMS PARSED] {response_data}")
            if not response_data.get("return", False):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Gateway error: {response_data.get('message')}",
                )
        except httpx.HTTPStatusError as e:
            print(f"[Fast2SMS HTTP ERROR] {e.response.text}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to send OTP via SMS gateway.",
            )
        except Exception as e:
            print(f"[Fast2SMS UNEXPECTED ERROR] {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unexpected error while sending OTP.",
            )


async def send_otp(db: Session, phone_number: str, hotel_id: int) -> str:
    otp_code = _generate_otp()
    db_otp_request = OtpRequest(
        hotel_id=hotel_id,
        phone_number=phone_number,
        otp_code=otp_code,
        created_at=datetime.now(timezone.utc),
    )
    db.add(db_otp_request)
    db.commit()
    db.refresh(db_otp_request)
    await _send_sms_otp(phone_number, otp_code)
    return db_otp_request.id


def verify_otp(db: Session, token: str, otp: str, phone_number: str):
    db_otp_request = db.query(OtpRequest).filter(OtpRequest.id == token).first()
    if not db_otp_request:
        raise HTTPException(status_code=400, detail="Invalid OTP session or token.")
    if db_otp_request.phone_number != phone_number:
        raise HTTPException(status_code=400, detail="OTP was not sent to this number.")
    if db_otp_request.verified:
        raise HTTPException(status_code=400, detail="This OTP has already been used.")

    expiry_time = db_otp_request.created_at.replace(tzinfo=timezone.utc) + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )
    if datetime.now(timezone.utc) > expiry_time:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")

    # In demo mode accept both the stored OTP and the universal demo code
    if DEMO_MODE:
        if otp not in (db_otp_request.otp_code, DEMO_OTP):
            raise HTTPException(status_code=400, detail="Invalid OTP code.")
    else:
        if db_otp_request.otp_code != otp:
            raise HTTPException(status_code=400, detail="Invalid OTP code.")

    db_otp_request.verified = True
    db.commit()
    return True
