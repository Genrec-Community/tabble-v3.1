#!/usr/bin/env python3
"""
Script to update hotels table with phone numbers
"""
import sqlite3
import random
import sys
import os

# Add the app directory to the Python path to import our configuration
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def update_hotels_phone_numbers():
    """Update hotels table to add phone numbers"""
    # Use centralized database configuration
    try:
        from config.database_config import get_sqlite_database_path
        db_path = get_sqlite_database_path()
    except ImportError:
        # Fallback to environment variable or default
        from dotenv import load_dotenv
        load_dotenv()
        db_path = os.getenv("SQLITE_DATABASE_PATH", "Tabble.db")
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if phone_number column exists
        cursor.execute("PRAGMA table_info(hotels)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'phone_number' not in columns:
            print("Adding phone_number column to hotels table...")
            cursor.execute("ALTER TABLE hotels ADD COLUMN phone_number TEXT")
            conn.commit()
        
        # Get all hotels without phone numbers
        cursor.execute("SELECT id, hotel_name FROM hotels WHERE phone_number IS NULL OR phone_number = ''")
        hotels_without_phone = cursor.fetchall()
        
        if not hotels_without_phone:
            print("All hotels already have phone numbers.")
            return True
        
        print(f"Found {len(hotels_without_phone)} hotels without phone numbers. Updating...")
        
        for hotel_id, hotel_name in hotels_without_phone:
            if hotel_name == "anifa":
                phone_number = "9361899061"
            else:
                # Generate random 10-digit phone number starting with 9
                phone_number = "9" + "".join([str(random.randint(0, 9)) for _ in range(9)])
            
            cursor.execute(
                "UPDATE hotels SET phone_number = ? WHERE id = ?",
                (phone_number, hotel_id)
            )
            print(f"Updated {hotel_name}: {phone_number}")
        
        conn.commit()
        print("Successfully updated all hotel phone numbers!")
        
        # Verify the updates
        cursor.execute("SELECT hotel_name, phone_number FROM hotels")
        all_hotels = cursor.fetchall()
        print("\nCurrent hotels and phone numbers:")
        for hotel_name, phone_number in all_hotels:
            print(f"  {hotel_name}: {phone_number}")
        
        return True
        
    except Exception as e:
        print(f"Error updating hotels: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = update_hotels_phone_numbers()
    sys.exit(0 if success else 1)
