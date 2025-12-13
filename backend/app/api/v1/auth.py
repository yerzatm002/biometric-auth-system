from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserRead as UserResponse
from app.services.auth_service import register, login
from app.db.session import get_db

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
