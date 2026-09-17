"""内容日历业务逻辑层。

设计依据：`FlowPilot_AI_数据模型设计_S1.md` §4.3

分层：
    main.py（表现层）          → 只调用 store，不感知存储实现
    ContentCalendarStore（本层）→ 校验、组装请求，不直接读写数据库或文件
    Repository（数据访问层）    → 唯一接触存储的位置

对外契约（返回值、错误码）与迁移前完全一致，确保既有测试无需修改。
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.data.content_plan_repository import (
    ContentPlanRepository,
    JsonContentPlanRepository,
    build_plan_payload,
)
from app.data.repository_factory import build_content_plan_repository


ContentPlanStatus = Literal["待适配", "适配中", "已生成", "已作废"]
ContentPlanPriority = Literal["高", "中", "低"]
ContentPlanStage = Literal["待生产", "生产中", "待审核", "待发布", "已发布", "待监测", "已复盘", "已完成"]
DataMode = Literal["mock", "demo", "manual", "real"]
ContentCalendarSortMode = Literal["date_asc", "score_desc", "priority_desc"]

# 可更新字段白名单（用户编码规范：参数走白名单，防止越权改字段）
UPDATABLE_FIELDS = ("scheduled_at", "owner", "priority", "content_stage", "status")


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
    """内容计划业务逻辑。

    本层不做存储决策，只负责：校验、组装、委派给仓储。
    """

    def __init__(
        self,
        repository: ContentPlanRepository | None = None,
        storage_path: str | Path | None = None,
    ) -> None:
        """初始化业务层。

        参数优先级：显式 repository > storage_path（JSON 存储）> 环境自动探测。

        `storage_path` 参数保留是为兼容既有调用方与测试：
        传入它即表示「明确要求使用本地 JSON 存储」，不做数据库探测。
        """
        if repository is not None:
            self._repository: ContentPlanRepository = repository
        elif storage_path is not None:
            self._repository = JsonContentPlanRepository(storage_path)
        else:
            self._repository = build_content_plan_repository()

    @property
    def repository(self) -> ContentPlanRepository:
        """暴露仓储供测试与诊断使用，不鼓励业务代码直接调用。"""
        return self._repository

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
        return self._repository.list_plans(
            keyword=keyword,
            status=status,
            platform=platform,
            owner=owner,
            priority=priority,
            start=start,
            end=end,
            sort=sort,
            page=page,
            page_size=page_size,
        )

    def create_plan(self, payload: ContentPlanCreateRequest) -> dict[str, Any]:
        plan = build_plan_payload(payload)
        return self._repository.create_plan(plan, actor=payload.actor or "system")

    def update_plan(self, plan_id: str, payload: ContentPlanUpdateRequest) -> dict[str, Any]:
        # 白名单过滤：只允许更新约定字段，避免意外覆盖 data_mode 等隔离字段
        changes = {field_name: getattr(payload, field_name) for field_name in UPDATABLE_FIELDS}
        return self._repository.update_plan(
            plan_id, changes, actor=payload.actor or "system"
        )


content_calendar_store = ContentCalendarStore()
