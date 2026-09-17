"""规则中心数据访问层。"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, sessionmaker

from app.data.models import RuleRecord


class RuleRepository(Protocol):
    def load_rules(self) -> list[dict[str, Any]]: ...

    def save_rules(self, rules: list[dict[str, Any]]) -> None: ...


class JsonRuleRepository:
    """本地 JSON 规则仓储。

    只负责 IO 与持久化格式；规则状态流转仍由 RuleStore 负责。
    """

    def __init__(self, storage_path: str | Path) -> None:
        self._storage_path = Path(storage_path)

    def load_rules(self) -> list[dict[str, Any]]:
        if not self._storage_path.exists():
            return []

        try:
            payload = json.loads(self._storage_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=500, detail=f"规则持久化文件损坏：{self._storage_path}") from exc

        return [
            deepcopy(rule)
            for rule in payload.get("rules", [])
            if rule.get("data_mode") != "mock" and rule.get("rule_id")
        ]

    def save_rules(self, rules: list[dict[str, Any]]) -> None:
        payload = {
            "schema_version": 1,
            "updated_at": datetime.now().replace(microsecond=0).isoformat(),
            "rules": [deepcopy(rule) for rule in rules if rule.get("data_mode") != "mock"],
        }

        self._storage_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self._storage_path.with_name(f"{self._storage_path.name}.{uuid4().hex}.tmp")
        try:
            temp_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            temp_path.replace(self._storage_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()


class SqlAlchemyRuleRepository:
    """SQLAlchemy 规则仓储。

    本阶段以 payload_json 保留完整规则对象契约，同时把查询常用字段独立成列。
    """

    def __init__(self, session_factory: sessionmaker[Session]) -> None:
        self._session_factory = session_factory

    def load_rules(self) -> list[dict[str, Any]]:
        with self._session_factory() as session:
            records = session.scalars(select(RuleRecord).order_by(RuleRecord.updated_at.asc())).all()
            return [json.loads(record.payload_json) for record in records]

    def save_rules(self, rules: list[dict[str, Any]]) -> None:
        durable_rules = [deepcopy(rule) for rule in rules if rule.get("data_mode") != "mock" and rule.get("rule_id")]
        durable_ids = {rule["rule_id"] for rule in durable_rules}

        with self._session_factory() as session:
            with session.begin():
                if durable_ids:
                    session.execute(delete(RuleRecord).where(RuleRecord.rule_id.not_in(durable_ids)))
                else:
                    session.execute(delete(RuleRecord))

                for rule in durable_rules:
                    existing = session.get(RuleRecord, rule["rule_id"])
                    payload_json = json.dumps(rule, ensure_ascii=False, sort_keys=True)
                    if existing is None:
                        session.add(_to_rule_record(rule, payload_json))
                    else:
                        existing.channel_type = str(rule.get("channel_type") or "")
                        existing.channel_id = str(rule.get("channel_id") or "")
                        existing.channel_name = str(rule.get("channel_name") or "")
                        existing.rule_title = str(rule.get("rule_title") or "")
                        existing.review_status = str(rule.get("review_status") or "")
                        existing.effective_status = str(rule.get("effective_status") or "")
                        existing.data_mode = str(rule.get("data_mode") or "")
                        existing.updated_at = str(rule.get("updated_at") or "")
                        existing.payload_json = payload_json


def _to_rule_record(rule: dict[str, Any], payload_json: str) -> RuleRecord:
    return RuleRecord(
        rule_id=str(rule["rule_id"]),
        channel_type=str(rule.get("channel_type") or ""),
        channel_id=str(rule.get("channel_id") or ""),
        channel_name=str(rule.get("channel_name") or ""),
        rule_title=str(rule.get("rule_title") or ""),
        review_status=str(rule.get("review_status") or ""),
        effective_status=str(rule.get("effective_status") or ""),
        data_mode=str(rule.get("data_mode") or ""),
        updated_at=str(rule.get("updated_at") or ""),
        payload_json=payload_json,
    )


__all__ = ["RuleRepository", "JsonRuleRepository", "SqlAlchemyRuleRepository"]
