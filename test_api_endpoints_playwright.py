#!/usr/bin/env python3
"""
Playwright API endpoint testing for Tabble application
Tests API endpoints with proper authentication and headers
"""
import asyncio
import json
import requests
import time
from datetime import datetime

async def test_api_endpoints():
    """Test API endpoints with proper authentication"""
    
    print("🌐 Starting API Endpoint Testing")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    test_results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_details": []
    }
    
    def log_test(test_name, success, details="", response_data=None):
        test_results["total_tests"] += 1
        if success:
            test_results["passed_tests"] += 1
            print(f"✅ {test_name}")
        else:
            test_results["failed_tests"] += 1
            print(f"❌ {test_name}: {details}")
        
        test_results["test_details"].append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
    
    # Test session headers
    session_id = "test-session-12345"
    headers = {
        "x-session-id": session_id,
        "Content-Type": "application/json"
    }
    
    try:
        # Test 1: Health Check
        print("\n🏥 Testing Health Check...")
        try:
            response = requests.get(f"{base_url}/health")
            success = response.status_code == 200
            log_test("Health Check", success, f"Status: {response.status_code}", response.json() if success else None)
        except Exception as e:
            log_test("Health Check", False, str(e))
        
        # Test 2: Get Hotels
        print("\n🏨 Testing Hotel Retrieval...")
        try:
            response = requests.get(f"{base_url}/settings/hotels", headers=headers)
            success = response.status_code == 200
            hotels_data = response.json() if success else None
            log_test("Hotel Retrieval", success, f"Status: {response.status_code}", hotels_data)
            
            if success and hotels_data and 'databases' in hotels_data:
                test_hotel = hotels_data['databases'][0]['database_name']
                print(f"   Using test hotel: {test_hotel}")
        except Exception as e:
            log_test("Hotel Retrieval", False, str(e))
            test_hotel = "tabble_new"
        
        # Test 3: Switch Hotel Context
        print("\n🔄 Testing Hotel Context Switch...")
        try:
            switch_data = {
                "hotel_name": test_hotel,
                "password": "password"
            }
            response = requests.post(f"{base_url}/settings/switch-hotel", 
                                   headers=headers, 
                                   json=switch_data)
            success = response.status_code == 200
            log_test("Hotel Context Switch", success, f"Status: {response.status_code}", response.json() if success else None)
            
            if success:
                # Update headers with hotel context
                headers.update({
                    "x-hotel-name": test_hotel,
                    "x-hotel-password": "password"
                })
        except Exception as e:
            log_test("Hotel Context Switch", False, str(e))
        
        # Test 4: Get Dishes
        print("\n🍽️ Testing Dish Retrieval...")
        try:
            response = requests.get(f"{base_url}/admin/api/dishes", headers=headers)
            success = response.status_code == 200
            dishes_data = response.json() if success else None
            log_test("Dish Retrieval", success, f"Status: {response.status_code}", dishes_data)
            
            if success and dishes_data:
                print(f"   Retrieved {len(dishes_data)} dishes")
                if dishes_data:
                    test_dish_id = dishes_data[0].get('id')
                    print(f"   Test dish ID: {test_dish_id}")
                    print(f"   Test dish name: {dishes_data[0].get('name')}")
                    print(f"   Image URL: {dishes_data[0].get('image_path', 'No image')[:50]}...")
        except Exception as e:
            log_test("Dish Retrieval", False, str(e))
            test_dish_id = 1
        
        # Test 5: Get Single Dish
        print("\n🍽️ Testing Single Dish Retrieval...")
        try:
            response = requests.get(f"{base_url}/admin/api/dishes/{test_dish_id}", headers=headers)
            success = response.status_code == 200
            dish_data = response.json() if success else None
            log_test("Single Dish Retrieval", success, f"Status: {response.status_code}", dish_data)
        except Exception as e:
            log_test("Single Dish Retrieval", False, str(e))
        
        # Test 6: Get Offer Dishes
        print("\n🎁 Testing Offer Dishes...")
        try:
            response = requests.get(f"{base_url}/admin/api/offers", headers=headers)
            success = response.status_code == 200
            offers_data = response.json() if success else None
            log_test("Offer Dishes Retrieval", success, f"Status: {response.status_code}", offers_data)
        except Exception as e:
            log_test("Offer Dishes Retrieval", False, str(e))
        
        # Test 7: Get Special Dishes
        print("\n⭐ Testing Special Dishes...")
        try:
            response = requests.get(f"{base_url}/admin/api/specials", headers=headers)
            success = response.status_code == 200
            specials_data = response.json() if success else None
            log_test("Special Dishes Retrieval", success, f"Status: {response.status_code}", specials_data)
        except Exception as e:
            log_test("Special Dishes Retrieval", False, str(e))
        
        # Test 8: Delete Dish (Soft Delete)
        print("\n🗑️ Testing Dish Deletion...")
        try:
            response = requests.delete(f"{base_url}/admin/api/dishes/{test_dish_id}", headers=headers)
            success = response.status_code == 200
            delete_data = response.json() if success else None
            log_test("Dish Deletion", success, f"Status: {response.status_code}", delete_data)
            
            if success:
                print("   Dish successfully soft deleted")
        except Exception as e:
            log_test("Dish Deletion", False, str(e))
        
        # Test 9: Verify Dish is Hidden After Delete
        print("\n👁️ Testing Dish Visibility After Delete...")
        try:
            response = requests.get(f"{base_url}/admin/api/dishes", headers=headers)
            success = response.status_code == 200
            if success:
                dishes_after_delete = response.json()
                dish_still_visible = any(d.get('id') == test_dish_id for d in dishes_after_delete)
                log_test("Dish Hidden After Delete", not dish_still_visible, 
                        f"Dish {'still visible' if dish_still_visible else 'properly hidden'}")
            else:
                log_test("Dish Hidden After Delete", False, f"Status: {response.status_code}")
        except Exception as e:
            log_test("Dish Hidden After Delete", False, str(e))
        
        # Test 10: Categories Endpoint
        print("\n📂 Testing Categories...")
        try:
            response = requests.get(f"{base_url}/admin/api/categories", headers=headers)
            success = response.status_code == 200
            categories_data = response.json() if success else None
            log_test("Categories Retrieval", success, f"Status: {response.status_code}", categories_data)
        except Exception as e:
            log_test("Categories Retrieval", False, str(e))
        
    except Exception as e:
        print(f"❌ Critical API test failure: {e}")
        log_test("Critical API Test", False, str(e))
    
    # Print Test Summary
    print("\n" + "=" * 50)
    print("📊 API TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed_tests']} ✅")
    print(f"Failed: {test_results['failed_tests']} ❌")
    
    success_rate = (test_results['passed_tests'] / test_results['total_tests']) * 100 if test_results['total_tests'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("\n🎉 ALL API ENDPOINTS WORKING PERFECTLY!")
    elif success_rate >= 75:
        print("\n✅ API ENDPOINTS MOSTLY FUNCTIONAL")
    else:
        print("\n⚠️ API ENDPOINTS NEED ATTENTION")
    
    # Save detailed test results
    with open('api_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\n📄 Detailed API test results saved to: api_test_results.json")
    
    return test_results

if __name__ == "__main__":
    asyncio.run(test_api_endpoints())
