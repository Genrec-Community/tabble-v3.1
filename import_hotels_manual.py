#!/usr/bin/env python3
"""
Script to manually import hotels from CSV
"""
import sqlite3
import csv
import random
import sys
import os

# Add the app directory to the Python path to import our configuration
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

def import_hotels_manual():
    """Import hotels from CSV manually"""
    # Use centralized database configuration
    try:
        from config.database_config import get_sqlite_database_path
        db_path = get_sqlite_database_path()
    except ImportError:
        # Fallback to environment variable or default
        from dotenv import load_dotenv
        load_dotenv()
        db_path = os.getenv("SQLITE_DATABASE_PATH", "Tabble.db")

    csv_path = "hotels.csv"
    
    if not os.path.exists(csv_path):
        print(f"CSV file {csv_path} not found!")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create hotels table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hotels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                hotel_name TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                phone_number TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Read from hotels.csv
        hotels_imported = 0
        print("Reading hotels.csv...")
        with open(csv_path, "r") as file:
            reader = csv.DictReader(file)
            print("CSV columns:", reader.fieldnames)
            for row in reader:
                print(f"Processing CSV row: {row}")
                
                # Check if hotel already exists
                cursor.execute("SELECT id FROM hotels WHERE hotel_name = ?", (row["hotel_name"],))
                existing = cursor.fetchone()

                if not existing:
                    # Assign phone number based on hotel name
                    if row["hotel_name"] == "anifa":
                        phone_number = "9361899061"
                    else:
                        # Generate random 10-digit phone number starting with 9
                        phone_number = "9" + "".join([str(random.randint(0, 9)) for _ in range(9)])
                    
                    cursor.execute("""
                        INSERT INTO hotels (hotel_name, password, phone_number)
                        VALUES (?, ?, ?)
                    """, (row["hotel_name"], row["password"], phone_number))
                    
                    hotels_imported += 1
                    print(f"Added hotel: {row['hotel_name']} with phone: {phone_number}")

        if hotels_imported > 0:
            conn.commit()
            print(f"Imported {hotels_imported} hotels from CSV")
        
        # Verify the import
        cursor.execute("SELECT id, hotel_name, password, phone_number FROM hotels")
        all_hotels = cursor.fetchall()
        print(f"\nTotal hotels in database: {len(all_hotels)}")
        for hotel_id, hotel_name, password, phone_number in all_hotels:
            print(f"  ID: {hotel_id}, Name: {hotel_name}, Password: {password}, Phone: {phone_number}")
        
        return True
        
    except Exception as e:
        print(f"Error importing hotels: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = import_hotels_manual()
    sys.exit(0 if success else 1)
