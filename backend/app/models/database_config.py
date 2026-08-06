from pydantic import BaseModel
from typing import List, Optional


class DatabaseEntry(BaseModel):
    database_name: str
    password: str


class DatabaseList(BaseModel):
    databases: List[DatabaseEntry]


class DatabaseSelectRequest(BaseModel):
    database_name: str
    password: str


class DatabaseSelectResponse(BaseModel):
    success: bool
    message: str
