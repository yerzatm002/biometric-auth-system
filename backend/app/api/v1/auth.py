from fastapi import APIRouter, Depends, Response, HTTPException
from sqlalchemy.orm import Session
from fastapi import Cookie
from datetime import datetime, timedelta

from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, SetPinRequest, PinLoginRequest
from app.schemas.user import UserRead as UserResponse
from app.services.auth_service import register, login
from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_pin, verify_pin
from app.core.jwt_manager import create_access_token, create_refresh_token, decode_token
import jwt

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):
    return register(data, db)

@router.post("/login", response_model=TokenResponse)
def login_user(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    access, refresh, user = login(data, db)

    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        samesite="strict",
        max_age=60*60*24*30
    )

    return TokenResponse(access_token=access)

@router.post("/set_pin")
def set_pin(data: SetPinRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    user.hashed_pin = hash_pin(data.pin)
    user.pin_attempts = 0
    user.pin_locked_until = None
    db.add(user)
    db.commit()
    return {"message": "PIN saved"}

MAX_PIN_ATTEMPTS = 5
LOCK_MINUTES = 15

@router.post("/login/pin")
def login_with_pin(data: PinLoginRequest, db: Session = Depends(get_db), response: Response = None):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # Проверяем блокировку
    if user.pin_locked_until and user.pin_locked_until > datetime.utcnow():
        raise HTTPException(403, "Account temporarily locked due to failed attempts")

    if not user.hashed_pin:
        raise HTTPException(400, "PIN not set for user")

    if not verify_pin(data.pin, user.hashed_pin):
        # неверный PIN -> инкремент попыток
        user.pin_attempts = (user.pin_attempts or 0) + 1
        if user.pin_attempts >= MAX_PIN_ATTEMPTS:
            user.pin_locked_until = datetime.utcnow() + timedelta(minutes=LOCK_MINUTES)
            user.pin_attempts = 0  # опционально обнуляем
        db.add(user)
        db.commit()
        raise HTTPException(401, "Incorrect PIN")

    # Успех
    user.pin_attempts = 0
    user.pin_locked_until = None
    db.add(user)
    db.commit()

    # Создаём JWT токены
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    # Ставим refresh токен в HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        max_age=60*60*24*30
    )

    return {"access_token": access_token}

@router.post("/refresh")
def refresh_token(refresh_token: str = Cookie(None)):
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user_id = payload["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")

    new_access = create_access_token({"sub": user_id})
    return {"access_token": new_access}