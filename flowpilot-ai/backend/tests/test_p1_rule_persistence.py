import json

import pytest
from fastapi import HTTPException

from app.data.rule_repository import JsonRuleRepository
from app.rule_store import RuleActionRequest, RuleCreateRequest, RuleStore, RuleUpdateRequest


def make_payload(**overrides):
    payload = {
        "channel_type": "publishing",
        "channel_id": "zhihu",
        "channel_name": "知乎",
        "rule_title": "P1.4 持久化规则",
        "rule_summary": "用于验证规则中心本地 JSON 持久化。",
        "source_type": "manual_verified",
        "source_url": "https://example.com/p1-4-rule",
        "confidence": 0.86,
        "data_mode": "manual",
        "actor": "persistence-test",
    }
    payload.update(overrides)
    return RuleCreateRequest(**payload)


def test_manual_rule_survives_store_restart(tmp_path):
    storage_path = tmp_path / "rules.json"
    store = RuleStore(storage_path=storage_path)

    created = store.create_rule(make_payload())

    restarted_store = RuleStore(storage_path=storage_path)
    publishing_rules = restarted_store.list_rules("publishing")

    assert storage_path.exists()
    assert any(rule["rule_id"] == created["rule_id"] for rule in publishing_rules)
    assert any(rule["rule_title"] == "P1.4 持久化规则" for rule in publishing_rules)


def test_rule_updates_and_status_changes_are_persisted(tmp_path):
    storage_path = tmp_path / "rules.json"
    store = RuleStore(storage_path=storage_path)
    created = store.create_rule(make_payload(rule_title="编辑前规则"))

    store.update_rule(
        created["rule_id"],
        RuleUpdateRequest(
            rule_title="编辑后规则",
            rule_summary="编辑后摘要",
            confidence=0.91,
            actor="persistence-test",
        ),
    )
    store.confirm_rule(created["rule_id"], RuleActionRequest(actor="reviewer"))
    store.expire_rule(created["rule_id"], RuleActionRequest(actor="ops"))

    restarted_store = RuleStore(storage_path=storage_path)
    persisted = next(rule for rule in restarted_store.list_rules("publishing") if rule["rule_id"] == created["rule_id"])

    assert persisted["rule_title"] == "编辑后规则"
    assert persisted["version"] == "0.1.1"
    assert persisted["review_status"] == "已确认"
    assert persisted["effective_status"] == "已过期"
    assert [entry["action"] for entry in persisted["audit_log"]] == ["created", "updated", "confirmed", "expired"]


def test_persistence_file_only_stores_non_mock_rules(tmp_path):
    storage_path = tmp_path / "rules.json"
    store = RuleStore(storage_path=storage_path)

    store.create_rule(make_payload(data_mode="manual", rule_title="需要持久化的人工规则"))

    stored = json.loads(storage_path.read_text(encoding="utf-8"))

    assert stored["schema_version"] == 1
    assert stored["rules"]
    assert all(rule["data_mode"] != "mock" for rule in stored["rules"])
    assert not any(rule["rule_id"].startswith("ai-") for rule in stored["rules"])


def test_corrupted_persistence_file_raises_clear_error(tmp_path):
    storage_path = tmp_path / "rules.json"
    storage_path.write_text("{not valid json", encoding="utf-8")

    with pytest.raises(HTTPException) as exc_info:
        RuleStore(storage_path=storage_path)

    assert exc_info.value.status_code == 500
    assert "规则持久化文件损坏" in exc_info.value.detail


def test_rule_store_can_use_repository_without_storage_path(tmp_path):
    repository = JsonRuleRepository(tmp_path / "rules.json")
    store = RuleStore(repository=repository)

    created = store.create_rule(make_payload(rule_title="Repository 规则"))
    restarted = RuleStore(repository=JsonRuleRepository(tmp_path / "rules.json"))

    assert any(rule["rule_id"] == created["rule_id"] for rule in restarted.list_rules("publishing"))
