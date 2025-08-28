from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.database import Base, engine, SessionLocal
from app import models

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_and_seed():
    print("Dropping and recreating all tables…")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # ---- Superadmin ----
        sa = models.SuperAdmin(
            username="superadmin",
            hashed_password=pwd.hash("Super@123"),
            name="Super Admin",
            email=None,
            phone=None,
        )
        db.add(sa)

        # ---- Admin ----
        ad = models.Admin(
            username="admin",
            hashed_password=pwd.hash("Admin@123"),
            name="Admin One",
            email=None,
            phone=None,
            department=None,
            station=None,
        )
        db.add(ad)

        # ---- Regular User ----
        u = models.User(
            username="user1",
            hashed_password=pwd.hash("User@123"),
            name="First User",
            designation="Officer",
            email=None,
            phone=None,
            department="Security",
            station="COK",
            role="user",
            is_active=True,
        )
        db.add(u)

        db.commit()
        print("✅ Seed complete: 1 superadmin, 1 admin, 1 user created.")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
