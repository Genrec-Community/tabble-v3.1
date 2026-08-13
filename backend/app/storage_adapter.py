"""
Storage adapter for local filesystem image storage
"""
import os
import shutil
from typing import Optional
from fastapi import UploadFile

class StorageAdapter:
    """Adapter that stores images on the local filesystem"""

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
        """Delete an image from the local filesystem"""
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
        """Get the full URL for an image (local paths are already URL paths)"""
        return image_path

# Global storage adapter instance
storage_adapter = StorageAdapter()

def get_storage_adapter() -> StorageAdapter:
    """Get the global storage adapter instance"""
    return storage_adapter
