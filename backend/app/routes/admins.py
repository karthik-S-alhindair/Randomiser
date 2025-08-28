from fastapi import APIRouter, Depends, HTTPException, Query
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func, desc
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter()
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto") 

# ---------- Schemas ----------
class AdminOut(BaseModel):
    id: int
    username: str
    name: str | None = None
    email: str | None = None
    department: str | None = None
    station: str | None = None
    created_at: datetime | None = None
    class Config: from_attributes = True

class SuperAdminOut(BaseModel):
    id: int
    username: str
    name: str | None = None
    email: str | None = None
    created_at: datetime | None = None
    class Config: from_attributes = True

class AdminCreate(BaseModel):
    username: str
    password: str
    name: str | None = None
    email: str | None = None
    department: str | None = None
    station: str | None = None

class AdminUpdate(BaseModel):
    password: str | None = None
    name: str | None = None
    email: str | None = None
    department: str | None = None
    station: str | None = None

class SuperAdminUpdate(BaseModel):
    password: str | None = None
    name: str | None = None
    email: str | None = None

# ---------- List only Admins (kept for compatibility) ----------
@router.get("", response_model=dict)
def list_admins(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    q = select(models.Admin)
    if search:
        s = f"%{search}%"
        q = q.where(or_(models.Admin.username.like(s),
                        models.Admin.name.like(s),
                        models.Admin.email.like(s)))
    total = db.execute(select(func.count()).select_from(q.subquery())).scalar() or 0
    q = q.order_by(desc(models.Admin.created_at)).offset((page - 1) * page_size).limit(page_size)
    items = db.execute(q).scalars().all()
    return {
        "items": [AdminOut.model_validate(x) for x in items],
        "total": total, "page": page, "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

# ---------- Combined list: Superadmins + Admins ----------
@router.get("/combined", response_model=dict)
def list_admins_and_superadmins(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    # Get admins
    qa = select(models.Admin)
    qs = select(models.SuperAdmin)
    if search:
        s = f"%{search}%"
        qa = qa.where(or_(models.Admin.username.like(s),
                          models.Admin.name.like(s),
                          models.Admin.email.like(s)))
        qs = qs.where(or_(models.SuperAdmin.username.like(s),
                          models.SuperAdmin.name.like(s),
                          models.SuperAdmin.email.like(s)))

    admins = [ {
        "id": a.id, "username": a.username, "name": a.name, "email": a.email,
        "role": "admin", "department": a.department, "station": a.station,
        "created_at": a.created_at.isoformat() if a.created_at else None
    } for a in db.execute(qa).scalars().all() ]

    supers = [ {
        "id": s.id, "username": s.username, "name": s.name, "email": s.email,
        "role": "superadmin", "department": None, "station": None,
        "created_at": s.created_at.isoformat() if s.created_at else None
    } for s in db.execute(qs).scalars().all() ]

    rows = admins + supers
    rows.sort(key=lambda r: (r["created_at"] or ""), reverse=True)  # newest first
    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": rows[start:end], "total": total,
        "page": page, "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

# ---------- Create Admin ----------
@router.post("", response_model=AdminOut, status_code=201)
def create_admin(payload: AdminCreate, db: Session = Depends(get_db)):
    exists = db.execute(select(models.Admin).where(models.Admin.username == payload.username)).scalar()
    if exists: raise HTTPException(status_code=409, detail="Username already exists")
    admin = models.Admin(
        username=payload.username,
        hashed_password=pwd.hash(payload.password),
        name=payload.name, email=payload.email,
        department=payload.department, station=payload.station,
    )
    db.add(admin); db.commit(); db.refresh(admin)
    return AdminOut.model_validate(admin)

# ---------- Update Admin ----------
@router.put("/{admin_id}", response_model=AdminOut)
def update_admin(admin_id: int, payload: AdminUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.Admin, admin_id)
    if not obj: raise HTTPException(status_code=404, detail="Admin not found")
    if payload.password: obj.hashed_password = pwd.hash(payload.password)
    for f in ("name","email","department","station"):
        v = getattr(payload, f)
        if v is not None: setattr(obj, f, v)
    db.commit(); db.refresh(obj)
    return AdminOut.model_validate(obj)

# ---------- Delete Admin ----------
@router.delete("/{admin_id}", response_model=dict)
def delete_admin(admin_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Admin, admin_id)
    if not obj: raise HTTPException(status_code=404, detail="Admin not found")
    db.delete(obj); db.commit()
    return {"ok": True}

# ---------- Superadmin edits (optional) ----------
@router.put("/super/{sa_id}", response_model=SuperAdminOut)
def update_superadmin(sa_id: int, payload: SuperAdminUpdate, db: Session = Depends(get_db)):
    obj = db.get(models.SuperAdmin, sa_id)
    if not obj: raise HTTPException(status_code=404, detail="Superadmin not found")
    if payload.password: obj.hashed_password = "plain:" + payload.password
    for f in ("name","email"):
        v = getattr(payload, f)
        if v is not None: setattr(obj, f, v)
    db.commit(); db.refresh(obj)
    return SuperAdminOut.model_validate(obj)

@router.delete("/super/{sa_id}", response_model=dict)
def delete_superadmin(sa_id: int, db: Session = Depends(get_db)):
    # prevent deleting the last superadmin
    total = db.execute(select(func.count(models.SuperAdmin.id))).scalar() or 0
    if total <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last superadmin")
    obj = db.get(models.SuperAdmin, sa_id)
    if not obj: raise HTTPException(status_code=404, detail="Superadmin not found")
    db.delete(obj); db.commit()
    return {"ok": True}
