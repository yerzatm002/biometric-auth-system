from sqlalchemy import Column, Integer, LargeBinary
from app.db.base import Base

class Biometric(Base):
    __tablename__ = "biometrics"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, unique=True, nullable=False)
    face_template = Column(LargeBinary, nullable=False)
    voice_template = Column(LargeBinary, nullable=True)
