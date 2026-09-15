from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.rule_store import DataMode


class GeoReportSnapshotCreateRequest(BaseModel):
    scope_label: str = Field(min_length=1)
    report_period: str = Field(min_length=1)
    total_records: int = Field(ge=0)
    brand_mention_rate: int = Field(ge=0, le=100)
    page_retrieval_rate: int = Field(ge=0, le=100)
    source_citation_rate: int = Field(ge=0, le=100)
    report_text: str = Field(min_length=1)
    session_id: str = ""
    session_name: str = ""
    query: str = ""
    source_url: str = ""
    data_mode: DataMode = "manual"
    actor: str = "system"


class GeoReportSnapshotStore:
    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._storage_path = (
            Path(storage_path) if storage_path is not None else Path(__file__).resolve().parents[1] / "data" / "geo-report-snapshots.local.json"
        )
        self._snapshots: dict[str, dict[str, Any]] = {}
        self._load_persistent_data()

    def list_snapshots(self) -> list[dict[str, Any]]:
        snapshots = [deepcopy(snapshot) for snapshot in self._snapshots.values()]
        return sorted(snapshots, key=lambda snapshot: snapshot["created_at"], reverse=True)

    def create_snapshot(self, payload: GeoReportSnapshotCreateRequest) -> dict[str, Any]:
        report_text = payload.report_text.strip()
        if not report_text:
            raise HTTPException(status_code=400, detail="报告文本不能为空")

        now = self._now()
        snapshot_id = f"geo-report-{uuid4().hex[:12]}"
        snapshot = {
            "snapshot_id": snapshot_id,
            "scope_label": payload.scope_label.strip(),
            "report_period": payload.report_period.strip(),
            "total_records": payload.total_records,
            "brand_mention_rate": payload.brand_mention_rate,
            "page_retrieval_rate": payload.page_retrieval_rate,
            "source_citation_rate": payload.source_citation_rate,
            "report_text": report_text,
            "session_id": payload.session_id.strip(),
            "session_name": payload.session_name.strip(),
            "query": payload.query.strip(),
            "source_url": payload.source_url.strip(),
            "created_at": now,
            "data_mode": payload.data_mode,
            "audit_log": [self._audit_entry("created", payload.actor, "GEO 运营报告快照已保存", now)],
        }
        self._snapshots[snapshot_id] = snapshot
        self._save_persistent_data()
        return deepcopy(snapshot)

    def _load_persistent_data(self) -> None:
        if not self._storage_path.exists():
            return

        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail=f"GEO 报告快照持久化文件损坏：{self._storage_path}") from exc

        for snapshot in payload.get("snapshots", []):
            if snapshot.get("snapshot_id"):
                self._snapshots[snapshot["snapshot_id"]] = snapshot

    def _save_persistent_data(self) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": self._now(),
            "snapshots": [snapshot for snapshot in self._snapshots.values() if snapshot.get("data_mode") != "mock"],
        }
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def _audit_entry(self, action: str, actor: str, summary: str, at: str) -> dict[str, str]:
        return {
            "action": action,
            "actor": actor,
            "summary": summary,
            "at": at,
        }

    def _now(self) -> str:
        return datetime.now().replace(microsecond=0).isoformat()


geo_report_snapshot_store = GeoReportSnapshotStore()
