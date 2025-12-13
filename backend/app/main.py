from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.middlewares.auth_middleware import auth_middleware
from app.api.v1.biometrics import router as biometrics_router


app = FastAPI(title="Biometric Auth System")

app.middleware("http")(auth_middleware)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(biometrics_router, prefix="/api/v1", tags=["Biometrics"])


@app.get("/secure")
def secure(user_id: int = None):
    return {"message": "OK", "user_id": user_id}
