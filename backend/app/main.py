from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.biometrics import router as biometrics_router
from app.middlewares.auth_middleware import auth_middleware


app = FastAPI(title="Biometric Auth System")

# ✅ CORS конфигурация
# Важно: docker IP (172.x) НЕ стабилен, лучше использовать regex для dev
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=".*",  # ✅ dev-friendly (можно убрать в production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Auth middleware после CORS
app.middleware("http")(auth_middleware)

# ✅ Routers
app.include_router(auth_router, prefix="/api/v1", tags=["Auth"])
app.include_router(biometrics_router, prefix="/api/v1", tags=["Biometrics"])

# ✅ Проверка токена: /secure (должен возвращать user_id из middleware)
@app.get("/secure")
def secure(request: Request):
    return {
        "message": "OK",
        "user_id": getattr(request.state, "user_id", None),
    }
