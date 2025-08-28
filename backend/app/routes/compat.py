from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_
from app.database import get_db
from app import models

router = APIRouter()

@router.get("/users")
def list_users_compat(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    roles: str = "",                      # e.g. "admin,superadmin"
    search: str | None = None,
    db: Session = Depends(get_db),
):
    want = {r.strip().lower() for r in roles.split(",") if r.strip()} or {"admin"}

    # Build filters
    a_q = select(models.Admin)
    s_q = select(models.SuperAdmin)
    if search:
        like = f"%{search}%"
        a_q = a_q.where(or_(
            models.Admin.username.like(like),
            models.Admin.name.like(like),
            models.Admin.email.like(like),
        ))
        s_q = s_q.where(or_(
            models.SuperAdmin.username.like(like),
            models.SuperAdmin.name.like(like),
            models.SuperAdmin.email.like(like),
        ))

    rows = []

    if "admin" in want:
        admins = db.execute(a_q).scalars().all()
        rows += [{
            "id": a.id,
            "username": a.username,
            "name": a.name,
            "email": a.email,
            "role": "admin",
            "department": a.department,
            "station": a.station,
            "created_at": (a.created_at.isoformat() if a.created_at else None),
        } for a in admins]

    if "superadmin" in want:
        supers = db.execute(s_q).scalars().all()
        rows += [{
            "id": s.id,
            "username": s.username,
            "name": s.name,
            "email": s.email,
            "role": "superadmin",
            "department": None,
            "station": None,
            "created_at": (s.created_at.isoformat() if s.created_at else None),
        } for s in supers]

    # Sort by created_at (newest first)
    rows.sort(key=lambda r: (r["created_at"] or ""), reverse=True)

    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": rows[start:end],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

@router.get("/dropdowns")
def dropdowns(db: Session = Depends(get_db)):
    deps = db.scalars(select(models.Department)
                      .where(models.Department.is_active.is_(True))
                      .order_by(models.Department.name.asc())).all()
    sh = db.scalars(select(models.Shift)
                    .where(models.Shift.is_active.is_(True))
                    .order_by(models.Shift.name.asc())).all()
    st = db.scalars(select(models.Station)
                    .where(models.Station.is_active.is_(True))
                    .order_by(models.Station.code.asc())).all()
    return {
        "departments": [{"name": d.name, "percent": d.percent} for d in deps],
        "shifts": [s.name for s in sh],
        "stations": [s.code for s in st],   # station **codes only**
    }
