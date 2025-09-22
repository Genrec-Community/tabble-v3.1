"""
Database adapter that supports both SQLite and Supabase
"""
import os
from typing import Dict, List, Optional, Any, Union
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from .database import SessionLocal, Hotel, Dish, Person, Order, OrderItem, Table, Feedback, LoyaltyProgram, SelectionOffer, Settings, OtpRequest
from .supabase_config import get_supabase_client, get_supabase_service_client

# Load environment variables
load_dotenv()

class DatabaseAdapter:
    """Adapter that provides a unified interface for both SQLite and Supabase"""
    
    def __init__(self):
        self.database_type = os.getenv("DATABASE_TYPE", "sqlite").lower()
        self.use_supabase = self.database_type == "supabase"
    
    def get_session(self):
        """Get database session - returns SQLAlchemy session for SQLite, None for Supabase"""
        if self.use_supabase:
            return None
        else:
            return SessionLocal()
    
    def get_supabase_client(self):
        """Get Supabase client if using Supabase"""
        if self.use_supabase:
            return get_supabase_client()
        return None
    
    # Hotel operations
    def get_hotels(self) -> List[Dict]:
        """Get all hotels"""
        if self.use_supabase:
            supabase = get_supabase_client()
            result = supabase.table("hotels").select("*").execute()
            return result.data
        else:
            db = SessionLocal()
            try:
                hotels = db.query(Hotel).all()
                return [
                    {
                        "id": hotel.id,
                        "hotel_name": hotel.hotel_name,
                        "password": hotel.password,
                        "phone_number": hotel.phone_number,
                        "created_at": hotel.created_at.isoformat() if hotel.created_at else None,
                        "updated_at": hotel.updated_at.isoformat() if hotel.updated_at else None
                    }
                    for hotel in hotels
                ]
            finally:
                db.close()
    
    def get_hotel_by_id(self, hotel_id: int) -> Optional[Dict]:
        """Get hotel by ID"""
        if self.use_supabase:
            supabase = get_supabase_client()
            result = supabase.table("hotels").select("*").eq("id", hotel_id).execute()
            return result.data[0] if result.data else None
        else:
            db = SessionLocal()
            try:
                hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
                if hotel:
                    return {
                        "id": hotel.id,
                        "hotel_name": hotel.hotel_name,
                        "password": hotel.password,
                        "phone_number": hotel.phone_number,
                        "created_at": hotel.created_at.isoformat() if hotel.created_at else None,
                        "updated_at": hotel.updated_at.isoformat() if hotel.updated_at else None
                    }
                return None
            finally:
                db.close()
    
    def authenticate_hotel(self, hotel_name: str, password: str) -> Optional[int]:
        """Authenticate hotel and return hotel_id"""
        if self.use_supabase:
            supabase = get_supabase_client()
            result = supabase.table("hotels").select("id").eq("hotel_name", hotel_name).eq("password", password).execute()
            return result.data[0]["id"] if result.data else None
        else:
            db = SessionLocal()
            try:
                hotel = db.query(Hotel).filter(Hotel.hotel_name == hotel_name, Hotel.password == password).first()
                return hotel.id if hotel else None
            finally:
                db.close()
    
    # Dish operations
    def get_dishes_by_hotel(self, hotel_id: int) -> List[Dict]:
        """Get all dishes for a hotel"""
        if self.use_supabase:
            supabase = get_supabase_client()
            result = supabase.table("dishes").select("*").eq("hotel_id", hotel_id).execute()
            return result.data
        else:
            db = SessionLocal()
            try:
                dishes = db.query(Dish).filter(Dish.hotel_id == hotel_id).all()
                return [
                    {
                        "id": dish.id,
                        "hotel_id": dish.hotel_id,
                        "name": dish.name,
                        "description": dish.description,
                        "category": dish.category,
                        "price": dish.price,
                        "quantity": dish.quantity,
                        "image_path": dish.image_path,
                        "discount": dish.discount,
                        "is_offer": dish.is_offer,
                        "is_special": dish.is_special,
                        "is_vegetarian": dish.is_vegetarian,
                        "visibility": getattr(dish, 'visibility', 1),
                        "created_at": dish.created_at.isoformat() if dish.created_at else None,
                        "updated_at": dish.updated_at.isoformat() if dish.updated_at else None
                    }
                    for dish in dishes
                ]
            finally:
                db.close()
    
    def create_dish(self, dish_data: Dict) -> Dict:
        """Create a new dish"""
        if self.use_supabase:
            supabase = get_supabase_service_client()
            result = supabase.table("dishes").insert(dish_data).execute()
            return result.data[0]
        else:
            db = SessionLocal()
            try:
                dish = Dish(**dish_data)
                db.add(dish)
                db.commit()
                db.refresh(dish)
                return {
                    "id": dish.id,
                    "hotel_id": dish.hotel_id,
                    "name": dish.name,
                    "description": dish.description,
                    "category": dish.category,
                    "price": dish.price,
                    "quantity": dish.quantity,
                    "image_path": dish.image_path,
                    "discount": dish.discount,
                    "is_offer": dish.is_offer,
                    "is_special": dish.is_special,
                    "is_vegetarian": dish.is_vegetarian,
                    "visibility": getattr(dish, 'visibility', 1),
                    "created_at": dish.created_at.isoformat() if dish.created_at else None,
                    "updated_at": dish.updated_at.isoformat() if dish.updated_at else None
                }
            finally:
                db.close()
    
    def update_dish(self, dish_id: int, hotel_id: int, dish_data: Dict) -> Optional[Dict]:
        """Update a dish"""
        if self.use_supabase:
            supabase = get_supabase_service_client()
            result = supabase.table("dishes").update(dish_data).eq("id", dish_id).eq("hotel_id", hotel_id).execute()
            return result.data[0] if result.data else None
        else:
            db = SessionLocal()
            try:
                dish = db.query(Dish).filter(Dish.id == dish_id, Dish.hotel_id == hotel_id).first()
                if dish:
                    for key, value in dish_data.items():
                        setattr(dish, key, value)
                    db.commit()
                    db.refresh(dish)
                    return {
                        "id": dish.id,
                        "hotel_id": dish.hotel_id,
                        "name": dish.name,
                        "description": dish.description,
                        "category": dish.category,
                        "price": dish.price,
                        "quantity": dish.quantity,
                        "image_path": dish.image_path,
                        "discount": dish.discount,
                        "is_offer": dish.is_offer,
                        "is_special": dish.is_special,
                        "is_vegetarian": dish.is_vegetarian,
                        "visibility": getattr(dish, 'visibility', 1),
                        "created_at": dish.created_at.isoformat() if dish.created_at else None,
                        "updated_at": dish.updated_at.isoformat() if dish.updated_at else None
                    }
                return None
            finally:
                db.close()
    
    def delete_dish(self, dish_id: int, hotel_id: int) -> bool:
        """Delete a dish"""
        if self.use_supabase:
            supabase = get_supabase_service_client()
            result = supabase.table("dishes").delete().eq("id", dish_id).eq("hotel_id", hotel_id).execute()
            return len(result.data) > 0
        else:
            db = SessionLocal()
            try:
                dish = db.query(Dish).filter(Dish.id == dish_id, Dish.hotel_id == hotel_id).first()
                if dish:
                    db.delete(dish)
                    db.commit()
                    return True
                return False
            finally:
                db.close()

# Global database adapter instance
db_adapter = DatabaseAdapter()

def get_database_adapter() -> DatabaseAdapter:
    """Get the global database adapter instance"""
    return db_adapter
