from datetime import datetime, timedelta
import jwt
from app.core.config import settings

def create_access_token(user_id: int):
    expire = datetime.utcnow() + timedelta(minutes= settings.ACCESS_TOKEN_EXPIRE_MIN)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(user_id: int):
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
