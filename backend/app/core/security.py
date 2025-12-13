from argon2 import PasswordHasher
from argon2.low_level import Type
from argon2.exceptions import VerifyMismatchError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

# Настройки Argon2 для паролей (более медленно и безопасно)
password_hasher = PasswordHasher(
    time_cost=3,       # Кол-во итераций
    memory_cost=64 * 1024,  # 64 MB
    parallelism=2,
    hash_len=32,
    type=Type.ID       # Argon2id — самая безопасная комбинация
)

# Настройки Argon2 для PIN (немного быстрее)
pin_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=32 * 1024,  # 32 MB
    parallelism=1,
    hash_len=16,
    type=Type.ID
)


# === Пароли ===
def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return password_hasher.verify(hashed, plain)
    except VerifyMismatchError:
        return False



# === PIN-коды ===
def hash_pin(pin: str) -> str:
    if not pin.isdigit():
        raise ValueError("PIN must contain only digits!")

    if len(pin) < 4:
        raise ValueError("PIN must be at least 4 digits!")

    return pin_hasher.hash(pin)


def verify_pin(plain: str, hashed: str) -> bool:
    try:
        return pin_hasher.verify(hashed, plain)
    except VerifyMismatchError:
        return False

hex_key = "9b0fae9a72c19589f4cb5ec9258e3bb37205c1635c8de7d05a4d398c4c8ef434"
AES_KEY = bytes.fromhex(hex_key)

def encrypt_data(data: str | bytes) -> bytes:
    if isinstance(data, str):
        data = data.encode('utf-8')
    aesgcm = AESGCM(AES_KEY)
    nonce = os.urandom(12)
    encrypted = aesgcm.encrypt(nonce, data, None)
    return nonce + encrypted

def decrypt_data(encrypted: bytes) -> bytes:
    aesgcm = AESGCM(AES_KEY)
    nonce = encrypted[:12]
    ct = encrypted[12:]
    return aesgcm.decrypt(nonce, ct, None)