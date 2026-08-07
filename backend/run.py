import uvicorn
import os

from app.utils.network import get_lan_ip


if __name__ == "__main__":
    # Create static/images directory if it doesn't exist
    os.makedirs("app/static/images", exist_ok=True)

    # Check for force reset flag

    # Get the IP address
    ip_address = get_lan_ip()

    # Display access information
    print("\n" + "=" * 50)

    print(f"Access from other devices at: http://{ip_address}:8001")
    print("=" * 50 + "\n")

    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)