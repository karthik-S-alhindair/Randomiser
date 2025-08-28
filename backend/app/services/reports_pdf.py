# app/services/reports_pdf.py                                   # NEW FILE
from pathlib import Path  # NEW
from datetime import datetime  # NEW
from zoneinfo import ZoneInfo  # NEW
import io, re  # NEW
import pandas as pd  # NEW

from reportlab.lib.pagesizes import A4  # NEW
from reportlab.lib import colors  # NEW
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer  # NEW
from reportlab.lib.units import mm  # NEW

IST = ZoneInfo("Asia/Kolkata")  # NEW
LOGO_PATH = Path("assets/AlhindairLogo.png")  # NEW

_SHIFT_CODE = {  # NEW
    "DAY": "D",
    "NIGHT": "N",  # NEW
    "MORNING": "M",
    "EVENING": "E",
    "AFTERNOON": "A",  # NEW
}  # NEW


def _shift_token(s: str) -> str:  # NEW
    key = (s or "").strip().upper()  # NEW
    return _SHIFT_CODE.get(key, key[:1] or "D")  # NEW


def _dept_token(s: str) -> str:  # NEW
    return re.sub(r"[^A-Za-z0-9]", "", (s or "").upper()) or "DEPT"  # NEW


def compute_filename(
    dt: datetime, station: str, shift: str, department: str, test_type: str
) -> str:  # NEW
    return f'{dt.strftime("%d%m%Y")}_{(station or "").upper()}_{_shift_token(shift)}_{_dept_token(department)}_{(test_type or "BA").upper()}.pdf'  # NEW


def build_randomiser_pdf(  # NEW
    *,  # NEW
    station: str,  # NEW
    department: str,  # NEW
    shift: str,  # NEW
    percent: int,  # NEW
    uploader_name: str,  # NEW
    test_type: str = "BA",  # NEW
    full_df: pd.DataFrame,  # NEW  # ["Person Name","Employee ID"]
    selected_df: pd.DataFrame,  # NEW  # ["Person Name","Employee ID"]
):  # NEW
    """Return (pdf_bytes, out_filename)."""  # NEW
    now_ist = datetime.now(IST)  # NEW
    out_name = compute_filename(now_ist, station, shift, department, test_type)  # NEW

    buff = io.BytesIO()  # NEW

    def _draw_header(canv, doc):  # NEW
        W, H = A4  # NEW
        if LOGO_PATH.exists():  # NEW
            canv.drawImage(
                str(LOGO_PATH),
                20 * mm,
                H - 35 * mm,
                width=45 * mm,
                height=18 * mm,  # NEW
                preserveAspectRatio=True,
                mask="auto",
            )  # NEW
        canv.setFont("Helvetica-Bold", 30)  # NEW
        canv.drawString(
            75 * mm, H - 28 * mm, f"Randomiser for {(test_type or 'BA').upper()}"
        )  # NEW

    doc = SimpleDocTemplate(  # NEW
        buff,
        pagesize=A4,  # NEW
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=35 * mm,
        bottomMargin=18 * mm,  # NEW
    )  # NEW

    meta_table = Table(
        [
            [  # NEW
                "Date & time",
                now_ist.strftime("%d.%m.%Y %H:%M:%S"),  # NEW
                "Station",
                (station or "").upper(),  # NEW
                "Department",
                department,  # NEW
                "Shift",
                shift,  # NEW
                "Percentage",
                f"{percent}%",  # NEW
                "User name",
                uploader_name,  # NEW
            ]
        ],
        colWidths=[70, 90, 55, 60, 65, 90, 35, 50, 70, 90],
    )  # NEW
    meta_table.setStyle(
        TableStyle(
            [  # NEW
                ("BOX", (0, 0), (-1, -1), 0.8, colors.black),  # NEW
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),  # NEW
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),  # NEW
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),  # NEW
                ("FONTSIZE", (0, 0), (-1, -1), 8),  # NEW
            ]
        )
    )  # NEW

    def _mk_tbl(data):  # NEW
        t = Table(data, colWidths=[170, 90])  # NEW
        t.setStyle(
            TableStyle(
                [  # NEW
                    ("BOX", (0, 0), (-1, -1), 0.8, colors.black),  # NEW
                    ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.black),  # NEW
                    ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),  # NEW
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),  # NEW
                    ("FONTSIZE", (0, 0), (-1, -1), 9),  # NEW
                ]
            )
        )  # NEW
        return t  # NEW

    left_data = [["Person Name", "Employee ID"]] + full_df[
        ["Person Name", "Employee ID"]
    ].values.tolist()  # NEW
    right_data = [["Person Name", "Employee ID"]] + selected_df[
        ["Person Name", "Employee ID"]
    ].values.tolist()  # NEW

    title_row = Table(
        [["Upload Staff Data", "", "Selected Staff Data"]], colWidths=[260, 20, 260]
    )  # NEW
    title_row.setStyle(
        TableStyle(
            [  # NEW
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),  # NEW
                ("FONTSIZE", (0, 0), (-1, -1), 10),  # NEW
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # NEW
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),  # NEW
            ]
        )
    )  # NEW

    left_tbl, right_tbl = _mk_tbl(left_data), _mk_tbl(right_data)  # NEW
    two_col = Table([[left_tbl, right_tbl]], colWidths=[260, 260])  # NEW

    story = [meta_table, Spacer(1, 10), title_row, two_col]  # NEW
    doc.build(story, onFirstPage=_draw_header, onLaterPages=_draw_header)  # NEW

    return buff.getvalue(), out_name  # NEW
