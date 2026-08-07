from fastapi import FastAPI, Request, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import os
from pathlib import Path

from .database import get_db, create_tables
from .routers import (
    chef,
    customer,
    admin,
    feedback,
    loyalty,
    selection_offer,
    table,
    analytics,
    settings,
    system,
    hotel_auth,
    public,
)
from .middleware import SessionMiddleware
from .utils.network import get_lan_ip

# Create FastAPI app
app = FastAPI(title="Tabble - Hotel Management App")

# Add CORS middleware to allow cross-origin requests
# CORS: explicit origins (env `CORS_ORIGINS` comma-separated). Wildcard + credentials is
# rejected by browsers, so default to the local dev/LAN frontend origins.
cors_origins_env = os.getenv("CORS_ORIGINS", "").strip()
cors_origins = (
    [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    if cors_origins_env
    else [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.150.138.137:3000",
        "http://localhost:8000",
    ]
)
# Always allow the machine's LAN IP so phones on the same WiFi can reach the API in dev
lan_ip = get_lan_ip()
lan_origins = [f"http://{lan_ip}:3000", f"http://{lan_ip}:8001"]
for origin in lan_origins:
    if origin not in cors_origins:
        cors_origins.append(origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["x-session-id", "content-disposition"],
)

# Add session middleware for database management
app.add_middleware(SessionMiddleware, require_database=True)

# Resolve paths relative to this file so the server works from any CWD
BASE_DIR = Path(__file__).resolve().parent.parent

# Mount static files
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "app" / "static"),
    name="static",
)

# Setup templates
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# Include routers
app.include_router(chef.router)
app.include_router(customer.router)
app.include_router(admin.router)
app.include_router(feedback.router)
app.include_router(loyalty.router)
app.include_router(selection_offer.router)
app.include_router(table.router)
app.include_router(analytics.router)
app.include_router(settings.router)
app.include_router(system.router)
app.include_router(hotel_auth.router)
app.include_router(public.router)

# Create database tables
create_tables()

# Check if we have the React build folder
react_build_dir = BASE_DIR.parent / "frontend" / "build"
has_react_build = os.path.isdir(react_build_dir)

if has_react_build:
    # Mount the React build folder
    app.mount("/", StaticFiles(directory=react_build_dir, html=True), name="react")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Tabble - Hotel Management App API is running"}

# Healthz Page
@app.get("/health")
async def health_check(request: Request):
    """Just for the usage in railways"""
    return {"status": "healthy"}
# Chef page
@app.get("/chef", response_class=HTMLResponse)
async def chef_page(request: Request):
    return templates.TemplateResponse("chef/index.html", {"request": request})


# Chef orders page
@app.get("/chef/orders", response_class=HTMLResponse)
async def chef_orders_page(request: Request):
    return templates.TemplateResponse("chef/orders.html", {"request": request})


# Customer login page
@app.get("/customer", response_class=HTMLResponse)
async def customer_login_page(request: Request):
    return templates.TemplateResponse("customer/login.html", {"request": request})


# Customer menu page
@app.get("/customer/menu", response_class=HTMLResponse)
async def customer_menu_page(request: Request, table_number: int, unique_id: str):
    return templates.TemplateResponse(
        "customer/menu.html",
        {"request": request, "table_number": table_number, "unique_id": unique_id},
    )


# Admin page
@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request):
    return templates.TemplateResponse("admin/index.html", {"request": request})


# Admin dishes page
@app.get("/admin/dishes", response_class=HTMLResponse)
async def admin_dishes_page(request: Request):
    return templates.TemplateResponse("admin/dishes.html", {"request": request})


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
