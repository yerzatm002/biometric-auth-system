from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.audit import AuditLog
from app.core.security import hash_password, verify_password, hash_pin
from app.core.jwt_manager import create_access_token, create_refresh_token

def register(data, db: Session):
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        raise HTTPException(400, "User already exists")

    new_user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        hashed_pin=hash_pin(data.pin) if data.pin else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_action(db, new_user.id, "register")

    return new_user


def login(data, db: Session):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(400, "Invalid credentials")

    if not verify_password(data.password, user.hashed_password):
        log_action(db, None, "login_fail", success=False)
        raise HTTPException(400, "Invalid credentials")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)

    log_action(db, user.id, "login")

    return access, refresh, user


def log_action(db, user_id, action, success=True):
    entry = AuditLog(user_id=user_id, action=action, success=success)
    db.add(entry)
    db.commit()
