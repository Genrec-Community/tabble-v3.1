#!/usr/bin/env python3
"""
Manual script to populate hotels from hotels.csv into the database.
Run this once on the production server if the automatic import didn't work.
"""

import sys
import os
import csv

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.database import (
    create_tables,
    get_db,
    Hotel,
    DATABASE_URL,
    engine
)

# Import centralized database configuration
from app.config.database_config import validate_database_config


def populate_hotels():
    """Populate hotels from CSV"""
    print("Populating hotels from hotels.csv...")

    # Validate database configuration
    if not validate_database_config():
        print("❌ Database configuration validation failed!")
        sys.exit(1)

    print("✅ Database configuration validated")

    # Create tables if they don't exist
    create_tables()

    # Get database session
    db = next(get_db())

    try:
        # Check existing hotels
        existing_count = db.query(Hotel).count()
        print(f"Found {existing_count} existing hotels in database")

        if existing_count > 0:
            print("Hotels already exist. Skipping import.")
            return

        # Read hotels.csv and import
        hotels_imported = 0

        with open("hotels.csv", "r") as file:
            reader = csv.DictReader(file)
            print("CSV columns:", reader.fieldnames)

            for row in reader:
                print(f"Processing: {row}")

                # Check if already exists
                existing = db.query(Hotel).filter(
                    Hotel.hotel_name == row["hotel_name"]
                ).first()

                if not existing:
                    hotel = Hotel(
                        hotel_name=row["hotel_name"],
                        password=row["password"]
                    )
                    db.add(hotel)
                    hotels_imported += 1
                    print(f"Added hotel: {row['hotel_name']}")

        db.commit()
        print(f"Successfully imported {hotels_imported} hotels")

        # Verify
        all_hotels = db.query(Hotel).all()
        print("Hotels in database:")
        for hotel in all_hotels:
            print(f"  {hotel.hotel_name}: {hotel.password}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    populate_hotels()