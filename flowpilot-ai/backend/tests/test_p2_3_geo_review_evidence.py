import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.geo_store import GeoMonitorRecordCreateRequest, GeoMonitorSessionCreateRequest, GeoMonitorStore
from app.main import app


client = TestClient(app)


def make_session_payload(**overrides):
    payload = {
        "name": "P2.3 GEO 证据复核任务",
        "target_brand": "武汉微艺达智能科技有限公司",
        "target_url": "https://example.com/wuhan-sandtable",
        "data_mode": "manual",
        "actor": "p2-3-test",
    }
    payload.update(overrides)
    return GeoMonitorSessionCreateRequest(**payload)


def make_record_payload(session_id: str, **overrides):
    payload = {
        "session_id": session_id,
        "query": "武汉智能沙盘厂家有哪些？",
        "ai_channel": "deepseek",
        "target_brand": "武汉微艺达智能科技有限公司",
        "target_url": "https://example.com/wuhan-sandtable",
        "related_concept_found": True,
        "brand_mentioned": True,
        "page_retrieved": False,
        "source_cited": False,
        "raw_response": "真实人工录入：回答中提到了武汉微艺达，但没有看到来源引用。",
        "response_summary": "品牌被提及，暂未确认页面检索或来源引用。",
        "manual_review_status": "待复核",
        "reviewer": "",
        "data_mode": "manual",
        "actor": "p2-3-test",
    }
    payload.update(overrides)
    return GeoMonitorRecordCreateRequest(**payload)


def test_add_evidence_attachment_to_geo_record(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())
    record = store.create_record(make_record_payload(session["session_id"]))

    updated = store.add_record_evidence_attachment(
        record["record_id"],
        {
            "attachment_type": "source_url",
            "title": "DeepSeek 回答来源链接",
            "url": "https://example.com/deepseek-source",
            "note": "人工复核时保存的来源链接。",
            "actor": "p2-3-test",
        },
    )

    assert len(updated["evidence_attachments"]) == 1
    assert updated["evidence_attachments"][0]["attachment_type"] == "source_url"
    assert updated["evidence_attachments"][0]["url"] == "https://example.com/deepseek-source"
    assert updated["audit_log"][-1]["action"] == "evidence_attachment_added"


def test_reject_evidence_attachment_with_unsafe_url(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())
    record = store.create_record(make_record_payload(session["session_id"]))

    with pytest.raises(HTTPException) as exc_info:
        store.add_record_evidence_attachment(
            record["record_id"],
            {
                "attachment_type": "source_url",
                "title": "本地文件不应被接受",
                "url": "file:///C:/secret.txt",
                "note": "",
                "actor": "p2-3-test",
            },
        )

    assert exc_info.value.status_code == 400
    assert "http" in exc_info.value.detail


def test_review_geo_record_updates_status_and_audit_log(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())
    record = store.create_record(make_record_payload(session["session_id"]))

    reviewed = store.review_record(
        record["record_id"],
        {
            "review_status_code": "verified",
            "reviewer": "王轩",
            "review_note": "原始回答可追溯，确认本次品牌提及有效。",
            "actor": "p2-3-test",
        },
    )

    assert reviewed["review_status_code"] == "verified"
    assert reviewed["manual_review_status"] == "已确认"
    assert reviewed["reviewer"] == "王轩"
    assert reviewed["review_note"] == "原始回答可追溯，确认本次品牌提及有效。"
    assert reviewed["reviewed_at"]
    assert reviewed["audit_log"][-1]["action"] == "geo_record_reviewed"


def test_verified_review_requires_raw_response_or_attachment(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())
    record = store.create_record(
        make_record_payload(
            session["session_id"],
            related_concept_found=False,
            brand_mentioned=False,
            page_retrieved=False,
            source_cited=False,
            raw_response="",
            response_summary="",
        )
    )

    with pytest.raises(HTTPException) as exc_info:
        store.review_record(
            record["record_id"],
            {
                "review_status_code": "verified",
                "reviewer": "王轩",
                "review_note": "空证据不能确认。",
                "actor": "p2-3-test",
            },
        )

    assert exc_info.value.status_code == 400
    assert "证据" in exc_info.value.detail


def test_geo_review_and_evidence_api_flow():
    session_response = client.post(
        "/api/geo-monitor/sessions",
        json={
            "name": "P2.3 API 证据复核任务",
            "target_brand": "武汉微艺达智能科技有限公司",
            "target_url": "https://example.com/p2-3",
            "data_mode": "manual",
            "actor": "api-p2-3-test",
        },
    )
    assert session_response.status_code == 201
    session = session_response.json()

    record_response = client.post(
        "/api/geo-monitor/records",
        json={
            "session_id": session["session_id"],
            "query": "武汉沙盘模型制作公司哪家好？",
            "ai_channel": "doubao",
            "target_brand": "武汉微艺达智能科技有限公司",
            "target_url": "https://example.com/p2-3",
            "related_concept_found": True,
            "brand_mentioned": True,
            "page_retrieved": False,
            "source_cited": False,
            "raw_response": "真实人工录入：豆包回答中提到了武汉微艺达。",
            "response_summary": "品牌被提及。",
            "manual_review_status": "待复核",
            "reviewer": "",
            "data_mode": "manual",
            "actor": "api-p2-3-test",
        },
    )
    assert record_response.status_code == 201
    record = record_response.json()

    attachment_response = client.post(
        f"/api/geo-monitor/records/{record['record_id']}/evidence-attachments",
        json={
            "attachment_type": "manual_note",
            "title": "人工复核备注",
            "url": "",
            "note": "已保存查询问题、平台、回答摘要。",
            "actor": "api-p2-3-test",
        },
    )
    assert attachment_response.status_code == 201
    assert attachment_response.json()["evidence_attachments"][0]["title"] == "人工复核备注"

    review_response = client.post(
        f"/api/geo-monitor/records/{record['record_id']}/review",
        json={
            "review_status_code": "verified",
            "reviewer": "王轩",
            "review_note": "证据足够，确认有效。",
            "actor": "api-p2-3-test",
        },
    )
    assert review_response.status_code == 200
    reviewed = review_response.json()
    assert reviewed["review_status_code"] == "verified"
    assert reviewed["manual_review_status"] == "已确认"
    assert len(reviewed["evidence_attachments"]) == 1
