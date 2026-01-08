from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import numpy as np
import cv2
import insightface

from app.db.session import get_db
from app.models.biometric import Biometric
from app.core.security import encrypt_data, decrypt_data

router = APIRouter()

# -----------------------------
# Настройки проверки
# -----------------------------

# Identity threshold (cosine similarity)
THRESHOLD = 0.6

# "Front" может быть слегка неидеальный
FRONT_MAX_ANGLE = 8  # yaw <= 8 градусов

# "Rotated" кадр должен быть заметно повернут
ROTATION_ABS_MIN = 10     # abs(yaw) >= 10

# Разница между front и rotated должна быть существенной
ROTATION_DELTA_MIN = 10   # abs(yaw_rot - yaw_front) >= 10

# -----------------------------
# Модель
# -----------------------------
face_model = insightface.app.FaceAnalysis(name="buffalo_l")
face_model.prepare(ctx_id=-1)


# -----------------------------
# Вспомогательные функции
# -----------------------------

def decode_image(file_bytes: bytes):
    """Decode bytes into cv2 image."""
    np_arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img


def get_best_face(img):
    """Return the biggest detected face (most likely the user)."""
    faces = face_model.get(img)
    if not faces:
        return None

    # выбираем самое крупное лицо (по площади bbox)
    best = max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
    return best


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between embeddings."""
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# -----------------------------
# Этап 1: регистрация лица
# -----------------------------
@router.post("/biometrics/face/enroll")
async def enroll_face(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    img = decode_image(contents)

    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    face = get_best_face(img)
    if not face:
        raise HTTPException(status_code=400, detail="No face detected")

    # берем embedding одного лица
    embedding = np.array(face.embedding, dtype=np.float32)

    encrypted_embedding = encrypt_data(embedding.tobytes())

    # ✅ если запись уже есть — обновляем
    biometric = db.query(Biometric).filter(Biometric.user_id == user_id).first()

    if biometric:
        biometric.face_template = encrypted_embedding
        db.commit()
        db.refresh(biometric)
        return {
            "message": "Face updated successfully",
            "biometric_id": biometric.id
        }

    # иначе создаём новую
    biometric_record = Biometric(user_id=user_id, face_template=encrypted_embedding)
    db.add(biometric_record)
    db.commit()
    db.refresh(biometric_record)

    return {
        "message": "Face enrolled successfully",
        "biometric_id": biometric_record.id
    }


# -----------------------------
# Этап 2: верификация лица (multiframe)
# -----------------------------
@router.post("/biometrics/face/verify-multiframe")
async def verify_multiframe(
    user_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    # ✅ минимум 2 кадра
    if len(files) < 2:
        raise HTTPException(400, detail="Need at least 2 images for liveness check")

    biometric = db.query(Biometric).filter(Biometric.user_id == user_id).first()
    if not biometric:
        raise HTTPException(404, detail="User not enrolled")

    saved_embedding = np.frombuffer(
        decrypt_data(biometric.face_template),
        dtype=np.float32
    )

    frames = []

    # ✅ обрабатываем все кадры
    for idx, file in enumerate(files):
        content = await file.read()
        img = decode_image(content)
        if img is None:
            continue

        face = get_best_face(img)
        if not face:
            continue

        emb = np.array(face.embedding, dtype=np.float32)
        yaw = float(face.pose[0])  # yaw (left/right head turn)
        sim = cosine_similarity(emb, saved_embedding)

        frames.append({
            "idx": idx,
            "yaw": yaw,
            "embedding": emb,
            "similarity": sim,
        })

    # если лицо распознано менее чем в 2 кадрах — fail
    if len(frames) < 2:
        raise HTTPException(400, detail="Face not detected on enough frames")

    # ---------------------------------------------------------
    # 1) выбираем лучший front: yaw ближе всего к 0
    # ---------------------------------------------------------
    best_front = min(frames, key=lambda x: abs(x["yaw"]))

    # ---------------------------------------------------------
    # 2) выбираем лучший rotated: максимальный abs(yaw)
    # ---------------------------------------------------------
    best_rotated = max(frames, key=lambda x: abs(x["yaw"]))

    yaw_front = best_front["yaw"]
    yaw_rot = best_rotated["yaw"]

    # similarity берем по front кадру (самый правильный)
    similarity = best_front["similarity"]
    identity_ok = similarity >= THRESHOLD

    # ---------------------------------------------------------
    # Liveness check:
    # 1) front должен быть близко к прямому
    # 2) rotated должен быть явно повернут
    # 3) между ними должна быть большая разница
    # ---------------------------------------------------------
    is_front_ok = abs(yaw_front) <= FRONT_MAX_ANGLE
    is_rotated_ok = abs(yaw_rot) >= ROTATION_ABS_MIN
    delta_ok = abs(yaw_rot - yaw_front) >= ROTATION_DELTA_MIN

    rotation_detected = bool(is_front_ok and is_rotated_ok and delta_ok)

    liveness_pass = bool(identity_ok and rotation_detected)

    result = {
        "verified": liveness_pass,
        "similarity": similarity,

        "rotation_detected": rotation_detected,
        "liveness_pass": liveness_pass,

        # DEBUG — чтобы видеть почему упало
        "front_frame_idx": best_front["idx"],
        "rotated_frame_idx": best_rotated["idx"],
        "yaw_front": yaw_front,
        "yaw_rotated": yaw_rot,
        "is_front_ok": is_front_ok,
        "is_rotated_ok": is_rotated_ok,
        "delta_ok": delta_ok,

        # thresholds
        "threshold_similarity": THRESHOLD,
        "front_max_angle": FRONT_MAX_ANGLE,
        "rotation_abs_min": ROTATION_ABS_MIN,
        "rotation_delta_min": ROTATION_DELTA_MIN,

        # полезно для анализа
        "frames_detected": len(frames),
    }

    return jsonable_encoder(result)
