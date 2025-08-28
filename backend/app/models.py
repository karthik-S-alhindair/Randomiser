from sqlalchemy import Boolean, Column, Integer, String, DateTime, func
from app.database import Base

class SuperAdmin(Base):
    __tablename__ = "superadmins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(32))
    created_at = Column(DateTime, server_default=func.current_timestamp())


class Admin(Base):
    __tablename__ = "admins"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255))
    email = Column(String(255))
    phone = Column(String(32))
    department = Column(String(80))
    station = Column(String(20))
    created_at = Column(DateTime, server_default=func.current_timestamp())


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # profile
    name = Column(String(255))
    designation = Column(String(255))              # NEW
    email = Column(String(255))
    phone = Column(String(32))

    # org placement
    department = Column(String(80))
    station = Column(String(20))

    # access flags
    role = Column(String(32), nullable=False, default="user")  # NEW
    is_active = Column(Boolean, nullable=False, default=True)  # NEW

    created_at = Column(DateTime, server_default=func.current_timestamp())


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    percent = Column(Integer, default=25)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())


class Shift(Base):
    __tablename__ = "shifts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())


class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.current_timestamp())


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_name = Column(String(255))
    file_path = Column(String(500))
    date = Column(String(20))
    shift = Column(String(50))
    department = Column(String(80))
    station = Column(String(20))
    percent = Column(Integer)
    total_count = Column(Integer)
    selected_count = Column(Integer)
    created_at = Column(DateTime, server_default=func.current_timestamp())
