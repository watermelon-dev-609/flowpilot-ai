from fastapi.testclient import TestClient

from app.main import app
from app.publish_queue_store import PublishQueueCreateRequest, PublishQueueStore, PublishQueueUpdateRequest


client = TestClient(app)


def make_publish_item(**overrides):
    payload = {
        "id": "queue-plan-1",
        "version_id": "content-calendar-plan-1",
        "topic_title": "武汉智能沙盘厂家怎么选？",
        "source_topic_title": "武汉智能沙盘厂家怎么选？",
        "platform_count": 2,
        "platform_drafts": [
            {
                "platform_id": "wechat",
                "platform_name": "微信公众号",
                "title": "武汉智能沙盘厂家怎么选？先看交付能力",
                "review_status": "审核通过",
            }
        ],
        "status": "ready",
        "queued_at": "2026-09-15T10:00:00.000Z",
        "planned_publish_at": "2026-09-20T10:00",
        "actor": "publish-queue-test",
    }
    payload.update(overrides)
    return PublishQueueCreateRequest(**payload)


def test_publish_queue_item_survives_store_restart(tmp_path):
    storage_path = tmp_path / "publish-queue.json"
    store = PublishQueueStore(storage_path=storage_path)
    created = store.upsert_item(make_publish_item())

    store.update_item(
        created["id"],
        PublishQueueUpdateRequest(
            status="published",
            publishing_channel="搜狐号",
            operator_name="王轩",
            actual_publish_at="2026-09-21T09:30",
            published_url="https://example.com/articles/wuhan-sandbox",
            operator_note="已人工发布，进入监测复盘。",
            actor="publisher",
        ),
    )

    restarted_store = PublishQueueStore(storage_path=storage_path)
    persisted = restarted_store.list_items()["items"][0]

    assert persisted["id"] == "queue-plan-1"
    assert persisted["version_id"] == "content-calendar-plan-1"
    assert persisted["status"] == "published"
    assert persisted["published_url"] == "https://example.com/articles/wuhan-sandbox"
    assert [entry["action"] for entry in persisted["audit_log"]] == ["created", "record_updated"]


def test_publish_queue_store_deduplicates_by_version_id(tmp_path):
    store = PublishQueueStore(storage_path=tmp_path / "publish-queue.json")

    first = store.upsert_item(make_publish_item(topic_title="第一版标题"))
    second = store.upsert_item(make_publish_item(id="queue-plan-1-copy", topic_title="更新后的标题"))

    listed = store.list_items()["items"]

    assert first["id"] == second["id"]
    assert len(listed) == 1
    assert listed[0]["topic_title"] == "更新后的标题"
    assert [entry["action"] for entry in listed[0]["audit_log"]] == ["created", "queue_refreshed"]


def test_publish_queue_api_lists_creates_and_updates_record():
    create_response = client.post("/api/publish-queue/items", json=make_publish_item(id="api-queue-plan-1", version_id="api-version-1").model_dump())

    assert create_response.status_code == 201
    created = create_response.json()

    list_response = client.get("/api/publish-queue/items")
    assert list_response.status_code == 200
    assert any(item["id"] == created["id"] for item in list_response.json()["items"])

    update_response = client.patch(
        f"/api/publish-queue/items/{created['id']}",
        json={
            "status": "published",
            "actual_publish_at": "2026-09-21T09:30",
            "published_url": "https://example.com/articles/wuhan-sandbox",
            "operator_name": "王轩",
            "actor": "api-test",
        },
    )

    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["status"] == "published"
    assert updated["published_url"] == "https://example.com/articles/wuhan-sandbox"
