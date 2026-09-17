"""S1.6 内容计划 JSON 到数据库迁移测试。"""

from __future__ import annotations

import json

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.data.content_plan_repository import SqlAlchemyContentPlanRepository
from app.data.database import _enable_sqlite_foreign_keys, build_session_factory, create_schema
from app.data.migrate_content_plans import import_content_plans_from_json


@pytest.fixture
def sql_repository():
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    return SqlAlchemyContentPlanRepository(build_session_factory(engine))


def make_plan(**overrides):
    plan = {
        "id": "content-plan-imported-001",
        "topic_title": "迁移脚本测试选题",
        "platform": "知乎",
        "brand_name": "武汉微艺达智能科技有限公司",
        "product_name": "智能沙盘",
        "region": "武汉",
        "target_audience": "企业展厅项目负责人",
        "facts": "迁移脚本使用的真实测试事实。",
        "overall_score": 91,
        "status": "待适配",
        "content_stage": "待生产",
        "priority": "高",
        "owner": "王轩",
        "scheduled_at": "2026-09-20T10:00:00.000Z",
        "data_mode": "manual",
        "created_at": "2026-09-15T12:00:00",
        "updated_at": "2026-09-16T09:00:00",
        "audit_log": [
            {
                "action": "created",
                "actor": "legacy-json",
                "summary": "内容计划已创建",
                "at": "2026-09-15T12:00:00",
            },
            {
                "action": "plan_updated",
                "actor": "planner",
                "summary": "内容计划排期已更新",
                "at": "2026-09-16T09:00:00",
            },
        ],
    }
    plan.update(overrides)
    return plan


def write_source(path, plans):
    path.write_text(
        json.dumps({"schema_version": 1, "updated_at": "2026-09-16T09:30:00", "plans": plans}, ensure_ascii=False),
        encoding="utf-8",
    )


def test_import_content_plans_preserves_existing_ids_and_audit_logs(tmp_path, sql_repository):
    source_path = tmp_path / "content-calendar.local.json"
    write_source(source_path, [make_plan()])

    summary = import_content_plans_from_json(source_path, sql_repository)

    imported = sql_repository.get_plan("content-plan-imported-001")
    assert summary == {"created": 1, "skipped": 0, "total": 1}
    assert imported["id"] == "content-plan-imported-001"
    assert imported["topic_title"] == "迁移脚本测试选题"
    assert imported["created_at"] == "2026-09-15T12:00:00"
    assert imported["updated_at"] == "2026-09-16T09:00:00"
    assert [entry["actor"] for entry in imported["audit_log"]] == ["legacy-json", "planner"]


def test_import_content_plans_is_idempotent(tmp_path, sql_repository):
    source_path = tmp_path / "content-calendar.local.json"
    write_source(source_path, [make_plan()])

    first = import_content_plans_from_json(source_path, sql_repository)
    second = import_content_plans_from_json(source_path, sql_repository)

    assert first == {"created": 1, "skipped": 0, "total": 1}
    assert second == {"created": 0, "skipped": 1, "total": 1}
    assert sql_repository.list_plans()["total"] == 1
    assert len(sql_repository.get_plan("content-plan-imported-001")["audit_log"]) == 2


def test_import_content_plans_rejects_corrupted_json(tmp_path, sql_repository):
    source_path = tmp_path / "broken-content-calendar.local.json"
    source_path.write_text("{ not valid json", encoding="utf-8")

    with pytest.raises(HTTPException) as exc_info:
        import_content_plans_from_json(source_path, sql_repository)

    assert exc_info.value.status_code == 500
    assert "内容计划迁移源文件损坏" in exc_info.value.detail
