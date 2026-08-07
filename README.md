# Tabble v3.1 — Restaurant QR Ordering System

Multi-hotel restaurant management app: customers scan a QR code at a table, browse a menu, order, and request payment; the kitchen tracks orders in real time; the hotel admin manages dishes, tables, offers, loyalty programs, and analytics.

- **Backend**: FastAPI + SQLAlchemy (SQLite — a single local `Tabble.db`) + Firebase Admin
- **Frontend**: React 18 (Create React App 5) + MUI v5 + Redux Toolkit + React Query + Firebase JS
- **Deployment**: Render (backend) via `backend/render.yaml`; auto-deploys from the `tabblefinal-backend` branch

## Repository layout

Two independent apps — **no root `package.json` / monorepo tooling**.

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI app. Entrypoint `app/main.py`, 12 routers in `app/routers/`, `app/database.py` (SQLAlchemy models + session manager), `app/storage_adapter.py` (local image storage), `app/models/` (Pydantic schemas), `app/utils/`, `app/services/`, `app/middleware/`. |
| `frontend/` | React SPA. `src/App.js` (providers + all routes), `src/pages/{customer,chef,admin,analysis}`, `src/components/`, `src/services/api.js`, `src/store/` (Redux), `src/hooks/`, `src/utils/`. |
| `backend/hotels.csv` | Seeds hotels (`hotel_name,password`) on the first DB creation. |
| `backend/render.yaml` | Render deploy config (branch: `tabblefinal-backend`). |

## Running it

### Backend

```powershell
cd backend
.\.venv\Scripts\python.exe run.py    # serves on 0.0.0.0:8001 with auto-reload
```

- The venv at `backend/.venv` is prebuilt; install once with `pip install -r requirements.txt`.
- Alternative: `.\.venv\Scripts\python.exe -m app.main` serves on `PORT` (default 8000).
- API docs: `http://localhost:8001/docs`.
- **`backend/.env` is not loaded by the code** — there is no `load_dotenv`. Set env vars in your shell/run config, or the in-code defaults apply (see Environment below).
- Run from `backend/` when you want image uploads to work (`storage_adapter.py` uses CWD-relative `app/static/images/...`).

### Frontend

```powershell
cd frontend
npm start          # dev server on 0.0.0.0:3000 (reachable from the LAN by default)
npm run build      # production build into build/
```

- No root package.json; run npm commands from `frontend/`.

## Environment

### Backend env vars that are actually read (defaults in code)

| Variable | Default | Used for |
|----------|---------|----------|
| `DEMO_MODE` | `true` | Seeds demo hotel (`demo`/`demo123`), 6 dishes, 3 tables×2 slots; fixed OTP `11111` and no SMS |
| `CORS_ORIGINS` | dev origins + auto `http://<lan-ip>:3000`/`:8001` | CORS allow-list (comma-separated) |
| `ADMIN_PASSWORD` | `adminoftabble` | Super admin login at `/adminofthetabble` |
| `FRONTEND_URL` | auto-detected `http://<lan-ip>:3000` | Base URL embedded in table QR codes |
| `FRONTEND_PORT` | `3000` | Port used when auto-detecting the QR frontend URL |
| `POC_MAX_TABLES_PER_HOTEL` | `1` | Hard cap on physical tables per hotel (POC mode) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` / `FIREBASE_SERVICE_ACCOUNT_BASE64` | — | Firebase Admin credentials (Google sign-in verification) |
| `FIREBASE_PROJECT_ID` | `tabble-v4` | Firebase project |
| `FAST2SMS_API_KEY` | a hardcoded key | SMS OTP (only used when `DEMO_MODE` is off) |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Only read by `python -m app.main` (run.py hardcodes 8001) |

Note: `RENDER`, `APP_ENV`, `DATABASE_TYPE`, `SECRET_KEY` appear in `render.yaml` but no code reads them. The app is always SQLite.

### Frontend env vars

- `REACT_APP_API_BASE_URL` — API base URL. **Dev is `http://localhost:8001`** (see `frontend/.env`, which is tracked). The runtime resolver `src/utils/apiBaseUrl.js` overrides it with `http://<same-host>:8001` when the page is opened from a LAN address (phone on the same WiFi). `REACT_APP_API_PORT` (default `8001`) changes that port.
- `REACT_APP_FIREBASE_*` (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`, `APP_ID`, `MEASUREMENT_ID`) — Firebase web-app config; hardcoded fallback keys already exist in `src/firebase.js`.

## Demo data & accounts

- Hotels are seeded from `backend/hotels.csv` (columns `hotel_name,password,hotel_id`; `hotel_id` is ignored) only when the Hotel table is empty:
  `tabble_new` / `myhotel`, `Hotel_Anifa-Trichy` / `Anifa@123`, `user` / `password`
- With `DEMO_MODE=true` (default) a `demo` / `demo123` hotel with dishes and QR-enabled tables is seeded too.
- Super admin: `/adminofthetabble`, password `ADMIN_PASSWORD`.
- Chef: hotel username/password via `/chef/auth/login` (not Firebase). Admin: hotel credentials. Customer: Firebase Google sign-in (or phone OTP).

## Routing & endpoints

### Frontend routes

- `/` Home · `/order?t={token}` QR landing · `/customer` / `/customer/menu` ordering
- `/chef/login`, `/chef`, `/chef/orders` — kitchen
- `/admin/login`, `/admin`, `/admin/dishes|offers|specials|tables|settings|chefs|loyalty|completed-orders|selection-offers` — hotel admin
- `/analysis`, `/analysis/customer|dish|chef` — analytics
- `/adminofthetabble` — super admin · `/backitup`, `/sysdiag`, `/emergency-sys` — system monitors

### Key API endpoints (prefix → router)

| Prefix | Notable endpoints |
|--------|-------------------|
| `/public` | `GET /public/scan/{token}` — QR token → hotel/table/slot; `GET /public/hotels` |
| `/tables` | `POST /tables/`, `POST /tables/batch`, `PUT /tables/{id}/occupy|free`, `PUT /tables/number/{n}/occupy|free`, `POST /tables/{id}/generate-qr`, `GET /tables/{id}/qr-image` (returns PNG + `x-qr-url` header) |
| `/settings` | `GET /settings/hotels`, `POST /settings/switch-hotel`, public `show-prices` |
| `/customer` | `POST /customer/api/login`, `POST /customer/api/orders`, `GET /customer/api/person/{id}/orders`, `PUT /customer/api/orders/{id}/payment|cancel`, `POST /customer/api/phone-auth` |
| `/chef` | `POST /chef/auth/login`, `GET /chef/orders/pending|accepted`, `PUT /chef/orders/{id}/accept|complete` |
| `/admin` | orders, bills (`/admin/orders/{id}/bill`), dishes/offers CRUD, `/admin/super/auth`, `/admin/super/hotels` (and `/stats`, `/{id}/stats`) |
| Others | `/hotel-auth` send/verify OTP, `/feedback`, `/loyalty`, `/selection-offers`, `/analytics`, `/monitoring` |

Full docs: `http://localhost:8001/docs`.

## How scanning & ordering works

1. Admin generates a QR per table slot (`POST /tables/{id}/generate-qr`). The token (`uuid4`) is created once and stored on the row; the PNG embeds `{frontend_url}/order?t={token}` (see `FRONTEND_URL`).
2. Customer scans → opens `/order?t=...` → `QRLanding.js` calls `GET /public/scan/{token}` → stores `customerQrToken`, `customerSelectedDatabase`, `tableNumber`, `slotNumber` in localStorage → navigates to `/customer/menu?...`.
3. `Menu.js` loads data via the `useMenuOptimized` hooks; the cart is persisted in localStorage as `customerCart_<qrToken>`.
4. Placing an order calls `POST /customer/api/orders`; "request payment" marks the order `payment_requested`. There is no live payment gateway — payment is completed at the counter.
5. The kitchen sees orders on `/chef/orders` and transitions status (accepted → ready → completed) via `/chef/orders/{id}/...`.

## Testing on your phone (same WiFi)

- Run the backend (`python run.py`, port 8001) and `npm start` (port 3000).
- The QR PNG now embeds your LAN IP automatically (backend `app/utils/network.py`); the frontend also points API calls at that LAN host in dev (`src/utils/apiBaseUrl.js`).
- **Regenerate the QR after any URL-related change** — the printed PNG keeps the old URL.
- If the phone can't connect, allow Node/Python through Windows Firewall for **private networks**.

## Deployment (Render)

- `backend/render.yaml` defines the `tabble-backend` web service (free tier, Singapore): start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`, persistent 1 GB disk for `app/static/images`, auto-deploy from branch `tabblefinal-backend`.
- Caveats: `FRONTEND_URL` is a placeholder (`https://your-frontend-url.com`), `CORS_ORIGINS="*"` conflicts with the code's forced `allow_credentials=True`, and `ADMIN_PASSWORD` is hardcoded. Set real env vars in the Render dashboard before production.

## Notes & known issues

- Frontend is plain JavaScript — there is **no TypeScript**. There are **no tests, no CI, and no standalone linter** in the repo.
- The React SPA is also served by the backend when `frontend/build` exists (mounted at `/` in `main.py`), which shadows the legacy Jinja2 HTML routes (`/chef`, `/customer`, `/admin`...). The `templates/` dir those routes reference doesn't exist.
- `app/services/optimized_queries.py` is dead, unimported code that references non-existent columns — do not wire it up as-is.
- `__init__.py` is missing in `backend/app/`, `app/routers/`, `app/models/` (namespace packages work, but tooling may complain).
- Redux store (`src/store/`) and React Query exist, but the customer menu uses the `useMenuOptimized` hooks instead; several services/hooks/components are unimported dead code (see AGENTS.md).
- `frontend/.env`, `frontend/.env.production`, `frontend/build/`, and `frontend/node_modules/` do not follow ignore rules (no root `.gitignore`) — don't `git add -A` blindly.

For agents working in this repo, see **[AGENTS.md](AGENTS.md)** for the compact, verified operator guide.

---

**Tabble v3.1** — QR ordering. Proprietary; all rights reserved.