"""SQLAlchemy 数据模型定义。

设计依据：`FlowPilot_AI_数据模型设计_S1.md`
本阶段只覆盖 content_calendar；rules / geo_monitor 在后续阶段各自建模型。
"""

from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。"""


class ContentPlanRecord(Base):
    """内容计划主表。

    字段名与现有 JSON 契约完全同名，降低迁移认知成本（设计文档 §3.5）。
    时间字段保留 VARCHAR 存储原始字符串，理由见设计文档 §3.1。
    """

    __tablename__ = "content_calendar_plans"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_title: Mapped[str] = mapped_column(String(500), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(200), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    target_audience: Mapped[str] = mapped_column(String(200), nullable=False)
    facts: Mapped[str] = mapped_column(Text, nullable=False)
    overall_score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    content_stage: Mapped[str] = mapped_column(String(20), nullable=False)
    priority: Mapped[str] = mapped_column(String(10), nullable=False)
    owner: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    scheduled_at: Mapped[str | None] = mapped_column(String(40), nullable=True)
    data_mode: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False)

    audit_logs: Mapped[list["ContentPlanAuditRecord"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        order_by="ContentPlanAuditRecord.id",
    )

    __table_args__ = (
        CheckConstraint("overall_score >= 0 AND overall_score <= 100", name="ck_plans_score_range"),
        Index("idx_plans_status", "status"),
        Index("idx_plans_platform", "platform"),
        Index("idx_plans_owner", "owner"),
        Index("idx_plans_priority", "priority"),
        Index("idx_plans_scheduled_at", "scheduled_at"),
    )


class ContentPlanAuditRecord(Base):
    """内容计划审计日志表。

    只追加不更新不删除，满足用户编码规范「变更可追踪」。
    独立成表而非内嵌数组，理由见设计文档 §3.3。
    """

    __tablename__ = "content_plan_audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    plan_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("content_calendar_plans.id", ondelete="CASCADE"),
        nullable=False,
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    actor: Mapped[str] = mapped_column(String(100), nullable=False)
    summary: Mapped[str] = mapped_column(String(500), nullable=False)
    at: Mapped[str] = mapped_column(String(40), nullable=False)

    plan: Mapped[ContentPlanRecord] = relationship(back_populates="audit_logs")

    __table_args__ = (Index("idx_audit_plan_id", "plan_id"),)
