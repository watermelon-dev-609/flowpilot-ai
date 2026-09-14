import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RulesPage from "../app/rules/page";
import RecordsPage from "../app/geo-monitor/records/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/rules/ai-channels")) {
        return response({
          channel_type: "ai",
          data_mode: "mock",
          source_policy: "official_first_manual_confirmed",
          rules: [
            {
              rule_id: "r1",
              channel_type: "ai",
              channel_id: "deepseek",
              channel_name: "深度求索",
              rule_title: "结构化回答规则",
              rule_summary: "优先展示可验证来源。",
              version: "0.2.0",
              confidence: 0.8,
              source_type: "manual",
              source_url: "",
              review_status: "待确认",
              effective_status: "草稿",
              updated_at: "2026-09-11",
              data_mode: "manual",
              audit_log: []
            }
          ]
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
      if (url.includes("/api/rule-source-reviews")) return response({ data_mode: "mock", reviews: [] });
      if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mock", reminders: [] });
      if (url.includes("/api/geo-monitor/sessions")) {
        return response({ data_mode: "mock", evidence_levels: {}, sessions: [] });
      }
      if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mock", records: [] });
      return response({ detail: "not found" }, 404);
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("接口联通页面", () => {
  it("规则中心从后端接口读取规则", async () => {
    installFetchMock();
    render(<RulesPage />);
    expect(await screen.findByText("结构化回答规则")).toBeInTheDocument();
    expect(screen.getByText("已连接后端接口")).toBeInTheDocument();
  });

  it("监测记录页从后端接口进入空状态", async () => {
    installFetchMock();
    render(<RecordsPage />);
    expect(await screen.findByRole("heading", { name: "监测记录库" })).toBeInTheDocument();
    expect(screen.getByText("录入真实查询记录")).toBeInTheDocument();
  });
});
