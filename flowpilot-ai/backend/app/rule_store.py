from __future__ import annotations

import http.client
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import HTTPException
from pydantic import BaseModel, Field

from app.data.rule_repository import JsonRuleRepository, RuleRepository
from app.p1_data import AI_CHANNEL_RULES, PUBLISHING_CHANNEL_RULES


ChannelType = Literal["ai", "publishing"]
DataMode = Literal["mock", "demo", "manual", "real"]


class RuleCreateRequest(BaseModel):
    channel_type: ChannelType
    channel_id: str = Field(min_length=1)
    channel_name: str = Field(min_length=1)
    rule_title: str = Field(min_length=1)
    rule_summary: str = Field(min_length=1)
    source_type: str = ""
    source_url: str = ""
    confidence: float = Field(ge=0, le=1)
    data_mode: DataMode = "manual"
    actor: str = "system"


class RuleUpdateRequest(BaseModel):
    rule_title: str | None = None
    rule_summary: str | None = None
    source_type: str | None = None
    source_url: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    actor: str = "system"


class RuleActionRequest(BaseModel):
    actor: str = "system"


class RuleSourceCheckRequest(BaseModel):
    actor: str = "system"
    check_note: str = "请求检查规则来源是否更新。"


class RuleSourceReviewProposalRequest(BaseModel):
    proposed_rule_summary: str = Field(min_length=1)
    proposed_source_url: str = Field(min_length=1)
    proposed_confidence: float = Field(ge=0, le=1)
    change_note: str = ""
    actor: str = "system"


class RuleSourceReviewActionRequest(BaseModel):
    actor: str = "system"
    decision_note: str = ""


class RuleStore:
    def __init__(self, storage_path: str | Path | None = None, repository: RuleRepository | None = None) -> None:
        if repository is not None:
            self._repository = repository
        else:
            storage = Path(storage_path) if storage_path is not None else Path(__file__).resolve().parents[1] / "data" / "rules.local.json"
            self._repository = JsonRuleRepository(storage)
        self._rules: dict[str, dict[str, Any]] = {}
        self._load_seed_rules()
        self._load_persistent_rules()

    def _load_seed_rules(self) -> None:
        for rule in AI_CHANNEL_RULES:
            self._rules[rule["rule_id"]] = self._normalize_seed_rule(rule, "ai")

        for rule in PUBLISHING_CHANNEL_RULES:
            self._rules[rule["rule_id"]] = self._normalize_seed_rule(rule, "publishing")

    def _normalize_seed_rule(self, rule: dict[str, Any], channel_type: ChannelType) -> dict[str, Any]:
        normalized = deepcopy(rule)
        normalized["channel_type"] = channel_type
        normalized["data_mode"] = "mock"
        normalized.setdefault("source_url", "")
        normalized.setdefault("rule_summary", "")
        normalized.setdefault("audit_log", [])
        return normalized

    def list_rules(self, channel_type: ChannelType | None = None) -> list[dict[str, Any]]:
        rules = list(self._rules.values())

        if channel_type is not None:
            rules = [rule for rule in rules if rule["channel_type"] == channel_type]

        return deepcopy(rules)

    def create_rule(self, payload: RuleCreateRequest) -> dict[str, Any]:
        now = self._now()
        rule_id = f"rule-{uuid4().hex[:12]}"
        rule = {
            "rule_id": rule_id,
            "channel_type": payload.channel_type,
            "channel_id": payload.channel_id,
            "channel_name": payload.channel_name,
            "rule_title": payload.rule_title,
            "rule_summary": payload.rule_summary,
            "source_type": payload.source_type,
            "source_url": payload.source_url,
            "source_note": "",
            "knowledge_cutoff": "待确认",
            "updated_at": now[:10],
            "version": "0.1.0",
            "confidence": payload.confidence,
            "review_status": "待确认",
            "reviewer": "",
            "effective_status": "草稿",
            "data_mode": payload.data_mode,
            "change_log": ["P1.3 手动创建规则。"],
            "audit_log": [self._audit_entry("created", payload.actor, "规则已创建", now)],
        }
        self._rules[rule_id] = rule
        self._save_persistent_rules()
        return deepcopy(rule)

    def update_rule(self, rule_id: str, payload: RuleUpdateRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)
        now = self._now()

        for field_name in ["rule_title", "rule_summary", "source_type", "source_url", "confidence"]:
            value = getattr(payload, field_name)
            if value is not None:
                rule[field_name] = value

        rule["updated_at"] = now[:10]
        rule["version"] = self._increment_patch_version(rule["version"])
        rule["audit_log"].append(self._audit_entry("updated", payload.actor, "规则字段已编辑", now))
        self._save_persistent_rules()
        return deepcopy(rule)

    def confirm_rule(self, rule_id: str, payload: RuleActionRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)

        if rule["data_mode"] == "mock":
            raise HTTPException(status_code=400, detail="data_mode=mock 的规则不能直接人工确认为真实规则")

        if not rule.get("source_type"):
            raise HTTPException(status_code=400, detail="规则缺少 source_type，不能确认")

        if float(rule["confidence"]) < 0.6:
            raise HTTPException(status_code=400, detail="规则置信度低于 0.6，不能确认")

        now = self._now()
        rule["review_status"] = "已确认"
        rule["effective_status"] = "已确认"
        rule["reviewer"] = payload.actor
        rule["updated_at"] = now[:10]
        rule["audit_log"].append(self._audit_entry("confirmed", payload.actor, "规则已人工确认", now))
        self._save_persistent_rules()
        return deepcopy(rule)

    def expire_rule(self, rule_id: str, payload: RuleActionRequest) -> dict[str, Any]:
        return self._change_effective_status(rule_id, payload.actor, "已过期", "expired", "规则已标记过期")

    def deprecate_rule(self, rule_id: str, payload: RuleActionRequest) -> dict[str, Any]:
        return self._change_effective_status(rule_id, payload.actor, "已废弃", "deprecated", "规则已标记废弃")

    def request_source_check(self, rule_id: str, payload: RuleSourceCheckRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)

        if not rule.get("source_url"):
            raise HTTPException(status_code=400, detail="规则缺少 source_url，不能创建来源检查任务")

        now = self._now()
        rule["latest_source_checked_at"] = now
        rule["source_check_status"] = "待人工复核"
        rule["source_check_summary"] = payload.check_note
        rule["updated_at"] = now[:10]
        rule["audit_log"].append(
            self._audit_entry("source_check_requested", payload.actor, "规则来源检查任务已记录", now)
        )
        self._save_persistent_rules()
        return deepcopy(rule)

    def list_source_review_tasks(self, status: str | None = None) -> list[dict[str, Any]]:
        reviews: list[dict[str, Any]] = []

        for rule in self._rules.values():
            for review in rule.get("source_review_tasks", []):
                if status is None or review.get("status") == status:
                    reviews.append(deepcopy(review))

        return sorted(reviews, key=lambda item: item.get("created_at", ""), reverse=True)

    def list_update_reminders(self) -> list[dict[str, Any]]:
        reminders: list[dict[str, Any]] = []

        for rule in self._rules.values():
            reasons: list[str] = []
            pending_reviews = [
                review
                for review in rule.get("source_review_tasks", [])
                if review.get("status") == "待复核"
            ]

            if not rule.get("source_url"):
                reasons.append("缺少来源 URL")

            if pending_reviews:
                reasons.append("存在待复核候选")

            if rule.get("data_mode") != "mock" and not rule.get("latest_source_checked_at") and not pending_reviews:
                reasons.append("长期未做来源复核")

            if not reasons:
                continue

            reminders.append(
                {
                    "rule_id": rule["rule_id"],
                    "channel_type": rule["channel_type"],
                    "channel_id": rule["channel_id"],
                    "channel_name": rule["channel_name"],
                    "rule_title": rule["rule_title"],
                    "reasons": reasons,
                    "severity": "high" if pending_reviews or not rule.get("source_url") else "medium",
                    "updated_at": rule.get("updated_at", ""),
                    "data_mode": rule.get("data_mode", "mock"),
                }
            )

        return sorted(reminders, key=lambda item: (item["severity"] != "high", item["updated_at"]))

    def create_source_review_proposal(self, rule_id: str, payload: RuleSourceReviewProposalRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)
        now = self._now()
        review = {
            "review_id": f"source-review-{uuid4().hex[:12]}",
            "rule_id": rule["rule_id"],
            "channel_type": rule["channel_type"],
            "channel_id": rule["channel_id"],
            "channel_name": rule["channel_name"],
            "rule_title": rule["rule_title"],
            "old_rule_summary": rule.get("rule_summary", ""),
            "old_source_url": rule.get("source_url", ""),
            "old_confidence": rule.get("confidence", 0),
            "old_version": rule.get("version", "0.1.0"),
            "proposed_rule_summary": payload.proposed_rule_summary,
            "proposed_source_url": payload.proposed_source_url,
            "proposed_confidence": payload.proposed_confidence,
            "change_note": payload.change_note,
            "status": "待复核",
            "created_at": now,
            "reviewed_at": "",
            "actor": payload.actor,
            "reviewer": "",
            "decision_note": "",
        }

        rule.setdefault("source_review_tasks", []).append(review)
        rule["source_check_status"] = "待人工复核"
        rule["source_check_summary"] = payload.change_note or "已提交新规则候选，等待人工复核。"
        rule["updated_at"] = now[:10]
        rule.setdefault("audit_log", []).append(
            self._audit_entry("source_review_proposed", payload.actor, "规则来源复核候选已提交", now)
        )
        self._save_persistent_rules()
        return deepcopy(review)

    def check_source_review_url(self, review_id: str, timeout_seconds: float = 3.0) -> dict[str, Any]:
        rule, review = self._find_source_review(review_id)
        url = review.get("proposed_source_url", "")
        now = self._now()

        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            review["source_url_check_status"] = "invalid"
            review["source_url_status_code"] = 0
            review["source_url_check_error"] = "URL 必须以 http 或 https 开头，并包含域名"
        else:
            connection_class = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
            path = parsed.path or "/"
            if parsed.query:
                path = f"{path}?{parsed.query}"

            try:
                connection = connection_class(parsed.netloc, timeout=timeout_seconds)
                connection.request("HEAD", path, headers={"User-Agent": "FlowPilotAI/0.1 source-review"})
                response = connection.getresponse()
                status_code = int(response.status)
                review["source_url_check_status"] = "reachable" if 200 <= status_code < 400 else "unreachable"
                review["source_url_status_code"] = status_code
                review["source_url_check_error"] = ""
                connection.close()
            except (OSError, TimeoutError, ValueError, http.client.HTTPException) as exc:
                review["source_url_check_status"] = "unreachable"
                review["source_url_status_code"] = 0
                review["source_url_check_error"] = str(exc)

        review["source_url_checked_at"] = now
        rule["updated_at"] = now[:10]
        rule.setdefault("audit_log", []).append(
            self._audit_entry("source_url_checked", "system", "候选来源 URL 可达性检查已记录", now)
        )
        self._save_persistent_rules()
        return deepcopy(review)

    def accept_source_review(self, rule_id: str, review_id: str, payload: RuleSourceReviewActionRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)
        review = self._get_source_review(rule, review_id)
        self._ensure_review_pending(review)

        now = self._now()
        old_version = rule.get("version", "0.1.0")
        new_version = self._increment_patch_version(old_version)
        rule["rule_summary"] = review["proposed_rule_summary"]
        rule["source_url"] = review["proposed_source_url"]
        rule["confidence"] = review["proposed_confidence"]
        rule["version"] = new_version
        rule["updated_at"] = now[:10]
        rule["source_check_status"] = "已采用"
        rule["source_check_summary"] = payload.decision_note or "新规则候选已采用。"
        rule.setdefault("change_log", []).append(f"P2.1 来源复核采用：{old_version} -> {new_version}")
        rule.setdefault("audit_log", []).append(
            self._audit_entry("source_review_accepted", payload.actor, "规则来源复核候选已采用", now)
        )
        review["status"] = "已采用"
        review["reviewed_at"] = now
        review["reviewer"] = payload.actor
        review["decision_note"] = payload.decision_note
        self._save_persistent_rules()
        return deepcopy(rule)

    def ignore_source_review(self, rule_id: str, review_id: str, payload: RuleSourceReviewActionRequest) -> dict[str, Any]:
        rule = self._get_rule(rule_id)
        review = self._get_source_review(rule, review_id)
        self._ensure_review_pending(review)

        now = self._now()
        review["status"] = "已忽略"
        review["reviewed_at"] = now
        review["reviewer"] = payload.actor
        review["decision_note"] = payload.decision_note
        rule["updated_at"] = now[:10]
        rule["source_check_status"] = "已忽略"
        rule["source_check_summary"] = payload.decision_note or "新规则候选已忽略。"
        rule.setdefault("audit_log", []).append(
            self._audit_entry("source_review_ignored", payload.actor, "规则来源复核候选已忽略", now)
        )
        self._save_persistent_rules()
        return deepcopy(rule)

    def _change_effective_status(
        self,
        rule_id: str,
        actor: str,
        status: str,
        action: str,
        summary: str,
    ) -> dict[str, Any]:
        rule = self._get_rule(rule_id)
        now = self._now()
        rule["effective_status"] = status
        rule["updated_at"] = now[:10]
        rule["audit_log"].append(self._audit_entry(action, actor, summary, now))
        self._save_persistent_rules()
        return deepcopy(rule)

    def _load_persistent_rules(self) -> None:
        for rule in self._repository.load_rules():
            self._rules[rule["rule_id"]] = rule

    def _save_persistent_rules(self) -> None:
        rules = [rule for rule in self._rules.values() if rule.get("data_mode") != "mock"]
        self._repository.save_rules(rules)

    def _get_rule(self, rule_id: str) -> dict[str, Any]:
        rule = self._rules.get(rule_id)

        if rule is None:
            raise HTTPException(status_code=404, detail="Rule not found")

        return rule

    def _get_source_review(self, rule: dict[str, Any], review_id: str) -> dict[str, Any]:
        for review in rule.get("source_review_tasks", []):
            if review.get("review_id") == review_id:
                return review

        raise HTTPException(status_code=404, detail="Source review not found")

    def _find_source_review(self, review_id: str) -> tuple[dict[str, Any], dict[str, Any]]:
        for rule in self._rules.values():
            for review in rule.get("source_review_tasks", []):
                if review.get("review_id") == review_id:
                    return rule, review

        raise HTTPException(status_code=404, detail="Source review not found")

    def _ensure_review_pending(self, review: dict[str, Any]) -> None:
        if review.get("status") != "待复核":
            raise HTTPException(status_code=400, detail="来源复核候选已处理，不能重复决策")

    def _audit_entry(self, action: str, actor: str, summary: str, at: str) -> dict[str, str]:
        return {
            "action": action,
            "actor": actor,
            "summary": summary,
            "at": at,
        }

    def _now(self) -> str:
        return datetime.now().replace(microsecond=0).isoformat()

    def _increment_patch_version(self, version: str) -> str:
        core = version.split("-", 1)[0]
        parts = core.split(".")

        if len(parts) != 3 or not all(part.isdigit() for part in parts):
            return "0.1.1"

        parts[-1] = str(int(parts[-1]) + 1)
        return ".".join(parts)


rule_store = RuleStore()
