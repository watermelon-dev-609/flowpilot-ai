import json

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.geo_report_store import GeoReportSnapshotCreateRequest, GeoReportSnapshotStore
from app.main import app


client = TestClient(app)


def make_snapshot_payload(**overrides):
    payload = {
        "scope_label": "全部平台 / 已确认 / 查询词包含：武汉智能沙盘厂家怎么选？",
        "report_period": "2026-09-11",
        "total_records": 1,
        "brand_mention_rate": 100,
        "page_retrieval_rate": 100,
        "source_citation_rate": 100,
        "report_text": "# 生成式运营周报\n\n- 发布来源：https://example.com/articles/wuhan-sandbox",
        "session_id": "session-report",
        "session_name": "武汉智能沙盘周报任务",
        "query": "武汉智能沙盘厂家怎么选？",
        "source_url": "https://example.com/articles/wuhan-sandbox",
        "actor": "report-test",
    }
    payload.update(overrides)
    return GeoReportSnapshotCreateRequest(**payload)


def test_report_snapshot_survives_restart(tmp_path):
    storage_path = tmp_path / "geo-report-snapshots.json"
    store = GeoReportSnapshotStore(storage_path=storage_path)

    snapshot = store.create_snapshot(make_snapshot_payload())

    restarted_store = GeoReportSnapshotStore(storage_path=storage_path)
    snapshots = restarted_store.list_snapshots()

    assert storage_path.exists()
    assert snapshots[0]["snapshot_id"] == snapshot["snapshot_id"]
    assert snapshots[0]["session_name"] == "武汉智能沙盘周报任务"
    assert snapshots[0]["source_url"] == "https://example.com/articles/wuhan-sandbox"
    assert snapshots[0]["data_mode"] == "manual"

    stored = json.loads(storage_path.read_text(encoding="utf-8"))
    assert stored["schema_version"] == 1
    assert stored["snapshots"][0]["report_text"].startswith("# 生成式运营周报")


def test_report_snapshot_requires_report_text(tmp_path):
    store = GeoReportSnapshotStore(storage_path=tmp_path / "geo-report-snapshots.json")

    with pytest.raises(HTTPException) as exc_info:
        store.create_snapshot(make_snapshot_payload(report_text="   "))

    assert exc_info.value.status_code == 400
    assert "报告文本不能为空" in exc_info.value.detail


def test_geo_report_snapshot_api_creates_and_lists_snapshot():
    response = client.post(
        "/api/geo-monitor/report-snapshots",
        json={
            "scope_label": "API 报告范围",
            "report_period": "2026-09-11",
            "total_records": 1,
            "brand_mention_rate": 100,
            "page_retrieval_rate": 100,
            "source_citation_rate": 100,
            "report_text": "# 生成式运营周报",
            "session_id": "session-api",
            "session_name": "API 周报任务",
            "query": "武汉智能沙盘厂家怎么选？",
            "source_url": "https://example.com/api-report",
            "actor": "api-test",
        },
    )

    assert response.status_code == 201
    snapshot = response.json()
    assert snapshot["snapshot_id"].startswith("geo-report-")
    assert snapshot["session_name"] == "API 周报任务"

    list_response = client.get("/api/geo-monitor/report-snapshots")

    assert list_response.status_code == 200
    assert any(item["snapshot_id"] == snapshot["snapshot_id"] for item in list_response.json()["snapshots"])
