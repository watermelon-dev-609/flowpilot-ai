from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Literal
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field


ContentPlanStatus = Literal["待适配", "适配中", "已生成", "已作废"]
ContentPlanPriority = Literal["高", "中", "低"]
ContentPlanStage = Literal["待生产", "生产中", "待审核", "待发布", "已发布", "待监测", "已复盘", "已完成"]
DataMode = Literal["mock", "demo", "manual", "real"]
ContentCalendarSortMode = Literal["date_asc", "score_desc", "priority_desc"]


class ContentPlanCreateRequest(BaseModel):
    topic_title: str = Field(min_length=1)
    platform: str = Field(min_length=1)
    brand_name: str = Field(min_length=1)
    product_name: str = Field(min_length=1)
    region: str = Field(min_length=1)
    target_audience: str = Field(min_length=1)
    facts: str = Field(min_length=1)
    overall_score: int = Field(ge=0, le=100)
    status: ContentPlanStatus = "待适配"
    scheduled_at: str | None = None
    owner: str = ""
    priority: ContentPlanPriority = "中"
    content_stage: ContentPlanStage = "待生产"
    data_mode: DataMode = "manual"
    actor: str = "system"


class ContentPlanUpdateRequest(BaseModel):
    scheduled_at: str | None = None
    owner: str | None = None
    priority: ContentPlanPriority | None = None
    content_stage: ContentPlanStage | None = None
    status: ContentPlanStatus | None = None
    actor: str = "system"


class ContentCalendarStore:
    def __init__(self, storage_path: str | Path | None = None) -> None:
        self._storage_path = (
            Path(storage_path)
            if storage_path is not None
            else Path(__file__).resolve().parents[1] / "data" / "content-calendar.local.json"
        )
        self._plans: dict[str, dict[str, Any]] = {}
        self._load_persistent_plans()

    def list_plans(
        self,
        keyword: str = "",
        status: str = "",
        platform: str = "",
        owner: str = "",
        priority: str = "",
        start: str = "",
        end: str = "",
        sort: ContentCalendarSortMode = "date_asc",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        plans = [plan for plan in self._plans.values() if self._matches_filters(plan, keyword, status, platform, owner, priority, start, end)]
        plans = self._sort_plans(plans, sort)
        total = len(plans)
        normalized_page = max(page, 1)
        normalized_page_size = min(max(page_size, 1), 100)
        start_index = (normalized_page - 1) * normalized_page_size
        end_index = start_index + normalized_page_size

        return {
            "plans": deepcopy(plans[start_index:end_index]),
            "total": total,
            "page": normalized_page,
            "page_size": normalized_page_size,
        }

    def create_plan(self, payload: ContentPlanCreateRequest) -> dict[str, Any]:
        now = self._now()
        plan_id = f"content-plan-{uuid4().hex[:12]}"
        plan = {
            "id": plan_id,
            "topic_title": payload.topic_title,
            "platform": payload.platform,
            "brand_name": payload.brand_name,
            "product_name": payload.product_name,
            "region": payload.region,
            "target_audience": payload.target_audience,
            "facts": payload.facts,
            "overall_score": payload.overall_score,
            "status": payload.status,
            "created_at": now,
            "scheduled_at": payload.scheduled_at,
            "owner": payload.owner,
            "priority": payload.priority,
            "content_stage": payload.content_stage,
            "data_mode": payload.data_mode,
            "audit_log": [self._audit_entry("created", payload.actor, "内容计划已创建", now)],
        }
        self._plans[plan_id] = plan
        self._save_persistent_plans()
        return deepcopy(plan)

    def update_plan(self, plan_id: str, payload: ContentPlanUpdateRequest) -> dict[str, Any]:
        plan = self._get_plan(plan_id)
        now = self._now()

        for field_name in ["scheduled_at", "owner", "priority", "content_stage", "status"]:
            value = getattr(payload, field_name)
            if value is not None:
                plan[field_name] = value

        plan.setdefault("audit_log", []).append(self._audit_entry("plan_updated", payload.actor, "内容计划排期已更新", now))
        self._save_persistent_plans()
        return deepcopy(plan)

    def _load_persistent_plans(self) -> None:
        if not self._storage_path.exists():
            return

        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail=f"内容计划持久化文件损坏：{self._storage_path}") from exc

        for plan in payload.get("plans", []):
            plan_id = plan.get("id")
            if plan_id:
                self._plans[plan_id] = plan

    def _save_persistent_plans(self) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": self._now(),
            "plans": list(self._plans.values()),
        }
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def _get_plan(self, plan_id: str) -> dict[str, Any]:
        plan = self._plans.get(plan_id)
        if plan is None:
            raise HTTPException(status_code=404, detail="Content plan not found")
        return plan

    def _matches_filters(
        self,
        plan: dict[str, Any],
        keyword: str,
        status: str,
        platform: str,
        owner: str,
        priority: str,
        start: str,
        end: str,
    ) -> bool:
        normalized_keyword = keyword.strip().lower()
        haystack = " ".join(
            str(plan.get(field_name, ""))
            for field_name in ["topic_title", "brand_name", "product_name", "region", "platform", "owner"]
        ).lower()
        plan_date = str(plan.get("scheduled_at") or plan.get("created_at") or "")[:10]

        return (
            (not normalized_keyword or normalized_keyword in haystack)
            and (not status or plan.get("status") == status)
            and (not platform or plan.get("platform") == platform)
            and (not owner or (plan.get("owner") or "未分配") == owner)
            and (not priority or (plan.get("priority") or "中") == priority)
            and (not start or plan_date >= start)
            and (not end or plan_date <= end)
        )

    def _sort_plans(self, plans: list[dict[str, Any]], sort: ContentCalendarSortMode) -> list[dict[str, Any]]:
        if sort == "score_desc":
            return sorted(plans, key=lambda item: item.get("overall_score", 0), reverse=True)

        if sort == "priority_desc":
            return sorted(plans, key=self._priority_weight, reverse=True)

        return sorted(plans, key=lambda item: item.get("scheduled_at") or item.get("created_at", ""))

    def _priority_weight(self, plan: dict[str, Any]) -> int:
        return {"高": 3, "中": 2, "低": 1}.get(plan.get("priority") or "中", 2)

    def _audit_entry(self, action: str, actor: str, summary: str, at: str) -> dict[str, str]:
        return {
            "action": action,
            "actor": actor,
            "summary": summary,
            "at": at,
        }

    def _now(self) -> str:
        return datetime.now().replace(microsecond=0).isoformat()


content_calendar_store = ContentCalendarStore()
