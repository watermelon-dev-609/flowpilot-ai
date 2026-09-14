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
});
