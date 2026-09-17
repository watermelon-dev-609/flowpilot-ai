"""S1.8 GEO 监测仓储测试。"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

from app.data.database import _enable_sqlite_foreign_keys, build_session_factory, create_schema
from app.data.geo_repository import JsonGeoMonitorRepository, SqlAlchemyGeoMonitorRepository
from app.geo_store import (
    GeoMonitorEvidenceAttachmentCreateRequest,
    GeoMonitorRecordCreateRequest,
    GeoMonitorRecordReviewRequest,
    GeoMonitorSessionCreateRequest,
    GeoMonitorStore,
)


def make_sql_repository():
    engine = create_engine(
        "sqlite://",
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    _enable_sqlite_foreign_keys(engine)
    create_schema(engine)
    return SqlAlchemyGeoMonitorRepository(build_session_factory(engine))


def make_session_payload(**overrides):
    payload = {
        "name": "SQL GEO 监测任务",
        "target_brand": "武汉微艺达",
        "target_url": "https://example.com/sandbox",
        "data_mode": "manual",
        "actor": "geo-sql-test",
    }
    payload.update(overrides)
    return GeoMonitorSessionCreateRequest(**payload)


def make_record_payload(session_id: str, **overrides):
    payload = {
        "session_id": session_id,
        "query": "智能沙盘公司推荐",
        "ai_channel": "deepseek",
        "target_brand": "武汉微艺达",
        "target_url": "https://example.com/sandbox",
        "product_name": "智能沙盘",
        "related_concept_found": True,
        "brand_mentioned": True,
        "page_retrieved": True,
        "source_cited": False,
        "raw_response": "人工录入模型回答，提到了武汉微艺达智能沙盘。",
        "response_summary": "品牌被提及，产品上下文保留。",
        "data_mode": "manual",
        "actor": "geo-sql-test",
    }
    payload.update(overrides)
    return GeoMonitorRecordCreateRequest(**payload)


def test_sql_geo_repository_persists_session_record_attachment_and_review():
    repository = make_sql_repository()
    store = GeoMonitorStore(repository=repository)
    session = store.create_session(make_session_payload())
    record = store.create_record(make_record_payload(session["session_id"]))

    store.add_record_evidence_attachment(
        record["record_id"],
        GeoMonitorEvidenceAttachmentCreateRequest(
            attachment_type="manual_note",
            title="人工证据",
            note="已在回答截图中复核到品牌与产品。",
            actor="reviewer",
        ),
    )
    reviewed = store.review_record(
        record["record_id"],
        GeoMonitorRecordReviewRequest(
            review_status_code="verified",
            reviewer="QA",
            review_note="证据充足。",
            actor="reviewer",
        ),
    )

    restarted = GeoMonitorStore(repository=repository)
    persisted_session = next(item for item in restarted.list_sessions() if item["session_id"] == session["session_id"])
    persisted_record = next(item for item in restarted.list_records() if item["record_id"] == record["record_id"])

    assert persisted_session["total_records"] == 1
    assert persisted_session["highest_evidence_level"] == 3
    assert reviewed["manual_review_status"] == "已确认"
    assert persisted_record["product_name"] == "智能沙盘"
    assert persisted_record["manual_review_status"] == "已确认"
    assert persisted_record["reviewer"] == "QA"
    assert persisted_record["evidence_attachments"][0]["title"] == "人工证据"
    assert [entry["action"] for entry in persisted_record["audit_log"]] == [
        "created",
        "evidence_attachment_added",
        "geo_record_reviewed",
    ]


def test_sql_geo_repository_does_not_persist_mock_data():
    repository = make_sql_repository()
    store = GeoMonitorStore(repository=repository)
    mock_session = store.create_session(make_session_payload(data_mode="mock"))

    restarted = GeoMonitorStore(repository=repository)

    assert all(item["session_id"] != mock_session["session_id"] for item in restarted.list_sessions())


def test_json_and_sql_geo_repositories_share_contract(tmp_path):
    sql_repository = make_sql_repository()
    json_repository = JsonGeoMonitorRepository(tmp_path / "geo-monitor.json")
    store = GeoMonitorStore(repository=sql_repository)
    session = store.create_session(make_session_payload())
    record = store.create_record(make_record_payload(session["session_id"]))

    sql_data = sql_repository.load_data()
    json_repository.save_data(sql_data["sessions"], sql_data["records"])
    json_data = json_repository.load_data()

    assert sql_data == json_data
    assert json_data["sessions"][0]["session_id"] == session["session_id"]
    assert json_data["records"][0]["record_id"] == record["record_id"]
