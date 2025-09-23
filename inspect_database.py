#!/usr/bin/env python3
"""
Script to inspect the current SQLite database structure and data
"""
import sqlite3
import os
import sys

# Add the app directory to the Python path to import our configuration
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def inspect_database():
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
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("=== DATABASE STRUCTURE ===")
        print(f"Tables found: {len(tables)}")
        for table in tables:
            print(f"- {table[0]}")
        
        print("\n=== TABLE SCHEMAS ===")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            print(f"\n{table_name}:")
            for col in columns:
                print(f"  {col[1]} {col[2]} {'NOT NULL' if col[3] else 'NULL'} {'PRIMARY KEY' if col[5] else ''}")
        
        print("\n=== DATA COUNTS ===")
        for table in tables:
            table_name = table[0]
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            count = cursor.fetchone()[0]
            print(f"{table_name}: {count} records")
        
        # Sample data from key tables
        print("\n=== SAMPLE DATA ===")
        
        # Hotels
        cursor.execute("SELECT id, hotel_name, phone_number FROM hotels LIMIT 5;")
        hotels = cursor.fetchall()
        print(f"\nHotels (first 5):")
        for hotel in hotels:
            print(f"  ID: {hotel[0]}, Name: {hotel[1]}, Phone: {hotel[2]}")
        
        # Dishes with image paths
        cursor.execute("SELECT id, hotel_id, name, image_path FROM dishes WHERE image_path IS NOT NULL LIMIT 5;")
        dishes = cursor.fetchall()
        print(f"\nDishes with images (first 5):")
        for dish in dishes:
            print(f"  ID: {dish[0]}, Hotel: {dish[1]}, Name: {dish[2]}, Image: {dish[3]}")
        
        # Settings with logo paths
        cursor.execute("SELECT id, hotel_id, hotel_name, logo_path FROM settings WHERE logo_path IS NOT NULL LIMIT 5;")
        settings = cursor.fetchall()
        print(f"\nSettings with logos (first 5):")
        for setting in settings:
            print(f"  ID: {setting[0]}, Hotel: {setting[1]}, Name: {setting[2]}, Logo: {setting[3]}")
            
    except Exception as e:
        print(f"Error inspecting database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    inspect_database()
