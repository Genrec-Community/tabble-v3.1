from pydantic import BaseModel, validator, field_serializer
from typing import Optional, List, Union
from datetime import datetime
import json

class DishBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str  # Keep as string - will store JSON array format
    price: float
    quantity: Optional[int] = 0  # Made optional for forms
    discount: Optional[float] = 0
    is_offer: Optional[int] = 0
    is_special: Optional[int] = 0
    is_vegetarian: Optional[int] = 1  # 1 = vegetarian, 0 = non-vegetarian
    visibility: Optional[int] = 1

class DishCreate(DishBase):
    pass

class DishUpdate(DishBase):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    image_path: Optional[str] = None
    discount: Optional[float] = None
    is_offer: Optional[int] = None
    is_special: Optional[int] = None
    is_vegetarian: Optional[int] = None
    visibility: Optional[int] = None

class Dish(DishBase):
    id: int
    image_path: Optional[str] = None
    visibility: int = 1
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Updated from orm_mode for Pydantic V2
