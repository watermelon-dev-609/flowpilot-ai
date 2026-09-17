"""SQLAlchemy 数据模型定义。

设计依据：`FlowPilot_AI_数据模型设计_S1.md`
当前覆盖 content_calendar、rules 与 geo_monitor 的第一阶段仓储模型。
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


class RuleRecord(Base):
    """规则中心过渡主表。

    规则对象当前字段较多且仍在迭代中，本阶段先用 payload_json 完整保留 API 契约，
    同时抽出常用索引字段，为后续拆分审计表与来源复核表做准备。
    """

    __tablename__ = "rules"

    rule_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    channel_type: Mapped[str] = mapped_column(String(20), nullable=False)
    channel_id: Mapped[str] = mapped_column(String(100), nullable=False)
    channel_name: Mapped[str] = mapped_column(String(200), nullable=False)
    rule_title: Mapped[str] = mapped_column(String(500), nullable=False)
    review_status: Mapped[str] = mapped_column(String(20), nullable=False)
    effective_status: Mapped[str] = mapped_column(String(20), nullable=False)
    data_mode: Mapped[str] = mapped_column(String(10), nullable=False)
    updated_at: Mapped[str] = mapped_column(String(40), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        Index("idx_rules_channel_type", "channel_type"),
        Index("idx_rules_channel_id", "channel_id"),
        Index("idx_rules_data_mode", "data_mode"),
        Index("idx_rules_updated_at", "updated_at"),
    )


class GeoMonitorSessionRecord(Base):
    """GEO 监测任务过渡主表。"""

    __tablename__ = "geo_monitor_sessions"

    session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    target_brand: Mapped[str] = mapped_column(String(200), nullable=False)
    target_url: Mapped[str] = mapped_column(String(500), nullable=False)
    data_mode: Mapped[str] = mapped_column(String(10), nullable=False)
    created_at: Mapped[str] = mapped_column(String(40), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        Index("idx_geo_sessions_target_brand", "target_brand"),
        Index("idx_geo_sessions_data_mode", "data_mode"),
        Index("idx_geo_sessions_created_at", "created_at"),
    )


class GeoMonitorRecordRecord(Base):
    """GEO 监测记录过渡主表。

    证据附件、复核记录与审计日志先保留在 payload_json 中，后续再拆表。
    """

    __tablename__ = "geo_monitor_records"

    record_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("geo_monitor_sessions.session_id", ondelete="CASCADE"),
        nullable=False,
    )
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    ai_channel: Mapped[str] = mapped_column(String(50), nullable=False)
    target_brand: Mapped[str] = mapped_column(String(200), nullable=False)
    product_name: Mapped[str] = mapped_column(String(200), nullable=False)
    evidence_level: Mapped[int] = mapped_column(Integer, nullable=False)
    review_status_code: Mapped[str] = mapped_column(String(30), nullable=False)
    data_mode: Mapped[str] = mapped_column(String(10), nullable=False)
    checked_at: Mapped[str] = mapped_column(String(40), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        Index("idx_geo_records_session_id", "session_id"),
        Index("idx_geo_records_ai_channel", "ai_channel"),
        Index("idx_geo_records_target_brand", "target_brand"),
        Index("idx_geo_records_product_name", "product_name"),
        Index("idx_geo_records_evidence_level", "evidence_level"),
        Index("idx_geo_records_review_status", "review_status_code"),
        Index("idx_geo_records_data_mode", "data_mode"),
        Index("idx_geo_records_checked_at", "checked_at"),
    )
