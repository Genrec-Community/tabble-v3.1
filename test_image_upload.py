#!/usr/bin/env python3
"""Test image upload functionality"""
import requests
import io
from PIL import Image

def create_test_image():
    """Create a simple test image"""
    # Create a simple 200x200 red image
    img = Image.new('RGB', (200, 200), color='red')
    
    # Add some text
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        draw.text((50, 90), "TEST DISH", fill='white')
    except:
        pass  # Skip text if font not available
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    return img_bytes

def test_image_upload():
    """Test uploading an image with dish creation"""
    base_url = "http://localhost:8000"
    
    # First authenticate
    auth_response = requests.post(f"{base_url}/settings/switch-hotel", 
                                 headers={'Content-Type': 'application/json'},
                                 json={
                                     'database_name': 'tabble_new',
                                     'password': 'myhotel'
                                 })
    
    if auth_response.status_code != 200:
        print(f"❌ Authentication failed: {auth_response.status_code}")
        return
    
    print("✅ Authentication successful")
    
    # Create test image
    test_image = create_test_image()
    
    # Prepare form data for dish creation with image
    files = {
        'image': ('test_dish.jpg', test_image, 'image/jpeg')
    }
    
    data = {
        'name': 'Test Dish with Image',
        'description': 'This dish has an uploaded image',
        'category': 'Test Category',
        'price': '25.99',
        'quantity': '8',
        'is_vegetarian': '1',
        'is_offer': '0',
        'is_special': '0'
    }
    
    # Create dish with image
    create_response = requests.post(f"{base_url}/admin/api/dishes",
                                   files=files,
                                   data=data)
    
    if create_response.status_code == 200:
        result = create_response.json()
        print("✅ Dish created with image successfully")
        print(f"   Dish ID: {result.get('id')}")
        print(f"   Image URL: {result.get('image_path')}")
        
        # Verify image URL is accessible
        if result.get('image_path'):
            img_response = requests.get(result['image_path'])
            if img_response.status_code == 200:
                print("✅ Image is accessible via URL")
            else:
                print(f"❌ Image not accessible: {img_response.status_code}")
        
        return result
    else:
        print(f"❌ Failed to create dish with image: {create_response.status_code}")
        print(f"   Response: {create_response.text}")
        return None

if __name__ == "__main__":
    test_image_upload()
