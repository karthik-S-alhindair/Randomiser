# app/schemas/reports.py                                      # CHANGED (replace old)
from pydantic import BaseModel                                # CHANGED
from datetime import date, datetime                           # CHANGED

class ReportRow(BaseModel):                                   # CHANGED
    id: int                                                   # CHANGED
    file_name: str                                            # CHANGED
    date: date | None = None                                  # CHANGED
    shift: str | None = None                                  # CHANGED
    department: str | None = None                             # CHANGED
    station: str | None = None                                # CHANGED
    percent: int | None = None                                # CHANGED
    total_count: int | None = None                            # CHANGED
    selected_count: int | None = None                         # CHANGED
    created_at: datetime | None = None                        # CHANGED
    class Config:                                             # CHANGED
        from_attributes = True                                # CHANGED  # (replaces orm_mode)

class ReportList(BaseModel):                                  # CHANGED
    items: list[ReportRow]                                    # CHANGED
    total: int                                                # CHANGED
    page: int                                                 # CHANGED
    page_size: int                                            # CHANGED
    pages: int                                                # CHANGED
