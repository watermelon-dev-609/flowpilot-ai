from fastapi import HTTPException
from fastapi.testclient import TestClient
import pytest

from app.main import app
from app.rule_store import RuleCreateRequest, RuleSourceCheckRequest, RuleStore


client = TestClient(app)


def make_rule_payload(**overrides):
    payload = {
        "channel_type": "ai",
        "channel_id": "deepseek",
        "channel_name": "DeepSeek",
        "rule_title": "P2.0 来源检查规则",
        "rule_summary": "用于验证规则来源检查和动态更新记录。",
        "source_type": "official_docs",
        "source_url": "https://api-docs.deepseek.com/",
        "confidence": 0.82,
        "data_mode": "manual",
        "actor": "source-check-test",
    }
    payload.update(overrides)
    return RuleCreateRequest(**payload)


def test_rule_source_check_records_review_status_and_audit_log(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())

    checked = store.request_source_check(
        created["rule_id"],
        RuleSourceCheckRequest(actor="rule-reviewer", check_note="检查官方文档是否有规则变更。"),
    )

    assert checked["source_check_status"] == "待人工复核"
    assert checked["source_check_summary"] == "检查官方文档是否有规则变更。"
    assert checked["latest_source_checked_at"]
    assert checked["audit_log"][-1]["action"] == "source_check_requested"
    assert checked["audit_log"][-1]["actor"] == "rule-reviewer"


def test_rule_source_check_is_persisted_after_restart(tmp_path):
    storage_path = tmp_path / "rules.json"
    store = RuleStore(storage_path=storage_path)
    created = store.create_rule(make_rule_payload(rule_title="需要重启验证的来源检查规则"))
    store.request_source_check(
        created["rule_id"],
        RuleSourceCheckRequest(actor="rule-reviewer", check_note="重启后仍应保留来源检查状态。"),
    )

    restarted_store = RuleStore(storage_path=storage_path)
    persisted = next(rule for rule in restarted_store.list_rules("ai") if rule["rule_id"] == created["rule_id"])

    assert persisted["source_check_status"] == "待人工复核"
    assert persisted["source_check_summary"] == "重启后仍应保留来源检查状态。"
    assert persisted["audit_log"][-1]["action"] == "source_check_requested"


def test_rule_source_check_requires_source_url(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload(source_url=""))

    with pytest.raises(HTTPException) as exc_info:
        store.request_source_check(
            created["rule_id"],
            RuleSourceCheckRequest(actor="rule-reviewer", check_note="缺少来源 URL。"),
        )

    assert exc_info.value.status_code == 400
    assert "source_url" in exc_info.value.detail


def test_rule_source_check_api_records_dynamic_update_request():
    created = client.post(
        "/api/rules",
        json={
            "channel_type": "ai",
            "channel_id": "deepseek",
            "channel_name": "DeepSeek",
            "rule_title": "P2.0 API 来源检查规则",
            "rule_summary": "API 测试来源检查。",
            "source_type": "official_docs",
            "source_url": "https://api-docs.deepseek.com/",
            "confidence": 0.82,
            "data_mode": "manual",
            "actor": "api-source-test",
        },
    ).json()

    response = client.post(
        f"/api/rules/{created['rule_id']}/source-check",
        json={"actor": "api-source-test", "check_note": "记录一次官方来源检查任务。"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source_check_status"] == "待人工复核"
    assert data["source_check_summary"] == "记录一次官方来源检查任务。"
    assert data["audit_log"][-1]["action"] == "source_check_requested"
