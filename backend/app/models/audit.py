from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    action = Column(String)
    success = Column(Boolean, default=True)
    timestamp = Column(DateTime, server_default=func.now())
    ip = Column(String)
