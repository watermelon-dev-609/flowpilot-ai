import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeoMonitorReportPanel } from "../app/geo-monitor/components/geo-monitor-report-panel";
import { GeoMonitorRecord, GeoMonitorSession } from "../app/lib/flowpilot-api";

function buildRecord(overrides: Partial<GeoMonitorRecord> = {}): GeoMonitorRecord {
  return {
    record_id: "record-report",
    session_id: "session-report",
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
    review_status_code: "pending",
    manual_review_status: "待复核",
    reviewer: "",
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
    session_id: "session-report",
    name: "武汉智能沙盘周报任务",
    target_brand: "武汉微艺达",
    target_url: "https://example.com/weiyida",
    created_at: "2026-09-11 10:00:00",
    data_mode: "manual",
    total_records: 1,
    highest_evidence_level: 2
  };
}

describe("生成式运营报告", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/geo-monitor/report");
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/geo-monitor/report");
  });

  it("从监测流程进入报告页时按查询词聚焦记录", () => {
    window.history.replaceState(
      {},
      "",
      "/geo-monitor/report?query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F"
    );

    render(
      <GeoMonitorReportPanel
        records={[
          buildRecord({
            record_id: "focused-record",
            query: "武汉智能沙盘厂家怎么选？",
            brand_mentioned: true,
            page_retrieved: true,
            source_cited: true,
            evidence_level: 4,
            evidence_label: "页面作为来源被引用"
          }),
          buildRecord({
            record_id: "other-record",
            query: "数字展厅预算怎么做？",
            brand_mentioned: false,
            page_retrieved: false,
            source_cited: false,
            evidence_level: 1,
            evidence_label: "出现相关概念"
          })
        ]}
        sessions={[buildSession()]}
      />
    );

    expect(screen.getByText("已聚焦监测结果")).toBeInTheDocument();
    expect(screen.getByText("查询词：武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("1 条")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));
    expect((screen.getByLabelText("周报文本内容") as HTMLTextAreaElement).value).toContain("查询词包含：武汉智能沙盘厂家怎么选？");
  });

  it("从发布监测链路进入报告页时按任务和来源链接聚焦复盘", () => {
    window.history.replaceState(
      {},
      "",
      "/geo-monitor/report?session=session-report&query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox"
    );

    render(
      <GeoMonitorReportPanel
        records={[
          buildRecord({
            record_id: "focused-record",
            query: "武汉智能沙盘厂家怎么选？",
            target_url: "https://example.com/articles/wuhan-sandbox",
            brand_mentioned: true,
            page_retrieved: true,
            source_cited: true,
            evidence_level: 4,
            evidence_label: "页面作为来源被引用"
          }),
          buildRecord({
            record_id: "other-session-record",
            session_id: "other-session",
            query: "武汉智能沙盘厂家怎么选？",
            target_url: "https://example.com/other",
            brand_mentioned: false,
            page_retrieved: false,
            source_cited: false,
            evidence_level: 1,
            evidence_label: "出现相关概念"
          })
        ]}
        sessions={[buildSession(), { ...buildSession(), session_id: "other-session", name: "其他任务" }]}
      />
    );

    expect(screen.getByText("来源链路：发布准备 -> 监测记录 -> 运营报告")).toBeInTheDocument();
    expect(screen.getByText("报告监测任务：武汉智能沙盘周报任务")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看发布来源" })).toHaveAttribute("href", "https://example.com/articles/wuhan-sandbox");
    expect(screen.getByText("1 条")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));
    const weeklyReport = (screen.getByLabelText("周报文本内容") as HTMLTextAreaElement).value;
    expect(weeklyReport).toContain("监测任务：武汉智能沙盘周报任务");
    expect(weeklyReport).toContain("发布来源：https://example.com/articles/wuhan-sandbox");
  });

  it("汇总真实监测记录并生成周报文本", () => {
    render(<GeoMonitorReportPanel records={[buildRecord({ source_cited: true, page_retrieved: true, review_status_code: "verified", manual_review_status: "已确认" })]} sessions={[buildSession()]} />);

    expect(screen.getByRole("region", { name: "生成式运营报告预览" })).toBeInTheDocument();
    expect(screen.getByText("品牌提及率")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));
    expect((screen.getByLabelText("周报文本内容") as HTMLTextAreaElement).value).toContain("# 生成式运营周报");
    expect(screen.getByRole("region", { name: "报告快照记录" })).toBeInTheDocument();
  });

  it("生成周报后保存报告快照", async () => {
    const saveReportSnapshot = vi.fn().mockResolvedValue({
      snapshot_id: "geo-report-test",
      created_at: "2026-09-11T10:30:00",
      scope_label: "保存后的报告范围",
      report_period: "2026-09-11",
      total_records: 1,
      brand_mention_rate: 100,
      page_retrieval_rate: 100,
      source_citation_rate: 100,
      report_text: "# 生成式运营周报",
      session_id: "",
      session_name: "",
      query: "",
      source_url: "",
      data_mode: "manual"
    });

    render(
      <GeoMonitorReportPanel
        records={[buildRecord({ source_cited: true, page_retrieved: true, review_status_code: "verified", manual_review_status: "已确认" })]}
        sessions={[buildSession()]}
        onSaveReportSnapshot={saveReportSnapshot}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));

    expect(saveReportSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        report_text: expect.stringContaining("# 生成式运营周报"),
        total_records: 1,
        actor: "frontend-user"
      })
    );
    expect(await screen.findByText("保存后的报告范围")).toBeInTheDocument();
  });

  it("进入报告页时展示已保存的报告快照", () => {
    render(
      <GeoMonitorReportPanel
        records={[buildRecord()]}
        sessions={[buildSession()]}
        initialReportSnapshots={[
          {
            snapshot_id: "geo-report-history",
            created_at: "2026-09-10T09:00:00",
            scope_label: "历史报告范围",
            report_period: "2026-09-10",
            total_records: 3,
            brand_mention_rate: 67,
            page_retrieval_rate: 33,
            source_citation_rate: 33,
            report_text: "# 历史周报",
            session_id: "session-report",
            session_name: "武汉智能沙盘周报任务",
            query: "武汉智能沙盘厂家怎么选？",
            source_url: "https://example.com/articles/wuhan-sandbox",
            data_mode: "manual"
          }
        ]}
      />
    );

    expect(screen.getByText("历史报告范围")).toBeInTheDocument();
    expect(screen.getByText("3 条记录")).toBeInTheDocument();
  });

  it("查看并复用历史报告快照正文", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:history-report");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) =>
        tagName === "a" ? ({ click, href: "", download: "" } as unknown as HTMLAnchorElement) : originalCreateElement(tagName)
      );

    render(
      <GeoMonitorReportPanel
        records={[buildRecord()]}
        sessions={[buildSession()]}
        initialReportSnapshots={[
          {
            snapshot_id: "geo-report-history",
            created_at: "2026-09-10T09:00:00",
            scope_label: "历史报告范围",
            report_period: "2026-09-10",
            total_records: 3,
            brand_mention_rate: 67,
            page_retrieval_rate: 33,
            source_citation_rate: 33,
            report_text: "# 历史周报\n\n- 监测任务：武汉智能沙盘周报任务",
            session_id: "session-report",
            session_name: "武汉智能沙盘周报任务",
            query: "武汉智能沙盘厂家怎么选？",
            source_url: "https://example.com/articles/wuhan-sandbox",
            data_mode: "manual"
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "查看完整周报" }));
    expect(screen.getByLabelText("历史周报正文")).toHaveValue("# 历史周报\n\n- 监测任务：武汉智能沙盘周报任务");

    fireEvent.click(screen.getByRole("button", { name: "复制历史周报" }));
    expect(writeText).toHaveBeenCalledWith("# 历史周报\n\n- 监测任务：武汉智能沙盘周报任务");
    expect(await screen.findByText("已复制历史周报")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下载历史周报" }));
    expect(click).toHaveBeenCalled();
    expect(screen.getByText("已下载历史周报")).toBeInTheDocument();

    createElement.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("复制和下载周报文本", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) =>
        tagName === "a" ? ({ click, href: "", download: "" } as unknown as HTMLAnchorElement) : originalCreateElement(tagName)
      );

    render(<GeoMonitorReportPanel records={[buildRecord()]} sessions={[buildSession()]} />);
    fireEvent.click(screen.getByRole("button", { name: "生成周报文本" }));
    fireEvent.click(screen.getByRole("button", { name: "复制周报" }));
    expect(await screen.findByText("已复制周报文本")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "下载文本文件" }));
    expect(screen.getByText("已下载周报文本文件")).toBeInTheDocument();

    createElement.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("没有真实记录时展示空状态", () => {
    render(<GeoMonitorReportPanel records={[]} sessions={[]} />);
    expect(screen.getByText("暂无可生成报告的真实监测记录")).toBeInTheDocument();
  });
});
