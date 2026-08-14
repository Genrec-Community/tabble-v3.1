# AGENTS.md

Tabble v3.1 — restaurant QR ordering system. Two independent apps, **no root package.json / workspace tooling**:
- `backend/` — FastAPI + SQLAlchemy, SQLite-only, Firebase Admin (Python venv at `backend/.venv`, prebuilt)
- `frontend/` — Create React App 5 (`react-scripts` 5.0.1), **plain JS — no TypeScript, no tsconfig**, MUI v5

Current work branch: `tabble-sanjay`. Render (`backend/render.yaml`) auto-deploys from `tabblefinal-backend`.

## Commands
Backend (run from `backend/`):
```
.\.venv\Scripts\python.exe run.py   # serves on 0.0.0.0:8001 with --reload (port hardcoded in run.py:22)
```
- Alternative: `.\.venv\Scripts\python.exe -m app.main` reads `PORT` (default 8000); docs at `http://localhost:8001/docs`.
- **No tests, no linter, no CI anywhere in the repo.** Verify backend changes with `python -m py_compile ...` and `import app.main`.
- **Tests live in `backend/tests/` (pytest 9, only test dep — `pip install pytest`).** Run from `backend/`: `.\.venv\Scripts\python.exe -m pytest` (50 tests: unit/order_utils, smoke, integration flow, regression). `conftest.py` swaps the DB to a fresh temp SQLite file per test (demo hotel seeded) — the real `Tabble.db` is never touched. `pytest.ini` silences deprecation noise. Modules that capture `engine` at import time (`app/routers/chef.py`, `app/routers/public.py`) are rebound in the fixture — remember this if you add a new `from ..database import engine`.

Frontend:
```
npm start          # dev server binds 0.0.0.0:3000; host-check firewall disabled → reachable from LAN by default
npm run build      # CI=false react-scripts build; no lint/typecheck/test run (and no test files exist)
```
Verify changes compile with `npx react-scripts build` (only real validation available).

## Backend gotchas
- **`backend/.env` is NOT loaded by code** — there is zero `load_dotenv`/`.env` parsing anywhere. `.env` and `.env.example` are documentation only; env vars come from the shell/IDE/deploy platform. Never assume an .env edit takes effect.
- Env vars actually read (`os.getenv`, defaults in code): `CORS_ORIGINS` (main.py:35), `HOST`/`PORT` (only `main.py` `__main__`; run.py ignores them), `FIREBASE_SERVICE_ACCOUNT_JSON` / `FIREBASE_SERVICE_ACCOUNT_BASE64`, `FIREBASE_PROJECT_ID` (default `tabble-v4`), `DEMO_MODE` (default `true`), `ADMIN_PASSWORD` (default `adminoftabble`), `FRONTEND_URL` / `FRONTEND_PORT` (default `3000`), `POC_MAX_TABLES_PER_HOTEL` (default `1000` — effectively unlimited). `RENDER`, `APP_ENV`, `DATABASE_TYPE`, `SECRET_KEY` are declared in render.yaml but read by nobody.
- DB: one SQLite file `backend/Tabble.db`, auto-created at import. `create_tables()` (database.py:576) = `metadata.create_all` + idempotent raw ALTERs (qr_token, slot_number, google_uid, show_prices, order_items.status, order_items.rejection_reason...). Hotels seeded from `backend/hotels.csv` (`hotel_name,password` used; `hotel_id` column ignored) only when the Hotel table is empty. With `DEMO_MODE=true` (default) it also seeds hotel `demo`/`demo123`, 6 dishes, and 3 tables×2 slots with uuid `qr_token`s.
- SQLite concurrency: all engines are built via `_create_sqlite_engine()` (database.py) which enables **WAL + busy_timeout=15000** per connection — without it, a reader (e.g. `GET /tables/` running `_reclaim_stale_slots`) blocks writers and commits fail with `database is locked`. Never use a bare `create_engine` for this DB; if you add an engine elsewhere, go through the helper.
- Multi-tenant: **single DB, per-session hotel context.** `SessionMiddleware` keys context by the `x-session-id` request header; the client authenticates via `x-hotel-name` + `x-hotel-password` (or `x-qr-token` from a QR session). Hotel resolution is `get_hotel_id_from_request()` in database.py:705. Paths exempt from session validation: `/admin/`, `/public/`, `/settings/public/`, `/chef/auth/` and the 6 `/settings/...` switch endpoints.
- QR flow (table.py): `POST /tables/{id}/generate-qr` (idempotent — token created once) and `GET /tables/{id}/qr-image` build the URL with `get_frontend_url()` (app/utils/network.py): env `FRONTEND_URL` if set, else `http://<auto-detected LAN IP>:3000`. Encoded URL is `{frontend}/order?t={token}`; PNG plus `x-qr-token` / `x-qr-url` response headers.
- CORS (main.py:33–51): env `CORS_ORIGINS` else dev defaults, then **always appends `http://<lan-ip>:3000` and `:8001`** (LAN accessible in dev). `allow_credentials=True`, so never use a `*` origin.
- Uploads: `storage_adapter.py` saves to **CWD-relative** `app/static/images/...` and returns `/static/...` URLs — run the server from `backend/` for image uploads to work (paths for DB/CSV are `__file__`-based and CWD-safe, but storage is not).
- `templates/` does not exist but `Jinja2Templates(BASE_DIR/"templates")` (main.py:75) is referenced; the legacy HTML routes (`/chef`, `/customer`, `/admin`...) are shadowed by the React build mount at `/` when `frontend/build` exists.
- Landmines: `app/services/optimized_queries.py` is dead code referencing columns that don't exist (`Dish.is_visible`, `OrderItem.position`) — don't wire it in as-is. `__init__.py` is missing in `app/`, `app/routers/`, `app/models/` (Python namespace packages work, but tooling may complain).

## Frontend gotchas
- API base for dev is **8001** (see `frontend/.env` — this file is **tracked in git**). `.env.example` still says 8000 — stale, ignore.
- `src/utils/apiBaseUrl.js` resolves the API base at runtime: in development, when the page is opened via a LAN hostname (phone on same WiFi), API calls → images point at `http://<same host>:8001` (port overridden by `REACT_APP_API_PORT`). This is what makes phone QR testing work — don't bypass it with hardcoded `localhost` URLs.
- Customer menu (`pages/customer/Menu.js`) uses the `useMenuOptimized` hooks, **not** React Query or the Redux slices (they exist but are unused for menu/order data). Cart lives in localStorage as `customerCart_<qrToken>`.
- QR landing `/order?t=...` (`pages/customer/QRLanding.js`): `GET /public/scan/{token}` → sets localStorage `customerQrToken`, `customerSelectedDatabase`, `tableNumber`, `slotNumber` → navigates to `/customer/menu?...`. `Menu.js` marks the slot occupied if free. Order flow: customer **Get Bill** → `payment_requested` (no live gateway) → admin **Mark as Paid** → `paid` + slot freed (green). Per-dish kitchen flow: chef accepts/rejects `order_items` individually (`OrderItem.status` = pending/accepted/rejected, `rejection_reason`); customer sees live snackbar/popup per decision; rejected items excluded from bills/totals. Shared helpers: `app/services/order_utils.py` (`served_items`, `recompute_order_status`, `compute_order_totals`, `free_slot_if_no_unpaid_orders`).
- Firebase: keys are hardcoded fallbacks in `src/firebase.js` (tracked). Customer auth = Firebase Google popup; **chef/admin are not Firebase** (hotel username/password via `/chef/auth/login`, admin via hotel credentials).
- Dead code, unimported: `services/optimizedApi.js`, `hooks/useApi.js`, `hooks/useOrderSync.js`, `hooks/useOptimizedPolling.js`, `components/PerformanceDashboard.js`, `pages/customer/components/PaymentDialog.js`, `OrderConfirmationDialog.js`. `App.js` has a duplicate `/backitup` route (~lines 386 and 398).
- Routes are all lazy-loaded; the app mounts providers in `App.js` (Redux → React Query → MUI theme → Router → Suspense).

## Git / secrets
- **No root `.gitignore`.** `frontend/build/` and `frontend/node_modules/` are **not ignored** (the rules in `backend/.gitignore` target `backend/frontend/...` and never match). Never `git add -A` blindly.
- `frontend/.env` and `frontend/.env.production` are **tracked with real Firebase keys / Render URL**; `backend/.env` is ignored/untracked. `backend/render.yaml` hardcodes `ADMIN_PASSWORD=adminoftabble` and `CORS_ORIGINS="*"` (conflicts with `allow_credentials=True`), and `FRONTEND_URL=https://your-frontend-url.com` — deploy config is not prod-ready.

## Verification shortcuts
- Backend: `cd backend; .\.venv\Scripts\python.exe -c "import sys; sys.path.insert(0,'.'); import app.main"` — also creates/seeds the DB, so it's a good smoke test.
- Phone/LAN test: backend on 8001 + `npm start` on 3000, open `http://<lan-ip>:3000/order?t=<token>`. Regenerate the QR after any URL change (the PNG embeds the old one). Allow Node/Python through Windows Firewall for private networks if the phone can't connect.