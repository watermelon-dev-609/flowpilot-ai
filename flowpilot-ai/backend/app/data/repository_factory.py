"""仓储工厂：按环境选择存储实现，失败时降级。

设计依据：`FlowPilot_AI_数据模型设计_S1.md` §4.2

降级策略：
    尝试连接数据库
      ├── 成功 → SqlAlchemyContentPlanRepository
      └── 失败 → JsonContentPlanRepository（记录警告，不中断服务）

「不中断服务」是关键：离线 Demo 是本项目的既定能力，不能因为数据库不可用而白屏。
"""

from __future__ import annotations

import logging
from pathlib import Path

from sqlalchemy import Engine

from app.data.content_plan_repository import (
    ContentPlanRepository,
    JsonContentPlanRepository,
    SqlAlchemyContentPlanRepository,
)
from app.data.database import build_engine, build_session_factory, create_schema

logger = logging.getLogger(__name__)

DEFAULT_JSON_FALLBACK_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "content-calendar.local.json"
)


def build_content_plan_repository(
    json_fallback_path: str | Path | None = None,
    database_url: str | None = None,
    engine: Engine | None = None,
) -> ContentPlanRepository:
    """构建内容计划仓储。

    优先使用数据库；连接或建表失败时降级到 JSON，并记录警告日志。
    """
    fallback_path = Path(json_fallback_path) if json_fallback_path else DEFAULT_JSON_FALLBACK_PATH

    try:
        active_engine = engine or build_engine(database_url)
        create_schema(active_engine)
        # 主动探测连接，避免延迟到首次查询才失败
        with active_engine.connect():
            pass
        session_factory = build_session_factory(active_engine)
        logger.info("内容计划仓储使用数据库实现：%s", active_engine.url.render_as_string(hide_password=True))
        return SqlAlchemyContentPlanRepository(session_factory)
    except Exception as exc:  # noqa: BLE001 - 降级需要捕获所有连接类异常
        logger.warning("数据库不可用，内容计划仓储降级为本地 JSON：%s", exc)
        return JsonContentPlanRepository(fallback_path)
