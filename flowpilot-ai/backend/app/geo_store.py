from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.p1_data import EVIDENCE_LEVELS, GEO_MONITOR_RECORDS, GEO_MONITOR_SESSIONS
from app.rule_store import DataMode


class GeoMonitorSessionCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    target_brand: str = Field(min_length=1)
    target_url: str = ""
    data_mode: DataMode = "manual"
    actor: str = "system"


class GeoMonitorRecordCreateRequest(BaseModel):
    session_id: str = Field(min_length=1)
    query: str = Field(min_length=1)
    ai_channel: str = Field(min_length=1)
    target_brand: str = Field(min_length=1)
    target_url: str = ""
    product_name: str = ""
    related_concept_found: bool = False
    brand_mentioned: bool = False
    page_retrieved: bool = False
    source_cited: bool = False
    raw_response: str = ""
    response_summary: str = ""
    manual_review_status: str = "待复核"
    reviewer: str = ""
    data_mode: DataMode = "manual"
    actor: str = "system"


class GeoMonitorEvidenceAttachmentCreateRequest(BaseModel):
    attachment_type: Literal["source_url", "screenshot_url", "raw_response_excerpt", "manual_note"]
    title: str = Field(min_length=1)
    url: str = ""
    note: str = ""
    actor: str = "system"


class GeoMonitorRecordReviewRequest(BaseModel):
    review_status_code: Literal["verified", "rejected", "needs_evidence"]
    reviewer: str = Field(min_length=1)
    review_note: str = ""
    actor: str = "system"


REVIEW_STATUS_LABELS = {
    "pending": "待复核",
    "verified": "已确认",
    "rejected": "已驳回",
    "needs_evidence": "需补充证据",
}


class GeoMonitorStore:
    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._storage_path = Path(storage_path) if storage_path is not None else Path(__file__).resolve().parents[1] / "data" / "geo-monitor.local.json"
        self._sessions: dict[str, dict[str, Any]] = {}
        self._records: dict[str, dict[str, Any]] = {}
        self._load_seed_data()
        self._load_persistent_data()

    def list_sessions(self) -> list[dict[str, Any]]:
        sessions = []

        for session in self._sessions.values():
            session_copy = deepcopy(session)
            records = [record for record in self._records.values() if record["session_id"] == session["session_id"]]
            session_copy["total_records"] = len(records)
            session_copy["highest_evidence_level"] = max([record["evidence_level"] for record in records], default=0)
            sessions.append(session_copy)

        return sessions

    def list_records(self, session_id: str | None = None) -> list[dict[str, Any]]:
        records = list(self._records.values())

        if session_id is not None:
            records = [record for record in records if record["session_id"] == session_id]

        return [self._normalize_record_for_response(record) for record in records]

    def create_session(self, payload: GeoMonitorSessionCreateRequest) -> dict[str, Any]:
        now = self._now()
        session_id = f"geo-mon-{uuid4().hex[:12]}"
        session = {
            "session_id": session_id,
            "name": payload.name,
            "target_brand": payload.target_brand,
            "target_url": payload.target_url,
            "created_at": now.replace("T", " "),
            "data_mode": payload.data_mode,
            "mock_notice": "" if payload.data_mode != "mock" else "示例数据，不计入真实 GEO 效果",
            "total_records": 0,
            "highest_evidence_level": 0,
            "audit_log": [self._audit_entry("created", payload.actor, "GEO 监测任务已创建", now)],
        }
        self._sessions[session_id] = session
        self._save_persistent_data()
        return deepcopy(session)

    def create_record(self, payload: GeoMonitorRecordCreateRequest) -> dict[str, Any]:
        if payload.session_id not in self._sessions:
            raise HTTPException(status_code=404, detail="GEO monitor session not found")

        if payload.source_cited and (not payload.target_url or not payload.raw_response):
            raise HTTPException(status_code=400, detail="source_cited=True 时必须提供 target_url 和 raw_response")

        now = self._now()
        evidence_level = self._calculate_evidence_level(payload)
        record_id = f"geo-rec-{uuid4().hex[:12]}"
        record = {
            "record_id": record_id,
            "session_id": payload.session_id,
            "query": payload.query,
            "ai_channel": payload.ai_channel,
            "target_brand": payload.target_brand,
            "target_url": payload.target_url,
            "product_name": payload.product_name,
            "checked_at": now.replace("T", " "),
            "evidence_level": evidence_level,
            "evidence_label": EVIDENCE_LEVELS[str(evidence_level)],
            "related_concept_found": payload.related_concept_found,
            "brand_mentioned": payload.brand_mentioned,
            "page_retrieved": payload.page_retrieved,
            "source_cited": payload.source_cited,
            "raw_response": payload.raw_response,
            "response_summary": payload.response_summary,
            "review_status_code": "pending",
            "manual_review_status": payload.manual_review_status,
            "reviewer": payload.reviewer,
            "review_note": "",
            "reviewed_at": "",
            "evidence_attachments": [],
            "data_mode": payload.data_mode,
            "audit_log": [self._audit_entry("created", payload.actor, "GEO 监测记录已创建", now)],
        }
        self._records[record_id] = record
        self._save_persistent_data()
        return deepcopy(record)

    def add_record_evidence_attachment(
        self,
        record_id: str,
        payload: GeoMonitorEvidenceAttachmentCreateRequest | dict[str, Any],
    ) -> dict[str, Any]:
        record = self._get_record(record_id)
        data = self._payload_data(payload)
        attachment_type = data.get("attachment_type", "")
        url = data.get("url", "").strip()
        note = data.get("note", "").strip()

        if not url and not note:
            raise HTTPException(status_code=400, detail="证据附件必须至少包含 url 或 note")

        if attachment_type in {"source_url", "screenshot_url"}:
            self._ensure_safe_http_url(url)

        now = self._now()
        attachment = {
            "attachment_id": f"geo-att-{uuid4().hex[:12]}",
            "attachment_type": attachment_type,
            "title": data.get("title", ""),
            "url": url,
            "note": note,
            "created_at": now,
            "actor": data.get("actor", "system"),
        }
        record.setdefault("evidence_attachments", []).append(attachment)
        record.setdefault("audit_log", []).append(
            self._audit_entry("evidence_attachment_added", data.get("actor", "system"), "GEO 监测证据附件已添加", now)
        )
        self._save_persistent_data()
        return self._normalize_record_for_response(record)

    def review_record(
        self,
        record_id: str,
        payload: GeoMonitorRecordReviewRequest | dict[str, Any],
    ) -> dict[str, Any]:
        record = self._get_record(record_id)
        data = self._payload_data(payload)
        review_status_code = data.get("review_status_code", "")

        if review_status_code == "verified" and not self._record_has_evidence(record):
            raise HTTPException(status_code=400, detail="缺少可复核证据，不能直接标记为已确认")

        now = self._now()
        record["review_status_code"] = review_status_code
        record["manual_review_status"] = REVIEW_STATUS_LABELS[review_status_code]
        record["reviewer"] = data.get("reviewer", "")
        record["review_note"] = data.get("review_note", "")
        record["reviewed_at"] = now
        record.setdefault("audit_log", []).append(
            self._audit_entry(
                "geo_record_reviewed",
                data.get("actor", "system"),
                f"GEO 监测记录复核为 {REVIEW_STATUS_LABELS[review_status_code]}",
                now,
            )
        )
        self._save_persistent_data()
        return self._normalize_record_for_response(record)

    def _load_seed_data(self) -> None:
        for session in GEO_MONITOR_SESSIONS:
            self._sessions[session["session_id"]] = deepcopy(session)

        for record in GEO_MONITOR_RECORDS:
            self._records[record["record_id"]] = deepcopy(record)

    def _load_persistent_data(self) -> None:
        if not self._storage_path.exists():
            return

        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail=f"GEO 监测持久化文件损坏：{self._storage_path}") from exc

        for session in payload.get("sessions", []):
            if session.get("data_mode") != "mock" and session.get("session_id"):
                self._sessions[session["session_id"]] = session

        for record in payload.get("records", []):
            if record.get("data_mode") != "mock" and record.get("record_id"):
                self._records[record["record_id"]] = record

    def _save_persistent_data(self) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": self._now(),
            "sessions": [session for session in self._sessions.values() if session.get("data_mode") != "mock"],
            "records": [record for record in self._records.values() if record.get("data_mode") != "mock"],
        }
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def _calculate_evidence_level(self, payload: GeoMonitorRecordCreateRequest) -> int:
        if payload.source_cited:
            return 4
        if payload.page_retrieved:
            return 3
        if payload.brand_mentioned:
            return 2
        if payload.related_concept_found:
            return 1
        return 0

    def _get_record(self, record_id: str) -> dict[str, Any]:
        record = self._records.get(record_id)

        if record is None:
            raise HTTPException(status_code=404, detail="GEO monitor record not found")

        return record

    def _payload_data(self, payload: BaseModel | dict[str, Any]) -> dict[str, Any]:
        if isinstance(payload, dict):
            return payload

        return payload.model_dump()

    def _ensure_safe_http_url(self, url: str) -> None:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise HTTPException(status_code=400, detail="证据附件 URL 必须以 http 或 https 开头，并包含域名")

    def _record_has_evidence(self, record: dict[str, Any]) -> bool:
        if record.get("raw_response", "").strip():
            return True

        return bool(record.get("evidence_attachments", []))

    def _normalize_record_for_response(self, record: dict[str, Any]) -> dict[str, Any]:
        record_copy = deepcopy(record)
        record_copy.setdefault("review_status_code", "pending")
        record_copy.setdefault("product_name", "")
        record_copy.setdefault("manual_review_status", REVIEW_STATUS_LABELS["pending"])
        record_copy.setdefault("review_note", "")
        record_copy.setdefault("reviewed_at", "")
        record_copy.setdefault("evidence_attachments", [])
        record_copy.setdefault("audit_log", [])
        return record_copy

    def _audit_entry(self, action: str, actor: str, summary: str, at: str) -> dict[str, str]:
        return {
            "action": action,
            "actor": actor,
            "summary": summary,
            "at": at,
        }

    def _now(self) -> str:
        return datetime.now().replace(microsecond=0).isoformat()


geo_monitor_store = GeoMonitorStore()
