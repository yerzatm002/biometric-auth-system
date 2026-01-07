from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    hashed_pin = Column(String, nullable=True)
    pin_attempts = Column(Integer, default=0, nullable=True)
    pin_locked_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
