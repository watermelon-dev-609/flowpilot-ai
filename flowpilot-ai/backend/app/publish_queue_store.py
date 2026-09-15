from __future__ import annotations

import json
from copy import deepcopy
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.rule_store import DataMode


PublishTaskStatus = Literal["ready", "publishing", "published", "failed", "cancelled"]


class PublishQueueDraftSummary(BaseModel):
    platform_id: str = Field(min_length=1)
    platform_name: str = Field(min_length=1)
    title: str = Field(min_length=1)
    review_status: str = ""


class PublishQueueCreateRequest(BaseModel):
    id: str = Field(min_length=1)
    version_id: str = Field(min_length=1)
    topic_title: str = Field(min_length=1)
    source_topic_title: str = ""
    platform_count: int = Field(ge=0)
    platform_drafts: list[PublishQueueDraftSummary] = []
    status: PublishTaskStatus = "ready"
    queued_at: str = ""
    publishing_channel: str = ""
    operator_name: str = ""
    planned_publish_at: str = ""
    actual_publish_at: str = ""
    published_url: str = ""
    failure_reason: str = ""
    operator_note: str = ""
    data_mode: DataMode = "manual"
    actor: str = "system"


class PublishQueueUpdateRequest(BaseModel):
    status: PublishTaskStatus | None = None
    publishing_channel: str | None = None
    operator_name: str | None = None
    planned_publish_at: str | None = None
    actual_publish_at: str | None = None
    published_url: str | None = None
    failure_reason: str | None = None
    operator_note: str | None = None
    actor: str = "system"


class PublishQueueStore:
    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._storage_path = Path(storage_path) if storage_path is not None else Path(__file__).resolve().parents[1] / "data" / "publish-queue.local.json"
        self._items: dict[str, dict[str, Any]] = {}
        self._load_persistent_data()

    def list_items(self, status: str = "") -> dict[str, Any]:
        items = list(self._items.values())
        if status:
            items = [item for item in items if item["status"] == status]
        items.sort(key=lambda item: item.get("last_updated_at") or item.get("queued_at") or "", reverse=True)
        return {"items": [deepcopy(item) for item in items], "total": len(items)}

    def upsert_item(self, payload: PublishQueueCreateRequest) -> dict[str, Any]:
        existing = self._find_by_version_id(payload.version_id)
        now = self._now()

        if existing is not None:
            item_id = existing["id"]
            existing.update(self._create_payload(payload))
            existing["id"] = item_id
            existing["last_action"] = "刷新发布准备记录"
            existing["last_updated_at"] = now
            existing.setdefault("audit_log", []).append(self._audit_entry("queue_refreshed", payload.actor, "发布准备记录已刷新", now))
            self._save_persistent_data()
            return deepcopy(existing)

        item = self._create_payload(payload)
        item["source_topic_title"] = item["source_topic_title"] or item["topic_title"]
        item["queued_at"] = item["queued_at"] or now
        item["last_action"] = "加入发布准备"
        item["last_updated_at"] = now
        item["audit_log"] = [self._audit_entry("created", payload.actor, "发布准备记录已创建", now)]
        self._items[item["id"]] = item
        self._save_persistent_data()
        return deepcopy(item)

    def update_item(self, item_id: str, payload: PublishQueueUpdateRequest) -> dict[str, Any]:
        if item_id not in self._items:
            raise HTTPException(status_code=404, detail="Publish queue item not found")

        item = self._items[item_id]
        changes = payload.model_dump(exclude={"actor"}, exclude_none=True)
        candidate = {**item, **changes}
        self._validate_status(candidate)

        now = self._now()
        item.update(changes)
        item["last_action"] = "保存发布记录"
        item["last_updated_at"] = now
        item.setdefault("audit_log", []).append(self._audit_entry("record_updated", payload.actor, "发布记录已保存", now))
        self._save_persistent_data()
        return deepcopy(item)

    def _create_payload(self, payload: PublishQueueCreateRequest) -> dict[str, Any]:
        return payload.model_dump(exclude={"actor"})

    def _find_by_version_id(self, version_id: str) -> dict[str, Any] | None:
        for item in self._items.values():
            if item["version_id"] == version_id:
                return item
        return None

    def _validate_status(self, item: dict[str, Any]) -> None:
        if item.get("published_url") and not self._is_http_url(item["published_url"]):
            raise HTTPException(status_code=400, detail="发布链接需要以 http:// 或 https:// 开头")
        if item.get("status") == "published" and (not item.get("published_url") or not item.get("actual_publish_at")):
            raise HTTPException(status_code=400, detail="已发布记录需要填写发布链接和实际发布时间")
        if item.get("status") == "failed" and not item.get("failure_reason"):
            raise HTTPException(status_code=400, detail="发布失败记录需要填写失败原因")

    def _load_persistent_data(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return
        for item in payload.get("items", []):
            if isinstance(item, dict) and item.get("id") and item.get("version_id"):
                self._items[item["id"]] = item

    def _save_persistent_data(self) -> None:
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        self._storage_path.write_text(json.dumps({"items": list(self._items.values())}, ensure_ascii=False, indent=2), encoding="utf-8")

    def _audit_entry(self, action: str, actor: str, summary: str, at: str) -> dict[str, str]:
        return {"action": action, "actor": actor or "system", "summary": summary, "at": at}

    def _now(self) -> str:
        return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    def _is_http_url(self, value: str) -> bool:
        return value.startswith("http://") or value.startswith("https://")


publish_queue_store = PublishQueueStore()
