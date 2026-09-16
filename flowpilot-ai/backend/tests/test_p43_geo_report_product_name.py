from fastapi.testclient import TestClient

from app.geo_report_store import GeoReportSnapshotCreateRequest, GeoReportSnapshotStore
from app.main import app


client = TestClient(app)


def test_geo_report_snapshot_persists_product_name(tmp_path):
    storage_path = tmp_path / "geo-report-snapshots.json"
    store = GeoReportSnapshotStore(storage_path=storage_path)

    snapshot = store.create_snapshot(
        GeoReportSnapshotCreateRequest(
            scope_label="智能沙盘 / 发布来源复盘",
            report_period="2026-09-16",
            total_records=1,
            brand_mention_rate=100,
            page_retrieval_rate=100,
            source_citation_rate=100,
            report_text="# 生成式运营周报\n\n- 产品：智能沙盘",
            session_id="geo-product-session",
            session_name="发布后监测：智能沙盘展厅负责人选型指南",
            query="智能沙盘展厅负责人选型指南",
            source_url="https://example.com/articles/sandbox",
            product_name="智能沙盘",
            data_mode="manual",
            actor="report-product-test",
        )
    )

    restarted_store = GeoReportSnapshotStore(storage_path=storage_path)
    [persisted_snapshot] = [
        item for item in restarted_store.list_snapshots() if item["snapshot_id"] == snapshot["snapshot_id"]
    ]

    assert snapshot["product_name"] == "智能沙盘"
    assert persisted_snapshot["product_name"] == "智能沙盘"


def test_geo_report_snapshot_api_returns_product_name():
    response = client.post(
        "/api/geo-monitor/report-snapshots",
        json={
            "scope_label": "智能沙盘 / 发布来源复盘",
            "report_period": "2026-09-16",
            "total_records": 1,
            "brand_mention_rate": 100,
            "page_retrieval_rate": 100,
            "source_citation_rate": 100,
            "report_text": "# 生成式运营周报\n\n- 产品：智能沙盘",
            "session_id": "geo-product-session",
            "session_name": "发布后监测：智能沙盘展厅负责人选型指南",
            "query": "智能沙盘展厅负责人选型指南",
            "source_url": "https://example.com/articles/sandbox",
            "product_name": "智能沙盘",
            "data_mode": "manual",
            "actor": "report-product-test",
        },
    )

    assert response.status_code == 201
    assert response.json()["product_name"] == "智能沙盘"
