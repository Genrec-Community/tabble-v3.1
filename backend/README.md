# Tabble v3.1 — Backend (FastAPI)

Restaurant QR-ordering backend: FastAPI + SQLAlchemy over a single SQLite file, Firebase Admin for Google sign-in verification, auto-generated table QR codes.

**Start it from `backend/`:**

```powershell
.\.venv\Scripts\python.exe run.py    # 0.0.0.0:8001, --reload (port hardcoded in run.py:22)
```

Alternative: `.\.venv\Scripts\python.exe -m app.main` (reads `PORT`, default 8000). API docs: `http://localhost:8001/docs`.

## Environment

**`backend/.env` is not loaded by the code.** There is no `load_dotenv` anywhere — `.env`/`.env.example` are documentation only. Env vars come from the shell/IDE/Render, otherwise the in-code defaults apply.

Variables actually read (`os.getenv`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `DEMO_MODE` | `true` | Seed demo hotel `demo`/`demo123`, 6 dishes, 3 tables×2 slots; fixed OTP `11111`, no SMS |
| `CORS_ORIGINS` | dev origins | Comma-separated frontend origins; `main.py` **always** appends `http://<lan-ip>:3000` and `:8001` |
| `ADMIN_PASSWORD` | `adminoftabble` | Super admin at `/admin/super/auth` |
| `FRONTEND_URL` | `http://<auto-detected lan>:3000` | Base URL embedded in table QR PNGs |
| `FRONTEND_PORT` | `3000` | Port when auto-detecting the QR base URL |
| `POC_MAX_TABLES_PER_HOTEL` | `1` | Hard cap on physical tables per hotel |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | — | Firebase Admin service-account JSON |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | — | Same credentials, base64-encoded (wins over JSON) |
| `FIREBASE_PROJECT_ID` | `tabble-v4` | Firebase project |
| `FAST2SMS_API_KEY` | a hardcoded key | SMS OTP service (only active when `DEMO_MODE=false`) |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Only read by `python -m app.main`; `run.py` ignores them |

`RENDER`, `APP_ENV`, `DATABASE_TYPE`, `SECRET_KEY` are declared in `render.yaml` but read by nobody. The app is always SQLite.

## Architecture

- **Entrypoint**: `app/main.py` — mounts `/static`, includes 12 routers, calls `create_tables()`, and mounts the React SPA at `/` when `frontend/build` exists.
- **One SQLite file** `backend/Tabble.db`. `create_tables()` (`app/database.py:576`) runs `metadata.create_all` plus idempotent raw `ALTER TABLE` adds (e.g. `tables.qr_token`, `slot_number`, `google_uid`, `show_prices`).
- **Hotels seeding**: `backend/hotels.csv` (`hotel_name,password,hotel_id` — `hotel_id` ignored) imported when the Hotel table is empty; otherwise only phone-number backfill.
- **Multi-tenancy**: single DB; `SessionMiddleware` (`app/middleware/session_middleware.py`) keys a per-session hotel context by the `x-session-id` header. Endpoints resolve the hotel via `get_hotel_id_from_request()` (`app/database.py:705`). Client auth is via `x-hotel-name` + `x-hotel-password` headers, or `x-qr-token` for QR sessions. `require_database=True` is set at `main.py:62`.

  Paths **exempt** from session validation: `/admin/`, `/public/`, `/settings/public/`, `/chef/auth/`, and the 6 `/settings` switch/database endpoints (databases, hotels, switch-database, switch-hotel, current-database, current-hotel).

- **Firebase**: `app/firebase_config.py` builds the Admin SDK from the service-account env vars; if absent it falls back to Application Default Credentials (no import-time crash). `verify_firebase_token` is used by `customer.py` for `/customer/api/auth/google`. Chef/admin are NOT Firebase — chef logs in with hotel credentials via `/chef/auth/login`.

- **Storage**: `app/storage_adapter.py` saves uploads to **CWD-relative** `app/static/images/...` and returns `/static/...` URLs. Run the server from `backend/` for uploads to work (`run.py` also does `os.makedirs("app/static/images", exist_ok=True)`).

## QR code flow

- `POST /tables/{table_id}/generate-qr` (idempotent — the `uuid4` token is created once) and `GET /tables/{table_id}/qr-image` both build `qr_url = f"{get_frontend_url()}/order?t={token}"` (`app/routers/table.py`).
- `get_frontend_url()` (`app/utils/network.py`): uses `FRONTEND_URL` env if set, otherwise auto-detects the machine's LAN IP → `http://<lan-ip>:<FRONTEND_PORT|3000>`. PNG response headers: `x-qr-token`, `x-qr-url`.
- Regenerate a QR after any URL change — the PNG embeds the previous URL.

## Routers & key endpoints

| Router file | Prefix | Notable endpoints |
|-------------|--------|-------------------|
| `public.py` | `/public` | `GET /public/scan/{token}`, `GET /public/hotels` |
| `table.py` | `/tables` | `POST /tables/`, `POST /tables/batch`, `PUT /tables/{id}/occupy|free`, `PUT /tables/number/{n}/occupy|free`, `POST /tables/{id}/generate-qr`, `GET /tables/{id}/qr-image` |
| `settings.py` | `/settings` | `GET /settings/hotels`, `POST /settings/switch-hotel`, `POST /settings/switch-database`, public `show-prices` |
| `customer.py` | `/customer` | `POST /customer/api/login`, `POST /customer/api/orders`, `GET /customer/api/person/{id}/orders`, `PUT /customer/api/orders/{id}/payment|cancel`, `POST /customer/api/auth/google`, `POST /customer/api/phone-auth` |
| `chef.py` | `/chef` | `POST /chef/auth/login`, `GET /chef/orders/pending|accepted|completed-orders-count`, `PUT /chef/orders/{id}/accept|complete` |
| `admin.py` | `/admin` | orders + bills (`GET /admin/orders/{id}/bill`, `POST /admin/orders/multi-bill`, `POST /admin/orders/merge`), dishes/offers/specials/loyalty CRUD, `POST /admin/super/auth`, `GET|POST|PUT|DELETE /admin/super/hotels...` |
| `hotel_auth.py` | `/hotel-auth` | `POST /hotel-auth/send-otp`, `POST /hotel-auth/verify-otp`, `GET /hotel-auth/check-verification/{action}` |
| `feedback.py` | `/feedback` | submit + `GET /feedback/order/{order_id}` |
| `loyalty.py` / `selection_offer.py` | `/loyalty`, `/selection-offers` | discounts (`/selection-offers/discount/{amount}`) |
| `analytics.py` | `/analytics` | dashboards/stats |
| `system.py` | `/monitoring` | system diagnostics |

## Auth & session mechanics

- Requests carry `x-session-id` (generated client-side once and persisted, `frontend/src/services/api.js`).
- On validation, the middleware resolves the hotel from the stored session context; header auth (`x-hotel-name`/`x-hotel-password` or `x-qr-token`) is consumed inside it. A request without hotel context on a validated endpoint returns `400 "No hotel selected"`.
- `/admin/`, `/public/`, `/settings/public/`, `/chef/auth/`, and the settings/switch endpoints never require a hotel session.

## Deployment (Render)

`render.yaml` defines the `tabble-backend` service (free tier, Singapore): build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`, persistent disk mounted at `app/static/images`, `autoDeploy` from branch `tabblefinal-backend`. Set real `FRONTEND_URL`, `CORS_ORIGINS` (not `"*"` — the code forces `allow_credentials=True`), and `ADMIN_PASSWORD` in the dashboard.

## No tests / verification

There are none. Verify changes with:

```powershell
.\.venv\Scripts\python.exe -m py_compile <changed files>
.\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0,'.'); import app.main"   # also creates/seeds Tabble.db
```

## Known issues

- `templates/` doesn't exist but `Jinja2Templates(BASE_DIR/"templates")` is referenced (`main.py:75`); the legacy HTML routes (`/chef`, `/customer`, `/admin`, ...) fail to render and are shadowed by the React build mount at `/`.
- `app/services/optimized_queries.py` is dead code referencing non-existent columns (`Dish.is_visible`, `OrderItem.position`) — don't wire it in as-is.
- `__init__.py` is missing in `app/`, `app/routers/`, `app/models/` (namespace packages work, but tooling may complain).
- `FAST2SMS_API_KEY` ships a hardcoded default key (`otp_service.py:10`).

Proprietary — all rights reserved.