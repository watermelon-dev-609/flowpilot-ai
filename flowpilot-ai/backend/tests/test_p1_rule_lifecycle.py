from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def make_rule_payload(**overrides):
    payload = {
        "channel_type": "ai",
        "channel_id": "deepseek",
        "channel_name": "DeepSeek",
        "rule_title": "P1.3 测试规则",
        "rule_summary": "用于验证规则新增、编辑和状态流转。",
        "source_type": "manual_verified",
        "source_url": "https://example.com/rule-source",
        "confidence": 0.82,
        "data_mode": "manual",
        "actor": "codex-test",
    }
    payload.update(overrides)
    return payload


def test_create_rule_adds_required_model_fields_and_audit_log():
    response = client.post("/api/rules", json=make_rule_payload(rule_title="P1.3 新增规则"))

    assert response.status_code == 201
    data = response.json()

    assert data["channel_type"] == "ai"
    assert data["rule_title"] == "P1.3 新增规则"
    assert data["review_status"] == "待确认"
    assert data["effective_status"] == "草稿"
    assert data["data_mode"] == "manual"
    assert data["version"] == "0.1.0"
    assert len(data["audit_log"]) == 1
    assert data["audit_log"][0]["action"] == "created"
    assert data["audit_log"][0]["actor"] == "codex-test"


def test_list_rules_can_filter_by_channel_type():
    client.post("/api/rules", json=make_rule_payload(channel_type="publishing", channel_id="zhihu", channel_name="知乎"))

    response = client.get("/api/rules?channel_type=publishing")

    assert response.status_code == 200
    data = response.json()
    assert data["channel_type"] == "publishing"
    assert all(rule["channel_type"] == "publishing" for rule in data["rules"])
    assert any(rule["channel_id"] == "zhihu" for rule in data["rules"])


def test_update_rule_changes_editable_fields_and_appends_audit_log():
    created = client.post("/api/rules", json=make_rule_payload(rule_title="P1.3 编辑前")).json()

    response = client.patch(
        f"/api/rules/{created['rule_id']}",
        json={
            "rule_title": "P1.3 编辑后",
            "rule_summary": "编辑后的规则摘要。",
            "confidence": 0.91,
            "source_type": "official_docs",
            "source_url": "https://example.com/official",
            "actor": "editor-test",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["rule_title"] == "P1.3 编辑后"
    assert data["confidence"] == 0.91
    assert data["source_type"] == "official_docs"
    assert data["version"] == "0.1.1"
    assert data["audit_log"][-1]["action"] == "updated"
    assert data["audit_log"][-1]["actor"] == "editor-test"


def test_confirm_rule_requires_non_mock_source_and_sufficient_confidence():
    mock_rule = client.post(
        "/api/rules",
        json=make_rule_payload(rule_title="不能确认的 Mock 规则", data_mode="mock", confidence=0.95),
    ).json()
    low_confidence_rule = client.post(
        "/api/rules",
        json=make_rule_payload(rule_title="低置信度规则", data_mode="manual", confidence=0.5),
    ).json()
    valid_rule = client.post(
        "/api/rules",
        json=make_rule_payload(rule_title="可确认规则", data_mode="manual", confidence=0.88),
    ).json()

    mock_response = client.post(f"/api/rules/{mock_rule['rule_id']}/confirm", json={"actor": "reviewer"})
    low_confidence_response = client.post(
        f"/api/rules/{low_confidence_rule['rule_id']}/confirm",
        json={"actor": "reviewer"},
    )
    valid_response = client.post(f"/api/rules/{valid_rule['rule_id']}/confirm", json={"actor": "reviewer"})

    assert mock_response.status_code == 400
    assert "mock" in mock_response.json()["detail"]
    assert low_confidence_response.status_code == 400
    assert "0.6" in low_confidence_response.json()["detail"]
    assert valid_response.status_code == 200
    assert valid_response.json()["review_status"] == "已确认"
    assert valid_response.json()["effective_status"] == "已确认"
    assert valid_response.json()["audit_log"][-1]["action"] == "confirmed"


def test_expire_and_deprecate_rule_are_recorded_as_auditable_state_changes():
    expire_rule = client.post("/api/rules", json=make_rule_payload(rule_title="待过期规则")).json()
    deprecate_rule = client.post("/api/rules", json=make_rule_payload(rule_title="待废弃规则")).json()

    expired = client.post(f"/api/rules/{expire_rule['rule_id']}/expire", json={"actor": "ops"})
    deprecated = client.post(f"/api/rules/{deprecate_rule['rule_id']}/deprecate", json={"actor": "ops"})

    assert expired.status_code == 200
    assert expired.json()["effective_status"] == "已过期"
    assert expired.json()["audit_log"][-1]["action"] == "expired"
    assert deprecated.status_code == 200
    assert deprecated.json()["effective_status"] == "已废弃"
    assert deprecated.json()["audit_log"][-1]["action"] == "deprecated"
