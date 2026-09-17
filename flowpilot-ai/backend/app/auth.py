"""鉴权与会话管理。"""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta
from typing import Literal

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from app.data.database import build_engine, build_session_factory, create_schema
from app.data.models import AuthSessionRecord, AuthUserRecord

UserRole = Literal["admin", "operator"]

_PASSWORD_ITERATIONS = 120_000
_security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str
    user: dict[str, str]


class AuthService:
    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def ensure_default_admin(
        self,
        email: str | None = None,
        password: str | None = None,
        display_name: str | None = None,
    ) -> None:
        admin_email = (email or os.environ.get("FLOWPILOT_ADMIN_EMAIL") or "admin@flowpilot.local").strip().lower()
        admin_password = password or os.environ.get("FLOWPILOT_ADMIN_PASSWORD") or "FlowPilot123!"
        admin_name = display_name or os.environ.get("FLOWPILOT_ADMIN_NAME") or "FlowPilot 管理员"
        now = _now()

        with self._session_factory() as session:
            with session.begin():
                user = session.scalar(select(AuthUserRecord).where(AuthUserRecord.email == admin_email))
                if user is None:
                    session.add(
                        AuthUserRecord(
                            user_id="user-default-admin",
                            email=admin_email,
                            display_name=admin_name,
                            password_hash=hash_password(admin_password),
                            role="admin",
                            is_active=True,
                            created_at=now,
                            updated_at=now,
                        )
                    )
                else:
                    user.display_name = admin_name
                    user.password_hash = hash_password(admin_password)
                    user.role = "admin"
                    user.is_active = True
                    user.updated_at = now

    def login(self, email: str, password: str) -> dict[str, object]:
        normalized_email = email.strip().lower()
        with self._session_factory() as session:
            user = session.scalar(select(AuthUserRecord).where(AuthUserRecord.email == normalized_email))
            if user is None or not user.is_active or not verify_password(password, user.password_hash):
                raise HTTPException(status_code=401, detail="邮箱或密码错误")

            token = secrets.token_urlsafe(32)
            now = _now()
            expires_at = (datetime.now() + timedelta(hours=8)).replace(microsecond=0).isoformat()
            session.add(
                AuthSessionRecord(
                    token=token,
                    user_id=user.user_id,
                    created_at=now,
                    expires_at=expires_at,
                )
            )
            session.commit()
            return {
                "access_token": token,
                "token_type": "bearer",
                "expires_at": expires_at,
                "user": _serialize_user(user),
            }

    def current_user(self, token: str) -> dict[str, str]:
        with self._session_factory() as session:
            auth_session = session.get(AuthSessionRecord, token)
            if auth_session is None:
                raise HTTPException(status_code=401, detail="未登录或登录状态无效")

            if _parse_dt(auth_session.expires_at) <= datetime.now():
                session.delete(auth_session)
                session.commit()
                raise HTTPException(status_code=401, detail="登录状态已过期")

            user = session.get(AuthUserRecord, auth_session.user_id)
            if user is None or not user.is_active:
                raise HTTPException(status_code=401, detail="账号不可用")

            return _serialize_user(user)

    def logout(self, token: str) -> None:
        with self._session_factory() as session:
            auth_session = session.get(AuthSessionRecord, token)
            if auth_session is not None:
                session.delete(auth_session)
                session.commit()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), _PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${_PASSWORD_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, expected = password_hash.split("$", 3)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations))
    return hmac.compare_digest(digest.hex(), expected)


def bearer_token(credentials: HTTPAuthorizationCredentials | None = Depends(_security)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise HTTPException(status_code=401, detail="缺少登录凭证")
    return credentials.credentials


def get_current_user(token: str = Depends(bearer_token)) -> dict[str, str]:
    return auth_service.current_user(token)


def get_admin_user(user: dict[str, str] = Depends(get_current_user)) -> dict[str, str]:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return user


def _serialize_user(user: AuthUserRecord) -> dict[str, str]:
    return {
        "user_id": user.user_id,
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role,
    }


def _parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _now() -> str:
    return datetime.now().replace(microsecond=0).isoformat()


_engine = build_engine()
create_schema(_engine)
auth_service = AuthService(build_session_factory(_engine))
auth_service.ensure_default_admin()


__all__ = [
    "AuthService",
    "LoginRequest",
    "LoginResponse",
    "auth_service",
    "bearer_token",
    "get_admin_user",
    "get_current_user",
    "hash_password",
    "verify_password",
]
