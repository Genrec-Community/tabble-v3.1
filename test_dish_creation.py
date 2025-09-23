#!/usr/bin/env python3
"""Test dish creation directly"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from database_adapter import get_database_adapter
from datetime import datetime, timezone

def test_dish_creation():
    db = get_database_adapter()
    
    # Test data
    dish_data = {
        'hotel_id': 1,
        'name': 'Direct Test Dish',
        'description': 'Testing direct creation',
        'category': '["Test"]',
        'price': 12.99,
        'quantity': 5,
        'discount': 0,
        'is_offer': 0,
        'is_special': 0,
        'is_vegetarian': 1,
        'visibility': 1,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    try:
        result = db.create_dish(dish_data)
        print('✅ Created dish:', result)
        
        # Verify it was created by fetching dishes
        dishes = db.get_dishes_by_hotel(1)
        print(f'✅ Total dishes now: {len(dishes)}')
        
        # Find our created dish
        created_dish = None
        for dish in dishes:
            if dish.get('name') == 'Direct Test Dish':
                created_dish = dish
                break
        
        if created_dish:
            print('✅ Found created dish in database:', created_dish.get('id'))
        else:
            print('❌ Created dish not found in database')
            
    except Exception as e:
        print(f'❌ Error creating dish: {e}')

if __name__ == "__main__":
    test_dish_creation()
