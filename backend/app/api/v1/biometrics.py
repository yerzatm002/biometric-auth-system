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

THRESHOLD = 0.6
ROTATION_MIN_ANGLE = 5 
BLINK_RATIO_THRESHOLD = 0.6     


face_model = insightface.app.FaceAnalysis(name="buffalo_l")
face_model.prepare(ctx_id=-1)

# --- Этап 1: регистрация лица ---
@router.post("/biometrics/face/enroll")
async def enroll_face(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    np_arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    faces = face_model.get(img)
    if not faces:
        raise HTTPException(status_code=400, detail="No face detected")

    embeddings = np.array([face.embedding for face in faces])
    avg_embedding = np.mean(embeddings, axis=0)

    encrypted_embedding = encrypt_data(avg_embedding.tobytes())

    biometric_record = Biometric(user_id=user_id, face_template=encrypted_embedding)
    db.add(biometric_record)
    db.commit()
    db.refresh(biometric_record)

    return {"message": "Face enrolled successfully", "biometric_id": biometric_record.id}


@router.post("/biometrics/face/verify-multiframe")
async def verify_multiframe(
    user_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if len(files) < 2:
        raise HTTPException(400, "Need at least 2 images: front, turn")

    biometric = db.query(Biometric).filter(Biometric.user_id == user_id).first()
    if not biometric:
        raise HTTPException(404, "User not enrolled")

    saved_embedding = np.frombuffer(
        decrypt_data(biometric.face_template),
        dtype=np.float32
    )

    embeddings, rotations = [], []

    for file in files:
        content = await file.read()
        img = cv2.imdecode(np.frombuffer(content, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(400, "Invalid image file")

        faces = face_model.get(img)
        if not faces:
            raise HTTPException(400, "Face not detected on all frames")

        face = faces[0]
        embeddings.append(face.embedding)

        rot = face.pose[0]  # yaw
        rotations.append(float(rot))

    # --- Step 1: identity match ---
    similarity = float(
        np.dot(embeddings[0], saved_embedding) /
        (np.linalg.norm(embeddings[0]) * np.linalg.norm(saved_embedding))
    )
    verified_identity = similarity >= THRESHOLD

    # --- Step 2: minimal head rotation ---
    rotated = bool(rotations[1] > ROTATION_MIN_ANGLE)

    liveness_pass = verified_identity and rotated

    result = {
        "verified": liveness_pass,
        "similarity": similarity,
        "rotation_detected": rotated,
        "liveness_pass": liveness_pass
    }

    return jsonable_encoder(result)