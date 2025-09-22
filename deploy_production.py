#!/usr/bin/env python3
"""
Production deployment script for Tabble with Supabase
"""
import os
import sys
import subprocess
from dotenv import load_dotenv

def check_environment():
    """Check if all required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    load_dotenv()
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "SUPABASE_SERVICE_KEY",
        "DATABASE_TYPE"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    if os.getenv("DATABASE_TYPE") != "supabase":
        print("⚠️ DATABASE_TYPE is not set to 'supabase'")
        return False
    
    print("✅ Environment configuration is valid")
    return True

def install_dependencies():
    """Install required dependencies"""
    print("📦 Installing dependencies...")
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def test_supabase_connection():
    """Test Supabase connection"""
    print("🔗 Testing Supabase connection...")
    
    try:
        result = subprocess.run([sys.executable, "test_supabase_integration.py"], 
                               capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Supabase connection test passed")
            return True
        else:
            print(f"❌ Supabase connection test failed: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Supabase connection test timed out")
        return False
    except Exception as e:
        print(f"❌ Error testing Supabase connection: {e}")
        return False

def setup_database():
    """Set up database schema if needed"""
    print("🗄️ Setting up database schema...")
    
    try:
        # Check if tables exist
        from app.supabase_config import get_supabase_service_client
        
        supabase = get_supabase_service_client()
        result = supabase.table("hotels").select("count", count="exact").execute()
        
        if result.count is not None and result.count > 0:
            print(f"✅ Database already set up with {result.count} hotels")
            return True
        else:
            print("ℹ️ Database appears to be empty, running migration...")
            
            # Run migration scripts
            subprocess.run([sys.executable, "migration/setup_supabase_schema.py"], check=True)
            subprocess.run([sys.executable, "migration/migrate_data.py"], check=True)
            subprocess.run([sys.executable, "migration/create_storage_bucket.py"], check=True)
            
            print("✅ Database migration completed")
            return True
            
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        return False

def start_application():
    """Start the application"""
    print("🚀 Starting Tabble application...")
    
    try:
        host = os.getenv("HOST", "0.0.0.0")
        port = int(os.getenv("PORT", 8000))
        
        print(f"📍 Application will be available at: http://{host}:{port}")
        print("🔄 Starting server...")
        
        # Start the application
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", host, 
            "--port", str(port),
            "--reload" if os.getenv("ENVIRONMENT") == "development" else "--no-reload"
        ])
        
    except KeyboardInterrupt:
        print("\n🛑 Application stopped by user")
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        return False

def main():
    """Main deployment function"""
    print("🎯 Tabble Production Deployment")
    print("=" * 50)
    
    steps = [
        ("Environment Check", check_environment),
        ("Install Dependencies", install_dependencies),
        ("Test Supabase Connection", test_supabase_connection),
        ("Setup Database", setup_database),
    ]
    
    for step_name, step_func in steps:
        print(f"\n📋 Step: {step_name}")
        if not step_func():
            print(f"\n❌ Deployment failed at step: {step_name}")
            sys.exit(1)
    
    print("\n🎉 All deployment steps completed successfully!")
    print("🚀 Starting application...")
    
    start_application()

if __name__ == "__main__":
    main()
