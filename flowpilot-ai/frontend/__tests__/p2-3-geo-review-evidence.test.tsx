import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewPage from "../app/geo-monitor/review/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/geo-monitor/sessions")) {
        return response({ data_mode: "mock", evidence_levels: { "0": "未出现", "1": "出现相关概念", "2": "品牌被提及", "3": "页面被检索到", "4": "页面作为来源被引用" }, sessions: [] });
      }
      if (url.includes("/api/geo-monitor/records")) {
        return response({ data_mode: "mock", records: [{ record_id: "record-1", session_id: "session-1", query: "武汉智能沙盘厂家有哪些？", ai_channel: "deepseek", target_brand: "武汉微艺达", target_url: "https://example.com", checked_at: "2026-09-11", evidence_level: 2, evidence_label: "品牌被提及", related_concept_found: true, brand_mentioned: true, page_retrieved: false, source_cited: false, raw_response: "人工录入结果", response_summary: "品牌被提及", review_status_code: "pending", manual_review_status: "待复核", reviewer: "", review_note: "", reviewed_at: "", evidence_attachments: [], audit_log: [], data_mode: "manual" }] });
      }
      return response({ detail: "not found" }, 404);
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("证据复核页面", () => {
  it("展示补充证据和人工复核操作", async () => {
    installFetchMock();
    render(<ReviewPage />);
    expect(await screen.findByText("证据与复核")).toBeInTheDocument();
    expect(screen.getByLabelText("证据链接")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /确认有效/ })).toBeInTheDocument();
  });
});
