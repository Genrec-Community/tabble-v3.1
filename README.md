# Tabble v3.1 — Restaurant QR Ordering System

Multi-hotel restaurant management app: customers scan a QR code at a table, browse the menu, order, and pay; the kitchen gets real-time orders; the hotel admin manages dishes, tables, offers, loyalty programs, and analytics.

- **Backend**: FastAPI + SQLAlchemy (SQLite default, optional Supabase) + Firebase Admin
- **Frontend**: React 18 (Create React App) + MUI v5 + Redux Toolkit + React Query + Firebase JS
- **Auth**: Firebase Google Sign-In (chef & customer) + hotel-name/password (admin)

---

## What's in this repo

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI app. `app/main.py` entrypoint, `app/routers/*` (12 routers), `app/database.py` (SQLAlchemy models + session manager), `app/database_adapter.py` / `app/storage_adapter.py` (SQLite⇄Supabase adapters), `app/models/*` (Pydantic schemas), `app/utils/`, `app/services/`, `app/middleware/`. `deploy_production.py`, `verify_migration.py`, `render.yaml` for deployment. |
| `frontend/` | React SPA. `src/App.js` (routes + MUI theme), `src/pages/{admin,chef,customer,analysis}`, `src/components/`, `src/services/api.js`, `src/store/` (Redux), `src/hooks/`, `src/utils/`. |
| `backend/hotels.csv` | Seeds hotels (hotel_name + password) on first DB creation. |
| `backend/render.yaml` | Render (free tier) deploy config for the backend. |

### Key routes (frontend)
- `/` Home · `/order?t={token}` QR landing
- `/customer` / `/customer/menu` — customer ordering
- `/chef/login` / `/chef` / `/chef/orders` — kitchen
- `/admin/login` `/admin` `/admin/tables` `/admin/dishes` `/admin/offers` `/admin/loyalty` `/admin/chefs` `/admin/settings` — hotel admin
- `/analysis/*` — analytics
- `/adminofthetabble` — super admin
- `/backitup` `/sysdiag` `/emergency-sys` — system monitors

---

## Running the project (tips)

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py        # serves on http://0.0.0.0:8001 (LAN access)
```

Or: `uvicorn app.main:app --reload --port 8000` (docs at `http://localhost:8000/docs`).

> The backend **must be started from inside `backend/`** — file paths (`app/static`, `hotels.csv`, `Tabble.db`) are relative to the working directory and will crash/misbehave if you run from anywhere else (see "What to fix" #2).

### 2. Frontend

```powershell
cd frontend
npm install
npm start          # http://localhost:3000
```

### 3. Environment setup

- `backend/.env` — copy from `backend/.env.example`. Add the extra keys listed below (see "What to fix" #8).
- `frontend/.env` — copy from `frontend/.env.example` and paste your real Firebase web-app values. Hardcoded fallback Firebase keys already exist in `src/firebase.js` if you want a quick start.

**Rolling config** (`backend/.env`):

```env
DATABASE_TYPE=sqlite         # or supabase
DEMO_MODE=true              # true = OTP 11111, no SMS, demo hotel "demo"/"demo123" seeded
ADMIN_PASSWORD=<super-admin> # super admin at /adminofthetabble
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_JSON=      # or FIREBASE_SERVICE_ACCOUNT_BASE64
FAST2SMS_API_KEY=
```

### 4. Demo accounts
- Hotel admin: hotel name from `hotels.csv` (`demo` / `demo123`)
- Chef / customer: Firebase Google Sign-In
- Super admin: `/adminofthetabble` with `ADMIN_PASSWORD`

---

## Errors found in the audit (what to fix)

Grouped by severity. These are hard errors (breaks build/startup/feature), not style or logic.

### 🔴 Blocking — startup or build breaks

1. **Frontend build fails — `frontend/src/store/index.js:24-25`**
   ```js
   export type RootState = ReturnType<typeof store.getState>;
   export type AppDispatch = typeof store.dispatch;
   ```
   TypeScript `export type` syntax in a `.js` file. Create React App 5 does not run the TS preset on `.js` files → Babel `SyntaxError`, both `npm start` and `npm run build` die. **Fix:** delete the two lines (nothing imports them), or rename the file to `index.ts`.

2. **Backend CWD-dependent paths — `app/main.py:43`, `app/database.py:59,100,125,227`**
   `app/static`, `hotels.csv`, and `SQLite:///./Tabble.db` are resolved against the current working directory. Starting uvicorn from anywhere but `backend/` raises `RuntimeError: Directory 'app/static' does not exist` (evaluated at import in `main.py`). **Fix:** make paths relative to `__file__` (e.g. `Path(__file__).resolve().parent.parent / "static"`).

3. **Missing templates dir — `app/main.py:46` + `:85-121`**
   `Jinja2Templates(directory="templates")` points to a directory that does not exist. Startup survives, but the six HTML routes (`/chef`, `/chef/orders`, `/customer`, `/customer/menu`, `/admin`, `/admin/dishes`) raise `TemplateNotFound` when hit. **Fix:** remove these routes (they're shadowed by the React SPA anyway) or add a real `templates/` dir.

### 🟠 Feature-breaking — crashes at runtime

3. **`MenuItem` undefined — `app/routers/admin.py:939,941,975,1076`**
   Three super-admin endpoints reference `MenuItem`, which is never imported or defined anywhere → `NameError` on every call (`GET /admin/super/hotels/{id}/stats`, `GET /admin/super/stats/overview`, `DELETE /admin/super/hotels/{id}`). **Fix:** import `Dish` (there is no `MenuItem` model in `app/database.py`) or create one.

4. **`supabase` not installed — `requirements.txt`**
   `app/supabase_config.py:6` does `from supabase import create_client, Client` at module level, but `requirements.txt` is missing `supabase`. `pip install -r requirements.txt` alone gives `ModuleNotFoundError` whenever Supabase mode is active (`verify_migration.py` hits it unconditionally). **Fix:** add `supabase>=2.0.0` (only needed if `DATABASE_TYPE=supabase`).

5. **`deploy_production.py` references files that don't exist** — `test_supabase_integration.py` (line 57) and `migration/setup_supabase_schema.py`, `migration/migrate_data.py`, `migration/create_storage_bucket.py` (lines 91-93). The deploy script's "Test Supabase Connection" and "Setup Database" steps fail with `FileNotFoundError`.

6. **`app/services/optimized_queries.py` uses the wrong column names** (currently dead code, but will crash if wired up):
   - `Dish.is_visible` → model uses `Dish.visibility` (lines 31, 55)
   - `item.position` → `OrderItem` has no `position` column (line 118)

### 🟡 Minor / config

7. **`.env.example` out of sync with code** — code reads `SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON/BASE64`, `FIREBASE_PROJECT_ID`, `POC_MAX_TABLES_PER_HOTEL`; none are in `.env.example`. `SECRET_KEY` is in `.env.example` but **no code reads it**. A fresh setup copying `.env.example` loses the Supabase/Firebase config.

8. **Missing `__init__.py`** in `backend/app/`, `app/routers/`, `app/models/`. Works today (Python namespace packages) but breaks `pytest` root detection / `pip install -e`. Add empty `__init__.py` files.

9. **Duplicate route — `frontend/src/App.js:719`** — `/backitup` declared twice (also at lines 703-714, wrapped in `<Layout />`). Harmless in v6 (later wins), but remove the duplicate.

10. **Misused hook call — `frontend/src/pages/customer/Menu.js:64`** — `usePerformanceMonitor('CustomerMenu', 150)` passes position through `{ enabled, logToConsole }`; the two args are silently ignored and the return value unused. Remove the call.

11. **`backend/README.md` is stale** — it references `validate_deployment.py`, `setup_test_hotels.py`, `deploy_wizard.py`, `guides/`, `migration/` — none of those exist in the repo.

12. **Duplicate lazy import — `backend/app/database_adapter.py:39-42`** — `from .supabase_config import get_supabase_client` twice in a row (harmless, tidy up).

13. **Mutable default in theme** — none. The custom 7-entry `shadows` array in `App.js:260` is **safe** (MUI v5 deep-merges to 25 entries; the strict invariant is MUI v6-only).

---

## Notes
- **Auth security** — `main.py` sets `allow_origins=["*"]` with `allow_credentials=True`; browsers will reject credentialed cross-origin requests against that combo. Tighten to your real FRONTEND_URL before production.
- **Secrets** — `frontend/src/firebase.js` ships hard-coded Firebase keys and the repo has real `.env` files checked in. Rotate/negotiate before pushing publicly.
- Backend README documents a Supabase migration—see `backend/SUPABASE_MIGRATION_GUIDE.md` and `backend/verify_migration.py`.