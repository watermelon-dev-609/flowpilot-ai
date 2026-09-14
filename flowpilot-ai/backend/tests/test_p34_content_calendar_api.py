from fastapi.testclient import TestClient

from app.content_calendar_store import ContentCalendarStore, ContentPlanCreateRequest, ContentPlanUpdateRequest
from app.main import app


client = TestClient(app)


def make_plan(**overrides):
    payload = {
        "topic_title": "后端内容计划选题",
        "platform": "知乎",
        "brand_name": "武汉微艺达智能科技有限公司",
        "product_name": "智能沙盘",
        "region": "武汉",
        "target_audience": "企业展厅项目负责人",
        "facts": "真实内容计划事实。",
        "overall_score": 91,
        "status": "待适配",
        "scheduled_at": "2026-09-20T10:00:00.000Z",
        "owner": "王轩",
        "priority": "高",
        "content_stage": "待生产",
        "data_mode": "manual",
        "actor": "content-calendar-test",
    }
    payload.update(overrides)
    return ContentPlanCreateRequest(**payload)


def test_content_calendar_plan_survives_store_restart(tmp_path):
    storage_path = tmp_path / "content-calendar.json"
    store = ContentCalendarStore(storage_path=storage_path)
    created = store.create_plan(make_plan())

    store.update_plan(
        created["id"],
        ContentPlanUpdateRequest(
            scheduled_at="2026-09-25T10:00:00.000Z",
            owner="运营同事",
            priority="中",
            content_stage="生产中",
            status="适配中",
            actor="planner",
        ),
    )

    restarted_store = ContentCalendarStore(storage_path=storage_path)
    persisted = restarted_store.list_plans()[0]

    assert persisted["id"] == created["id"]
    assert persisted["scheduled_at"] == "2026-09-25T10:00:00.000Z"
    assert persisted["owner"] == "运营同事"
    assert persisted["priority"] == "中"
    assert persisted["content_stage"] == "生产中"
    assert persisted["status"] == "适配中"
    assert [entry["action"] for entry in persisted["audit_log"]] == ["created", "plan_updated"]


def test_content_calendar_api_lists_and_updates_seed_plan():
    create_response = client.post("/api/content-calendar/plans", json=make_plan(topic_title="API 内容计划").model_dump())

    assert create_response.status_code == 201
    created = create_response.json()

    list_response = client.get("/api/content-calendar/plans")

    assert list_response.status_code == 200
    plans = list_response.json()["plans"]
    assert any(plan["id"] == created["id"] for plan in plans)

    update_response = client.patch(
        f"/api/content-calendar/plans/{created['id']}",
        json={
            "scheduled_at": "2026-09-26T10:00:00.000Z",
            "owner": "API 运营",
            "priority": "低",
            "content_stage": "待审核",
            "status": "已生成",
            "actor": "api-test",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["scheduled_at"] == "2026-09-26T10:00:00.000Z"
    assert updated["owner"] == "API 运营"
    assert updated["priority"] == "低"
    assert updated["content_stage"] == "待审核"
    assert updated["status"] == "已生成"
