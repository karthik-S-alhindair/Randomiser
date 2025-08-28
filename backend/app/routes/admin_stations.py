# --- NEW FILE ---
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/admin/stations", tags=["admin:stations"])

# ---------- Schemas ----------
class StationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: str = Field(..., min_length=1, max_length=10)
    is_active: bool = True

class StationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=10)
    is_active: Optional[bool] = None

class StationOut(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool
    class Config:
        from_attributes = True

# ---------- Routes ----------
@router.get("", response_model=dict)
def list_stations(
    q: str | None = None,
    page: int = 1,
    per_page: int = 8,
    only_active: bool = False,
    db: Session = Depends(get_db),
):
    qry = select(models.Station)
    if q:
        like = f"%{q.strip()}%"
        qry = qry.where(or_(models.Station.name.ilike(like),
                            models.Station.code.ilike(like)))
    if only_active:
        qry = qry.where(models.Station.is_active.is_(True))
    total = db.scalar(select(func.count()).select_from(qry.subquery()))
    items = db.scalars(qry.order_by(models.Station.name.asc())
                           .offset((page - 1) * per_page)
                           .limit(per_page)).all()
    return {
        "page": page,
        "per_page": per_page,
        "total": total or 0,
        "items": [StationOut.model_validate(s).model_dump() for s in items],
    }

@router.post("", response_model=StationOut, status_code=201)
def create_station(payload: StationCreate, db: Session = Depends(get_db)):
    exists = db.scalar(select(func.count()).where(
        or_(models.Station.name == payload.name, models.Station.code == payload.code)
    ))
    if exists:
        raise HTTPException(status_code=400, detail="Station with same name/code already exists")
    s = models.Station(name=payload.name.strip(), code=payload.code.strip().upper(),
                       is_active=payload.is_active)
    db.add(s); db.commit(); db.refresh(s)
    return s

@router.patch("/{id}", response_model=StationOut)
def update_station(id: int, payload: StationUpdate, db: Session = Depends(get_db)):
    s = db.get(models.Station, id)
    if not s:
        raise HTTPException(status_code=404, detail="Station not found")
    if payload.name is not None:
        s.name = payload.name.strip()
    if payload.code is not None:
        s.code = payload.code.strip().upper()
    if payload.is_active is not None:
        s.is_active = payload.is_active
    db.commit(); db.refresh(s)
    return s

@router.patch("/{id}/active", response_model=StationOut)
def toggle_station_active(id: int, is_active: bool, db: Session = Depends(get_db)):
    s = db.get(models.Station, id)
    if not s:
        raise HTTPException(status_code=404, detail="Station not found")
    s.is_active = bool(is_active)
    db.commit(); db.refresh(s)
    return s

@router.delete("/{id}", status_code=204)
def delete_station(id: int, db: Session = Depends(get_db)):
    s = db.get(models.Station, id)
    if not s:
        raise HTTPException(status_code=404, detail="Station not found")
    db.delete(s); db.commit()
    return None
