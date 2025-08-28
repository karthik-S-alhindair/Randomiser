from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from passlib.context import CryptContext

from app.database import get_db
from app import models

try:
    from app.schemas import UserOut, UserUpdate, UserCreate, ChangePassword, UserPage
except ImportError:
    from app.schemas.users import UserOut, UserUpdate, UserCreate, ChangePassword, UserPage

from typing import Optional
from pydantic import BaseModel

router = APIRouter()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# -------- Login (unchanged) --------
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    stmt = select(models.User).where(models.User.username == payload.username)
    user = db.execute(stmt).scalars().first()
    if not user or not pwd_ctx.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "role": user.role,
        "username": user.username,
        "name": user.name or "",
        "department": getattr(user, "department", None) or user.designation or ""
    }
# -------- Create admin/user --------
@router.post("", response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    exists = db.scalar(
        select(func.count()).select_from(models.User).where(models.User.username == payload.username)
    )
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = models.User(
        username=payload.username,
        hashed_password=pwd_ctx.hash(payload.password),
        role=(payload.role or "admin").lower(),
        name=payload.name,
        designation=payload.designation,
        email=payload.email,
        phone=payload.phone,
        station=payload.station,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# -------- Change password (by username) --------
@router.post("/change-password")
def change_password(payload: ChangePassword, db: Session = Depends(get_db)):
    user = db.execute(select(models.User).where(models.User.username == payload.username)).scalars().first()
    if not user or not pwd_ctx.verify(payload.current, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = pwd_ctx.hash(payload.new)
    db.add(user)
    db.commit()
    return {"ok": True}

# -------- Paginated list (admins only when roles="admin,superadmin") --------
@router.get("", response_model=UserPage)
def list_users(
    page: int = 1,
    page_size: int = 10,
    roles: Optional[str] = None,
    db: Session = Depends(get_db),
):
    page = max(1, page)
    page_size = max(1, min(page_size, 100))

    stmt = select(models.User)
    if roles:
        role_list = [r.strip().lower() for r in roles.split(",") if r.strip()]
        if role_list:
            stmt = stmt.where(models.User.role.in_(role_list))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    pages = max(1, (total + page_size - 1) // page_size)
    if page > pages: page = pages

    items = db.execute(
        stmt.order_by(models.User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}

# -------- Get / Update / Delete (unchanged) --------
@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    pwd = data.pop("password", None)
    if pwd: user.hashed_password = pwd_ctx.hash(pwd)
    for k, v in data.items(): setattr(user, k, v)
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(models.User, user_id)
    if not user: raise HTTPException(status_code=404, detail="User not found")
    db.delete(user); db.commit()
    return None
