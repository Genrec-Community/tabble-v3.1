import os
import firebase_admin
from firebase_admin import auth as firebase_auth

_app = None


def get_firebase_app():
    global _app
    if _app is None:
        _app = firebase_admin.initialize_app(
            options={"projectId": os.getenv("FIREBASE_PROJECT_ID", "tabble-v4")}
        )
    return _app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    get_firebase_app()
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return {
            "uid": decoded.get("uid"),
            "email": decoded.get("email", ""),
            "name": decoded.get("name", ""),
            "picture": decoded.get("picture", ""),
        }
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {e}")
