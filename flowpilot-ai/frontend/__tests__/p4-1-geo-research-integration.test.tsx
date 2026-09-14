import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GeoResearchPage from "../app/geo-research/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const evidenceLevels = {
  "0": "未出现",
  "1": "出现相关概念",
  "2": "品牌被提及",
  "3": "页面被检索到",
  "4": "页面作为来源被引用"
};

const aiRule = {
  rule_id: "rule-p4-1",
  channel_type: "ai",
  channel_id: "deepseek",
  channel_name: "DeepSeek",
  rule_title: "结构化来源规则",
  rule_summary: "优先使用可验证内容。",
  source_type: "manual_verified",
  source_url: "https://example.com/deepseek",
  updated_at: "2026-09-11",
  version: "1.0.0",
  confidence: 0.8,
  review_status: "已确认",
  effective_status: "生效",
  data_mode: "manual"
};

const manualRecord = {
  record_id: "record-p4-1",
  session_id: "session-p4-1",
  query: "武汉智能沙盘厂家有哪些？",
  ai_channel: "deepseek",
  target_brand: "武汉微艺达",
  target_url: "https://example.com/weiyida",
  checked_at: "2026-09-11 10:00:00",
  evidence_level: 2,
  evidence_label: "品牌被提及",
  related_concept_found: true,
  brand_mentioned: true,
  page_retrieved: false,
  source_cited: false,
  raw_response: "人工录入的真实查询结果。",
  response_summary: "品牌被提及。",
  manual_review_status: "待复核",
  reviewer: "",
  data_mode: "manual"
};

afterEach(() => vi.unstubAllGlobals());

describe("研究页联动数据", () => {
  it("展示规则与监测数据来源概览", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/ai-channels")) {
          return response({
            channel_type: "ai",
            data_mode: "mock",
            source_policy: "official_first_manual_confirmed",
            rules: [aiRule]
          });
        }
        if (url.includes("/api/rules/publishing-channels")) {
          return response({
            channel_type: "publishing",
            data_mode: "mock",
            source_policy: "official_first_manual_confirmed",
            rules: []
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) {
          return response({ data_mode: "mock", evidence_levels: evidenceLevels, sessions: [] });
        }
        if (url.includes("/api/geo-monitor/records")) {
          return response({ data_mode: "mock", records: [manualRecord] });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<GeoResearchPage />);

    expect(await screen.findByText("研究数据来源概览")).toBeInTheDocument();
    expect(screen.getByText("模型平台规则")).toBeInTheDocument();
    expect(screen.getByText("媒体平台规则")).toBeInTheDocument();
    expect(screen.getAllByText("1 条").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("仅统计真实 / 人工记录")).toBeInTheDocument();
  });
});
