"""S1.8 规则中心仓储测试。"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.data.database import _enable_sqlite_foreign_keys, build_session_factory, create_schema
from app.data.rule_repository import JsonRuleRepository, SqlAlchemyRuleRepository
from app.rule_store import (
    RuleActionRequest,
    RuleCreateRequest,
    RuleSourceReviewActionRequest,
    RuleSourceReviewProposalRequest,
    RuleStore,
)


def make_rule_payload(**overrides):
    payload = {
        "channel_type": "ai",
        "channel_id": "deepseek",
        "channel_name": "DeepSeek",
        "rule_title": "SQL 规则仓储测试",
        "rule_summary": "旧规则摘要。",
        "source_type": "manual_verified",
        "source_url": "https://example.com/old-rule",
        "confidence": 0.76,
        "data_mode": "manual",
        "actor": "sql-rule-test",
    }
    payload.update(overrides)
    return RuleCreateRequest(**payload)


def make_sql_repository():
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    return SqlAlchemyRuleRepository(build_session_factory(engine))


def test_sql_rule_repository_persists_rule_store_lifecycle():
    repository = make_sql_repository()
    store = RuleStore(repository=repository)

    created = store.create_rule(make_rule_payload())
    confirmed = store.confirm_rule(created["rule_id"], RuleActionRequest(actor="reviewer"))

    restarted = RuleStore(repository=repository)
    persisted = next(rule for rule in restarted.list_rules("ai") if rule["rule_id"] == created["rule_id"])

    assert confirmed["review_status"] == "已确认"
    assert persisted["rule_title"] == "SQL 规则仓储测试"
    assert persisted["review_status"] == "已确认"
    assert [entry["action"] for entry in persisted["audit_log"]] == ["created", "confirmed"]


def test_sql_rule_repository_persists_source_review_decision():
    repository = make_sql_repository()
    store = RuleStore(repository=repository)
    created = store.create_rule(make_rule_payload())
    review = store.create_source_review_proposal(
        created["rule_id"],
        RuleSourceReviewProposalRequest(
            proposed_rule_summary="新规则摘要。",
            proposed_source_url="https://example.com/new-rule",
            proposed_confidence=0.91,
            change_note="来源更新。",
            actor="review-proposer",
        ),
    )

    store.accept_source_review(
        created["rule_id"],
        review["review_id"],
        RuleSourceReviewActionRequest(actor="reviewer", decision_note="采用。"),
    )

    restarted = RuleStore(repository=repository)
    persisted = next(rule for rule in restarted.list_rules("ai") if rule["rule_id"] == created["rule_id"])
    persisted_review = persisted["source_review_tasks"][0]

    assert persisted["rule_summary"] == "新规则摘要。"
    assert persisted["confidence"] == 0.91
    assert persisted_review["status"] == "已采用"
    assert persisted_review["decision_note"] == "采用。"


def test_json_and_sql_rule_repositories_share_contract(tmp_path):
    sql_repository = make_sql_repository()
    json_repository = JsonRuleRepository(tmp_path / "rules.json")
    store = RuleStore(repository=sql_repository)
    created = store.create_rule(make_rule_payload(rule_title="契约一致规则"))

    sql_rules = sql_repository.load_rules()
    json_repository.save_rules(sql_rules)
    json_rules = json_repository.load_rules()

    assert len(sql_rules) == len(json_rules) == 1
    assert sql_rules[0] == json_rules[0]
    assert json_rules[0]["rule_id"] == created["rule_id"]
