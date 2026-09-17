"""数据库连接与会话管理。

设计依据：`FlowPilot_AI_数据模型设计_S1.md` §4.2

支持 PostgreSQL（生产目标）与 SQLite（当前开发/测试环境）：
- 连接串通过环境变量 `FLOWPILOT_DATABASE_URL` 注入，禁止硬编码。
- 未配置环境变量时回退到本地 SQLite 文件。
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.data.models import Base

DEFAULT_SQLITE_PATH = Path(__file__).resolve().parents[2] / "data" / "flowpilot.local.db"


def resolve_database_url() -> str:
    """解析数据库连接串。

    优先级：环境变量 > 本地 SQLite 回退。
    禁止硬编码连接串与凭据（用户编码规范「配置与密钥」）。
    """
    configured = os.environ.get("FLOWPILOT_DATABASE_URL", "").strip()
    if configured:
        return configured
    return f"sqlite:///{DEFAULT_SQLITE_PATH}"


def build_engine(database_url: str | None = None) -> Engine:
    """创建数据库引擎。

    SQLite 需要显式开启外键约束，否则 ON DELETE CASCADE 不生效。
    """
    url = database_url or resolve_database_url()
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    engine = create_engine(url, future=True, connect_args=connect_args)

    if url.startswith("sqlite"):
        _enable_sqlite_foreign_keys(engine)

    return engine


def _enable_sqlite_foreign_keys(engine: Engine) -> None:
    """SQLite 默认关闭外键约束，需按连接开启。"""

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_schema(engine: Engine) -> None:
    """建表。

    当前阶段不用 Alembic（YAGNI）：只有两张新表，`create_all` 够用。
    引入 Alembic 的时机是表结构开始演进、需要可追溯迁移历史时。
    """
    Base.metadata.create_all(engine)


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)
