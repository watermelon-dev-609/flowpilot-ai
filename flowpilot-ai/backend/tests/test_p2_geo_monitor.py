import json

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.geo_store import GeoMonitorRecordCreateRequest, GeoMonitorSessionCreateRequest, GeoMonitorStore


client = TestClient(app)


def make_session_payload(**overrides):
    payload = {
        "name": "P2.0 真实 GEO 监测任务",
        "target_brand": "武汉微艺达智能科技有限公司",
        "target_url": "https://example.com/wuhan-sandtable",
        "data_mode": "manual",
        "actor": "geo-test",
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
        "page_retrieved": True,
        "source_cited": True,
        "raw_response": "真实测试记录：回答中出现目标品牌，并列出了目标 URL 作为参考来源。",
        "response_summary": "品牌被提及，页面被检索，目标 URL 被作为来源引用。",
        "manual_review_status": "待复核",
        "reviewer": "",
        "data_mode": "manual",
        "actor": "geo-test",
    }
    payload.update(overrides)
    return GeoMonitorRecordCreateRequest(**payload)


def test_manual_geo_monitor_session_and_record_survive_restart(tmp_path):
    storage_path = tmp_path / "geo-monitor.json"
    store = GeoMonitorStore(storage_path=storage_path)
    session = store.create_session(make_session_payload())

    record = store.create_record(make_record_payload(session["session_id"]))

    restarted_store = GeoMonitorStore(storage_path=storage_path)
    sessions = restarted_store.list_sessions()
    records = restarted_store.list_records()

    assert storage_path.exists()
    assert any(item["session_id"] == session["session_id"] for item in sessions)
    assert any(item["record_id"] == record["record_id"] for item in records)
    assert record["evidence_level"] == 4
    assert record["evidence_label"] == "页面作为来源被引用"


def test_evidence_level_is_calculated_from_truthful_flags(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())

    related_only = store.create_record(
        make_record_payload(
            session["session_id"],
            brand_mentioned=False,
            page_retrieved=False,
            source_cited=False,
            raw_response="真实测试记录：回答只解释智能沙盘概念，没有出现品牌或目标页面。",
            response_summary="只出现相关概念。",
        )
    )
    brand_only = store.create_record(
        make_record_payload(
            session["session_id"],
            page_retrieved=False,
            source_cited=False,
            raw_response="真实测试记录：回答出现武汉微艺达，但没有目标 URL。",
            response_summary="品牌被提及。",
        )
    )

    assert related_only["evidence_level"] == 1
    assert brand_only["evidence_level"] == 2


def test_source_citation_requires_target_url_and_raw_response(tmp_path):
    store = GeoMonitorStore(storage_path=tmp_path / "geo-monitor.json")
    session = store.create_session(make_session_payload())

    with pytest.raises(HTTPException) as exc_info:
        store.create_record(
            make_record_payload(
                session["session_id"],
                source_cited=True,
                target_url="",
                raw_response="",
            )
        )

    assert exc_info.value.status_code == 400
    assert "source_cited=True" in exc_info.value.detail


def test_persistence_file_only_stores_non_mock_geo_data(tmp_path):
    storage_path = tmp_path / "geo-monitor.json"
    store = GeoMonitorStore(storage_path=storage_path)
    session = store.create_session(make_session_payload(data_mode="manual"))
    store.create_record(make_record_payload(session["session_id"], data_mode="manual"))

    stored = json.loads(storage_path.read_text(encoding="utf-8"))

    assert stored["schema_version"] == 1
    assert stored["sessions"]
    assert stored["records"]
    assert all(item["data_mode"] != "mock" for item in stored["sessions"])
    assert all(item["data_mode"] != "mock" for item in stored["records"])


def test_geo_monitor_api_creates_manual_session_and_record():
    session_response = client.post(
        "/api/geo-monitor/sessions",
        json={
            "name": "P2.0 API 真实监测任务",
            "target_brand": "武汉微艺达智能科技有限公司",
            "target_url": "https://example.com/p2-api",
            "data_mode": "manual",
            "actor": "api-test",
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
            "target_url": "https://example.com/p2-api",
            "related_concept_found": True,
            "brand_mentioned": True,
            "page_retrieved": False,
            "source_cited": False,
            "raw_response": "真实人工录入：回答提到武汉微艺达，但未看到来源链接。",
            "response_summary": "品牌被提及，未确认页面检索或来源引用。",
            "manual_review_status": "待复核",
            "reviewer": "",
            "data_mode": "manual",
            "actor": "api-test",
        },
    )

    assert record_response.status_code == 201
    record = record_response.json()
    assert record["evidence_level"] == 2
    assert record["evidence_label"] == "品牌被提及"
