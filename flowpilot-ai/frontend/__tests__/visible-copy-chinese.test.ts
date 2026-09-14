import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const appRoot = join(process.cwd(), "app");

const checkedFiles = [
  "layout.tsx",
  "rules/page.tsx",
  "rules/rules-workspace.tsx",
  "geo-monitor/error.tsx",
  "geo-monitor/loading.tsx",
  "geo-monitor/page.tsx",
  "geo-monitor/sessions/page.tsx",
  "geo-monitor/records/page.tsx",
  "geo-monitor/review/page.tsx",
  "geo-monitor/report/page.tsx",
  "geo-monitor/components/geo-monitor-overview-panel.tsx",
  "geo-monitor/components/geo-monitor-session-panel.tsx",
  "geo-monitor/components/geo-monitor-record-panel.tsx",
  "geo-monitor/components/geo-monitor-review-panel.tsx",
  "geo-monitor/components/geo-monitor-report-panel.tsx",
  "geo-monitor/components/shared.ts"
];

const bannedVisibleFragments = [
  "FlowPilot AI",
  "GEO 监测",
  "GEO 数据",
  "GEO 运营",
  "GEO 效果",
  "GEO 成果",
  "AI 平台",
  "AI 平台规则",
  "AI 搜索",
  "AI 查询",
  "AI 响应",
  "Mock 数据",
  "Demo 数据",
  "API 请求失败",
  "读取后端 P1 API",
  "目标页面 URL",
  "来源 URL",
  "证据 URL",
  "候选来源 URL",
  "HTTP ",
  "Real GEO Evidence Workspace",
  "GEO Monitor",
  "GEO Report",
  "GEO Evidence Review",
  "Raw AI Response Evidence",
  "Markdown Export",
  "Markdown 周报"
];

describe("全站可见文案中文化审计", () => {
  it("核心页面不展示英文缩写或英文产品词", () => {
    const violations = checkedFiles.flatMap((relativeFile) => {
      const content = readFileSync(join(appRoot, relativeFile), "utf8");
      return bannedVisibleFragments
        .filter((fragment) => content.includes(fragment))
        .map((fragment) => `${relativeFile}: ${fragment}`);
    });

    expect(violations).toEqual([]);
  });
});
