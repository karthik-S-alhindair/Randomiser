from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database import get_db
from app import models

router = APIRouter(prefix="/api/departments", tags=["departments"])

# -------- Schemas --------
class DeptOut(BaseModel):
    id: int
    name: str
    percent: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DeptCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    percent: int = Field(ge=0, le=100)
    is_active: bool = True

class DeptUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    percent: int | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None

class ToggleBody(BaseModel):
    is_active: bool

# -------- Helpers --------
def _dept_by_id(db: Session, dept_id: int) -> models.Department | None:
    return db.get(models.Department, dept_id)

# -------- Routes --------
@router.get("")
def list_departments(
    q: str = Query("", description="Search by name"),
    page: int = Query(1, ge=1),
    per_page: int = Query(8, ge=1, le=100),
    only_active: bool = Query(False),
    db: Session = Depends(get_db),
):
    stmt = select(models.Department)
    cnt = select(func.count(models.Department.id))

    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(models.Department.name.ilike(like))
        cnt = cnt.where(models.Department.name.ilike(like))

    if only_active:
        stmt = stmt.where(models.Department.is_active.is_(True))
        cnt = cnt.where(models.Department.is_active.is_(True))

    total = db.scalar(cnt) or 0
    items = db.execute(
        stmt.order_by(models.Department.created_at.desc())
            .limit(per_page)
            .offset((page - 1) * per_page)
    ).scalars().all()

    return {
        "items": [DeptOut.model_validate(d).model_dump() for d in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }

@router.post("", response_model=DeptOut, status_code=201)
def create_department(body: DeptCreate, db: Session = Depends(get_db)):
    # uniqueness
    exists = db.scalar(select(func.count()).select_from(models.Department).where(
        func.lower(models.Department.name) == body.name.strip().lower()
    ))
    if exists:
        raise HTTPException(status_code=409, detail="Department name already exists")

    dep = models.Department(
        name=body.name.strip(),
        percent=int(body.percent),
        is_active=bool(body.is_active),
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep

@router.patch("/{dept_id}", response_model=DeptOut)
def update_department(dept_id: int, body: DeptUpdate, db: Session = Depends(get_db)):
    dep = _dept_by_id(db, dept_id)
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")

    # name uniqueness
    if body.name and body.name.strip().lower() != dep.name.lower():
        exists = db.scalar(select(func.count()).select_from(models.Department).where(
            func.lower(models.Department.name) == body.name.strip().lower()
        ))
        if exists:
            raise HTTPException(status_code=409, detail="Department name already exists")
        dep.name = body.name.strip()

    if body.percent is not None:
        dep.percent = int(body.percent)

    if body.is_active is not None:
        dep.is_active = bool(body.is_active)

    db.commit()
    db.refresh(dep)
    return dep

@router.patch("/{dept_id}/active", response_model=DeptOut)
def toggle_department_active(dept_id: int, body: ToggleBody, db: Session = Depends(get_db)):
    dep = _dept_by_id(db, dept_id)
    if not dep:
        raise HTTPException(status_code=404, detail="Department not found")
    dep.is_active = bool(body.is_active)
    db.commit()
    db.refresh(dep)
    return dep

@router.delete("/{dept_id}", status_code=204)
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dep = _dept_by_id(db, dept_id)
    if not dep:
        return  # 204
    db.delete(dep)
    db.commit()
