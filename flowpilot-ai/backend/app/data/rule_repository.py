"""规则中心数据访问层。"""

from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Protocol
from uuid import uuid4

from fastapi import HTTPException


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


__all__ = ["RuleRepository", "JsonRuleRepository"]
