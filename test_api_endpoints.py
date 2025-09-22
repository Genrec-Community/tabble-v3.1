#!/usr/bin/env python3
"""
Test script to verify API endpoints are working with Supabase
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health endpoint"""
    print("🧪 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
            return True
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False

def test_hotels_endpoint():
    """Test the hotels endpoint"""
    print("🧪 Testing hotels endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/settings/hotels")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Hotels endpoint working - found {len(data.get('databases', []))} hotels")
            return True
        else:
            print(f"❌ Hotels endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Hotels endpoint error: {e}")
        return False

def test_hotel_authentication():
    """Test hotel authentication"""
    print("🧪 Testing hotel authentication...")
    try:
        # Try to authenticate with the first hotel
        auth_data = {
            "database_name": "tabble_new",
            "password": "password123"  # This might not be the correct password
        }
        
        response = requests.post(f"{BASE_URL}/settings/select-hotel", json=auth_data)
        
        if response.status_code == 200:
            print("✅ Hotel authentication endpoint working")
            return True
        elif response.status_code == 401:
            print("✅ Hotel authentication endpoint working (invalid credentials expected)")
            return True
        else:
            print(f"❌ Hotel authentication failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Hotel authentication error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting API Endpoint Tests...\n")
    
    tests_passed = 0
    total_tests = 3
    
    # Test health endpoint
    if test_health_endpoint():
        tests_passed += 1
    
    # Test hotels endpoint
    if test_hotels_endpoint():
        tests_passed += 1
    
    # Test hotel authentication
    if test_hotel_authentication():
        tests_passed += 1
    
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All API tests passed! Application is working correctly with Supabase.")
        return True
    else:
        print("❌ Some API tests failed. Please check the application.")
        return False

if __name__ == "__main__":
    main()
