from sqlalchemy import text
from app.database import engine

def main():
    print("DB URL:", engine.url)
    with engine.connect() as conn:
        val = conn.execute(text("SELECT 1")).scalar()
        print("DB OK:", val == 1)

if __name__ == "__main__":
    main()
