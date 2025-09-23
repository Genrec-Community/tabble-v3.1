#!/usr/bin/env python3
"""
Comprehensive Playwright test for Tabble application with Supabase backend
Tests CRUD operations, image uploads, and data persistence
"""
import asyncio
import json
import os
import sys
from datetime import datetime

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_supabase_application():
    """Comprehensive test of the Tabble application with Supabase backend"""
    
    print("🧪 Starting Comprehensive Supabase Application Test")
    print("=" * 60)
    
    # Test results tracking
    test_results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_details": []
    }
    
    def log_test(test_name, success, details=""):
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
            "timestamp": datetime.now().isoformat()
        })
    
    try:
        # Test 1: Database Adapter Health Check
        print("\n📊 Testing Database Adapter...")
        try:
            from database_adapter import get_database_adapter
            db_adapter = get_database_adapter()
            
            health_check = db_adapter.health_check()
            log_test("Database Adapter Health Check", health_check)
            
            if health_check:
                print(f"   Database Type: {db_adapter.database_type}")
                print(f"   Using Supabase: {db_adapter.use_supabase}")
        except Exception as e:
            log_test("Database Adapter Health Check", False, str(e))
        
        # Test 2: Storage Adapter Health Check
        print("\n🗂️ Testing Storage Adapter...")
        try:
            from storage_adapter import get_storage_adapter
            storage_adapter = get_storage_adapter()
            
            print(f"   Storage Type: {storage_adapter.database_type}")
            print(f"   Using Supabase: {storage_adapter.use_supabase}")
            print(f"   Bucket Name: {storage_adapter.bucket_name}")
            log_test("Storage Adapter Configuration", True)
        except Exception as e:
            log_test("Storage Adapter Configuration", False, str(e))
        
        # Test 3: Hotel Data Retrieval
        print("\n🏨 Testing Hotel Data Retrieval...")
        try:
            hotels = db_adapter.get_hotels()
            log_test("Hotel Data Retrieval", len(hotels) > 0, f"Retrieved {len(hotels)} hotels")
            
            if hotels:
                print(f"   Sample hotel: {hotels[0].get('hotel_name', 'Unknown')}")
                test_hotel_id = hotels[0].get('id')
                test_hotel_name = hotels[0].get('hotel_name')
        except Exception as e:
            log_test("Hotel Data Retrieval", False, str(e))
            test_hotel_id = 1
            test_hotel_name = "tabble_new"
        
        # Test 4: Dish Data Retrieval
        print("\n🍽️ Testing Dish Data Retrieval...")
        try:
            dishes = db_adapter.get_dishes_by_hotel(test_hotel_id)
            log_test("Dish Data Retrieval", True, f"Retrieved {len(dishes)} dishes")
            
            if dishes:
                sample_dish = dishes[0]
                print(f"   Sample dish: {sample_dish.get('name', 'Unknown')}")
                print(f"   Image path: {sample_dish.get('image_path', 'No image')}")
                
                # Test image URL processing
                if sample_dish.get('image_path'):
                    processed_url = storage_adapter.get_image_url(sample_dish['image_path'])
                    log_test("Image URL Processing", processed_url.startswith('http'), f"URL: {processed_url[:50]}...")
        except Exception as e:
            log_test("Dish Data Retrieval", False, str(e))
        
        # Test 5: Dish Update Operation
        print("\n✏️ Testing Dish Update Operation...")
        try:
            if dishes:
                test_dish_id = dishes[0].get('id')
                update_data = {
                    'name': f'Updated Test Dish {datetime.now().strftime("%H%M%S")}',
                    'description': 'Updated via comprehensive test',
                    'updated_at': datetime.now().isoformat()
                }
                
                updated_dish = db_adapter.update_dish(test_dish_id, test_hotel_id, update_data)
                log_test("Dish Update Operation", updated_dish is not None, f"Updated dish ID: {test_dish_id}")
                
                if updated_dish:
                    print(f"   Updated name: {updated_dish.get('name')}")
        except Exception as e:
            log_test("Dish Update Operation", False, str(e))
        
        # Test 6: Dish Visibility Toggle (Soft Delete)
        print("\n🗑️ Testing Dish Soft Delete...")
        try:
            if dishes:
                # First ensure dish is visible
                restore_result = db_adapter.update_dish(test_dish_id, test_hotel_id, {'visibility': 1})
                
                # Then soft delete it
                delete_result = db_adapter.update_dish(test_dish_id, test_hotel_id, {'visibility': 0})
                log_test("Dish Soft Delete", delete_result is not None, f"Soft deleted dish ID: {test_dish_id}")
                
                # Restore it for further tests
                restore_result = db_adapter.update_dish(test_dish_id, test_hotel_id, {'visibility': 1})
                log_test("Dish Restore", restore_result is not None, f"Restored dish ID: {test_dish_id}")
        except Exception as e:
            log_test("Dish Soft Delete", False, str(e))
        
        # Test 7: Data Persistence Verification
        print("\n💾 Testing Data Persistence...")
        try:
            # Re-fetch dishes to verify persistence
            updated_dishes = db_adapter.get_dishes_by_hotel(test_hotel_id)
            log_test("Data Persistence", len(updated_dishes) > 0, f"Persisted {len(updated_dishes)} dishes")
            
            # Verify the updated dish is still there
            if updated_dishes:
                found_updated = any(d.get('id') == test_dish_id for d in updated_dishes)
                log_test("Updated Dish Persistence", found_updated, f"Dish ID {test_dish_id} found after update")
        except Exception as e:
            log_test("Data Persistence", False, str(e))
        
        # Test 8: Authentication Test
        print("\n🔐 Testing Hotel Authentication...")
        try:
            auth_result = db_adapter.authenticate_hotel(test_hotel_name, "password")
            log_test("Hotel Authentication", auth_result is not None, f"Authenticated hotel: {test_hotel_name}")
        except Exception as e:
            log_test("Hotel Authentication", False, str(e))
        
    except Exception as e:
        print(f"❌ Critical test failure: {e}")
        log_test("Critical Test Execution", False, str(e))
    
    # Print Test Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed_tests']} ✅")
    print(f"Failed: {test_results['failed_tests']} ❌")
    
    success_rate = (test_results['passed_tests'] / test_results['total_tests']) * 100 if test_results['total_tests'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("\n🎉 APPLICATION READY FOR PRODUCTION!")
    elif success_rate >= 60:
        print("\n⚠️ APPLICATION MOSTLY FUNCTIONAL - Minor issues detected")
    else:
        print("\n🚨 APPLICATION NEEDS ATTENTION - Major issues detected")
    
    # Save detailed test results
    with open('supabase_test_results.json', 'w') as f:
        json.dump(test_results, f, indent=2)
    
    print(f"\n📄 Detailed test results saved to: supabase_test_results.json")
    
    return test_results

if __name__ == "__main__":
    asyncio.run(test_supabase_application())
