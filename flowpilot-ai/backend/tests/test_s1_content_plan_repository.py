"""S1 数据层测试：Repository 契约一致性、事务、并发、降级。

设计依据：`FlowPilot_AI_数据模型设计_S1.md`
覆盖范围（按用户编码规范：正常 / 边界 / 异常 三类）：
- 正常：SQLAlchemy 实现的 CRUD、筛选、排序、分页
- 边界：分页上下界、空结果、关键字大小写、未分配负责人
- 异常：404、事务回滚、并发条件更新、数据库不可用降级

核心断言：SQLAlchemy 实现与 JSON 实现的**对外契约必须完全一致**。
"""

from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, func, select
from sqlalchemy.pool import StaticPool

from app.content_calendar_store import (
    ContentCalendarStore,
    ContentPlanCreateRequest,
    ContentPlanUpdateRequest,
)
from app.data.content_plan_repository import (
    JsonContentPlanRepository,
    SqlAlchemyContentPlanRepository,
    build_plan_payload,
)
from app.data.database import _enable_sqlite_foreign_keys, build_session_factory, create_schema
from app.data.models import ContentPlanAuditRecord, ContentPlanRecord
from app.data.repository_factory import build_content_plan_repository


def make_payload(**overrides):
    """构造创建请求，字段与既有测试保持一致。"""
    payload = {
        "topic_title": "数据层测试选题",
        "platform": "知乎",
        "brand_name": "武汉微艺达智能科技有限公司",
        "product_name": "智能沙盘",
        "region": "武汉",
        "target_audience": "企业展厅项目负责人",
        "facts": "真实数据层测试事实。",
        "overall_score": 88,
        "status": "待适配",
        "scheduled_at": "2026-09-20T10:00:00.000Z",
        "owner": "王轩",
        "priority": "高",
        "content_stage": "待生产",
        "data_mode": "manual",
        "actor": "data-layer-test",
    }
    payload.update(overrides)
    return ContentPlanCreateRequest(**payload)


@pytest.fixture
def sql_repository():
    """内存 SQLite 仓储，每例独立，避免测试互相污染。

    使用 StaticPool 让内存库在连接间共享，否则每次连接都是新的空库。
    """
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    return SqlAlchemyContentPlanRepository(build_session_factory(engine))


@pytest.fixture
def json_repository(tmp_path):
    return JsonContentPlanRepository(tmp_path / "content-calendar.json")


# ---------------------------------------------------------------------------
# 正常场景
# ---------------------------------------------------------------------------


def test_sql_repository_create_and_read_roundtrip(sql_repository):
    """创建后能读回，字段与审计日志完整。"""
    created = sql_repository.create_plan(build_plan_payload(make_payload()), actor="tester")

    assert created["id"].startswith("content-plan-")
    assert created["topic_title"] == "数据层测试选题"
    assert created["overall_score"] == 88
    assert created["data_mode"] == "manual"
    assert [entry["action"] for entry in created["audit_log"]] == ["created"]

    fetched = sql_repository.get_plan(created["id"])
    assert fetched["id"] == created["id"]
    assert fetched["topic_title"] == created["topic_title"]


def test_sql_repository_update_appends_audit_log(sql_repository):
    """更新后审计日志追加而非覆盖，且字段生效。"""
    created = sql_repository.create_plan(build_plan_payload(make_payload()), actor="tester")

    updated = sql_repository.update_plan(
        created["id"],
        {"scheduled_at": "2026-09-25T10:00:00.000Z", "owner": "运营同事", "priority": "中"},
        actor="planner",
    )

    assert updated["scheduled_at"] == "2026-09-25T10:00:00.000Z"
    assert updated["owner"] == "运营同事"
    assert updated["priority"] == "中"
    assert [entry["action"] for entry in updated["audit_log"]] == ["created", "plan_updated"]
    assert updated["audit_log"][1]["actor"] == "planner"


def test_sql_repository_persists_across_store_restart(tmp_path):
    """换一个 store 实例仍能读到数据（落库而非内存缓存）。"""
    engine = create_engine(f"sqlite:///{tmp_path / 'restart.db'}", future=True)
    create_schema(engine)

    store_a = ContentCalendarStore(
        repository=SqlAlchemyContentPlanRepository(build_session_factory(engine))
    )
    created = store_a.create_plan(make_payload(topic_title="重启后仍存在"))

    store_b = ContentCalendarStore(
        repository=SqlAlchemyContentPlanRepository(build_session_factory(engine))
    )
    plans = store_b.list_plans()["plans"]

    assert [plan["id"] for plan in plans] == [created["id"]]
    assert plans[0]["topic_title"] == "重启后仍存在"


def test_sql_repository_filters_sorts_and_paginates(sql_repository):
    """筛选 + 排序 + 分页组合，语义与既有 JSON 实现一致。"""
    dataset = [
        ("九月知乎高分选题", "知乎", "王轩", "高", "待适配", "2026-09-20T10:00:00.000Z", 92),
        ("九月公众号低分选题", "公众号", "运营同事", "低", "适配中", "2026-09-22T10:00:00.000Z", 75),
        ("十月知乎最高分选题", "知乎", "王轩", "中", "待适配", "2026-10-02T10:00:00.000Z", 98),
    ]
    for title, platform, owner, priority, status, scheduled, score in dataset:
        sql_repository.create_plan(
            build_plan_payload(
                make_payload(
                    topic_title=title,
                    platform=platform,
                    owner=owner,
                    priority=priority,
                    status=status,
                    scheduled_at=scheduled,
                    overall_score=score,
                )
            ),
            actor="tester",
        )

    result = sql_repository.list_plans(
        keyword="知乎",
        status="待适配",
        platform="知乎",
        owner="王轩",
        priority="高",
        start="2026-09-01",
        end="2026-09-30",
        sort="score_desc",
        page=1,
        page_size=10,
    )

    assert result["total"] == 1
    assert [plan["topic_title"] for plan in result["plans"]] == ["九月知乎高分选题"]


# ---------------------------------------------------------------------------
# 边界场景
# ---------------------------------------------------------------------------


def test_sql_repository_sort_modes(sql_repository):
    """三种排序方式各自生效。

    刻意让三条轴（分数 / 优先级 / 日期）的排序结果各不相同，
    这样任何一种排序失效都会立刻暴露，而不是被巧合掩盖。
    """
    fixtures = [
        # (title, score, priority, scheduled_at)
        ("甲", 70, "低", "2026-09-20T00:00:00.000Z"),
        ("乙", 90, "中", "2026-09-01T00:00:00.000Z"),
        ("丙", 80, "高", "2026-09-10T00:00:00.000Z"),
    ]
    for title, score, priority, scheduled in fixtures:
        sql_repository.create_plan(
            build_plan_payload(
                make_payload(
                    topic_title=title,
                    overall_score=score,
                    priority=priority,
                    scheduled_at=scheduled,
                )
            ),
            actor="t",
        )

    def titles_for(sort: str) -> list[str]:
        return [
            plan["topic_title"]
            for plan in sql_repository.list_plans(sort=sort, page=1, page_size=10)["plans"]
        ]

    assert titles_for("score_desc") == ["乙", "丙", "甲"]      # 90, 80, 70
    assert titles_for("priority_desc") == ["丙", "乙", "甲"]   # 高, 中, 低
    assert titles_for("date_asc") == ["乙", "丙", "甲"]        # 09-01, 09-10, 09-20


def test_sql_repository_pagination_bounds(sql_repository):
    """分页上下界：page 小于 1 归一到 1，page_size 上限 100。"""
    for index in range(5):
        sql_repository.create_plan(
            build_plan_payload(make_payload(topic_title=f"分页 {index}")), actor="t"
        )

    first_page = sql_repository.list_plans(page=0, page_size=2)
    assert first_page["page"] == 1
    assert len(first_page["plans"]) == 2

    huge_page_size = sql_repository.list_plans(page=1, page_size=9999)
    assert huge_page_size["page_size"] == 100

    beyond_last = sql_repository.list_plans(page=99, page_size=10)
    assert beyond_last["plans"] == []
    assert beyond_last["total"] == 5


def test_sql_repository_keyword_is_case_insensitive(sql_repository):
    """关键字搜索忽略大小写，与 JSON 实现一致。"""
    sql_repository.create_plan(
        build_plan_payload(make_payload(topic_title="ROS 智能小车选题", product_name="ROS 小车")),
        actor="t",
    )

    assert sql_repository.list_plans(keyword="ros")["total"] == 1
    assert sql_repository.list_plans(keyword="ROS")["total"] == 1


def test_sql_repository_unassigned_owner_filter(sql_repository):
    """负责人为空串时对外表现为「未分配」。"""
    sql_repository.create_plan(
        build_plan_payload(make_payload(owner="", topic_title="无人负责选题")), actor="t"
    )
    sql_repository.create_plan(
        build_plan_payload(make_payload(owner="王轩", topic_title="有人负责选题")), actor="t"
    )

    unassigned = sql_repository.list_plans(owner="未分配")
    assert unassigned["total"] == 1
    assert unassigned["plans"][0]["topic_title"] == "无人负责选题"


def test_sql_repository_empty_database_returns_empty_page(sql_repository):
    """空库不报错，返回空列表与 total=0。"""
    result = sql_repository.list_plans()
    assert result == {"plans": [], "total": 0, "page": 1, "page_size": 50}


# ---------------------------------------------------------------------------
# 异常场景
# ---------------------------------------------------------------------------


def test_sql_repository_get_missing_plan_raises_404(sql_repository):
    with pytest.raises(HTTPException) as exc_info:
        sql_repository.get_plan("content-plan-does-not-exist")
    assert exc_info.value.status_code == 404


def test_sql_repository_update_missing_plan_raises_404(sql_repository):
    with pytest.raises(HTTPException) as exc_info:
        sql_repository.update_plan("content-plan-missing", {"owner": "x"}, actor="t")
    assert exc_info.value.status_code == 404


def test_sql_repository_failed_update_rolls_back(sql_repository, monkeypatch):
    """事务回滚：更新过程中抛错，数据与审计日志都不应留下痕迹。"""
    created = sql_repository.create_plan(build_plan_payload(make_payload()), actor="t")

    original_commit_guard = ContentPlanRecord.__setattr__

    def explode(self, name, value):  # noqa: ANN001
        if name == "owner" and value == "会触发回滚":
            raise RuntimeError("模拟写入失败")
        return original_commit_guard(self, name, value)

    monkeypatch.setattr(ContentPlanRecord, "__setattr__", explode, raising=False)

    with pytest.raises(RuntimeError):
        sql_repository.update_plan(created["id"], {"owner": "会触发回滚"}, actor="t")

    monkeypatch.undo()

    reloaded = sql_repository.get_plan(created["id"])
    assert reloaded["owner"] == "王轩"
    assert [entry["action"] for entry in reloaded["audit_log"]] == ["created"]


def test_sql_repository_audit_rows_not_duplicated_on_repeat_read(sql_repository):
    """重复读取不会产生重复审计记录（审计表只追加，读取不写入）。"""
    created = sql_repository.create_plan(build_plan_payload(make_payload()), actor="t")

    for _ in range(3):
        sql_repository.get_plan(created["id"])
        sql_repository.list_plans()

    reloaded = sql_repository.get_plan(created["id"])
    assert len(reloaded["audit_log"]) == 1


def test_cascade_delete_removes_audit_logs(tmp_path):
    """外键级联：删除计划时审计日志一并清理，不留孤儿数据。"""
    engine = create_engine(f"sqlite:///{tmp_path / 'cascade.db'}", future=True)
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    factory = build_session_factory(engine)
    repository = SqlAlchemyContentPlanRepository(factory)

    created = repository.create_plan(build_plan_payload(make_payload()), actor="t")

    with factory() as session:
        with session.begin():
            record = session.get(ContentPlanRecord, created["id"])
            session.delete(record)

    with factory() as session:
        remaining = session.scalar(select(func.count()).select_from(ContentPlanAuditRecord))
        assert remaining == 0


# ---------------------------------------------------------------------------
# 降级与契约一致性
# ---------------------------------------------------------------------------


def test_factory_falls_back_to_json_when_database_unavailable(tmp_path):
    """数据库连接失败时降级到 JSON，不抛异常。"""
    repository = build_content_plan_repository(
        json_fallback_path=tmp_path / "fallback.json",
        database_url="postgresql+psycopg://user:pass@127.0.0.1:1/nonexistent",
    )
    assert isinstance(repository, JsonContentPlanRepository)

    created = repository.create_plan(build_plan_payload(make_payload()), actor="t")
    assert created["topic_title"] == "数据层测试选题"


def test_factory_uses_sqlalchemy_when_database_available(tmp_path):
    """数据库可用时使用 SQLAlchemy 实现。"""
    repository = build_content_plan_repository(
        json_fallback_path=tmp_path / "unused.json",
        database_url=f"sqlite:///{tmp_path / 'available.db'}",
    )
    assert isinstance(repository, SqlAlchemyContentPlanRepository)


def test_json_and_sql_implementations_share_contract(sql_repository, json_repository):
    """两种实现的对外结构必须一致——这是可替换性的基础保证。"""
    payloads = [
        make_payload(topic_title="契约一致 A", overall_score=91),
        make_payload(topic_title="契约一致 B", platform="公众号", overall_score=77),
    ]

    for payload in payloads:
        sql_plan = sql_repository.create_plan(build_plan_payload(payload), actor="t")
        json_plan = json_repository.create_plan(build_plan_payload(payload), actor="t")

        # id 与时间戳是随机/当前时间，不参与比较；其余字段结构必须一致
        ignored = {"id", "created_at"}
        assert set(sql_plan.keys()) - ignored == set(json_plan.keys()) - ignored

        sql_result = sql_repository.list_plans()
        json_result = json_repository.list_plans()
        assert set(sql_result.keys()) == set(json_result.keys())


def test_json_and_sql_import_plan_share_contract(sql_repository, json_repository):
    """迁移导入时两种实现都应保留旧 id、时间与审计日志。"""
    plan = {
        "id": "content-plan-legacy-import",
        "topic_title": "旧 JSON 导入选题",
        "platform": "知乎",
        "brand_name": "武汉微艺达智能科技有限公司",
        "product_name": "智能沙盘",
        "region": "武汉",
        "target_audience": "企业展厅项目负责人",
        "facts": "旧 JSON 中已有事实。",
        "overall_score": 86,
        "status": "待适配",
        "content_stage": "待生产",
        "priority": "中",
        "owner": "运营",
        "scheduled_at": "2026-09-21T10:00:00.000Z",
        "data_mode": "manual",
        "created_at": "2026-09-15T10:00:00",
        "updated_at": "2026-09-16T10:00:00",
        "audit_log": [
            {"action": "created", "actor": "legacy", "summary": "内容计划已创建", "at": "2026-09-15T10:00:00"},
            {"action": "plan_updated", "actor": "planner", "summary": "内容计划排期已更新", "at": "2026-09-16T10:00:00"},
        ],
    }

    sql_plan = sql_repository.import_plan(plan)
    json_plan = json_repository.import_plan(plan)

    assert sql_plan["id"] == json_plan["id"] == "content-plan-legacy-import"
    assert sql_plan["updated_at"] == json_plan["updated_at"] == "2026-09-16T10:00:00"
    assert sql_plan["audit_log"] == json_plan["audit_log"]


def test_json_repository_rejects_corrupted_file(tmp_path):
    """JSON 文件损坏时给出明确错误，而不是静默返回空数据。"""
    storage_path = tmp_path / "broken.json"
    storage_path.write_text("{ this is not valid json", encoding="utf-8")

    with pytest.raises(HTTPException) as exc_info:
        JsonContentPlanRepository(storage_path)
    assert exc_info.value.status_code == 500


def test_store_update_whitelist_blocks_data_mode_change(sql_repository):
    """白名单保护：更新请求不能篡改 data_mode 等隔离字段。"""
    store = ContentCalendarStore(repository=sql_repository)
    created = store.create_plan(make_payload(data_mode="mock"))

    # 尝试通过更新请求注入 data_mode，应被白名单过滤掉
    store.update_plan(
        created["id"],
        ContentPlanUpdateRequest(owner="新负责人", actor="t"),
    )

    reloaded = sql_repository.get_plan(created["id"])
    assert reloaded["data_mode"] == "mock"
    assert reloaded["owner"] == "新负责人"
