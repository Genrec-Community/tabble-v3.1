#!/usr/bin/env python3
"""
Script to check hotels in database
"""
import sqlite3
import sys
import os

def check_hotels():
    """Check hotels in database"""
    db_path = "Tabble.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if hotels table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='hotels'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("Hotels table does not exist!")
            return False
        
        # Get all hotels
        cursor.execute("SELECT id, hotel_name, password, phone_number FROM hotels")
        hotels = cursor.fetchall()
        
        print(f"Found {len(hotels)} hotels in database:")
        for hotel_id, hotel_name, password, phone_number in hotels:
            print(f"  ID: {hotel_id}, Name: {hotel_name}, Password: {password}, Phone: {phone_number}")
        
        return True
        
    except Exception as e:
        print(f"Error checking hotels: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = check_hotels()
    sys.exit(0 if success else 1)
