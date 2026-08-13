from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TableBase(BaseModel):
    table_number: int
    slot_number: int = 1
    is_occupied: bool = False
    current_order_id: Optional[int] = None
    qr_token: Optional[str] = None


class TableCreate(BaseModel):
    table_number: int
    slot_number: int = 1
    is_occupied: bool = False


class TableUpdate(BaseModel):
    is_occupied: Optional[bool] = None
    current_order_id: Optional[int] = None


class Table(TableBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TableStatus(BaseModel):
    total_tables: int
    occupied_tables: int
    free_tables: int
