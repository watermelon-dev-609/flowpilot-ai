"""S2 鉴权与会话测试。"""

from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.pool import StaticPool

from app.data.database import _enable_sqlite_foreign_keys, build_session_factory, create_schema
from app.main import app


client = TestClient(app)


def make_session_factory():
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    return build_session_factory(engine)


def test_auth_service_creates_default_admin_and_verifies_password():
    from app.auth import AuthService

    service = AuthService(make_session_factory())
    service.ensure_default_admin(email="admin@example.com", password="Secret123!", display_name="管理员")

    login = service.login("admin@example.com", "Secret123!")

    assert login["access_token"]
    assert login["user"] == {
        "user_id": "user-default-admin",
        "email": "admin@example.com",
        "display_name": "管理员",
        "role": "admin",
    }


def test_auth_service_rejects_invalid_password():
    from app.auth import AuthService

    service = AuthService(make_session_factory())
    service.ensure_default_admin(email="admin@example.com", password="Secret123!", display_name="管理员")

    with pytest.raises(HTTPException) as exc_info:
        service.login("admin@example.com", "bad-password")

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "邮箱或密码错误"


def test_auth_service_rejects_expired_session():
    from app.auth import AuthService
    from app.data.models import AuthSessionRecord

    session_factory = make_session_factory()
    service = AuthService(session_factory)
    service.ensure_default_admin(email="admin@example.com", password="Secret123!", display_name="管理员")
    login = service.login("admin@example.com", "Secret123!")

    with session_factory() as session:
        auth_session = session.scalar(
            select(AuthSessionRecord).where(AuthSessionRecord.token == login["access_token"])
        )
        assert auth_session is not None
        auth_session.expires_at = (datetime.now() - timedelta(minutes=1)).isoformat()
        session.commit()

    with pytest.raises(HTTPException) as exc_info:
        service.current_user(login["access_token"])

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "登录状态已过期"


def test_auth_service_hashes_password_in_database():
    from app.auth import AuthService
    from app.data.models import AuthUserRecord

    session_factory = make_session_factory()
    service = AuthService(session_factory)
    service.ensure_default_admin(email="admin@example.com", password="Secret123!", display_name="管理员")

    with session_factory() as session:
        user = session.scalar(select(AuthUserRecord).where(AuthUserRecord.email == "admin@example.com"))

    assert user is not None
    assert user.password_hash != "Secret123!"
    assert user.password_hash.startswith("pbkdf2_sha256$")


def test_auth_api_login_me_and_logout_flow():
    login_response = client.post(
        "/api/auth/login",
        json={"email": "admin@flowpilot.local", "password": "FlowPilot123!"},
    )

    assert login_response.status_code == 200
    login_payload = login_response.json()
    token = login_payload["access_token"]

    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "admin@flowpilot.local"
    assert me_response.json()["role"] == "admin"

    logout_response = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_response.status_code == 204

    expired_me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert expired_me_response.status_code == 401
