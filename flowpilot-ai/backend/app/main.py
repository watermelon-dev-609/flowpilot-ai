from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.content_calendar_store import (
    ContentPlanCreateRequest,
    ContentPlanUpdateRequest,
    content_calendar_store,
)
from app.geo_store import (
    GeoMonitorEvidenceAttachmentCreateRequest,
    GeoMonitorRecordCreateRequest,
    GeoMonitorRecordReviewRequest,
    GeoMonitorSessionCreateRequest,
    geo_monitor_store,
)
from app.p1_data import (
    EVIDENCE_LEVELS,
)
from app.rule_store import (
    ChannelType,
    RuleActionRequest,
    RuleCreateRequest,
    RuleSourceCheckRequest,
    RuleSourceReviewActionRequest,
    RuleSourceReviewProposalRequest,
    RuleUpdateRequest,
    rule_store,
)


app = FastAPI(
    title="FlowPilot AI API",
    description="P0 backend skeleton for the enterprise AI operations workspace.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str | bool]:
    return {
        "service": "FlowPilot AI",
        "status": "ok",
        "phase": "P0",
        "mock_ai": True,
    }


@app.get("/api/project-plan")
def project_plan() -> dict[str, str | list[str]]:
    return {
        "name": "FlowPilot AI",
        "positioning": "企业 AI 智能运营工作台",
        "current_focus": "企业产品内容与 GEO 工作台",
        "p0_modules": [
            "Product Center",
            "GEO Research",
            "Content Engine",
            "Fact Check",
            "GEO Critic",
            "AI Citation Readiness",
            "Multi-platform Content",
        ],
        "reserved_modules": [
            "Enterprise Knowledge Base",
            "Project Workspace",
            "ComfyUI AIGC Studio",
            "GEO Monitor",
            "Report Dashboard",
        ],
    }


@app.get("/api/rules/ai-channels")
def ai_channel_rules() -> dict[str, str | list[dict]]:
    return {
        "channel_type": "ai",
        "data_mode": "mock",
        "source_policy": "official_first_manual_confirmed",
        "rules": rule_store.list_rules("ai"),
    }


@app.get("/api/rules/publishing-channels")
def publishing_channel_rules() -> dict[str, str | list[dict]]:
    return {
        "channel_type": "publishing",
        "data_mode": "mock",
        "source_policy": "official_first_manual_confirmed",
        "rules": rule_store.list_rules("publishing"),
    }


@app.get("/api/rules")
def rules(channel_type: ChannelType | None = None) -> dict[str, str | list[dict]]:
    return {
        "channel_type": channel_type or "all",
        "data_mode": "mixed",
        "source_policy": "official_first_manual_confirmed",
        "rules": rule_store.list_rules(channel_type),
    }


@app.get("/api/rules/update-reminders")
def rule_update_reminders() -> dict[str, str | list[dict]]:
    return {
        "data_mode": "mixed",
        "reminders": rule_store.list_update_reminders(),
    }


@app.post("/api/rules", status_code=201)
def create_rule(payload: RuleCreateRequest) -> dict:
    return rule_store.create_rule(payload)


@app.patch("/api/rules/{rule_id}")
def update_rule(rule_id: str, payload: RuleUpdateRequest) -> dict:
    return rule_store.update_rule(rule_id, payload)


@app.post("/api/rules/{rule_id}/confirm")
def confirm_rule(rule_id: str, payload: RuleActionRequest) -> dict:
    return rule_store.confirm_rule(rule_id, payload)


@app.post("/api/rules/{rule_id}/expire")
def expire_rule(rule_id: str, payload: RuleActionRequest) -> dict:
    return rule_store.expire_rule(rule_id, payload)


@app.post("/api/rules/{rule_id}/deprecate")
def deprecate_rule(rule_id: str, payload: RuleActionRequest) -> dict:
    return rule_store.deprecate_rule(rule_id, payload)


@app.post("/api/rules/{rule_id}/source-check")
def request_rule_source_check(rule_id: str, payload: RuleSourceCheckRequest) -> dict:
    return rule_store.request_source_check(rule_id, payload)


@app.get("/api/rule-source-reviews")
def rule_source_reviews(status: str | None = None) -> dict[str, str | list[dict]]:
    return {
        "data_mode": "mixed",
        "reviews": rule_store.list_source_review_tasks(status),
    }


@app.get("/api/content-calendar/plans")
def content_calendar_plans(
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
) -> dict[str, str | int | list[dict]]:
    result = content_calendar_store.list_plans(
        keyword=keyword,
        status=status,
        platform=platform,
        owner=owner,
        priority=priority,
        start=start,
        end=end,
        sort=sort if sort in {"date_asc", "score_desc", "priority_desc"} else "date_asc",
        page=page,
        page_size=page_size,
    )
    return {
        "data_mode": "manual",
        **result,
    }


@app.post("/api/content-calendar/plans", status_code=201)
def create_content_calendar_plan(payload: ContentPlanCreateRequest) -> dict:
    return content_calendar_store.create_plan(payload)


@app.patch("/api/content-calendar/plans/{plan_id}")
def update_content_calendar_plan(plan_id: str, payload: ContentPlanUpdateRequest) -> dict:
    return content_calendar_store.update_plan(plan_id, payload)


@app.post("/api/rule-source-reviews/{review_id}/source-url-check")
def check_rule_source_review_url(review_id: str) -> dict:
    return rule_store.check_source_review_url(review_id)


@app.post("/api/rules/{rule_id}/source-review-proposals", status_code=201)
def create_rule_source_review_proposal(rule_id: str, payload: RuleSourceReviewProposalRequest) -> dict:
    return rule_store.create_source_review_proposal(rule_id, payload)


@app.post("/api/rules/{rule_id}/source-review-proposals/{review_id}/accept")
def accept_rule_source_review(rule_id: str, review_id: str, payload: RuleSourceReviewActionRequest) -> dict:
    return rule_store.accept_source_review(rule_id, review_id, payload)


@app.post("/api/rules/{rule_id}/source-review-proposals/{review_id}/ignore")
def ignore_rule_source_review(rule_id: str, review_id: str, payload: RuleSourceReviewActionRequest) -> dict:
    return rule_store.ignore_source_review(rule_id, review_id, payload)


@app.get("/api/geo-monitor/sessions")
def geo_monitor_sessions() -> dict[str, str | dict[str, str] | list[dict]]:
    return {
        "data_mode": "mock",
        "evidence_levels": EVIDENCE_LEVELS,
        "sessions": geo_monitor_store.list_sessions(),
    }


@app.get("/api/geo-monitor/records")
def geo_monitor_records() -> dict[str, str | list[dict]]:
    return {
        "data_mode": "mock",
        "records": geo_monitor_store.list_records(),
    }


@app.post("/api/geo-monitor/sessions", status_code=201)
def create_geo_monitor_session(payload: GeoMonitorSessionCreateRequest) -> dict:
    return geo_monitor_store.create_session(payload)


@app.post("/api/geo-monitor/records", status_code=201)
def create_geo_monitor_record(payload: GeoMonitorRecordCreateRequest) -> dict:
    return geo_monitor_store.create_record(payload)


@app.post("/api/geo-monitor/records/{record_id}/evidence-attachments", status_code=201)
def add_geo_monitor_record_evidence_attachment(
    record_id: str,
    payload: GeoMonitorEvidenceAttachmentCreateRequest,
) -> dict:
    return geo_monitor_store.add_record_evidence_attachment(record_id, payload)


@app.post("/api/geo-monitor/records/{record_id}/review")
def review_geo_monitor_record(record_id: str, payload: GeoMonitorRecordReviewRequest) -> dict:
    return geo_monitor_store.review_record(record_id, payload)
