from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from passlib.context import CryptContext

from app import models
from app.database import get_db

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---------- Schemas ----------

class UserOut(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    station: Optional[str]
    department: Optional[str]
    username: Optional[str]
    designation: Optional[str]
    role: Optional[str]
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    name: str
    designation: Optional[str] = None
    email: Optional[EmailStr] = None        # optional per your rule
    phone: Optional[str] = None
    department: Optional[str] = None         # you use this in create
    station: Optional[str] = None
    username: str
    password: str
    role: Optional[str] = "user"
    is_active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    station: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class ToggleActive(BaseModel):
    is_active: bool

# ---------- Routes ----------

@router.get("", response_model=dict)
def list_users(
    q: str = Query("", description="search by name/email/username/role"),
    page: int = Query(1, ge=1),
    per_page: int = Query(8, ge=1, le=100),
    db: Session = Depends(get_db),
):
    base = select(models.User).order_by(models.User.created_at.desc())
    if q:
        like = f"%{q}%"
        base = base.where(
            or_(
                func.lower(models.User.name).like(func.lower(like)),
                func.lower(models.User.email).like(func.lower(like)),
                func.lower(models.User.username).like(func.lower(like)),
                func.lower(models.User.role).like(func.lower(like)),
            )
        )
    total = db.execute(select(func.count()).select_from(base.subquery())).scalar() or 0
    items = db.execute(base.limit(per_page).offset((page - 1) * per_page)).scalars().all()
    return {
        "items": [UserOut.model_validate(u).model_dump() for u in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }

@router.post("", response_model=UserOut)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if db.execute(select(models.User).where(models.User.username == payload.username)).scalars().first():
        raise HTTPException(status_code=409, detail="Username already exists")
    if payload.email:
        if db.execute(select(models.User).where(models.User.email == payload.email)).scalars().first():
            raise HTTPException(status_code=409, detail="Email already exists")

    user = models.User(
        name=payload.name,
        designation=payload.designation,
        email=payload.email,
        phone=payload.phone,
        username=payload.username,
        department=payload.department,
        station=payload.station,
        role="user",
        is_active=payload.is_active if payload.is_active is not None else True,
        hashed_password=pwd.hash(payload.password),   # <- correct column
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.username and payload.username != user.username:
        if db.execute(select(models.User).where(models.User.username == payload.username)).scalars().first():
            raise HTTPException(status_code=409, detail="Username already exists")
        user.username = payload.username

    if payload.email and payload.email != user.email:
        if db.execute(select(models.User).where(models.User.email == payload.email)).scalars().first():
            raise HTTPException(status_code=409, detail="Email already exists")
        user.email = payload.email

    for field in ["name", "designation", "phone", "department", "station", "role"]:
        val = getattr(payload, field)
        if val is not None:
            setattr(user, field, val)

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = pwd.hash(payload.password)   # <- use `user`, not db_user

    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/active", response_model=UserOut)
def toggle_active(user_id: int, body: ToggleActive, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = body.is_active
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}
