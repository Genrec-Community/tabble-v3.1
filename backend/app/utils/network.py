import os
import socket


def get_lan_ip() -> str:
    """Get the local LAN IP address of this machine (best-effort)."""
    try:
        # Does not need to be reachable; only used to learn the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def get_frontend_url() -> str:
    """Resolve the public base URL embedded in QR codes.

    Development: auto-detect the machine's LAN IP so phones on the same WiFi
    can open the frontend (e.g. http://192.168.1.5:3000). Set the
    FRONTEND_URL env var (e.g. to your deployed URL) in production to override.
    """
    frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    if frontend_url:
        return frontend_url
    frontend_port = os.getenv("FRONTEND_PORT", "3000")
    return f"http://{get_lan_ip()}:{frontend_port}"
