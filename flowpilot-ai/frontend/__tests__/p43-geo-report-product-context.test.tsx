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
    const saveReportSnapshot = vi.fn().mockImplementation(async (payload) => ({
      snapshot_id: "geo-report-product",
      created_at: "2026-09-16T11:30:00",
      ...payload
    }));

    window.history.replaceState(
      {},
      "",
      "/geo-monitor/report?session=geo-product-session&query=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA%E9%80%89%E5%9E%8B%E6%8C%87%E5%8D%97&url=https%3A%2F%2Fexample.com%2Farticles%2Fsandbox&product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98"
    );

    render(
      <GeoMonitorReportPanel
        records={[buildRecord(), buildRecord({ record_id: "other-product", product_name: "数字展厅", target_url: "https://example.com/other" })]}
        sessions={[buildSession()]}
        onSaveReportSnapshot={saveReportSnapshot}
      />
    );

    expect(screen.getByText("产品：智能沙盘")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));

    const weeklyReport = screen.getByLabelText("周报文本内容") as HTMLTextAreaElement;
    expect(weeklyReport.value).toContain("- 产品：智能沙盘");
    expect(saveReportSnapshot).toHaveBeenCalledWith(expect.objectContaining({ product_name: "智能沙盘" }));
    expect(await screen.findByText("报告快照已保存")).toBeInTheDocument();
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
});
