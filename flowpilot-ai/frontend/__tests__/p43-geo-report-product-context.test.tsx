import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeoMonitorReportPanel } from "../app/geo-monitor/components/geo-monitor-report-panel";
import { GeoMonitorRecord, GeoMonitorSession } from "../app/lib/flowpilot-api";

function buildRecord(overrides: Partial<GeoMonitorRecord> = {}): GeoMonitorRecord {
  return {
    record_id: "geo-record-product",
    session_id: "geo-product-session",
    query: "智能沙盘展厅负责人选型指南",
    ai_channel: "deepseek",
    target_brand: "武汉微艺达",
    target_url: "https://example.com/articles/sandbox",
    product_name: "智能沙盘",
    checked_at: "2026-09-16 11:20:00",
    evidence_level: 4,
    evidence_label: "页面作为来源被引用",
    related_concept_found: true,
    brand_mentioned: true,
    page_retrieved: true,
    source_cited: true,
    raw_response: "人工录入模型回答，提到了武汉微艺达智能沙盘。",
    response_summary: "品牌、产品和来源均已被记录。",
    review_status_code: "verified",
    manual_review_status: "已确认",
    reviewer: "运营",
    review_note: "",
    reviewed_at: "",
    evidence_attachments: [],
    audit_log: [],
    data_mode: "manual",
    ...overrides
  };
}

function buildSession(): GeoMonitorSession {
  return {
    session_id: "geo-product-session",
    name: "发布后监测：智能沙盘展厅负责人选型指南",
    target_brand: "武汉微艺达",
    target_url: "https://example.com/articles/sandbox",
    created_at: "2026-09-16 11:05:00",
    data_mode: "manual",
    total_records: 1,
    highest_evidence_level: 4
  };
}

describe("GEO report product context", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/geo-monitor/report");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/geo-monitor/report");
  });

  it("carries product focus into report text and saved snapshots", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/content-calendar/plans/api-product-plan") && init?.method === "PATCH") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "api-product-plan",
            topic_title: "智能沙盘展厅负责人选型指南",
            platform: "知乎",
            brand_name: "武汉微艺达",
            product_name: "智能沙盘",
            region: "武汉",
            target_audience: "展厅负责人",
            facts: "复盘同步测试事实。",
            overall_score: 91,
            status: "已生成",
            content_stage: "已复盘",
            created_at: "2026-09-16T11:00:00",
            data_mode: "manual"
          })
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({ detail: "not found" }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    const saveReportSnapshot = vi.fn().mockImplementation(async (payload) => ({
      snapshot_id: "geo-report-product",
      created_at: "2026-09-16T11:30:00",
      ...payload
    }));

    window.history.replaceState(
      {},
      "",
      "/geo-monitor/report?session=geo-product-session&query=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA%E9%80%89%E5%9E%8B%E6%8C%87%E5%8D%97&url=https%3A%2F%2Fexample.com%2Farticles%2Fsandbox&product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&plan=api-product-plan"
    );

    render(
      <GeoMonitorReportPanel
        records={[buildRecord(), buildRecord({ record_id: "other-product", product_name: "数字展厅", target_url: "https://example.com/other" })]}
        sessions={[buildSession()]}
        onSaveReportSnapshot={saveReportSnapshot}
      />
    );

    expect(screen.getByText("产品：智能沙盘")).toBeInTheDocument();
    expect(screen.getByText("内容计划：api-product-plan")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));

    const weeklyReport = screen.getByLabelText("周报文本内容") as HTMLTextAreaElement;
    expect(weeklyReport.value).toContain("- 产品：智能沙盘");
    expect(weeklyReport.value).toContain("- 内容计划：api-product-plan");
    expect(saveReportSnapshot).toHaveBeenCalledWith(expect.objectContaining({ product_name: "智能沙盘" }));
    expect(await screen.findByText("报告快照已保存")).toBeInTheDocument();
    const stageCall = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/api/content-calendar/plans/api-product-plan") && init?.method === "PATCH");
    expect(stageCall).toBeTruthy();
    expect(JSON.parse(String(stageCall?.[1]?.body))).toMatchObject({
      content_stage: "已复盘",
      actor: "frontend-user"
    });
  });

  it("shows product names on historical report snapshots", () => {
    render(
      <GeoMonitorReportPanel
        records={[buildRecord()]}
        sessions={[buildSession()]}
        initialReportSnapshots={[
          {
            snapshot_id: "geo-report-history-product",
            created_at: "2026-09-16T11:30:00",
            scope_label: "智能沙盘 / 发布来源复盘",
            report_period: "2026-09-16",
            total_records: 1,
            brand_mention_rate: 100,
            page_retrieval_rate: 100,
            source_citation_rate: 100,
            report_text: "# 生成式运营周报\n\n- 产品：智能沙盘",
            session_id: "geo-product-session",
            session_name: "发布后监测：智能沙盘展厅负责人选型指南",
            query: "智能沙盘展厅负责人选型指南",
            source_url: "https://example.com/articles/sandbox",
            product_name: "智能沙盘",
            data_mode: "manual"
          }
        ]}
      />
    );

    expect(screen.getByText("产品：智能沙盘")).toBeInTheDocument();
  });

  it("filters report records by selected product", () => {
    render(
      <GeoMonitorReportPanel
        records={[
          buildRecord({ record_id: "sandbox-record", product_name: "智能沙盘", brand_mentioned: true, source_cited: true }),
          buildRecord({
            record_id: "expo-record",
            product_name: "数字展厅",
            query: "数字展厅预算怎么做",
            brand_mentioned: false,
            page_retrieved: false,
            source_cited: false,
            evidence_level: 1
          })
        ]}
        sessions={[buildSession()]}
      />
    );

    fireEvent.change(screen.getByLabelText("报告产品"), { target: { value: "数字展厅" } });
    fireEvent.click(screen.getByRole("button", { name: "生成当前范围报告" }));

    expect(screen.getByText("覆盖产品数")).toBeInTheDocument();
    expect(screen.getByText("1 个")).toBeInTheDocument();
    expect(screen.getByText("产品：数字展厅")).toBeInTheDocument();
    expect(screen.getAllByText("1 条").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));
    expect((screen.getByLabelText("周报文本内容") as HTMLTextAreaElement).value).toContain("- 产品：数字展厅");
  });

  it("compares GEO performance by product", () => {
    render(
      <GeoMonitorReportPanel
        records={[
          buildRecord({ record_id: "sandbox-cited", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: true, source_cited: true }),
          buildRecord({ record_id: "sandbox-mentioned", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: false, source_cited: false }),
          buildRecord({
            record_id: "expo-related",
            product_name: "数字展厅",
            query: "数字展厅预算怎么做",
            brand_mentioned: false,
            page_retrieved: false,
            source_cited: false,
            evidence_level: 1
          })
        ]}
        sessions={[buildSession()]}
      />
    );

    const comparison = screen.getByRole("region", { name: "产品表现对比" });
    expect(comparison).toHaveTextContent("智能沙盘");
    expect(comparison).toHaveTextContent("2 条");
    expect(comparison).toHaveTextContent("100%");
    expect(comparison).toHaveTextContent("50%");
    expect(comparison).toHaveTextContent("数字展厅");
    expect(comparison).toHaveTextContent("1 条");
    expect(comparison).toHaveTextContent("0%");
  });

  it("persists product comparison in weekly report snapshots", async () => {
    const saveReportSnapshot = vi.fn().mockImplementation(async (payload) => ({
      snapshot_id: "geo-report-product-comparison",
      created_at: "2026-09-16T11:45:00",
      ...payload
    }));

    render(
      <GeoMonitorReportPanel
        records={[
          buildRecord({ record_id: "sandbox-cited", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: true, source_cited: true }),
          buildRecord({ record_id: "sandbox-mentioned", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: false, source_cited: false }),
          buildRecord({
            record_id: "expo-related",
            product_name: "数字展厅",
            query: "数字展厅预算怎么做",
            brand_mentioned: false,
            page_retrieved: false,
            source_cited: false,
            evidence_level: 1
          })
        ]}
        sessions={[buildSession()]}
        onSaveReportSnapshot={saveReportSnapshot}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));

    const weeklyReport = screen.getByLabelText("周报文本内容") as HTMLTextAreaElement;
    expect(weeklyReport.value).toContain("## 产品表现对比");
    expect(weeklyReport.value).toContain("- 智能沙盘：2 条，品牌提及率 100%，页面检索率 50%，来源引用率 50%");
    expect(weeklyReport.value).toContain("- 数字展厅：1 条，品牌提及率 0%，页面检索率 0%，来源引用率 0%");
    expect(saveReportSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        report_text: expect.stringContaining("## 产品表现对比")
      })
    );
    expect(await screen.findByText("报告快照已保存")).toBeInTheDocument();
  });
});
