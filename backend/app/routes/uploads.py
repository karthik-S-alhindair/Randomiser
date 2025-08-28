from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import io
import math
import random
import re
import shutil
import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.services.reports_pdf import build_randomiser_pdf
from app import models
from app.database import get_db
from urllib.parse import quote

# Keep this prefix ONLY if you don't add another prefix in main.py
router = APIRouter(prefix="/api/uploads", tags=["uploads"])

IST = ZoneInfo("Asia/Kolkata")
ALLOWED_EXTS = {".xlsx", ".xls"}
REPORT_DIR = Path("storage/reports").resolve()
LOGO_PATH = Path("assets/AlhindairLogo.png")
REPORT_DIR = Path("storage/reports").resolve()
DOWNLOADS_DIR = Path("storage/downloads").resolve()

SHIFT_CODE = {
    "DAY": "D",
    "NIGHT": "N",
    "MORNING": "M",
    "EVENING": "E",
    "AFTERNOON": "A",
}


def shift_token(s: str) -> str:
    key = (s or "").strip().upper()
    return SHIFT_CODE.get(key, key[:1] or "D")


def dept_token(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "", (s or "").upper()) or "DEPT"


def _get_user_by_username(db: Session, username: str):
    return (
        db.execute(select(models.User).where(models.User.username == username))
        .scalars()
        .first()
    )


@router.get("/init")
def init_upload(username: str, db: Session = Depends(get_db)):
    user = _get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "date_ist": datetime.now(IST).date().isoformat(),
        "username": user.username,
        "name": user.name or user.username,
        "department": user.department or "",
        "station": user.station or "",
        "percent": 25,
        "test_type": "BA",
    }


@router.post("/generate")
def generate_report(
    username: str = Form(...),
    shift: str = Form(...),
    station: str = Form(...),
    department: str = Form(...),
    percent: int = Form(25),
    file: UploadFile = File(...),
    test_type: str = Form("BA"),
    db: Session = Depends(get_db),
):
    # Validate user & permissions
    user = _get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if (test_type or "").upper() != "BA":
        raise HTTPException(
            status_code=403, detail="Users can only generate BA reports"
        )
    if (user.department or "").strip().lower() != department.strip().lower():
        raise HTTPException(status_code=403, detail="Department mismatch")
    if (user.station or "").strip().lower() != station.strip().lower():
        raise HTTPException(status_code=403, detail="Station mismatch")

    # Validate file
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400, detail="Only Excel files (.xlsx/.xls) are allowed"
        )

    # Read Excel
    try:
        df = pd.read_excel(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

    # Normalize headers
    cols = {c.strip().lower(): c for c in df.columns if isinstance(c, str)}
    required = ["date", "shift", "employee id", "name", "department", "station"]
    missing = [r for r in required if r not in cols]
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Missing columns in Excel: {', '.join(missing)}"
        )

    c_date, c_shift = cols["date"], cols["shift"]
    c_eid, c_name = cols["employee id"], cols["name"]
    c_dept, c_stat = cols["department"], cols["station"]

    # Enforce IST date and matching fields
    today_ist = datetime.now(IST).date()
    try:
        excel_dates = pd.to_datetime(df[c_date]).dt.date
    except Exception:
        raise HTTPException(
            status_code=400, detail="Excel 'Date' column cannot be parsed"
        )

    if not (excel_dates == today_ist).all():
        raise HTTPException(
            status_code=400, detail=f"Excel Date must be {today_ist.isoformat()} (IST)"
        )
    if not (df[c_shift].astype(str).str.strip().str.lower() == shift.lower()).all():
        raise HTTPException(
            status_code=400, detail="Excel 'Shift' does not match the selected shift"
        )
    if not (df[c_dept].astype(str).str.strip().str.lower() == department.lower()).all():
        raise HTTPException(
            status_code=400, detail="Excel 'Department' does not match your department"
        )
    if not (df[c_stat].astype(str).str.strip().str.lower() == station.lower()).all():
        raise HTTPException(
            status_code=400,
            detail="Excel 'Station' does not match the selected station",
        )

    # Clean dataframes for rendering
    clean = pd.DataFrame(
        {
            "Person Name": df[c_name].astype(str).str.strip(),
            "Employee ID": df[c_eid].astype(str).str.strip(),
            "Department": df[c_dept].astype(str).str.strip(),
        }
    )

    # Random selection per department
    selected_rows = []
    for _dept, grp in clean.groupby("Department"):
        n = len(grp)
        k = max(1, math.ceil(n * (percent / 100))) if n > 0 else 0
        if k > 0:
            pick = grp.sample(n=k, random_state=random.randint(0, 10_000))
            selected_rows.append(pick[["Person Name", "Employee ID"]])
    selected = (
        pd.concat(selected_rows, ignore_index=True)
        if selected_rows
        else clean.iloc[0:0][["Person Name", "Employee ID"]]
    )

    # -------- Build PDF with proper layout --------
    # Import here to keep import overhead out of app startup
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    now_ist = datetime.now(IST)

    # Filename — date only, no time or forbidden chars
    date_token = now_ist.strftime("%d%m%Y")
    shift_tok = shift_token(shift)
    dept_tok = dept_token(department)
    station_tok = (station or "").upper()
    test_tok = "BA"

    out_name = f"{date_token}_{station_tok}_{shift_tok}_{dept_tok}_{test_tok}.pdf"
    out_path = (REPORT_DIR / out_name).resolve()

    buff = io.BytesIO()

    def draw_header(canv, doc):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm

        W, H = A4
        # Logo: slightly smaller
        if LOGO_PATH.exists():
            canv.drawImage(
                str(LOGO_PATH),
                20 * mm,
                H - 30 * mm,  # y a touch lower
                width=42 * mm,
                height=17 * mm,  # smaller than before
                preserveAspectRatio=True,
                mask="auto",
            )
        # Title: a bit smaller too
        canv.setFont("Helvetica-Bold", 26)
        canv.drawString(78 * mm, H - 22 * mm, f"Randomiser for {test_tok}")

    # Extra top margin so meta table doesn't collide with header
    doc = SimpleDocTemplate(
        buff,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=38 * mm,
        bottomMargin=18 * mm,
    )

    # Available width
    W = doc.width

    # 1) META TABLE (two rows, 6 equal columns)
    meta_data = [
        ["Date & Time", "Station", "Department", "Shift", "Percentage", "User name"],
        [
            now_ist.strftime("%d-%m-%Y  %H:%M"),
            station_tok,
            department,
            shift,
            f"{percent}%",
            user.name or user.username,
        ],
    ]
    meta_table = Table(meta_data, colWidths=[W / 6.0] * 6, hAlign="LEFT")
    meta_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),  # header centered
                ("ALIGN", (0, 1), (-1, 1), "CENTER"),  # values centered (keeps neat)
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    # 2) COMBINED 4-COLUMN TABLE (guaranteed alignment)
    from reportlab.platypus import Table, TableStyle
    from reportlab.lib import colors

    # Left & right data (no titles here)
    left_rows = clean[["Person Name", "Employee ID"]].values.tolist()
    right_rows = selected[["Person Name", "Employee ID"]].values.tolist()

    # Largest side drives number of body rows
    n = max(len(left_rows), len(right_rows))

    # Build rows; empty cells if one side shorter
    body = []
    for i in range(n):
        l = left_rows[i] if i < len(left_rows) else ["", ""]
        r = right_rows[i] if i < len(right_rows) else ["", ""]
        body.append([l[0], l[1], r[0], r[1]])

    # Final table data:
    #  row 0: titles spanning (0–1) and (2–3)
    #  row 1: 4 headers
    #  rows 2..: body
    data = [
        ["Upload Staff Data", "", "Selected Staff Data", ""],
        ["Person Name", "Employee ID", "Person Name", "Employee ID"],
    ] + body

    # Column widths: split width in half; inside each half 62% / 38%
    half = W / 2.0
    col_widths = [0.62 * half, 0.38 * half, 0.62 * half, 0.38 * half]

    combined = Table(data, colWidths=col_widths, hAlign="LEFT")
    combined.setStyle(
        TableStyle(
            [
                # Outer box + full grid
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                ("INNERGRID", (0, 1), (-1, -1), 0.4, colors.black),
                # Titles
                ("SPAN", (0, 0), (1, 0)),  # "Upload Staff Data"
                ("SPAN", (2, 0), (3, 0)),  # "Selected Staff Data"
                ("ALIGN", (0, 0), (3, 0), "CENTER"),
                ("FONTNAME", (0, 0), (3, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (3, 0), 10),
                # Column headers
                ("BACKGROUND", (0, 1), (3, 1), colors.whitesmoke),
                ("FONTNAME", (0, 1), (3, 1), "Helvetica-Bold"),
                ("ALIGN", (0, 1), (3, 1), "CENTER"),
                # Body
                ("FONTNAME", (0, 2), (3, -1), "Helvetica"),
                ("VALIGN", (0, 0), (3, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (3, -1), 3),
                ("BOTTOMPADDING", (0, 0), (3, -1), 3),
            ]
        )
    )

    story = [
        meta_table,
        Spacer(1, 10),
        combined,
    ]

    doc.build(story, onFirstPage=draw_header, onLaterPages=draw_header)

    pdf_bytes = buff.getvalue()
    buff.close()
    out_path.write_bytes(pdf_bytes)
    # -------- End PDF build --------

    # Persist record
    rep = models.Report(
        file_name=out_name,
        file_path=str(out_path),
        date=today_ist,
        shift=shift,
        department=department,
        station=station_tok,
        percent=percent,
        uploaded_by=user.username,
        total_count=len(clean),
        selected_count=len(selected),
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    # Strong filename headers for the frontend
    # headers = {
    #    "Content-Disposition": f'attachment; filename="{out_name}"',
    #    "Content-Type": "application/pdf",
    #    "Content-Length": str(len(pdf_bytes)),
    # RFC 5987 (helps some browsers if unicode appears)
    #    "Content-Disposition": f"attachment; filename={out_name}; filename*=UTF-8''{out_name}",
    # }
    dispo = f'attachment; filename="{out_name}"; ' f"filename*=UTF-8''{quote(out_name)}"
    headers = {"Content-Disposition": dispo}
    return StreamingResponse(
        io.BytesIO(pdf_bytes), media_type="application/pdf", headers=headers
    )


@router.post("/admin-generate")
def admin_generate_report(
    shift: str = Form(...),
    station: str = Form(...),
    department: str = Form(...),
    percent: int = Form(25),
    file: UploadFile = File(...),
    test_type: str = Form("BA"),  # "BA" or "PA"
    db: Session = Depends(get_db),
):
    # ---- Validate inputs ----
    tt = (test_type or "").upper()
    if tt not in {"BA", "PA"}:
        raise HTTPException(status_code=400, detail="test_type must be BA or PA")

    try:
        percent = int(percent)
    except Exception:
        raise HTTPException(status_code=400, detail="percent must be an integer")
    if percent < 0 or percent > 100:
        raise HTTPException(status_code=400, detail="percent must be between 0 and 100")

    # Validate file type
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(
            status_code=400, detail="Only Excel files (.xlsx/.xls) are allowed"
        )

    # Read Excel
    try:
        df = pd.read_excel(file.file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Excel: {e}")

    # Normalize headers
    cols = {str(c).strip().lower(): c for c in df.columns if isinstance(c, str)}
    required = ["date", "shift", "employee id", "name", "department", "station"]
    missing = [r for r in required if r not in cols]
    if missing:
        raise HTTPException(
            status_code=400, detail=f"Missing columns in Excel: {', '.join(missing)}"
        )

    c_date, c_shift = cols["date"], cols["shift"]
    c_eid, c_name = cols["employee id"], cols["name"]
    c_dept, c_stat = cols["department"], cols["station"]

    # Enforce IST date and matching fields
    now_ist = datetime.now(IST)
    today_ist = now_ist.date()

    # Accept dd-mm-yyyy safely (your uploads often store Date as TEXT)
    excel_dates = pd.to_datetime(df[c_date], dayfirst=True, errors="coerce").dt.date
    if excel_dates.isna().any():
        raise HTTPException(status_code=400, detail="Excel 'Date' has invalid rows")
    if not (excel_dates == today_ist).all():
        raise HTTPException(
            status_code=400, detail=f"Excel Date must be {today_ist.isoformat()} (IST)"
        )

    if not (df[c_shift].astype(str).str.strip().str.lower() == (shift or "").lower()).all():
        raise HTTPException(
            status_code=400, detail="Excel 'Shift' does not match the selected shift"
        )

    # Optional normalization so GSD vs long form is treated consistently
    def _canon_dept(s: str) -> str:
        s = (s or "").strip().lower()
        mapping = {
            "ground service department (gsd)": "gsd",
            "ground service department": "gsd",
            "gsd": "gsd",
            "flight dispatch": "flight dispatch",
            "security": "security",
            "engineering": "engineering",
        }
        return mapping.get(s, s)

    if not (df[c_dept].astype(str).apply(_canon_dept) == _canon_dept(department)).all():
        raise HTTPException(
            status_code=400, detail="Excel 'Department' does not match the selected department"
        )

    if not (df[c_stat].astype(str).str.strip().str.lower() == (station or "").lower()).all():
        raise HTTPException(
            status_code=400, detail="Excel 'Station' does not match the selected station"
        )

    # Clean dataframes for rendering
    clean = pd.DataFrame(
        {
            "Person Name": df[c_name].astype(str).str.strip(),
            "Employee ID": df[c_eid].astype(str).str.strip(),
            "Department": df[c_dept].astype(str).str.strip(),
        }
    )

    # Random selection per department (at least 1 if department has rows)
    selected_rows = []
    for _dept, grp in clean.groupby("Department"):
        n = len(grp)
        k = max(1, math.ceil(n * (percent / 100))) if n > 0 else 0
        if k > 0:
            pick = grp.sample(n=k, random_state=random.randint(0, 10_000))
            selected_rows.append(pick[["Person Name", "Employee ID"]])
    selected = (
        pd.concat(selected_rows, ignore_index=True)
        if selected_rows
        else clean.iloc[0:0][["Person Name", "Employee ID"]]
    )

    # -------- Build PDF with proper layout (same as your reference) --------
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Spacer, Table, TableStyle

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    station_tok = (station or "").upper()

    # Filename — date only, no time or forbidden chars
    date_token = now_ist.strftime("%d%m%Y")
    shift_tok = shift_token(shift)
    dept_tok = dept_token(department)
    test_tok = tt  # BA or PA

    out_name = f"{date_token}_{station_tok}_{shift_tok}_{dept_tok}_{test_tok}.pdf"
    out_path = (REPORT_DIR / out_name).resolve()
    downloads_path = (DOWNLOADS_DIR / out_name).resolve()

    buff = io.BytesIO()

    def draw_header(canv, doc):
        W, H = A4
        if LOGO_PATH.exists():
            canv.drawImage(
                str(LOGO_PATH),
                20 * mm,
                H - 30 * mm,
                width=42 * mm,
                height=17 * mm,
                preserveAspectRatio=True,
                mask="auto",
            )
        canv.setFont("Helvetica-Bold", 26)
        canv.drawString(78 * mm, H - 22 * mm, f"Randomiser for {test_tok}")

    doc = SimpleDocTemplate(
        buff,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=38 * mm,
        bottomMargin=18 * mm,
    )

    W = doc.width

    # 1) META TABLE
    meta_data = [
        ["Date & Time", "Station", "Department", "Shift", "Percentage", "User name"],
        [
            now_ist.strftime("%d-%m-%Y  %H:%M"),
            station_tok,
            department,
            shift,
            f"{percent}%",
            "admin",
        ],
    ]
    meta_table = Table(meta_data, colWidths=[W / 6.0] * 6, hAlign="LEFT")
    meta_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, 1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    # 2) COMBINED 4-COLUMN TABLE
    left_rows = clean[["Person Name", "Employee ID"]].values.tolist()
    right_rows = selected[["Person Name", "Employee ID"]].values.tolist()
    n = max(len(left_rows), len(right_rows))
    body = []
    for i in range(n):
        l = left_rows[i] if i < len(left_rows) else ["", ""]
        r = right_rows[i] if i < len(right_rows) else ["", ""]
        body.append([l[0], l[1], r[0], r[1]])

    data = [
        ["Upload Staff Data", "", "Selected Staff Data", ""],
        ["Person Name", "Employee ID", "Person Name", "Employee ID"],
    ] + body

    half = W / 2.0
    col_widths = [0.62 * half, 0.38 * half, 0.62 * half, 0.38 * half]

    combined = Table(data, colWidths=col_widths, hAlign="LEFT")
    combined.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),
                ("INNERGRID", (0, 1), (-1, -1), 0.4, colors.black),
                ("SPAN", (0, 0), (1, 0)),
                ("SPAN", (2, 0), (3, 0)),
                ("ALIGN", (0, 0), (3, 0), "CENTER"),
                ("FONTNAME", (0, 0), (3, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (3, 0), 10),
                ("BACKGROUND", (0, 1), (3, 1), colors.whitesmoke),
                ("FONTNAME", (0, 1), (3, 1), "Helvetica-Bold"),
                ("ALIGN", (0, 1), (3, 1), "CENTER"),
                ("FONTNAME", (0, 2), (3, -1), "Helvetica"),
                ("VALIGN", (0, 0), (3, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (3, -1), 3),
                ("BOTTOMPADDING", (0, 0), (3, -1), 3),
            ]
        )
    )

    story = [meta_table, Spacer(1, 10), combined]
    doc.build(story, onFirstPage=draw_header, onLaterPages=draw_header)

    pdf_bytes = buff.getvalue()
    buff.close()

    # Write both copies
    out_path.write_bytes(pdf_bytes)
    downloads_path.write_bytes(pdf_bytes)

    # Persist record
    rep = models.Report(
        file_name=out_name,
        file_path=str(out_path),  # DB points to reports copy
        date=today_ist,
        shift=shift,
        department=department,
        station=station_tok,
        percent=percent,
        uploaded_by="admin",
        total_count=len(clean),
        selected_count=len(selected),
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)

    # Stream back to client
    dispo = f'attachment; filename="{out_name}"; filename*=UTF-8\'\'{quote(out_name)}'
    headers = {
        "Content-Disposition": dispo,
        "Content-Type": "application/pdf",
        "Content-Length": str(len(pdf_bytes)),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
        # let browser JS read Content-Disposition
        "Access-Control-Expose-Headers": "Content-Disposition",
    }

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers=headers,
    )
