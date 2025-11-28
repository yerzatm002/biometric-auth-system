# biometric-auth-system
# Biometric Authentication System (Face + Voice + PIN)

This project is a prototype of a secure biometric authentication system using:
- Face recognition
- Voice recognition
- PIN fallback
- Secure storage with AES-256 encryption
- Python FastAPI backend
- React frontend
- PostgreSQL database

## Features (MVP)
- User registration (face, voice, PIN)
- Authentication via face → voice → PIN fallback
- Liveness detection (basic)
- Encrypted biometric templates
- API documented with OpenAPI/Swagger

## Tech Stack
- Backend: FastAPI, Python 3.10+
- Frontend: React + JS
- Database: PostgreSQL
- Containerization: Docker & Docker Compose

## How to run
```bash
docker-compose up --build


```mermaid
erDiagram
    USERS ||--o{ FACE_EMBEDDINGS : has
    USERS ||--o{ VOICE_EMBEDDINGS : has
    USERS ||--o{ LOGIN_ATTEMPTS : has
    USERS ||--o{ CONSENTS : has
    USERS ||--o{ AUDIT_LOGS : has

    USERS {
        UUID id PK
        string email UNIQUE
        string password_hash
        string pin_hash
        timestamptz created_at
        timestamptz updated_at
    }
    FACE_EMBEDDINGS {
        UUID id PK
        UUID user_id FK
        bytea embedding_enc
        string model
        timestamptz created_at
    }
    VOICE_EMBEDDINGS {
        UUID id PK
        UUID user_id FK
        bytea embedding_enc
        string model
        timestamptz created_at
    }
    LOGIN_ATTEMPTS {
        UUID id PK
        UUID user_id FK NULL
        string method  "face|voice|pin"
        bool success
        float score NULL
        string ip
        timestamptz created_at
    }
    CONSENTS {
        UUID id PK
        UUID user_id FK
        bool accepted
        timestamptz accepted_at
        jsonb details
    }
    AUDIT_LOGS {
        UUID id PK
        UUID user_id FK NULL
        string action
        jsonb details
        timestamptz created_at
    }


```mermaid
sequenceDiagram
  participant UserBrowser
  participant Frontend
  participant Backend
  participant DB
  UserBrowser->>Frontend: open /enroll, grant camera
  Frontend->>UserBrowser: capture 5 frames
  Frontend->>Backend: POST /biometrics/face/enroll (images multipart)
  Backend->>Backend: extract embeddings (model)
  Backend->>Backend: avg_embedding = mean(embeddings)
  Backend->>Backend: ciphertext = encrypt(avg_embedding)
  Backend->>DB: INSERT face_embedding( user_id, ciphertext, model )
  DB-->>Backend: OK
  Backend-->>Frontend: 200 {status: "ok"}
  Frontend-->>UserBrowser: show success



## 6.2 Authentication flow (Face -> Voice -> PIN)
sequenceDiagram
  participant User
  participant Frontend
  participant Backend
  participant DB
  User->>Frontend: choose "Login by Face"
  Frontend->>User: capture frames
  Frontend->>Backend: POST /biometrics/face/verify (images)
  Backend->>Backend: extract embedding
  Backend->>DB: SELECT face_embedding WHERE user_id
  DB-->>Backend: returns encrypted embedding
  Backend->>Backend: decrypt -> stored_embedding
  Backend->>Backend: score = cosine(embedding, stored_embedding)
  alt score >= face_threshold and liveness OK
    Backend->>Frontend: 200 {match:true, score}
    Frontend->>User: logged in
  else if ambiguous or liveness fail
    Backend->>Frontend: 200 {match:false, reason:"ambiguous"}
    Frontend->>User: offer voice auth
    Frontend->>Backend: GET /biometrics/voice/challenge
    Backend-->>Frontend: {challenge}
    Frontend->>User: show challenge
    User->>Frontend: record audio + send
    Frontend->>Backend: POST /biometrics/voice/verify (audio, challenge)
    Backend->>DB: get stored voice embedding
    Backend->>Backend: decrypt, compare
    alt voice pass
      Backend->>Frontend: success
    else
      Frontend->>User: show PIN input
      Frontend->>Backend: POST /auth/login/pin
    end
  end
