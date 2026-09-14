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
    persisted = restarted_store.list_plans()["plans"][0]

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


def test_content_calendar_store_filters_sorts_and_paginates(tmp_path):
    store = ContentCalendarStore(storage_path=tmp_path / "content-calendar.json")
    store.create_plan(
        make_plan(
            topic_title="九月知乎高分选题",
            platform="知乎",
            owner="王轩",
            priority="高",
            status="待适配",
            scheduled_at="2026-09-20T10:00:00.000Z",
            overall_score=92,
        )
    )
    store.create_plan(
        make_plan(
            topic_title="九月公众号低分选题",
            platform="公众号",
            owner="运营同事",
            priority="低",
            status="适配中",
            scheduled_at="2026-09-22T10:00:00.000Z",
            overall_score=75,
        )
    )
    store.create_plan(
        make_plan(
            topic_title="十月知乎最高分选题",
            platform="知乎",
            owner="王轩",
            priority="中",
            status="待适配",
            scheduled_at="2026-10-02T10:00:00.000Z",
            overall_score=98,
        )
    )

    result = store.list_plans(
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
    assert result["page"] == 1
    assert result["page_size"] == 10
    assert [plan["topic_title"] for plan in result["plans"]] == ["九月知乎高分选题"]


def test_content_calendar_api_accepts_filter_sort_and_pagination_params():
    for index in range(3):
      response = client.post(
          "/api/content-calendar/plans",
          json=make_plan(
              topic_title=f"分页内容计划 {index}",
              platform="知乎",
              owner="王轩",
              priority="高" if index < 2 else "低",
              scheduled_at=f"2026-09-2{index}T10:00:00.000Z",
              overall_score=90 + index,
          ).model_dump(),
      )
      assert response.status_code == 201

    response = client.get(
        "/api/content-calendar/plans",
        params={
            "keyword": "分页",
            "platform": "知乎",
            "owner": "王轩",
            "priority": "高",
            "start": "2026-09-20",
            "end": "2026-09-30",
            "sort": "score_desc",
            "page": 1,
            "page_size": 1,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 2
    assert payload["page"] == 1
    assert payload["page_size"] == 1
    assert len(payload["plans"]) == 1
    assert payload["plans"][0]["topic_title"].startswith("分页内容计划")
