"""GEO 监测数据访问层。"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, sessionmaker

from app.data.models import GeoMonitorRecordRecord, GeoMonitorSessionRecord


class GeoMonitorRepository(Protocol):
    def load_data(self) -> dict[str, list[dict[str, Any]]]: ...

    def save_data(self, sessions: list[dict[str, Any]], records: list[dict[str, Any]]) -> None: ...


class JsonGeoMonitorRepository:
    """本地 JSON GEO 监测仓储。"""

    def __init__(self, storage_path: str | Path) -> None:
        self._storage_path = Path(storage_path)

    def load_data(self) -> dict[str, list[dict[str, Any]]]:
        if not self._storage_path.exists():
            return {"sessions": [], "records": []}

        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail=f"GEO 监测持久化文件损坏：{self._storage_path}") from exc

        return {
            "sessions": [
                deepcopy(session)
                for session in payload.get("sessions", [])
                if session.get("data_mode") != "mock" and session.get("session_id")
            ],
            "records": [
                deepcopy(record)
                for record in payload.get("records", [])
                if record.get("data_mode") != "mock" and record.get("record_id")
            ],
        }

    def save_data(self, sessions: list[dict[str, Any]], records: list[dict[str, Any]]) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": datetime.now().replace(microsecond=0).isoformat(),
            "sessions": [deepcopy(session) for session in sessions if session.get("data_mode") != "mock"],
            "records": [deepcopy(record) for record in records if record.get("data_mode") != "mock"],
        }
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()


class SqlAlchemyGeoMonitorRepository:
    """SQLAlchemy GEO 监测仓储。

    本阶段用 session / record 两张过渡主表承接真实数据库持久化，
    payload_json 保留完整 API 契约，后续再拆证据附件与复核日志表。
    """

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def load_data(self) -> dict[str, list[dict[str, Any]]]:
        with self._session_factory() as session:
            session_records = session.scalars(
                select(GeoMonitorSessionRecord).order_by(GeoMonitorSessionRecord.created_at.asc())
            ).all()
            monitor_records = session.scalars(
                select(GeoMonitorRecordRecord).order_by(GeoMonitorRecordRecord.checked_at.asc())
            ).all()
            return {
                "sessions": [json.loads(record.payload_json) for record in session_records],
                "records": [json.loads(record.payload_json) for record in monitor_records],
            }

    def save_data(self, sessions: list[dict[str, Any]], records: list[dict[str, Any]]) -> None:
        durable_sessions = [
            deepcopy(session)
            for session in sessions
            if session.get("data_mode") != "mock" and session.get("session_id")
        ]
        durable_records = [
            deepcopy(record)
            for record in records
            if record.get("data_mode") != "mock" and record.get("record_id")
        ]
        session_ids = {session["session_id"] for session in durable_sessions}
        record_ids = {record["record_id"] for record in durable_records}

        with self._session_factory() as session:
            with session.begin():
                if record_ids:
                    session.execute(
                        delete(GeoMonitorRecordRecord).where(GeoMonitorRecordRecord.record_id.not_in(record_ids))
                    )
                else:
                    session.execute(delete(GeoMonitorRecordRecord))

                if session_ids:
                    session.execute(
                        delete(GeoMonitorSessionRecord).where(
                            GeoMonitorSessionRecord.session_id.not_in(session_ids)
                        )
                    )
                else:
                    session.execute(delete(GeoMonitorSessionRecord))

                for monitor_session in durable_sessions:
                    payload_json = json.dumps(monitor_session, ensure_ascii=False, sort_keys=True)
                    existing = session.get(GeoMonitorSessionRecord, monitor_session["session_id"])
                    if existing is None:
                        session.add(_to_session_record(monitor_session, payload_json))
                    else:
                        _update_session_record(existing, monitor_session, payload_json)

                for monitor_record in durable_records:
                    payload_json = json.dumps(monitor_record, ensure_ascii=False, sort_keys=True)
                    existing = session.get(GeoMonitorRecordRecord, monitor_record["record_id"])
                    if existing is None:
                        session.add(_to_monitor_record(monitor_record, payload_json))
                    else:
                        _update_monitor_record(existing, monitor_record, payload_json)


def _to_session_record(session: dict[str, Any], payload_json: str) -> GeoMonitorSessionRecord:
    return GeoMonitorSessionRecord(
        session_id=str(session["session_id"]),
        name=str(session.get("name") or ""),
        target_brand=str(session.get("target_brand") or ""),
        target_url=str(session.get("target_url") or ""),
        data_mode=str(session.get("data_mode") or ""),
        created_at=str(session.get("created_at") or ""),
        payload_json=payload_json,
    )


def _update_session_record(record: GeoMonitorSessionRecord, session: dict[str, Any], payload_json: str) -> None:
    record.name = str(session.get("name") or "")
    record.target_brand = str(session.get("target_brand") or "")
    record.target_url = str(session.get("target_url") or "")
    record.data_mode = str(session.get("data_mode") or "")
    record.created_at = str(session.get("created_at") or "")
    record.payload_json = payload_json


def _to_monitor_record(record: dict[str, Any], payload_json: str) -> GeoMonitorRecordRecord:
    return GeoMonitorRecordRecord(
        record_id=str(record["record_id"]),
        session_id=str(record.get("session_id") or ""),
        query=str(record.get("query") or ""),
        ai_channel=str(record.get("ai_channel") or ""),
        target_brand=str(record.get("target_brand") or ""),
        product_name=str(record.get("product_name") or ""),
        evidence_level=int(record.get("evidence_level") or 0),
        review_status_code=str(record.get("review_status_code") or "pending"),
        data_mode=str(record.get("data_mode") or ""),
        checked_at=str(record.get("checked_at") or ""),
        payload_json=payload_json,
    )


def _update_monitor_record(existing: GeoMonitorRecordRecord, record: dict[str, Any], payload_json: str) -> None:
    existing.session_id = str(record.get("session_id") or "")
    existing.query = str(record.get("query") or "")
    existing.ai_channel = str(record.get("ai_channel") or "")
    existing.target_brand = str(record.get("target_brand") or "")
    existing.product_name = str(record.get("product_name") or "")
    existing.evidence_level = int(record.get("evidence_level") or 0)
    existing.review_status_code = str(record.get("review_status_code") or "pending")
    existing.data_mode = str(record.get("data_mode") or "")
    existing.checked_at = str(record.get("checked_at") or "")
    existing.payload_json = payload_json


__all__ = ["GeoMonitorRepository", "JsonGeoMonitorRepository", "SqlAlchemyGeoMonitorRepository"]
