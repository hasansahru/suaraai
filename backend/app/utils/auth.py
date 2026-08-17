"""
auth.py — Utilitas autentikasi sederhana (file-based, JWT + bcrypt).

User data disimpan di `settings/users.json`.
Password di-hash dengan bcrypt. Session menggunakan JWT token.
"""

from __future__ import annotations

import json
import os
import time
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# ── Dependencies ─────────────────────────────────────────────
try:
    import bcrypt
    _BCRYPT_AVAILABLE = True
except ImportError:
    _BCRYPT_AVAILABLE = False
    logger.warning("bcrypt tidak terinstal. Autentikasi tidak tersedia.")

try:
    import jwt as pyjwt
    _JWT_AVAILABLE = True
except ImportError:
    _JWT_AVAILABLE = False
    logger.warning("PyJWT tidak terinstal. Autentikasi tidak tersedia.")

# ── Config ───────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS_DIR = os.path.join(BASE_DIR, "settings")
USERS_FILE = os.path.join(SETTINGS_DIR, "users.json")

# Secret key — dalam produksi, gunakan env variable
JWT_SECRET = os.environ.get("JWT_SECRET", "ai-suara-modern-secret-key-2024-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # Token berlaku 7 hari


@dataclass
class UserInfo:
    username: str
    display_name: str
    role: str  # "admin" atau "user"


def _load_users() -> dict:
    """Muat data users dari file JSON."""
    if not os.path.exists(USERS_FILE):
        return {"users": []}
    try:
        with open(USERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"users": []}


def _save_users(data: dict) -> None:
    """Simpan data users ke file JSON."""
    os.makedirs(SETTINGS_DIR, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _hash_password(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    if not _BCRYPT_AVAILABLE:
        raise RuntimeError("bcrypt tidak terinstal.")
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    """Verifikasi password terhadap hash bcrypt."""
    if not _BCRYPT_AVAILABLE:
        return False
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def init_default_admin() -> None:
    """
    Buat akun admin default jika belum ada user sama sekali.
    Username: admin, Password: admin123
    """
    data = _load_users()
    if len(data.get("users", [])) > 0:
        return  # Sudah ada user, skip

    admin_user = {
        "username": "admin",
        "password_hash": _hash_password("admin123"),
        "display_name": "Administrator",
        "role": "admin",
        "created_at": time.time(),
    }
    data["users"] = [admin_user]
    _save_users(data)
    logger.info("Akun admin default dibuat (username: admin, password: admin123)")


def register_user(
    username: str,
    password: str,
    display_name: str,
    role: str = "user",
) -> UserInfo:
    """
    Daftarkan user baru. Raise ValueError jika username sudah ada.
    """
    if not username or not password:
        raise ValueError("Username dan password wajib diisi.")
    if len(password) < 4:
        raise ValueError("Password minimal 4 karakter.")

    data = _load_users()
    users = data.get("users", [])

    # Cek duplikat
    for u in users:
        if u["username"].lower() == username.lower():
            raise ValueError(f"Username '{username}' sudah terdaftar.")

    new_user = {
        "username": username.strip(),
        "password_hash": _hash_password(password),
        "display_name": display_name.strip() or username.strip(),
        "role": role,
        "created_at": time.time(),
    }
    users.append(new_user)
    data["users"] = users
    _save_users(data)

    return UserInfo(
        username=new_user["username"],
        display_name=new_user["display_name"],
        role=new_user["role"],
    )


def authenticate(username: str, password: str) -> UserInfo:
    """
    Autentikasi user. Raise ValueError jika gagal.
    """
    data = _load_users()
    users = data.get("users", [])

    for u in users:
        if u["username"].lower() == username.lower():
            if _verify_password(password, u["password_hash"]):
                return UserInfo(
                    username=u["username"],
                    display_name=u["display_name"],
                    role=u.get("role", "user"),
                )
            else:
                raise ValueError("Password salah.")

    raise ValueError("Username tidak ditemukan.")


def generate_token(user: UserInfo) -> str:
    """Generate JWT token untuk user yang sudah terautentikasi."""
    if not _JWT_AVAILABLE:
        raise RuntimeError("PyJWT tidak terinstal.")

    payload = {
        "sub": user.username,
        "name": user.display_name,
        "role": user.role,
        "iat": int(time.time()),
        "exp": int(time.time()) + (JWT_EXPIRATION_HOURS * 3600),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> UserInfo:
    """
    Verifikasi JWT token. Raise ValueError jika invalid/expired.
    """
    if not _JWT_AVAILABLE:
        raise RuntimeError("PyJWT tidak terinstal.")

    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return UserInfo(
            username=payload["sub"],
            display_name=payload.get("name", payload["sub"]),
            role=payload.get("role", "user"),
        )
    except pyjwt.ExpiredSignatureError:
        raise ValueError("Token sudah kadaluarsa. Silakan login ulang.")
    except pyjwt.InvalidTokenError:
        raise ValueError("Token tidak valid.")


def get_all_users() -> list[dict]:
    """Ambil daftar semua user (tanpa password hash)."""
    data = _load_users()
    result = []
    for u in data.get("users", []):
        result.append({
            "username": u["username"],
            "display_name": u["display_name"],
            "role": u.get("role", "user"),
        })
    return result
