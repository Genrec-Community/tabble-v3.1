"""
Storage adapter that supports both local filesystem and Supabase Storage
"""
import os
import shutil
from typing import Optional, BinaryIO
from fastapi import UploadFile
from dotenv import load_dotenv
try:
    from .supabase_config import get_supabase_service_client
except ImportError:
    from app.supabase_config import get_supabase_service_client

# Load environment variables
load_dotenv()

class StorageAdapter:
    """Adapter that provides a unified interface for both local and Supabase storage"""
    
    def __init__(self):
        self.database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
        self.use_supabase = self.database_type == "supabase"
        self.bucket_name = "tabble-images"
    
    def upload_image(self, file: UploadFile, hotel_name: str, image_type: str, item_id: Optional[int] = None) -> str:
        """
        Upload image and return the path/URL
        
        Args:
            file: The uploaded file
            hotel_name: Name of the hotel (for organizing images)
            image_type: Type of image ('dishes', 'logo')
            item_id: ID of the item (for dishes)
        
        Returns:
            Path or URL to the uploaded image
        """
        if self.use_supabase:
            return self._upload_to_supabase(file, hotel_name, image_type, item_id)
        else:
            return self._upload_to_local(file, hotel_name, image_type, item_id)
    
    def _upload_to_supabase(self, file: UploadFile, hotel_name: str, image_type: str, item_id: Optional[int] = None) -> str:
        """Upload image to Supabase Storage"""
        try:
            supabase = get_supabase_service_client()
            
            # Create file path in bucket
            if image_type == "dishes" and item_id:
                file_path = f"{hotel_name}/dishes/{item_id}_{file.filename}"
            elif image_type == "logo":
                file_path = f"{hotel_name}/logo/hotel_logo_{file.filename}"
            else:
                file_path = f"{hotel_name}/{image_type}/{file.filename}"
            
            # Read file content
            file_content = file.file.read()
            file.file.seek(0)  # Reset file pointer
            
            # Upload to Supabase Storage
            result = supabase.storage.from_(self.bucket_name).upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            
            if result:
                # Get public URL
                public_url = supabase.storage.from_(self.bucket_name).get_public_url(file_path)
                return public_url
            else:
                raise Exception("Failed to upload to Supabase Storage")
                
        except Exception as e:
            print(f"Error uploading to Supabase: {e}")
            raise
    
    def _upload_to_local(self, file: UploadFile, hotel_name: str, image_type: str, item_id: Optional[int] = None) -> str:
        """Upload image to local filesystem"""
        try:
            # Create directory structure
            if image_type == "dishes":
                base_dir = f"app/static/images/dishes/{hotel_name}"
                if item_id:
                    filename = f"{item_id}_{file.filename}"
                    url_path = f"/static/images/dishes/{hotel_name}/{filename}"
                else:
                    filename = file.filename
                    url_path = f"/static/images/dishes/{hotel_name}/{filename}"
            elif image_type == "logo":
                base_dir = f"app/static/images/logo/{hotel_name}"
                filename = f"hotel_logo_{file.filename}"
                url_path = f"/static/images/logo/{hotel_name}/{filename}"
            else:
                base_dir = f"app/static/images/{image_type}/{hotel_name}"
                filename = file.filename
                url_path = f"/static/images/{image_type}/{hotel_name}/{filename}"
            
            # Create directory if it doesn't exist
            os.makedirs(base_dir, exist_ok=True)
            
            # Save file
            file_path = os.path.join(base_dir, filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            return url_path
            
        except Exception as e:
            print(f"Error uploading to local storage: {e}")
            raise
    
    def delete_image(self, image_path: str) -> bool:
        """Delete an image"""
        if self.use_supabase:
            return self._delete_from_supabase(image_path)
        else:
            return self._delete_from_local(image_path)
    
    def _delete_from_supabase(self, image_url: str) -> bool:
        """Delete image from Supabase Storage"""
        try:
            supabase = get_supabase_service_client()
            
            # Extract file path from URL
            # URL format: https://knuodzevjolsdgrloctl.supabase.co/storage/v1/object/public/tabble-images/path/to/file
            if "/storage/v1/object/public/" in image_url:
                file_path = image_url.split(f"/storage/v1/object/public/{self.bucket_name}/")[1]
                
                result = supabase.storage.from_(self.bucket_name).remove([file_path])
                return len(result) > 0
            
            return False
            
        except Exception as e:
            print(f"Error deleting from Supabase: {e}")
            return False
    
    def _delete_from_local(self, image_path: str) -> bool:
        """Delete image from local filesystem"""
        try:
            # Convert URL path to file path
            if image_path.startswith("/static/"):
                file_path = image_path.replace("/static/", "app/static/")
                if os.path.exists(file_path):
                    os.remove(file_path)
                    return True
            return False
            
        except Exception as e:
            print(f"Error deleting from local storage: {e}")
            return False
    
    def get_image_url(self, image_path: str) -> str:
        """Get the full URL for an image"""
        if self.use_supabase:
            # If it's already a full URL, return as is
            if image_path.startswith("http"):
                return image_path
            # Otherwise, construct the Supabase URL
            supabase = get_supabase_service_client()
            return supabase.storage.from_(self.bucket_name).get_public_url(image_path)
        else:
            # For local storage, return the path as is (it's already a URL path)
            return image_path

# Global storage adapter instance
storage_adapter = StorageAdapter()

def get_storage_adapter() -> StorageAdapter:
    """Get the global storage adapter instance"""
    return storage_adapter
