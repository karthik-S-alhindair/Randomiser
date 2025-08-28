# app/routes/shifts.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

# ---------- Schemas ----------
class ShiftIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    is_active: bool = True

class ShiftUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None

class ShiftToggle(BaseModel):
    is_active: bool

class ShiftOut(BaseModel):
    id: int
    name: str
    is_active: bool
    created_at: str

    @classmethod
    def from_orm_(cls, s: models.Shift):
        return cls(
            id=s.id,
            name=s.name,
            is_active=s.is_active,
            created_at=s.created_at.isoformat() if s.created_at else "",
        )

class PageOut(BaseModel):
    items: list[ShiftOut]
    total: int
    page: int
    per_page: int

# ---------- Endpoints ----------
@router.get("", response_model=PageOut)
def list_shifts(
    q: str | None = None,
    page: int = 1,
    per_page: int = 8,
    only_active: bool = False,
    db: Session = Depends(get_db),
):
    stmt = select(models.Shift)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(models.Shift.name.ilike(like)))
    if only_active:
        stmt = stmt.where(models.Shift.is_active.is_(True))

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    stmt = stmt.order_by(models.Shift.created_at.desc()) \
               .offset((page - 1) * per_page).limit(per_page)

    items = db.scalars(stmt).all()
    return PageOut(
        items=[ShiftOut.from_orm_(s) for s in items],
        total=total or 0,
        page=page,
        per_page=per_page,
    )

@router.post("", response_model=ShiftOut)
def create_shift(payload: ShiftIn, db: Session = Depends(get_db)):
    exists = db.scalar(select(models.Shift).where(models.Shift.name.ilike(payload.name)))
    if exists:
        raise HTTPException(status_code=400, detail="Shift name already exists")
    s = models.Shift(name=payload.name.strip(), is_active=payload.is_active)
    db.add(s)
    db.commit()
    db.refresh(s)
    return ShiftOut.from_orm_(s)

@router.patch("/{sid}", response_model=ShiftOut)
def update_shift(sid: int, payload: ShiftUpdate, db: Session = Depends(get_db)):
    s = db.get(models.Shift, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Shift not found")

    if payload.name is not None:
        name = payload.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name cannot be blank")
        clash = db.scalar(
            select(models.Shift).where(models.Shift.id != sid,
                                       models.Shift.name.ilike(name))
        )
        if clash:
            raise HTTPException(status_code=400, detail="Shift name already exists")
        s.name = name

    if payload.is_active is not None:
        s.is_active = bool(payload.is_active)

    db.commit()
    db.refresh(s)
    return ShiftOut.from_orm_(s)

@router.patch("/{sid}/active", response_model=ShiftOut)
def toggle_shift_active(sid: int, payload: ShiftToggle, db: Session = Depends(get_db)):
    s = db.get(models.Shift, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Shift not found")
    s.is_active = bool(payload.is_active)
    db.commit()
    db.refresh(s)
    return ShiftOut.from_orm_(s)

@router.delete("/{sid}", status_code=204)
def delete_shift(sid: int, db: Session = Depends(get_db)):
    s = db.get(models.Shift, sid)
    if not s:
        raise HTTPException(status_code=404, detail="Shift not found")
    db.delete(s)
    db.commit()
