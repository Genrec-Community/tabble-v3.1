import base64
import json
import os
from pathlib import Path
import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials

_app = None

# Local service-account JSON: backend/firebase-service-account.json
# (gitignored — never commit this file). Preferred over env vars because
# backend/.env is NOT loaded by this codebase.
_LOCAL_SA_FILE = Path(__file__).resolve().parent.parent / "firebase-service-account.json"


def _load_service_account():
    """Return the service-account dict from, in order of preference:
    1. FIREBASE_SERVICE_ACCOUNT_BASE64 env var
    2. FIREBASE_SERVICE_ACCOUNT_JSON env var
    3. backend/firebase-service-account.json file
    4. None → let the Admin SDK try Application Default Credentials
    """
    base64_cred = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
    if base64_cred:
        try:
            compact = "".join(base64_cred.split())
            raw = base64.b64decode(compact, validate=True)
            return json.loads(raw.decode("utf-8"))
        except Exception as e:
            raise ValueError(
                "FIREBASE_SERVICE_ACCOUNT_BASE64 is set but is not valid "
                f"base64-encoded service-account JSON ({e}). Fix it by base64-"
                "encoding the service-account JSON file (e.g. `base64 -w0 "
                "firebase-service-account.json`) and updating the env var."
            ) from e

    json_cred = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if json_cred:
        return json.loads(json_cred)

    if _LOCAL_SA_FILE.exists():
        return json.loads(_LOCAL_SA_FILE.read_text(encoding="utf-8"))

    return None


def get_firebase_app():
    global _app
    if _app is None:
        service_account = _load_service_account()
        credential = credentials.Certificate(service_account) if service_account else None
        _app = firebase_admin.initialize_app(
            credential=credential,
            options={"projectId": os.getenv("FIREBASE_PROJECT_ID", "tabble-v4")},
        )
    return _app


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return the decoded claims."""
    service_account = _load_service_account()
    if service_account is None:
        raise ValueError(
            "Firebase is not configured: set FIREBASE_SERVICE_ACCOUNT_JSON / "
            "FIREBASE_SERVICE_ACCOUNT_BASE64 or drop the service-account JSON at "
            "backend/firebase-service-account.json"
        )
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