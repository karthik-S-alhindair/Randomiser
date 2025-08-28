from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select
from passlib.context import CryptContext
from app.database import get_db
from app import models
from passlib.context import CryptContext
from passlib.exc import UnknownHashError

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginIn(BaseModel):
    username: str
    password: str

class LoginOut(BaseModel):
    username: str
    role: str
    name: str | None = None
    department: str | None = None
    station: str | None = None

def _verify(password_plain: str, stored: str) -> bool:
    if not stored:
        return False
    # Allow dev seeds like "plain:xxx"
    if stored.startswith("plain:"):
        return password_plain == stored[6:]
    # Try hash verify; if it's not a hash, fall back to plaintext compare
    try:
        return pwd_ctx.verify(password_plain, stored)
    except UnknownHashError:
        return False

@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    u = payload.username

    # Try superadmin → admin → user
    sa = db.execute(select(models.SuperAdmin).where(models.SuperAdmin.username == u)).scalars().first()
    if sa and _verify(payload.password, sa.hashed_password):
        return {"username": sa.username, "role": "superadmin", "name": sa.name, "department": None, "station": None}

    ad = db.execute(select(models.Admin).where(models.Admin.username == u)).scalars().first()
    if ad and _verify(payload.password, ad.hashed_password):
        return {"username": ad.username, "role": "admin", "name": ad.name, "department": ad.department, "station": ad.station}

    us = db.execute(select(models.User).where(models.User.username == u)).scalars().first()
    if us and _verify(payload.password, us.hashed_password):
        if not getattr(us, "is_active", True):
            raise HTTPException(status_code=403, detail="Account disabled")
        return {"username": us.username, "role": "user", "name": us.name,
            "department": us.department, "station": us.station}

    raise HTTPException(status_code=401, detail="Invalid username or password")
