import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeoMonitorOverviewPanel } from "../app/geo-monitor/components/geo-monitor-overview-panel";
import { GeoMonitorRecord, GeoMonitorSession } from "../app/lib/flowpilot-api";

function buildSession(overrides: Partial<GeoMonitorSession> = {}): GeoMonitorSession {
  return {
    session_id: "session-real",
    name: "真实监测任务",
    target_brand: "微艺达",
    target_url: "https://example.com",
    created_at: "2026-09-14",
    data_mode: "manual",
    total_records: 1,
    highest_evidence_level: 2,
    ...overrides
  };
}

function buildRecord(overrides: Partial<GeoMonitorRecord> = {}): GeoMonitorRecord {
  return {
    record_id: "record-real",
    session_id: "session-real",
    query: "武汉智能沙盘厂家有哪些？",
    ai_channel: "deepseek",
    target_brand: "微艺达",
    target_url: "https://example.com",
    checked_at: "2026-09-14",
    evidence_level: 2,
    evidence_label: "品牌被提及",
    related_concept_found: true,
    brand_mentioned: true,
    page_retrieved: false,
    source_cited: false,
    raw_response: "人工录入结果",
    response_summary: "品牌被提及",
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

describe("GEO 监测总览统计口径", () => {
  it("概览指标排除模拟任务和模拟记录", () => {
    render(
      <GeoMonitorOverviewPanel
        sessions={[
          buildSession(),
          buildSession({ session_id: "session-mock", name: "示例任务", data_mode: "mock", highest_evidence_level: 4 })
        ]}
        records={[
          buildRecord(),
          buildRecord({
            record_id: "record-mock",
            session_id: "session-mock",
            evidence_level: 4,
            source_cited: true,
            review_status_code: "pending",
            manual_review_status: "待复核",
            data_mode: "mock"
          })
        ]}
      />
    );

    expect(screen.getByText("仅统计真实 / 人工任务")).toBeInTheDocument();
    expect(screen.getByText("来源引用记录 0 条")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("surfaces product-level GEO risks and next actions", () => {
    render(
      <GeoMonitorOverviewPanel
        sessions={[buildSession()]}
        records={[
          buildRecord({ record_id: "sandbox-1", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: false, source_cited: false }),
          buildRecord({ record_id: "sandbox-2", product_name: "智能沙盘", brand_mentioned: true, page_retrieved: false, source_cited: false }),
          buildRecord({ record_id: "expo-1", product_name: "数字展厅", brand_mentioned: true, page_retrieved: true, source_cited: true })
        ]}
      />
    );

    const board = screen.getByRole("region", { name: "产品级风险与机会看板" });
    expect(board).toHaveTextContent("智能沙盘");
    expect(board).toHaveTextContent("高风险");
    expect(board).toHaveTextContent("优先补来源引用");
    expect(board).toHaveTextContent("数字展厅");
    expect(board).toHaveTextContent("表现稳定");
    expect(screen.getByRole("link", { name: "查看智能沙盘报告" })).toHaveAttribute("href", "/geo-monitor/report?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98");
    expect(screen.getByRole("link", { name: "生成智能沙盘选题" })).toHaveAttribute(
      "href",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&source=geo-monitor&risk=%E9%AB%98%E9%A3%8E%E9%99%A9&action=%E4%BC%98%E5%85%88%E8%A1%A5%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8&facts=%E5%93%81%E7%89%8C%E6%8F%90%E5%8F%8A%E7%8E%87%20100%25%EF%BC%8C%E9%A1%B5%E9%9D%A2%E6%A3%80%E7%B4%A2%E7%8E%87%200%25%EF%BC%8C%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8%E7%8E%87%200%25"
    );
  });
});
