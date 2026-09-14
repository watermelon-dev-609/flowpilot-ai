import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GeoMonitorDataPanel } from "../app/geo-monitor/components/geo-monitor-record-panel";
import { GeoMonitorRecord } from "../app/lib/flowpilot-api";

function buildRecord(index: number, channel = index % 2 === 0 ? "deepseek" : "kimi"): GeoMonitorRecord {
  return {
    record_id: `record-${index}`,
    session_id: "session-1",
    query: `测试问题 ${index}`,
    ai_channel: channel,
    target_brand: "武汉微艺达",
    target_url: "https://example.com",
    checked_at: "2026-09-11",
    evidence_level: index % 5,
    evidence_label: "品牌被提及",
    related_concept_found: true,
    brand_mentioned: true,
    page_retrieved: false,
    source_cited: false,
    raw_response: "人工录入结果",
    response_summary: "摘要",
    review_status_code: "pending",
    manual_review_status: "待复核",
    reviewer: "",
    review_note: "",
    reviewed_at: "",
    evidence_attachments: [],
    audit_log: [],
    data_mode: "manual" as const
  };
}

describe("监测记录筛选分页", () => {
  it("按模型平台筛选并保留分页控件", () => {
    render(
      <GeoMonitorDataPanel
        data={{
          sessions: { data_mode: "mock", evidence_levels: {}, sessions: [] },
          records: { data_mode: "mock", records: Array.from({ length: 12 }, (_, index) => buildRecord(index)) }
        }}
        showReviewCards={false}
      />
    );

    expect(screen.getByLabelText("模型平台筛选")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("模型平台筛选"), { target: { value: "kimi" } });
    expect(screen.getAllByText("月之暗面").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "下一页" })).toBeInTheDocument();
  });
});
