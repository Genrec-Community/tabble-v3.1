#!/usr/bin/env python3
"""
Test script to verify Supabase integration is working
"""
import os
import sys
from dotenv import load_dotenv

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

def test_database_adapter():
    """Test the database adapter"""
    print("🧪 Testing Database Adapter...")
    
    try:
        from app.database_adapter import get_database_adapter
        
        db_adapter = get_database_adapter()
        print(f"✅ Database adapter initialized (using {db_adapter.database_type})")
        
        # Test getting hotels
        hotels = db_adapter.get_hotels()
        print(f"✅ Retrieved {len(hotels)} hotels from database")
        
        for hotel in hotels:
            print(f"  - Hotel: {hotel['hotel_name']} (ID: {hotel['id']})")
        
        # Test authentication
        if hotels:
            first_hotel = hotels[0]
            hotel_id = db_adapter.authenticate_hotel(first_hotel['hotel_name'], first_hotel['password'])
            if hotel_id:
                print(f"✅ Authentication successful for hotel: {first_hotel['hotel_name']}")
            else:
                print(f"❌ Authentication failed for hotel: {first_hotel['hotel_name']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database adapter test failed: {e}")
        return False

def test_storage_adapter():
    """Test the storage adapter"""
    print("\n🧪 Testing Storage Adapter...")
    
    try:
        from app.storage_adapter import get_storage_adapter
        
        storage_adapter = get_storage_adapter()
        print(f"✅ Storage adapter initialized (using {'Supabase' if storage_adapter.use_supabase else 'Local'})")
        
        return True
        
    except Exception as e:
        print(f"❌ Storage adapter test failed: {e}")
        return False

def test_supabase_connection():
    """Test direct Supabase connection"""
    print("\n🧪 Testing Supabase Connection...")
    
    try:
        from app.supabase_config import get_supabase_client
        
        supabase = get_supabase_client()
        print("✅ Supabase client initialized")
        
        # Test a simple query
        result = supabase.table("hotels").select("id, hotel_name").limit(1).execute()
        if result.data:
            print(f"✅ Supabase query successful: {result.data[0]}")
        else:
            print("ℹ️ Supabase query returned no data (this is normal if no hotels exist)")
        
        return True
        
    except Exception as e:
        print(f"❌ Supabase connection test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Supabase Integration Tests...\n")
    
    tests_passed = 0
    total_tests = 3
    
    # Test database adapter
    if test_database_adapter():
        tests_passed += 1
    
    # Test storage adapter
    if test_storage_adapter():
        tests_passed += 1
    
    # Test Supabase connection
    if test_supabase_connection():
        tests_passed += 1
    
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Supabase integration is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the configuration.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
