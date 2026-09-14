import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app import rule_store as rule_store_module
from app.rule_store import RuleCreateRequest, RuleStore


client = TestClient(app)


def make_rule_payload(**overrides):
    payload = {
        "channel_type": "ai",
        "channel_id": "deepseek",
        "channel_name": "DeepSeek",
        "rule_title": "P2.1 来源复核规则",
        "rule_summary": "旧规则：AI 搜索更容易采信结构清晰且来源明确的页面。",
        "source_type": "official_docs",
        "source_url": "https://example.com/old-rule",
        "confidence": 0.72,
        "data_mode": "manual",
        "actor": "p2-1-test",
    }
    payload.update(overrides)
    return RuleCreateRequest(**payload)


def make_proposal_payload(**overrides):
    payload = {
        "proposed_rule_summary": "新规则候选：AI 搜索更偏好带 FAQ、实体关系和可访问来源的页面。",
        "proposed_source_url": "https://example.com/new-rule",
        "proposed_confidence": 0.88,
        "change_note": "补充 FAQ 与实体关系要求，等待人工复核后采用。",
        "actor": "rule-reviewer",
    }
    payload.update(overrides)
    return rule_store_module.RuleSourceReviewProposalRequest(**payload)


def test_create_source_review_proposal_records_old_and_new_rule_versions(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())

    review = store.create_source_review_proposal(created["rule_id"], make_proposal_payload())

    assert review["status"] == "待复核"
    assert review["rule_id"] == created["rule_id"]
    assert review["old_rule_summary"] == "旧规则：AI 搜索更容易采信结构清晰且来源明确的页面。"
    assert review["old_source_url"] == "https://example.com/old-rule"
    assert review["old_confidence"] == 0.72
    assert review["old_version"] == "0.1.0"
    assert review["proposed_rule_summary"] == "新规则候选：AI 搜索更偏好带 FAQ、实体关系和可访问来源的页面。"
    assert review["proposed_source_url"] == "https://example.com/new-rule"
    assert review["proposed_confidence"] == 0.88

    reviews = store.list_source_review_tasks()
    assert any(item["review_id"] == review["review_id"] for item in reviews)


def test_accept_source_review_updates_rule_and_writes_audit_log(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())
    review = store.create_source_review_proposal(created["rule_id"], make_proposal_payload())

    updated = store.accept_source_review(
        created["rule_id"],
        review["review_id"],
        rule_store_module.RuleSourceReviewActionRequest(actor="human-reviewer", decision_note="来源可信，采用。"),
    )

    assert updated["rule_summary"] == "新规则候选：AI 搜索更偏好带 FAQ、实体关系和可访问来源的页面。"
    assert updated["source_url"] == "https://example.com/new-rule"
    assert updated["confidence"] == 0.88
    assert updated["version"] == "0.1.1"
    assert updated["audit_log"][-1]["action"] == "source_review_accepted"
    assert any("P2.1 来源复核采用" in item for item in updated["change_log"])

    accepted_review = next(item for item in store.list_source_review_tasks() if item["review_id"] == review["review_id"])
    assert accepted_review["status"] == "已采用"
    assert accepted_review["decision_note"] == "来源可信，采用。"
    assert accepted_review["reviewed_at"]


def test_ignore_source_review_keeps_original_rule_and_writes_audit_log(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())
    review = store.create_source_review_proposal(created["rule_id"], make_proposal_payload())

    updated = store.ignore_source_review(
        created["rule_id"],
        review["review_id"],
        rule_store_module.RuleSourceReviewActionRequest(actor="human-reviewer", decision_note="来源不足，暂不采用。"),
    )

    assert updated["rule_summary"] == "旧规则：AI 搜索更容易采信结构清晰且来源明确的页面。"
    assert updated["source_url"] == "https://example.com/old-rule"
    assert updated["confidence"] == 0.72
    assert updated["version"] == "0.1.0"
    assert updated["audit_log"][-1]["action"] == "source_review_ignored"

    ignored_review = next(item for item in store.list_source_review_tasks() if item["review_id"] == review["review_id"])
    assert ignored_review["status"] == "已忽略"
    assert ignored_review["decision_note"] == "来源不足，暂不采用。"


def test_source_review_cannot_be_decided_twice(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())
    review = store.create_source_review_proposal(created["rule_id"], make_proposal_payload())
    action = rule_store_module.RuleSourceReviewActionRequest(actor="human-reviewer", decision_note="采用一次。")

    store.accept_source_review(created["rule_id"], review["review_id"], action)

    with pytest.raises(HTTPException) as exc_info:
        store.ignore_source_review(created["rule_id"], review["review_id"], action)

    assert exc_info.value.status_code == 400
    assert "已处理" in exc_info.value.detail


def test_source_review_api_exposes_queue_create_accept_and_ignore():
    created = client.post(
        "/api/rules",
        json={
            "channel_type": "publishing",
            "channel_id": "zhihu",
            "channel_name": "知乎",
            "rule_title": "P2.1 API 来源复核规则",
            "rule_summary": "旧规则：知乎内容需要问题导向和案例支撑。",
            "source_type": "manual_verified",
            "source_url": "https://example.com/zhihu-old-rule",
            "confidence": 0.7,
            "data_mode": "manual",
            "actor": "api-p2-1-test",
        },
    ).json()

    proposal_response = client.post(
        f"/api/rules/{created['rule_id']}/source-review-proposals",
        json={
            "proposed_rule_summary": "新规则候选：知乎内容需要明确回答问题，并降低硬广表达。",
            "proposed_source_url": "https://example.com/zhihu-new-rule",
            "proposed_confidence": 0.86,
            "change_note": "根据人工复核来源更新。",
            "actor": "api-reviewer",
        },
    )

    assert proposal_response.status_code == 201
    review = proposal_response.json()

    queue_response = client.get("/api/rule-source-reviews")
    assert queue_response.status_code == 200
    assert any(item["review_id"] == review["review_id"] for item in queue_response.json()["reviews"])

    accept_response = client.post(
        f"/api/rules/{created['rule_id']}/source-review-proposals/{review['review_id']}/accept",
        json={"actor": "api-reviewer", "decision_note": "采用新规则。"},
    )
    assert accept_response.status_code == 200
    assert accept_response.json()["rule_summary"] == "新规则候选：知乎内容需要明确回答问题，并降低硬广表达。"

    second = client.post(
        f"/api/rules/{created['rule_id']}/source-review-proposals/{review['review_id']}/ignore",
        json={"actor": "api-reviewer", "decision_note": "重复处理。"},
    )
    assert second.status_code == 400
