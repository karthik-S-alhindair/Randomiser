import argparse
import pandas as pd
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models import User

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

REQUIRED_COLS = ["Name", "Designation", "Username", "Password", "Emailid", "Phone No", "Station"]

def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    # Trim spaces and unify column names just in case
    df = df.rename(columns={c: c.strip() for c in df.columns})
    # Basic presence check
    missing = [c for c in REQUIRED_COLS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    return df

def upsert_user(db: Session, row, default_role: str = "user"):
    username = str(row["Username"]).strip()
    if not username:
        return "SKIP: empty username"

    plain_password = str(row["Password"]).strip()
    if not plain_password:
        return f"SKIP: {username} has empty password"

    # Fetch existing
    u = db.query(User).filter(User.username == username).first()
    if not u:
        u = User(username=username, role=default_role, hashed_password=pwd.hash(plain_password))
        db.add(u)
    else:
        # Update password only if provided (non-empty)
        u.hashed_password = pwd.hash(plain_password)

    # Map fields
    u.name = str(row["Name"]).strip() if pd.notna(row["Name"]) else None
    u.designation = str(row["Designation"]).strip() if pd.notna(row["Designation"]) else None
    u.email = str(row["Emailid"]).strip() if pd.notna(row["Emailid"]) else None
    u.phone = str(row["Phone No"]).strip() if pd.notna(row["Phone No"]) else None
    u.station = str(row["Station"]).strip() if pd.notna(row["Station"]) else None

    db.commit()
    return f"UPSERT: {username}"

def main(path: str, default_role: str = "user", sheet: str | int | None = 0):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    df = pd.read_excel(path, sheet_name=sheet, engine="openpyxl")
    df = normalize_columns(df)

    db = SessionLocal()
    try:
        results = []
        for idx, row in df.iterrows():
            try:
                msg = upsert_user(db, row, default_role=default_role)
                results.append(msg)
            except Exception as e:
                results.append(f"ERROR row {idx+1}: {e}")
        print("\n".join(results))
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import users from Excel into SQLite")
    parser.add_argument("excel_path", help="Path to .xlsx file")
    parser.add_argument("--role", default="user", help="Default role if not specified in Excel")
    parser.add_argument("--sheet", default=0, help="Sheet name or index (default 0)")
    args = parser.parse_args()
    main(args.excel_path, default_role=args.role, sheet=args.sheet)
