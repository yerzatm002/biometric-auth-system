from fastapi import Request, HTTPException
import jwt
from app.core.config import settings

PUBLIC_PATHS = [
    "/api/v1/auth",
    "/docs",
    "/openapi.json"
]

async def auth_middleware(request: Request, call_next):

    # ✅ 1) Пропускаем CORS preflight
    if request.method == "OPTIONS":
        return await call_next(request)

    # ✅ 2) Разрешаем публичные пути
    for path in PUBLIC_PATHS:
        if request.url.path.startswith(path):
            return await call_next(request)

    # ✅ 3) Проверяем токен
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(401, "Missing access token")

    token = token.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        request.state.user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(401, "Invalid token")

    return await call_next(request)
