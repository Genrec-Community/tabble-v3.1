#!/usr/bin/env python3
"""
Script to set up the Supabase database schema
Creates all tables with proper relationships and constraints
"""
import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def execute_sql_query(sql_query: str):
    """Execute SQL query using Supabase Management API"""
    project_id = "knuodzevjolsdgrloctl"

    url = f"https://api.supabase.com/v1/projects/{project_id}/database/query"
    headers = {
        "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
        "Content-Type": "application/json"
    }

    data = {"query": sql_query}

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"SQL execution failed: {response.status_code} - {response.text}")

def create_tables():
    """Create all tables in Supabase"""

    # SQL to create all tables with proper relationships
    create_tables_sql = """
    -- Create hotels table
    CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        hotel_name VARCHAR UNIQUE NOT NULL,
        password VARCHAR NOT NULL,
        phone_number VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create dishes table
    CREATE TABLE IF NOT EXISTS dishes (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        name VARCHAR,
        description TEXT,
        category VARCHAR,
        price FLOAT,
        quantity INTEGER DEFAULT 0,
        image_path VARCHAR,
        discount FLOAT DEFAULT 0,
        is_offer INTEGER DEFAULT 0,
        is_special INTEGER DEFAULT 0,
        is_vegetarian INTEGER DEFAULT 1,
        visibility INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create persons table
    CREATE TABLE IF NOT EXISTS persons (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        username VARCHAR,
        password VARCHAR,
        phone_number VARCHAR,
        visit_count INTEGER DEFAULT 0,
        last_visit TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hotel_id, username),
        UNIQUE(hotel_id, phone_number)
    );

    -- Create orders table
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        table_number INTEGER,
        unique_id VARCHAR,
        person_id INTEGER REFERENCES persons(id) ON DELETE SET NULL,
        status VARCHAR DEFAULT 'pending',
        total_amount FLOAT,
        subtotal_amount FLOAT,
        loyalty_discount_amount FLOAT DEFAULT 0,
        selection_offer_discount_amount FLOAT DEFAULT 0,
        loyalty_discount_percentage FLOAT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create order_items table
    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        price FLOAT,
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create tables table
    CREATE TABLE IF NOT EXISTS tables (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        table_number INTEGER,
        is_occupied BOOLEAN DEFAULT FALSE,
        current_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hotel_id, table_number)
    );

    -- Create feedback table
    CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        person_id INTEGER REFERENCES persons(id) ON DELETE SET NULL,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create loyalty_tiers table
    CREATE TABLE IF NOT EXISTS loyalty_tiers (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        visit_count INTEGER,
        discount_percentage FLOAT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hotel_id, visit_count)
    );

    -- Create selection_offers table
    CREATE TABLE IF NOT EXISTS selection_offers (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        min_amount FLOAT,
        discount_amount FLOAT,
        is_active BOOLEAN DEFAULT TRUE,
        description VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create settings table
    CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        hotel_name VARCHAR NOT NULL,
        address VARCHAR,
        contact_number VARCHAR,
        email VARCHAR,
        tax_id VARCHAR,
        logo_path VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(hotel_id)
    );

    -- Create otp_requests table
    CREATE TABLE IF NOT EXISTS otp_requests (
        id VARCHAR PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        phone_number VARCHAR NOT NULL,
        otp_code VARCHAR NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        verified BOOLEAN DEFAULT FALSE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_dishes_hotel_id ON dishes(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_persons_hotel_id ON persons(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_orders_hotel_id ON orders(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_hotel_id ON order_items(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_tables_hotel_id ON tables(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_hotel_id ON feedback(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_loyalty_tiers_hotel_id ON loyalty_tiers(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_selection_offers_hotel_id ON selection_offers(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_settings_hotel_id ON settings(hotel_id);
    CREATE INDEX IF NOT EXISTS idx_otp_requests_hotel_id ON otp_requests(hotel_id);
    """
    
    try:
        # Execute the SQL to create tables
        result = execute_sql_query(create_tables_sql)
        print("✅ Database schema created successfully!")
        return True
    except Exception as e:
        print(f"❌ Error creating database schema: {e}")
        return False

def create_storage_bucket():
    """Create storage bucket for images"""
    try:
        # Create bucket for images using Management API
        project_id = "knuodzevjolsdgrloctl"
        bucket_name = "tabble-images"

        url = f"https://api.supabase.com/v1/projects/{project_id}/storage/buckets"
        headers = {
            "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_KEY')}",
            "Content-Type": "application/json"
        }

        # Check if bucket exists first
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            buckets = response.json()
            bucket_exists = any(bucket.get('name') == bucket_name for bucket in buckets)

            if bucket_exists:
                print(f"ℹ️ Storage bucket '{bucket_name}' already exists")
                return True

        # Create bucket
        data = {
            "name": bucket_name,
            "public": True,
            "file_size_limit": 52428800,  # 50MB
            "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif"]
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code in [200, 201]:
            print(f"✅ Storage bucket '{bucket_name}' created successfully!")
            return True
        else:
            print(f"❌ Error creating storage bucket: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error creating storage bucket: {e}")
        return False

def main():
    """Main function to set up Supabase schema"""
    try:
        print("🚀 Setting up Supabase database schema...")

        # Create tables
        if not create_tables():
            sys.exit(1)

        # Create storage bucket
        if not create_storage_bucket():
            sys.exit(1)

        print("🎉 Supabase setup completed successfully!")

    except Exception as e:
        print(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
