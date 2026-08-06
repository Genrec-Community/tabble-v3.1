from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import uuid
from typing import Callable
from ..database import db_manager


class SessionMiddleware(BaseHTTPMiddleware):
    """Middleware to handle session-based database management"""
    
    def __init__(self, app, require_database: bool = True):
        super().__init__(app)
        self.require_database = require_database
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip validation for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            response = await call_next(request)
            return response

        # Get or generate session ID
        session_id = request.headers.get('x-session-id')
        if not session_id:
            session_id = str(uuid.uuid4())

        # Add session ID to request state
        request.state.session_id = session_id

        # Check if this is a database-related endpoint
        path = request.url.path
        is_database_endpoint = (
            path.startswith('/settings/') or
            path.startswith('/customer/api/') or
            path.startswith('/chef/') or
            path.startswith('/admin/') or
            path.startswith('/analytics/') or
            path.startswith('/tables/') or
            path.startswith('/feedback/') or
            path.startswith('/loyalty/') or
            path.startswith('/selection-offers/')
        )

        # Skip session validation for certain endpoints
        skip_validation_endpoints = [
            '/settings/databases',
            '/settings/hotels',
            '/settings/switch-database',
            '/settings/switch-hotel',
            '/settings/current-database',
            '/settings/current-hotel'
        ]

        # Skip validation for admin, chef auth, and public routes
        skip_validation_paths = [
            '/admin/',
            '/chef/auth/',
            '/public/',
            '/settings/public/',
        ]

        # Check if path should skip validation
        should_skip_path = any(path.startswith(skip_path) for skip_path in skip_validation_paths)

        should_validate = (
            is_database_endpoint and
            path not in skip_validation_endpoints and
            not should_skip_path and
            self.require_database
        )
        
        if should_validate:
            # Check if session has a valid hotel context
            current_hotel_id = db_manager.get_current_hotel_id(session_id)
            if not current_hotel_id:
                # Try QR token auth first
                qr_token = request.headers.get('x-qr-token')
                if qr_token:
                    hotel_id = db_manager.authenticate_via_qr_token(qr_token)
                    if hotel_id:
                        db_manager.set_hotel_context(session_id, hotel_id)
                    else:
                        return JSONResponse(
                            status_code=401,
                            content={
                                "detail": "Invalid QR token",
                                "error_code": "QR_AUTH_FAILED"
                            }
                        )
                else:
                    # Fall back to hotel name/password headers
                    stored_hotel_name = request.headers.get('x-hotel-name')
                    stored_password = request.headers.get('x-hotel-password')

                    if stored_hotel_name and stored_password:
                        try:
                            hotel_id = db_manager.authenticate_hotel(stored_hotel_name, stored_password)
                            if hotel_id:
                                db_manager.set_hotel_context(session_id, hotel_id)
                            else:
                                return JSONResponse(
                                    status_code=401,
                                    content={
                                        "detail": "Invalid hotel credentials",
                                        "error_code": "HOTEL_AUTH_FAILED"
                                    }
                                )
                        except Exception as e:
                            return JSONResponse(
                                status_code=500,
                                content={
                                    "detail": f"Hotel authentication failed: {str(e)}",
                                    "error_code": "HOTEL_VERIFICATION_ERROR"
                                }
                            )
                    else:
                        return JSONResponse(
                            status_code=400,
                            content={
                                "detail": "No hotel selected. Please select a hotel first.",
                                "error_code": "HOTEL_NOT_SELECTED"
                            }
                        )
        
        # Process the request
        response = await call_next(request)
        
        # Add session ID to response headers
        response.headers["x-session-id"] = session_id
        
        return response


def get_session_id(request: Request) -> str:
    """Helper function to get session ID from request"""
    return getattr(request.state, 'session_id', str(uuid.uuid4()))
