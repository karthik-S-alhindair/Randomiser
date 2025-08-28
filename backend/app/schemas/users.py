from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    station: Optional[str] = None
    role: Optional[str] = None
    username: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # Pydantic v2

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserCreate(UserBase):
    username: str
    password: str
    role: str = "admin"

class ChangePassword(BaseModel):
    username: str
    current: str
    new: str

class UserPage(BaseModel):
    items: List[UserOut]
    total: int
    page: int
    page_size: int
    pages: int
