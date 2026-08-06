# Tabble v3.1 - Restaurant QR Ordering System

**Production-grade restaurant ordering system with QR codes, Firebase authentication, and real-time order management.**

## 🎯 Quick Start - Deploy 3 Test Hotels

```bash
# 1. Validate configuration
python validate_deployment.py

# 2. Create 3 test hotels in database
python setup_test_hotels.py

# 3. Start interactive deployment wizard
python deploy_wizard.py
```

**Test Hotels Created:**
- **Hotel Paradise** - `paradise_admin` / `Paradise@2026`
- **Hotel Riverside** - `riverside_admin` / `Riverside@2026`
- **Hotel Summit** - `summit_admin` / `Summit@2026`

## 📚 Complete Documentation

All deployment and testing guides are in **[guides/](guides/)**:

| Guide | Purpose |
|-------|---------|
| **[DEPLOYMENT_README.md](guides/DEPLOYMENT_README.md)** | 🚀 **START HERE** - Quick deployment walkthrough |
| **[PRODUCTION_TEST_DEPLOYMENT.md](guides/PRODUCTION_TEST_DEPLOYMENT.md)** | Complete production setup with all details |
| **[TESTING_CHECKLIST.md](guides/TESTING_CHECKLIST.md)** | Systematic testing for all 3 hotels |
| **[QR_TESTING_GUIDE.md](guides/QR_TESTING_GUIDE.md)** | Mobile QR code testing procedures |
| **[GUIDE.md](guides/GUIDE.md)** | Development and local setup |
| **[POC_DEPLOYMENT.md](guides/POC_DEPLOYMENT.md)** | Single-table POC deployment |

## ✨ Key Features

### 🏨 Multi-Hotel System
- Complete hotel isolation (separate menus, orders, tables)
- Independent admin and chef access per hotel
- Shared Supabase database with proper isolation

### 📱 QR Code Ordering
- 2 QR codes per table (Seat 1 & Seat 2)
- Mobile-optimized scanning experience
- Automatic seat occupancy detection
- Dynamic QR generation with UUID tokens

### 🔐 Authentication
- **Admin**: Hotel name + password
- **Chef**: Firebase Google Sign-In
- **Customer**: Firebase Google Sign-In
- Persistent sessions across page reloads

### 🍽️ Complete Restaurant Management
- Real-time menu management
- Dish availability toggle
- Today's specials
- Order tracking and history
- Chef dashboard with status updates
- Admin panel with full control

## 🔄 Complete Pipeline Verification

### Pipeline Flow
```
1. QR Code Generation (Admin)
   └─> Backend generates UUID token for table/seat
   └─> QR encodes: https://domain.com/order?t={token}

2. Customer Scans QR
   └─> Opens URL in mobile browser
   └─> Frontend calls /public/scan/{token}
   └─> Backend returns: hotel_name, table_number, slot_number, is_occupied

3. Customer Login
   └─> Redirects to Google Sign-In (Firebase)
   └─> Firebase returns user: uid, email, name, picture
   └─> Session stored in localStorage + Firebase persistence

4. Customer Orders
   └─> Browse menu (filtered by availability)
   └─> Add items to cart
   └─> Place order
   └─> Backend creates order linked to customer UID

5. Chef Processes
   └─> Chef sees order in real-time
   └─> Accepts order (status: Pending → Preparing)
   └─> Marks ready (status: Preparing → Ready)
   └─> Completes (status: Ready → Completed)

6. Real-time Updates
   └─> Customer sees status changes without refresh
   └─> Updates via polling or WebSocket (depending on config)
```

### Key Endpoints Verified

**Public (No Auth):**
- ✅ `GET /public/scan/{qr_token}` - Resolve QR token to hotel/table/slot

**Table Management:**
- ✅ `POST /tables/` - Create table (auto-creates 2 slots)
- ✅ `POST /tables/{table_id}/generate-qr` - Generate QR code PNG
- ✅ `GET /tables/{table_id}/qr-image` - Get existing QR code

**Authentication:**
- ✅ `POST /auth/admin/login` - Admin hotel + password login
- ✅ `POST /auth/chef/google` - Chef Firebase Google Sign-In
- ✅ `POST /auth/customer/google` - Customer Firebase Google Sign-In

**Orders:**
- ✅ Customer places order with table/slot context
- ✅ Chef receives orders filtered by their hotel
- ✅ Order status updates propagate to all interfaces

**Frontend Routes:**
- ✅ `/order?t={token}` - QR landing page (resolves token)
- ✅ `/customer/menu` - Customer ordering interface
- ✅ `/chef/login` - Chef Google login
- ✅ `/chef/orders` - Chef dashboard
- ✅ `/admin/login` - Admin login
- ✅ `/admin/dashboard` - Admin panel

## ⚙️ Configuration

### Backend Environment

Create `.env.production`:

```env
SECRET_KEY=<generate-with-secrets.token_urlsafe(32)>
FRONTEND_URL=https://your-production-frontend.com
DATABASE_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_KEY=<your-service-key>
FIREBASE_PROJECT_ID=tabble-v4
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-service-account-json>
POC_MAX_TABLES_PER_HOTEL=1
DEMO_MODE=false
```

### Frontend Environment

Create `frontend/.env.production`:

```env
REACT_APP_API_BASE_URL=https://your-backend-api.com
REACT_APP_FIREBASE_API_KEY=<firebase-api-key>
REACT_APP_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=<project-id>
REACT_APP_FIREBASE_STORAGE_BUCKET=<project>.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
REACT_APP_FIREBASE_APP_ID=<app-id>
REACT_APP_FIREBASE_MEASUREMENT_ID=<measurement-id>
```

### Firebase Console Setup

1. Enable Google Authentication
2. Add production domain to Authorized Domains
3. Generate service account key (Project Settings → Service Accounts)
4. Base64 encode the JSON file:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("path/to/service-account.json"))
   ```

## 🛠️ Development

```bash
# Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

Access:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## 📦 Tech Stack

**Backend:**
- FastAPI (Python)
- Supabase (PostgreSQL)
- Firebase Admin SDK
- SQLAlchemy ORM
- Python qrcode library

**Frontend:**
- React 18
- React Router v6
- Material-UI (MUI)
- Redux Toolkit
- React Query
- Firebase JS SDK

## 📊 Project Structure

```
tabble-v3.1/
├── app/                        # Backend (FastAPI)
│   ├── routers/
│   │   ├── public.py          # QR scan endpoint (no auth)
│   │   ├── table.py           # Table & QR management
│   │   ├── admin.py           # Admin endpoints
│   │   ├── customer.py        # Customer endpoints
│   │   └── auth.py            # Authentication
│   ├── database.py            # SQLAlchemy models
│   ├── firebase_config.py     # Firebase integration
│   └── middleware/            # Session & auth middleware
├── frontend/                   # Frontend (React)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── customer/      # QRLanding, Menu, Login
│   │   │   ├── chef/          # Chef dashboard
│   │   │   └── admin/         # Admin panel
│   │   ├── components/        # Shared components
│   │   └── firebase.js        # Firebase config
├── guides/                     # Documentation
├── migration/                  # Database migrations
├── setup_test_hotels.py       # Create 3 test hotels
├── validate_deployment.py     # Pre-deployment validation
└── deploy_wizard.py           # Interactive deployment
```

## 🧪 Testing

Follow **[guides/TESTING_CHECKLIST.md](guides/TESTING_CHECKLIST.md)** for complete testing:

**Critical Tests:**
1. ✅ QR scan on mobile device (mobile data, not WiFi)
2. ✅ Firebase Google authentication
3. ✅ Complete order flow: Customer → Chef → Status Updates
4. ✅ Multi-hotel isolation (orders don't cross hotels)
5. ✅ Mobile optimization (< 3s page load)
6. ✅ Real-time updates without refresh

## 🚨 Common Issues

### QR Code Shows localhost
**Fix**: Update `FRONTEND_URL` in `.env.production`, restart backend, **regenerate all QR codes**

### Google Login Fails
**Fix**: Add production domain to Firebase Console → Authentication → Authorized Domains

### Orders Not Appearing
**Check**: Browser console for errors, verify backend is running, check CORS headers

### Table Creation Blocked
**Expected**: `POC_MAX_TABLES_PER_HOTEL=1` enforces 1 table limit for testing

## 🚀 Deployment

### Recommended Stack
- **Backend**: Railway, Render, Heroku, VPS
- **Frontend**: Vercel, Netlify, Firebase Hosting
- **Database**: Supabase (managed PostgreSQL)
- **Auth**: Firebase Authentication

### Deploy Steps
1. Set all environment variables
2. Run `python validate_deployment.py`
3. Run `python setup_test_hotels.py`
4. Deploy backend to hosting platform
5. Build frontend: `cd frontend && npm run build`
6. Deploy frontend build/ folder
7. Test QR codes on mobile devices
8. Follow [TESTING_CHECKLIST.md](guides/TESTING_CHECKLIST.md)

## ✅ Success Criteria

System is production-ready when:
- ✅ All 3 hotels operate independently
- ✅ QR codes resolve correctly on mobile
- ✅ Google authentication works seamlessly
- ✅ Complete order pipeline works
- ✅ Real-time updates without manual refresh
- ✅ Mobile experience is smooth
- ✅ No errors in production console
- ✅ All items in testing checklist passed

## 📄 License

Proprietary - All rights reserved

---

**Tabble v3.1** - Built for production restaurant ordering
