#!/usr/bin/env python3
"""
Script to create Supabase storage bucket
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def create_storage_bucket():
    """Create storage bucket for images"""
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        
        supabase = create_client(url, key)
        bucket_name = "tabble-images"
        
        # Check if bucket already exists
        try:
            buckets = supabase.storage.list_buckets()
            bucket_exists = any(bucket.name == bucket_name for bucket in buckets)
            
            if bucket_exists:
                print(f"ℹ️ Storage bucket '{bucket_name}' already exists")
                return True
        except Exception as e:
            print(f"Warning: Could not list buckets: {e}")
        
        # Create bucket
        try:
            result = supabase.storage.create_bucket(bucket_name)
            print(f"✅ Storage bucket '{bucket_name}' created successfully!")
            return True
        except Exception as e:
            if "already exists" in str(e).lower():
                print(f"ℹ️ Storage bucket '{bucket_name}' already exists")
                return True
            else:
                print(f"❌ Error creating storage bucket: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Creating Supabase storage bucket...")
    
    if create_storage_bucket():
        print("🎉 Storage bucket setup completed!")
    else:
        print("❌ Storage bucket setup failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
