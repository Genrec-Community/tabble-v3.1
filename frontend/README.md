# Tabble v3.1 — Frontend (React SPA)

Customer-facing QR ordering, kitchen (chef), and hotel-admin web app. **Plain JavaScript** (no TypeScript) built with Create React App 5 (`react-scripts` 5.0.1) + MUI v5 + Redux Toolkit + React Query + Firebase JS SDK.

## Scripts

```bash
npm install
npm start          # dev server on 0.0.0.0:3000 (reachable from the LAN by default)
npm run build      # CI=false react-scripts build → build/ (warnings don't fail the build)
npm test           # exists (react-scripts test) — no test files are present
```

There is no lint/typecheck script. The only real validation is `npm run build` (or `npx react-scripts build`).

## Environment

`frontend/.env` (dev, **tracked in git**):

```
REACT_APP_API_BASE_URL=http://localhost:8001
```

- Dev API base is **8001** (the backend `run.py` serves 8001). `.env.example` still says 8000 — ignore it.
- `REACT_APP_API_PORT` (default `8001`) can override the port of the LAN-derived URL.
- `REACT_APP_FIREBASE_API_KEY/AUTH_DOMAIN/PROJECT_ID/STORAGE_BUCKET/MESSAGING_SENDER_ID/APP_ID/MEASUREMENT_ID` — Firebase web config. `src/firebase.js` ships hardcoded fallback keys, and `frontend/.env.production` holds real keys + the Render backend URL.

### Runtime API-base resolution (`src/utils/apiBaseUrl.js`)

In **development**, when the page is opened from a LAN hostname (e.g. a phone on the same WiFi), `getApiBaseUrl()` returns `http://<same host>:<REACT_APP_API_PORT|8001>` — overriding `REACT_APP_API_BASE_URL` — so phone => API calls go to this machine. On `localhost` it falls back to the configured value. Production always uses `REACT_APP_API_BASE_URL`. This is what makes phone QR testing work — don't hardcode `localhost` URLs past it.

## Project structure

```
src/
├── index.js          # createRoot + StrictMode (mounts App)
├── App.js            # providers (Redux → React Query → theme → Router → Suspense) + ALL routes
├── firebase.js       # Firebase init + GoogleAuthProvider (hardcoded fallback keys)
├── pages/
│   ├── customer/     # QRLanding, Menu, Login + components (CartDialog, AddToCartDialog, ...)
│   ├── chef/         # Login, Dashboard, Orders
│   ├── admin/        # Dashboard, Dishes, Offers, Specials, Tables, Settings, Chefs, Loyalty, CompletedOrders, SelectionOffers, SuperAdmin
│   └── analysis/     # AnalysisDashboard, Customer/Dish/ChefAnalysis
├── components/       # Layout, AuthWrapper, DatabaseSelector, ThemeModeToggle, ...
├── services/
│   ├── api.js        # axios instance + customerService / chefService / adminService / analyticsService
│   └── optimizedApi.js  # ⚠️ dead code — not imported
├── hooks/            # useMenuOptimized (used), usePerformanceMonitor (used); others unused
├── store/            # Redux Toolkit slices (cart/menu/orders/ui/auth)
└── utils/            # apiBaseUrl.js, errorHandler.js, errorLogger.js, cacheManager.js, theme*, ...
```

## Routing (all lazy-loaded)

| Path | Page |
|------|------|
| `/` | Home |
| `/order?t={token}` | QRLanding (QR scan entry) |
| `/customer` · `/customer/menu` · `/customer/demo-entry` | customer login / menu |
| `/chef/login` · `/chef` · `/chef/orders` | chef |
| `/admin/login` · `/admin` · `/admin/{dishes\|offers\|specials\|tables\|settings\|chefs\|loyalty\|completed-orders\|selection-offers}` | admin |
| `/analysis` · `/analysis/{customer\|dish\|chef}` | analytics (admin auth-gated) |
| `/adminofthetabble` | super admin |
| `/backitup` · `/sysdiag` · `/emergency-sys` | performance/system monitors |

Known quirk: `/backitup` is declared twice in `App.js` (once in a layout wrapper, once standalone).

## How the customer flow works

1. **`QRLanding`** (`/order?t={token}`) → `GET /public/scan/{token}` → on success stores `customerQrToken`, `customerSelectedDatabase`, `tableNumber`, `slotNumber` in localStorage → navigates to `/customer/menu?...` (handles cart-conflict and slot-occupied screens).
2. **`Menu.js`** pulls menu/orders through the **`useMenuOptimized` hooks** (`src/hooks/useMenuOptimized.js`) — *not* React Query or the Redux slices (those exist but are unused for menu/order data). The cart is persisted per-table in localStorage as `customerCart_<qrToken>` (+ `customerCartUpdatedAt`, `customerOrderStatus`).
3. Placing an order calls `POST /customer/api/orders`; “request payment” calls `PUT /customer/api/orders/{id}/payment`, which marks the order `payment_requested` — there is **no live payment gateway**; payment is settled at the counter.
4. Chef pages poll/refresh order status via the chef service (`/chef/...`).

## Auth
- **Admin**: hotel name + password (via `/admin/...` with `x-hotel-name`/`x-hotel-password` headers; the `AuthWrapper` restores the session from localStorage: `selectedHotel`/`hotelPassword` — the legacy `selectedDatabase`/`databasePassword` aliases still write too).
- **Chef**: username/password via `POST /chef/auth/login` (localStorage keys `chefId`, `chefUsername`, `chefHotelName`).
- **Customer**: Firebase Google **popup** sign-in (either the phone or manual demo login) → `/customer/api/auth/google`.

## Known issues / dead code
- Often-cited dead code (never imported): `services/optimizedApi.js`, `hooks/useApi.js`, `hooks/useOrderSync.js`, `hooks/useOptimizedPolling.js`, `components/PerformanceDashboard.js`, `pages/customer/components/PaymentDialog.js`, `OrderConfirmationDialog.js`.
- `usePerformanceMonitor('CustomerMenu', 150)` in `Menu.js:64` is a misused call (the hook takes `{ enabled, logToConsole }`; the args are ignored and the return value unused).
- `.env`-driven API base means regenerating the QR is required anytime the embedded frontend URL would change.

Proprietary — all rights reserved.