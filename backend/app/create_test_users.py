# app/create_test_users.py
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.models import User

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def ensure_user(db: Session, *, username: str, plain_password: str, role: str, name: str, designation: str):
    u = db.query(User).filter(User.username == username).first()
    if u is None:
        u = User(
            username=username,
            hashed_password=pwd.hash(plain_password),
            role=role,
            name=name,
            designation=designation,
        )
        db.add(u)
        db.commit()
        print(f"CREATED: {username} ({role})")
    else:
        # update role / name / designation / password if re-run
        u.hashed_password = pwd.hash(plain_password)
        u.role = role
        u.name = name
        u.designation = designation
        db.commit()
        print(f"UPDATED: {username} ({role})")

if __name__ == "__main__":
    # make sure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Feel free to change usernames/passwords below
    ensure_user(
        db,
        username="AA9001",            # Karthik's employee ID
        plain_password="Karthik@123", # temp password
        role="superadmin",
        name="Karthik",
        designation="IT",
    )
    ensure_user(
        db,
        username="AA9002",            # Jeswin's employee ID
        plain_password="Jeswin@123",  # temp password
        role="admin",
        name="Jeswin",
        designation="Flight Safety",
    )

    db.close()
