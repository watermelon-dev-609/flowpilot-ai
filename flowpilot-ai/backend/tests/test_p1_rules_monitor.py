from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_ai_channel_rules_expose_source_version_and_review_fields():
    response = client.get("/api/rules/ai-channels")

    assert response.status_code == 200
    data = response.json()
    assert data["channel_type"] == "ai"
    assert data["data_mode"] == "mock"
    assert data["source_policy"] == "official_first_manual_confirmed"
    assert len(data["rules"]) >= 3

    rule = data["rules"][0]
    assert {
        "rule_id",
        "channel_id",
        "channel_name",
        "rule_title",
        "source_type",
        "updated_at",
        "version",
        "confidence",
        "review_status",
        "effective_status",
        "change_log",
    }.issubset(rule)


def test_publishing_channel_rules_are_separate_from_ai_channel_rules():
    response = client.get("/api/rules/publishing-channels")

    assert response.status_code == 200
    data = response.json()
    assert data["channel_type"] == "publishing"
    assert data["data_mode"] == "mock"
    assert len(data["rules"]) >= 3
    assert {rule["channel_id"] for rule in data["rules"]} >= {
        "wechat_mp",
        "xiaohongshu",
        "zhihu",
    }


def test_geo_monitor_sessions_preserve_real_vs_mock_data_mode():
    response = client.get("/api/geo-monitor/sessions")

    assert response.status_code == 200
    data = response.json()
    assert data["data_mode"] == "mock"
    assert data["evidence_levels"] == {
        "0": "未出现",
        "1": "出现相关概念",
        "2": "品牌被提及",
        "3": "页面被检索到",
        "4": "页面作为来源被引用",
    }
    assert len(data["sessions"]) >= 1
    assert data["sessions"][0]["mock_notice"] == "示例数据，不计入真实 GEO 效果"


def test_geo_monitor_records_include_raw_evidence_and_citation_level():
    response = client.get("/api/geo-monitor/records")

    assert response.status_code == 200
    data = response.json()
    assert data["data_mode"] == "mock"
    assert len(data["records"]) >= 3

    record = data["records"][0]
    assert {
        "record_id",
        "query",
        "ai_channel",
        "target_brand",
        "target_url",
        "checked_at",
        "evidence_level",
        "brand_mentioned",
        "page_retrieved",
        "source_cited",
        "raw_response",
        "manual_review_status",
        "data_mode",
    }.issubset(record)
    assert record["data_mode"] == "mock"
