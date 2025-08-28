from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func, desc
from datetime import date
from pathlib import Path
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/user")
def list_user_reports(
    username: str,
    date_from: str | None = None,
    date_to: str | None = None,
    shift: str | None = None,                  # ← NEW
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    u = (
        db.execute(select(models.User).where(models.User.username == username))
        .scalars()
        .first()
    )
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    q = select(models.Report).where(
        and_(
            models.Report.department == (u.department or ""),
            models.Report.station == (u.station or ""),
        )
    )
    if date_from:
        q = q.where(models.Report.date >= date.fromisoformat(date_from))
    if date_to:
        q = q.where(models.Report.date <= date.fromisoformat(date_to))
    if shift:
        q = q.where(models.Report.shift.ilike(shift))  # "Day" / "Night"

    total = db.execute(select(func.count()).select_from(q.subquery())).scalar() or 0
    q = (
        q.order_by(desc(models.Report.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = db.execute(q).scalars().all()

    def row(x: models.Report):
        return {
            "id": x.id,
            "file_name": x.file_name,
            "date": x.date.isoformat() if x.date else None,
            "shift": x.shift,
            "department": x.department,
            "station": x.station,
            "percent": x.percent,
            "total_count": x.total_count,
            "selected_count": x.selected_count,
            "created_at": x.created_at.isoformat() if x.created_at else None,
        }

    return {
        "items": [row(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

@router.get("/admin")
def list_admin_reports(
    date_from: str | None = None,
    date_to: str | None = None,
    shift: str | None = None,
    department: str | None = None,
    station: str | None = None,
    test_type: str | None = None,                 # "BA" or "PA"
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    # Base query: all reports
    q = select(models.Report)

    # Date range
    if date_from:
        q = q.where(models.Report.date >= date.fromisoformat(date_from))
    if date_to:
        q = q.where(models.Report.date <= date.fromisoformat(date_to))

    # Optional filters
    if shift:
        q = q.where(models.Report.shift.ilike(shift))
    if department:
        q = q.where(models.Report.department.ilike(department))
    if station:
        q = q.where(models.Report.station.ilike(station))
    if test_type:
        # test type is embedded in filename suffix: ..._BA.pdf / ..._PA.pdf
        tt = (test_type or "").upper()
        q = q.where(models.Report.file_name.ilike(f"%_{tt}.pdf"))

    total = db.execute(select(func.count()).select_from(q.subquery())).scalar() or 0
    q = (
        q.order_by(desc(models.Report.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = db.execute(q).scalars().all()

    def row(x: models.Report):
        return {
            "id": x.id,
            "file_name": x.file_name,
            "date": x.date.isoformat() if x.date else None,
            "shift": x.shift,
            "department": x.department,
            "station": x.station,
            "percent": x.percent,
            "total_count": x.total_count,
            "selected_count": x.selected_count,
            "created_at": x.created_at.isoformat() if x.created_at else None,
        }

    return {
        "items": [row(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }

@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    r = db.get(models.Report, report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    p = Path(r.file_path)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Report file missing on server")
    return FileResponse(path=str(p), filename=r.file_name, media_type="application/pdf")
