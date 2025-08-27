# Tabble-v3

A modern restaurant management system built with Python FastAPI and React.
A comprehensive restaurant management system built with FastAPI (backend) and React (frontend), featuring QR code-based table ordering, phone OTP authentication, real-time order management, and multi-database support for independent hotel operations.

## 🌟 Key Features

### 🍽️ Customer Interface
- **Phone OTP Authentication**: Secure Fast2SMS-based authentication
- **Real-time Cart Management**: Live cart updates with special offers
- **Today's Specials**: Dynamic special dish recommendations
- **Payment Processing**: Integrated payment with loyalty discounts
- **Order History**: Track past orders and preferences

### 👨‍🍳 Chef Dashboard
- **Real-time Order Management**: Live order notifications and updates
- **Kitchen Operations**: Streamlined order acceptance and completion
- **Order Status Updates**: Instant status changes reflected across all interfaces

### 🏨 Admin Panel
- **Complete Restaurant Management**: Full control over restaurant operations
- **Dish Management**: Add, edit, and manage menu items with images
- **Offers & Specials**: Create and manage promotional offers
- **Table Management**: Monitor table occupancy and status
- **Order Tracking**: Complete order lifecycle management
- **Loyalty Program**: Configurable visit-based discount system
- **Selection Offers**: Amount-based discount configuration
- **Settings**: Hotel information and configuration management

### 📊 Analytics Dashboard
- **Customer Analysis**: Detailed customer behavior insights
- **Dish Performance**: Menu item popularity and sales metrics
- **Chef Performance**: Kitchen efficiency tracking
- **Sales & Revenue**: Comprehensive financial reporting

### 🗄️ Multi-Database Support
- **Independent Hotel Operations**: Each hotel operates with its own database
- **Database Authentication**: Secure database access with password protection
- **Session-based Management**: Consistent database context across all interfaces
- **Data Isolation**: Complete separation of hotel data for security and privacy

## 📁 Project Structure

```
tabble/
├── app/                           # Backend FastAPI application
│   ├── database.py               # Database configuration and models
│   ├── main.py                   # FastAPI application entry point
│   ├── middleware/               # Custom middleware (CORS, session handling)
│   ├── models/                   # SQLAlchemy database models
│   ├── routers/                  # API route definitions
│   │   ├── admin.py             # Admin panel endpoints
│   │   ├── chef.py              # Chef dashboard endpoints
│   │   ├── customer.py          # Customer interface endpoints
│   │   └── analytics.py         # Analytics and reporting endpoints
│   ├── services/                 # Business logic and external services  
│   │   ├── otp_service.py       # Fast2SMS OTP authentication
│   │   └── database_service.py  # Database operations
│   ├── static/                   # Static file serving
│   │   └── images/              # Dish and hotel logo images
│   │       └── dishes/          # Organized by database name
│   └── utils/                    # Utility functions and helpers
├── frontend/                      # React frontend application
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Layout.js        # Main layout wrapper
│   │   │   ├── AdminLayout.js   # Admin panel layout
│   │   │   └── ChefLayout.js    # Chef dashboard layout
│   │   ├── pages/               # Page components
│   │   │   ├── admin/           # Admin interface pages
│   │   │   ├── chef/            # Chef dashboard pages
│   │   │   ├── customer/        # Customer interface pages
│   │   │   └── analysis/        # Analytics dashboard
│   │   ├── services/            # API communication services
│   │   │   └── api.js           # Axios configuration and API calls
│   │   ├── App.js               # Main React application
│   │   ├── index.js             # React DOM entry point
│   │   └── global.css           # Global styling
│   ├── public/                   # Static assets
│   │   ├── index.html           # HTML template
│   │   └── favicon.ico          # Application icon
│   ├── package.json             # Node.js dependencies
│   ├── .env.example             # Environment variables template
│   └── .env                     # Environment configuration
├── templates/                     # Report generation templates
│   └── analysis/                # Analytics report templates
├── hotels.csv                    # Database registry and passwords
├── init_db.py                    # Database initialization with sample data
├── create_empty_db.py            # Empty database creation utility
├── requirements.txt              # Python dependencies
├── run.py                        # Backend server launcher
└── README.md                     # Project documentation
```

## 🚀 Quick Start Guide

### Prerequisites

#### For Windows:
- **Python 3.8+**: Download from [python.org](https://www.python.org/downloads/)
- **Node.js 16+**: Download from [nodejs.org](https://nodejs.org/downloads/)
- **Git**: Download from [git-scm.com](https://git-scm.com/downloads)

#### For macOS:
- **Python 3.8+**: Install via Homebrew: `brew install python3`
- **Node.js 16+**: Install via Homebrew: `brew install node`
- **Git**: Install via Homebrew: `brew install git`

### 🔧 Installation & Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd tabble
```

#### 2. Backend Setup

##### Windows:
```cmd
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

##### macOS/Linux:
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup

##### Both Windows and macOS:
```bash
# Navigate to frontend directory
cd frontend

# Copy environment template
cp .env.example .env

# Install Node.js dependencies
npm install
```

#### 4. Configure Environment Variables

##### Backend (.env in root directory):
```env
SECRET_KEY=your_secret_key_here
```

##### Frontend (frontend/.env):
```env
# Backend API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000

# Development settings
NODE_ENV=development

# Fast2SMS Configuration (for OTP services)
# FAST2SMS_API_KEY=your_fast2sms_api_key
```

## 🗄️ Database Management

### Understanding the Multi-Database System

Tabble supports multiple independent hotel databases, allowing each hotel to operate with complete data isolation. Each database contains:

- **Dishes**: Menu items with pricing, categories, and images
- **Orders**: Customer orders and order items
- **Persons**: Customer information and visit history
- **Tables**: Table management and occupancy status
- **Loyalty Program**: Visit-based discount tiers
- **Selection Offers**: Amount-based promotional offers
- **Settings**: Hotel-specific configuration
- **Feedback**: Customer reviews and ratings

### Database Registry (hotels.csv)

The `hotels.csv` file serves as the central registry for all hotel databases:

```csv
hotel_database,password
tabble_new.db,myhotel

```

### Creating a New Hotel Database

#### Method 1: Using the create_empty_db.py Script

##### Windows:
```cmd
# Activate virtual environment
venv\Scripts\activate

# Run the database creation script
python create_empty_db.py
```

##### macOS/Linux:
```bash
# Activate virtual environment
source venv/bin/activate

# Run the database creation script
python create_empty_db.py
```

**Interactive Process:**
1. The script will prompt you for a database name
2. Enter the hotel name (without .db extension)
3. The script creates an empty database with proper schema
4. Manually add the database entry to `hotels.csv`

**Example:**
```
Creating a new empty database with the proper schema
Enter name for the new database (without .db extension): newhotel

Success! Created empty database 'newhotel.db' with the proper schema
```

Then add to `hotels.csv`:
```csv
newhotel.db,newhotel123
```

#### Method 2: Initialize with Sample Data

##### Windows:
```cmd
# Create database with sample data
python init_db.py
```

##### macOS/Linux:
```bash
# Create database with sample data
python init_db.py
```

**Note:** This creates `tabble_new.db` with sample dishes, users, and configuration.

### Database Schema Details

The `create_empty_db.py` script creates the following tables:

#### Core Tables:
- **dishes**: Menu items with pricing, categories, offers, and visibility
- **persons**: Customer profiles with visit tracking
- **orders**: Order management with status tracking
- **order_items**: Individual items within orders
- **tables**: Table management and occupancy status

#### Configuration Tables:
- **loyalty_program**: Visit-based discount configuration
- **selection_offers**: Amount-based promotional offers
- **settings**: Hotel information and branding
- **feedback**: Customer reviews and ratings

### Running the Application

#### Start Backend Server

##### Windows:
```cmd
# Activate virtual environment
venv\Scripts\activate

# Start the FastAPI server
python run.py
```

##### macOS/Linux:
```bash
# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
python run.py
```

The backend will be available at `http://localhost:8000`

#### Start Frontend Development Server

##### Both Windows and macOS:
```bash
# Navigate to frontend directory
cd frontend

# Start React development server
npm start
```

The frontend will be available at `http://localhost:3000`

### 🔗 API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🎯 Key Features Implementation

### 🍽️ Table Management
- **QR Code Generation**: Automatic QR code creation for each table
- **Real-time Status Monitoring**: Live table occupancy tracking
- **Session-based Occupancy**: Table status changes based on customer interaction
- **Multi-database Support**: Table management per hotel database

### 📱 Order Processing
- **Real-time Order Tracking**: Live order status updates across all interfaces
- **Kitchen Notifications**: Instant order notifications to chef dashboard
- **Status Synchronization**: Order status changes reflect immediately
- **Payment Integration**: Secure payment processing with loyalty discounts

### 📊 Analytics and Reporting
- **Custom Report Templates**: Configurable analytics reports
- **PDF Generation**: Automated report exports
- **Performance Metrics**: Comprehensive business intelligence
- **Multi-dimensional Analysis**: Customer, dish, and chef performance tracking

### 🔐 Authentication & Security
- **Fast2SMS Phone OTP**: Secure customer authentication
- **Database Password Protection**: Hotel database access control
- **Session Management**: Secure session handling across interfaces
- **Data Isolation**: Complete separation of hotel data

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues:
```bash
# If you get "Module not found" errors
pip install -r requirements.txt

# If database connection fails
python create_empty_db.py

# If port 8000 is already in use
# Edit run.py and change the port number
```

#### Frontend Issues:
```bash
# If npm install fails
npm cache clean --force
npm install

# If environment variables aren't loading
# Check that .env file exists in frontend directory
cp .env.example .env

# If API calls fail
# Verify REACT_APP_API_BASE_URL in frontend/.env
```

#### Database Issues:
```bash
# If database schema is outdated
python init_db.py --force-reset

# If hotels.csv is missing entries
# Manually add your database to hotels.csv
```

### Platform-Specific Notes

#### Windows:
- Use `venv\Scripts\activate` to activate virtual environment
- Use `python` command (not `python3`)
- Ensure Python is added to PATH during installation

#### macOS:
- Use `source venv/bin/activate` to activate virtual environment
- Use `python3` command for Python 3.x
- Install Xcode Command Line Tools if needed: `xcode-select --install`

## 🔄 Development Workflow

### Adding a New Hotel Database

1. **Create Empty Database:**
   ```bash
   python create_empty_db.py
   ```

2. **Add to Registry:**
   Edit `hotels.csv` and add your database entry:
   ```csv
   yourhotel.db,yourpassword123
   ```

3. **Configure Hotel Settings:**
   - Access admin panel: `http://localhost:3000/admin`
   - Navigate to Settings
   - Configure hotel information

4. **Add Menu Items:**
   - Use admin panel to add dishes
   - Upload dish images to `app/static/images/dishes/yourhotel/`

### Deployment Considerations

#### Production Environment Variables:
```env
# Backend
SECRET_KEY=your_production_secret_key
DATABASE_URL=your_production_database_url

# Frontend
REACT_APP_API_BASE_URL=https://your-domain.com/api
NODE_ENV=production
```

#### Image Storage:
- Images are stored in `app/static/images/dishes/{database_name}/`
- Ensure proper directory permissions for image uploads
- Consider using cloud storage for production deployments


# tabble-v3.1
