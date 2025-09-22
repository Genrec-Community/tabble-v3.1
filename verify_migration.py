#!/usr/bin/env python3
"""
Verification script to ensure Supabase migration is working correctly
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_environment():
    """Verify environment configuration"""
    print("🔍 Verifying Environment Configuration...")
    
    required_vars = {
        "DATABASE_TYPE": "supabase",
        "SUPABASE_URL": "https://knuodzevjolsdgrloctl.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "SUPABASE_SERVICE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    }
    
    all_good = True
    for var, expected_prefix in required_vars.items():
        value = os.getenv(var)
        if not value:
            print(f"  ❌ {var} is not set")
            all_good = False
        elif not value.startswith(expected_prefix):
            print(f"  ❌ {var} has unexpected value")
            all_good = False
        else:
            print(f"  ✅ {var} is configured correctly")
    
    return all_good

def verify_database_connection():
    """Verify database connection and data"""
    print("\n🗄️ Verifying Database Connection...")
    
    try:
        from app.supabase_config import get_supabase_client
        
        supabase = get_supabase_client()
        
        # Test connection
        result = supabase.table("hotels").select("id, hotel_name").execute()
        
        if result.data:
            print(f"  ✅ Connected to Supabase successfully")
            print(f"  ✅ Found {len(result.data)} hotels in database:")
            for hotel in result.data:
                print(f"    - {hotel['hotel_name']} (ID: {hotel['id']})")
            return True
        else:
            print("  ❌ No hotels found in database")
            return False
            
    except Exception as e:
        print(f"  ❌ Database connection failed: {e}")
        return False

def verify_storage_bucket():
    """Verify storage bucket exists"""
    print("\n📁 Verifying Storage Bucket...")
    
    try:
        from app.supabase_config import get_supabase_service_client
        
        supabase = get_supabase_service_client()
        
        # List buckets
        buckets = supabase.storage.list_buckets()
        
        bucket_names = [bucket.name for bucket in buckets]
        
        if "tabble-images" in bucket_names:
            print("  ✅ Storage bucket 'tabble-images' exists")
            return True
        else:
            print("  ❌ Storage bucket 'tabble-images' not found")
            print(f"  Available buckets: {bucket_names}")
            return False
            
    except Exception as e:
        print(f"  ❌ Storage verification failed: {e}")
        return False

def verify_adapters():
    """Verify database and storage adapters"""
    print("\n🔧 Verifying Adapters...")
    
    try:
        from app.database_adapter import get_database_adapter
        from app.storage_adapter import get_storage_adapter
        
        # Test database adapter
        db_adapter = get_database_adapter()
        if db_adapter.use_supabase:
            print("  ✅ Database adapter configured for Supabase")
        else:
            print("  ❌ Database adapter not configured for Supabase")
            return False
        
        # Test storage adapter
        storage_adapter = get_storage_adapter()
        if storage_adapter.use_supabase:
            print("  ✅ Storage adapter configured for Supabase")
        else:
            print("  ❌ Storage adapter not configured for Supabase")
            return False
        
        # Test adapter functionality
        hotels = db_adapter.get_hotels()
        if hotels:
            print(f"  ✅ Database adapter working - retrieved {len(hotels)} hotels")
        else:
            print("  ⚠️ Database adapter working but no hotels found")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Adapter verification failed: {e}")
        return False

def verify_migration_completeness():
    """Verify all tables were migrated"""
    print("\n📊 Verifying Migration Completeness...")
    
    try:
        from app.supabase_config import get_supabase_service_client
        
        supabase = get_supabase_service_client()
        
        # Check all expected tables exist
        expected_tables = [
            "hotels", "dishes", "persons", "orders", "order_items", 
            "tables", "feedback", "loyalty_tiers", "selection_offers", 
            "settings", "otp_requests"
        ]
        
        # Query each table to verify it exists
        existing_tables = []
        for table in expected_tables:
            try:
                result = supabase.table(table).select("*").limit(1).execute()
                existing_tables.append(table)
            except Exception:
                pass  # Table doesn't exist or can't be accessed
        
        missing_tables = set(expected_tables) - set(existing_tables)

        if not missing_tables:
            print(f"  ✅ All {len(expected_tables)} expected tables exist")
            print(f"  📋 Tables verified: {', '.join(sorted(existing_tables))}")
            return True
        else:
            print(f"  ❌ Missing tables: {', '.join(missing_tables)}")
            print(f"  ✅ Existing tables: {', '.join(sorted(existing_tables))}")
            return False
            
    except Exception as e:
        print(f"  ❌ Migration verification failed: {e}")
        return False

def main():
    """Main verification function"""
    print("🔍 Tabble Supabase Migration Verification")
    print("=" * 50)
    
    verification_steps = [
        ("Environment Configuration", verify_environment),
        ("Database Connection", verify_database_connection),
        ("Storage Bucket", verify_storage_bucket),
        ("Adapters", verify_adapters),
        ("Migration Completeness", verify_migration_completeness),
    ]
    
    passed_steps = 0
    total_steps = len(verification_steps)
    
    for step_name, step_func in verification_steps:
        print(f"\n📋 {step_name}")
        if step_func():
            passed_steps += 1
        else:
            print(f"  ⚠️ {step_name} verification failed")
    
    print(f"\n📊 Verification Results: {passed_steps}/{total_steps} steps passed")
    
    if passed_steps == total_steps:
        print("🎉 All verifications passed! Migration is successful.")
        print("\n✅ Your Tabble application is ready for production with Supabase!")
        return True
    else:
        print("❌ Some verifications failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
