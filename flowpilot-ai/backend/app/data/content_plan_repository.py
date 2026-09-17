"""内容计划数据访问层。

设计依据：`FlowPilot_AI_数据模型设计_S1.md` §4

分层职责：
- ContentPlanRepository：抽象契约（接口先行）
- JsonContentPlanRepository：本地 JSON 实现，离线 Demo 兜底
- SqlAlchemyContentPlanRepository：SQLite / PostgreSQL 通用实现

重要：本层是唯一接触存储的位置，业务逻辑不得直接读写数据库或文件。
"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, sessionmaker

from app.data.models import ContentPlanAuditRecord, ContentPlanRecord, Base

# 优先级排序权重，与现有 ContentCalendarStore 保持一致
PRIORITY_WEIGHTS = {"高": 3, "中": 2, "低": 1}


class ContentPlanRepository(Protocol):
    """内容计划仓储契约。

    返回值与错误契约必须与现有 ContentCalendarStore 完全一致：
    - list_plans 返回 {plans, total, page, page_size}
    - get_plan 找不到时抛 HTTPException(404)
    """

    def list_plans(
        self,
        keyword: str = "",
        status: str = "",
        platform: str = "",
        owner: str = "",
        priority: str = "",
        start: str = "",
        end: str = "",
        sort: str = "date_asc",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]: ...

    def create_plan(self, plan: dict[str, Any], actor: str) -> dict[str, Any]: ...

    def update_plan(self, plan_id: str, changes: dict[str, Any], actor: str) -> dict[str, Any]: ...

    def get_plan(self, plan_id: str) -> dict[str, Any]: ...


def _now() -> str:
    return datetime.now().replace(microsecond=0).isoformat()


def _new_plan_id() -> str:
    return f"content-plan-{uuid4().hex[:12]}"


def _audit_entry(action: str, actor: str, summary: str, at: str) -> dict[str, str]:
    return {"action": action, "actor": actor, "summary": summary, "at": at}


# ---------------------------------------------------------------------------
# JSON 实现（离线兜底）
# ---------------------------------------------------------------------------


class JsonContentPlanRepository:
    """本地 JSON 文件实现。

    从原 ContentCalendarStore 中提取存储逻辑，行为保持完全一致，
    作为数据库不可用时的降级方案。
    """

    def __init__(self, storage_path: str | Path) -> None:
        self._storage_path = Path(storage_path)
        self._plans: dict[str, dict[str, Any]] = {}
        self._load()

    def list_plans(
        self,
        keyword: str = "",
        status: str = "",
        platform: str = "",
        owner: str = "",
        priority: str = "",
        start: str = "",
        end: str = "",
        sort: str = "date_asc",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        plans = [
            plan
            for plan in self._plans.values()
            if _matches_filters(plan, keyword, status, platform, owner, priority, start, end)
        ]
        plans = _sort_plans(plans, sort)
        return _paginate(plans, page, page_size)

    def create_plan(self, plan: dict[str, Any], actor: str) -> dict[str, Any]:
        record = deepcopy(plan)
        record["updated_at"] = record["created_at"]
        record["audit_log"] = [_audit_entry("created", actor, "内容计划已创建", record["created_at"])]
        self._plans[record["id"]] = record
        self._save()
        return deepcopy(record)

    def update_plan(self, plan_id: str, changes: dict[str, Any], actor: str) -> dict[str, Any]:
        plan = self._get_plan(plan_id)
        now = _now()
        for field_name, value in changes.items():
            if value is not None:
                plan[field_name] = value
        plan["updated_at"] = now
        plan.setdefault("audit_log", []).append(
            _audit_entry("plan_updated", actor, "内容计划排期已更新", now)
        )
        self._save()
        return deepcopy(plan)

    def get_plan(self, plan_id: str) -> dict[str, Any]:
        return deepcopy(self._get_plan(plan_id))

    def _get_plan(self, plan_id: str) -> dict[str, Any]:
        plan = self._plans.get(plan_id)
        if plan is None:
            raise HTTPException(status_code=404, detail="Content plan not found")
        return plan

    def _load(self) -> None:
        if not self._storage_path.exists():
            return
        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=500,
                detail=f"内容计划持久化文件损坏：{self._storage_path}",
            ) from exc
        for plan in payload.get("plans", []):
            plan_id = plan.get("id")
            if plan_id:
                self._plans[plan_id] = plan

    def _save(self) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": _now(),
            "plans": list(self._plans.values()),
        }
        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(
                json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()


# ---------------------------------------------------------------------------
# SQLAlchemy 实现（SQLite / PostgreSQL 通用）
# ---------------------------------------------------------------------------


class SqlAlchemyContentPlanRepository:
    """关系型数据库实现。

    并发安全（设计文档 §3.4）：
    - 写操作包在事务中，失败自动回滚。
    - 单条更新校验受影响行数，避免静默丢失更新。
    """

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def list_plans(
        self,
        keyword: str = "",
        status: str = "",
        platform: str = "",
        owner: str = "",
        priority: str = "",
        start: str = "",
        end: str = "",
        sort: str = "date_asc",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]:
        with self._session_factory() as session:
            statement = select(ContentPlanRecord)
            statement = _apply_filters(
                statement, keyword, status, platform, owner, priority, start, end
            )

            total = session.scalar(
                select(func.count()).select_from(statement.subquery())
            ) or 0

            statement = _apply_sort(statement, sort)
            normalized_page = max(page, 1)
            normalized_page_size = min(max(page_size, 1), 100)
            statement = statement.offset((normalized_page - 1) * normalized_page_size).limit(
                normalized_page_size
            )

            records = session.scalars(statement).all()
            return {
                "plans": [_to_dict(record) for record in records],
                "total": total,
                "page": normalized_page,
                "page_size": normalized_page_size,
            }

    def create_plan(self, plan: dict[str, Any], actor: str) -> dict[str, Any]:
        with self._session_factory() as session:
            with session.begin():
                record = ContentPlanRecord(
                    id=plan["id"],
                    topic_title=plan["topic_title"],
                    platform=plan["platform"],
                    brand_name=plan["brand_name"],
                    product_name=plan["product_name"],
                    region=plan["region"],
                    target_audience=plan["target_audience"],
                    facts=plan["facts"],
                    overall_score=plan["overall_score"],
                    status=plan["status"],
                    content_stage=plan["content_stage"],
                    priority=plan["priority"],
                    owner=plan.get("owner") or "",
                    scheduled_at=plan.get("scheduled_at"),
                    data_mode=plan["data_mode"],
                    created_at=plan["created_at"],
                    updated_at=plan["created_at"],
                )
                session.add(record)
                session.flush()
                session.add(
                    ContentPlanAuditRecord(
                        plan_id=record.id,
                        action="created",
                        actor=actor,
                        summary="内容计划已创建",
                        at=plan["created_at"],
                    )
                )

            session.refresh(record)
            return _to_dict(record)

    def update_plan(self, plan_id: str, changes: dict[str, Any], actor: str) -> dict[str, Any]:
        with self._session_factory() as session:
            with session.begin():
                record = session.get(ContentPlanRecord, plan_id)
                if record is None:
                    raise HTTPException(status_code=404, detail="Content plan not found")

                for field_name, value in changes.items():
                    if value is not None:
                        setattr(record, field_name, value)

                now = _now()
                record.updated_at = now
                session.add(
                    ContentPlanAuditRecord(
                        plan_id=plan_id,
                        action="plan_updated",
                        actor=actor,
                        summary="内容计划排期已更新",
                        at=now,
                    )
                )

            session.refresh(record)
            return _to_dict(record)

    def get_plan(self, plan_id: str) -> dict[str, Any]:
        with self._session_factory() as session:
            record = session.get(ContentPlanRecord, plan_id)
            if record is None:
                raise HTTPException(status_code=404, detail="Content plan not found")
            return _to_dict(record)


# ---------------------------------------------------------------------------
# 查询辅助（纯逻辑，不依赖具体存储）
# ---------------------------------------------------------------------------


def _matches_filters(
    plan: dict[str, Any],
    keyword: str,
    status: str,
    platform: str,
    owner: str,
    priority: str,
    start: str,
    end: str,
) -> bool:
    """JSON 实现的筛选逻辑，行为与原 store 完全一致。"""
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


def _apply_filters(
    statement: Any,
    keyword: str,
    status: str,
    platform: str,
    owner: str,
    priority: str,
    start: str,
    end: str,
) -> Any:
    """SQL 版筛选，语义与 _matches_filters 对齐。

    注意：关键字搜索在 SQL 侧对小写做匹配，使用 lower() 保证与 JSON 实现一致。
    """
    normalized_keyword = keyword.strip().lower()
    if normalized_keyword:
        pattern = f"%{normalized_keyword}%"
        statement = statement.where(
            or_(
                func.lower(ContentPlanRecord.topic_title).like(pattern),
                func.lower(ContentPlanRecord.brand_name).like(pattern),
                func.lower(ContentPlanRecord.product_name).like(pattern),
                func.lower(ContentPlanRecord.region).like(pattern),
                func.lower(ContentPlanRecord.platform).like(pattern),
                func.lower(ContentPlanRecord.owner).like(pattern),
            )
        )

    if status:
        statement = statement.where(ContentPlanRecord.status == status)
    if platform:
        statement = statement.where(ContentPlanRecord.platform == platform)
    if owner:
        # owner 为空串时对外表现为「未分配」，与 JSON 实现一致
        if owner == "未分配":
            statement = statement.where(ContentPlanRecord.owner == "")
        else:
            statement = statement.where(ContentPlanRecord.owner == owner)
    if priority:
        statement = statement.where(ContentPlanRecord.priority == priority)

    # 日期范围作用于「计划日期，缺省取创建日期」，与 JSON 实现的 coalesce 语义一致
    if start:
        statement = statement.where(
            func.substr(
                func.coalesce(ContentPlanRecord.scheduled_at, ContentPlanRecord.created_at), 1, 10
            )
            >= start
        )
    if end:
        statement = statement.where(
            func.substr(
                func.coalesce(ContentPlanRecord.scheduled_at, ContentPlanRecord.created_at), 1, 10
            )
            <= end
        )

    return statement


def _apply_sort(statement: Any, sort: str) -> Any:
    if sort == "score_desc":
        return statement.order_by(ContentPlanRecord.overall_score.desc())
    if sort == "priority_desc":
        from sqlalchemy import case

        weight = case(
            (ContentPlanRecord.priority == "高", 3),
            (ContentPlanRecord.priority == "中", 2),
            (ContentPlanRecord.priority == "低", 1),
            else_=2,
        )
        return statement.order_by(weight.desc())
    return statement.order_by(
        func.coalesce(ContentPlanRecord.scheduled_at, ContentPlanRecord.created_at).asc()
    )


def _paginate(plans: list[dict[str, Any]], page: int, page_size: int) -> dict[str, Any]:
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


def _sort_plans(plans: list[dict[str, Any]], sort: str) -> list[dict[str, Any]]:
    if sort == "score_desc":
        return sorted(plans, key=lambda item: item.get("overall_score", 0), reverse=True)
    if sort == "priority_desc":
        return sorted(
            plans,
            key=lambda item: PRIORITY_WEIGHTS.get(item.get("priority") or "中", 2),
            reverse=True,
        )
    return sorted(plans, key=lambda item: item.get("scheduled_at") or item.get("created_at", ""))


def _to_dict(record: ContentPlanRecord) -> dict[str, Any]:
    """ORM 记录转对外字典。

    审计日志组装回内嵌数组，保持与 JSON 实现的对外契约一致（设计文档 §3.3）。
    """
    return {
        "id": record.id,
        "topic_title": record.topic_title,
        "platform": record.platform,
        "brand_name": record.brand_name,
        "product_name": record.product_name,
        "region": record.region,
        "target_audience": record.target_audience,
        "facts": record.facts,
        "overall_score": record.overall_score,
        "status": record.status,
        "content_stage": record.content_stage,
        "priority": record.priority,
        "owner": record.owner,
        "scheduled_at": record.scheduled_at,
        "data_mode": record.data_mode,
        "created_at": record.created_at,
        "updated_at": record.updated_at,
        "audit_log": [
            {"action": item.action, "actor": item.actor, "summary": item.summary, "at": item.at}
            for item in record.audit_logs
        ],
    }


def build_plan_payload(payload: Any) -> dict[str, Any]:
    """把请求对象转成仓储层需要的字典。

    集中在此处，避免仓储实现各自拼装字段（DRY）。
    """
    return {
        "id": _new_plan_id(),
        "topic_title": payload.topic_title,
        "platform": payload.platform,
        "brand_name": payload.brand_name,
        "product_name": payload.product_name,
        "region": payload.region,
        "target_audience": payload.target_audience,
        "facts": payload.facts,
        "overall_score": payload.overall_score,
        "status": payload.status,
        "content_stage": payload.content_stage,
        "priority": payload.priority,
        "owner": payload.owner,
        "scheduled_at": payload.scheduled_at,
        "data_mode": payload.data_mode,
        "created_at": _now(),
    }


__all__ = [
    "ContentPlanRepository",
    "JsonContentPlanRepository",
    "SqlAlchemyContentPlanRepository",
    "build_plan_payload",
    "Base",
]

# 保证 Base 的元数据被注册（供 create_schema 使用）
_ = Base
