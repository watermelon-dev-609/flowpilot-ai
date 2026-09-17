"""S1.6 内容计划迁移工具。

把旧版 `content-calendar.local.json` 中的计划导入 Repository 目标。
重复执行时按 `id` 跳过已存在记录，避免重复审计日志或重复主记录。
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from app.data.content_plan_repository import ContentPlanRepository, SqlAlchemyContentPlanRepository
from app.data.repository_factory import DEFAULT_JSON_FALLBACK_PATH, build_content_plan_repository


def import_content_plans_from_json(
    source_path: str | Path,
    repository: ContentPlanRepository,
) -> dict[str, int]:
    source = Path(source_path)
    payload = _read_source_payload(source)
    plans = payload.get("plans", [])
    if not isinstance(plans, list):
        raise HTTPException(status_code=500, detail=f"内容计划迁移源文件结构错误：{source}")

    created = 0
    skipped = 0

    for plan in plans:
        if not isinstance(plan, dict):
            raise HTTPException(status_code=500, detail=f"内容计划迁移源文件结构错误：{source}")
        plan_id = str(plan.get("id") or "")
        if not plan_id:
            raise HTTPException(status_code=500, detail=f"内容计划缺少 id，无法迁移：{source}")

        if _plan_exists(repository, plan_id):
            skipped += 1
            continue

        repository.import_plan(plan)
        created += 1

    return {"created": created, "skipped": skipped, "total": len(plans)}


def _read_source_payload(source: Path) -> dict[str, Any]:
    try:
        payload = json.loads(source.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"内容计划迁移源文件损坏：{source}") from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=f"内容计划迁移源文件不存在：{source}") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=500, detail=f"内容计划迁移源文件结构错误：{source}")
    return payload


def _plan_exists(repository: ContentPlanRepository, plan_id: str) -> bool:
    try:
        repository.get_plan(plan_id)
    except HTTPException as exc:
        if exc.status_code == 404:
            return False
        raise
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Import content-calendar JSON plans into the configured repository.")
    parser.add_argument(
        "--source",
        default=str(DEFAULT_JSON_FALLBACK_PATH),
        help="Path to content-calendar.local.json",
    )
    parser.add_argument(
        "--database-url",
        default=None,
        help="Optional SQLAlchemy database URL. Defaults to FLOWPILOT_DATABASE_URL or local SQLite.",
    )
    parser.add_argument(
        "--allow-json-fallback",
        action="store_true",
        help="Allow importing back into JSON fallback when the database is unavailable.",
    )
    args = parser.parse_args()

    repository = build_content_plan_repository(database_url=args.database_url)
    if not args.allow_json_fallback and not isinstance(repository, SqlAlchemyContentPlanRepository):
        raise SystemExit("Database repository is unavailable. Re-run with --allow-json-fallback only for local recovery.")

    summary = import_content_plans_from_json(args.source, repository)
    print(
        f"Imported content plans: created={summary['created']} skipped={summary['skipped']} total={summary['total']}"
    )


if __name__ == "__main__":
    main()
