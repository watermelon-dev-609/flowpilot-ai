from http.server import BaseHTTPRequestHandler, HTTPServer
from threading import Thread

from fastapi.testclient import TestClient

from app.main import app
from app.rule_store import RuleCreateRequest, RuleSourceReviewProposalRequest, RuleStore


client = TestClient(app)


def make_rule_payload(**overrides):
    payload = {
        "channel_type": "publishing",
        "channel_id": "zhihu",
        "channel_name": "知乎",
        "rule_title": "P2.2 复核运营规则",
        "rule_summary": "旧规则：知乎内容需要问题导向。",
        "source_type": "manual_verified",
        "source_url": "https://example.com/old-rule",
        "confidence": 0.72,
        "data_mode": "manual",
        "actor": "p2-2-test",
    }
    payload.update(overrides)
    return RuleCreateRequest(**payload)


def make_proposal_payload(**overrides):
    payload = {
        "proposed_rule_summary": "新规则候选：知乎内容需要直接回答问题并补充案例。",
        "proposed_source_url": "https://example.com/new-rule",
        "proposed_confidence": 0.88,
        "change_note": "P2.2 测试候选。",
        "actor": "p2-2-test",
    }
    payload.update(overrides)
    return RuleSourceReviewProposalRequest(**payload)


class OkHandler(BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.send_response(204)
        self.end_headers()

    def log_message(self, format, *args):
        return


def run_test_server():
    server = HTTPServer(("127.0.0.1", 0), OkHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, f"http://127.0.0.1:{server.server_port}/rule-source"


def test_source_review_list_filters_by_status(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())
    accepted = store.create_source_review_proposal(created["rule_id"], make_proposal_payload(change_note="采用候选"))
    ignored = store.create_source_review_proposal(created["rule_id"], make_proposal_payload(change_note="忽略候选"))

    store.accept_source_review(created["rule_id"], accepted["review_id"], rule_store_action("采用。"))
    store.ignore_source_review(created["rule_id"], ignored["review_id"], rule_store_action("忽略。"))

    assert all(item["status"] == "已采用" for item in store.list_source_review_tasks("已采用"))
    assert all(item["status"] == "已忽略" for item in store.list_source_review_tasks("已忽略"))


def test_source_review_url_check_records_reachable_result(tmp_path):
    server, url = run_test_server()
    try:
        store = RuleStore(storage_path=tmp_path / "rules.json")
        created = store.create_rule(make_rule_payload())
        review = store.create_source_review_proposal(created["rule_id"], make_proposal_payload(proposed_source_url=url))

        checked = store.check_source_review_url(review["review_id"])

        assert checked["source_url_check_status"] == "reachable"
        assert checked["source_url_status_code"] == 204
        assert checked["source_url_checked_at"]
        assert checked["source_url_check_error"] == ""
    finally:
        server.shutdown()


def test_source_review_url_check_records_invalid_url(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    created = store.create_rule(make_rule_payload())
    review = store.create_source_review_proposal(
        created["rule_id"],
        make_proposal_payload(proposed_source_url="not-a-valid-url"),
    )

    checked = store.check_source_review_url(review["review_id"])

    assert checked["source_url_check_status"] == "invalid"
    assert checked["source_url_status_code"] == 0
    assert "http" in checked["source_url_check_error"]


def test_rule_update_reminders_include_missing_source_and_pending_review(tmp_path):
    store = RuleStore(storage_path=tmp_path / "rules.json")
    missing_source = store.create_rule(make_rule_payload(rule_title="缺少来源的规则", source_url=""))
    with_pending = store.create_rule(make_rule_payload(rule_title="有待复核候选的规则"))
    store.create_source_review_proposal(with_pending["rule_id"], make_proposal_payload())

    reminders = store.list_update_reminders()

    missing = next(item for item in reminders if item["rule_id"] == missing_source["rule_id"])
    pending = next(item for item in reminders if item["rule_id"] == with_pending["rule_id"])
    assert "缺少来源 URL" in missing["reasons"]
    assert "存在待复核候选" in pending["reasons"]


def test_rule_review_operations_api_supports_filter_url_check_and_reminders():
    created = client.post(
        "/api/rules",
        json={
            "channel_type": "publishing",
            "channel_id": "zhihu",
            "channel_name": "知乎",
            "rule_title": "P2.2 API 复核规则",
            "rule_summary": "旧规则：知乎内容需要问题导向。",
            "source_type": "manual_verified",
            "source_url": "https://example.com/p2-2-old",
            "confidence": 0.7,
            "data_mode": "manual",
            "actor": "api-p2-2-test",
        },
    ).json()

    review = client.post(
        f"/api/rules/{created['rule_id']}/source-review-proposals",
        json={
            "proposed_rule_summary": "新规则候选：知乎内容需要先给结论。",
            "proposed_source_url": "not-a-valid-url",
            "proposed_confidence": 0.86,
            "change_note": "验证 URL 检查。",
            "actor": "api-p2-2-test",
        },
    ).json()

    filtered = client.get("/api/rule-source-reviews?status=待复核")
    assert filtered.status_code == 200
    assert any(item["review_id"] == review["review_id"] for item in filtered.json()["reviews"])

    checked = client.post(f"/api/rule-source-reviews/{review['review_id']}/source-url-check")
    assert checked.status_code == 200
    assert checked.json()["source_url_check_status"] == "invalid"

    reminders = client.get("/api/rules/update-reminders")
    assert reminders.status_code == 200
    assert any(item["rule_id"] == created["rule_id"] for item in reminders.json()["reminders"])


def rule_store_action(note: str):
    from app.rule_store import RuleSourceReviewActionRequest

    return RuleSourceReviewActionRequest(actor="p2-2-test", decision_note=note)
