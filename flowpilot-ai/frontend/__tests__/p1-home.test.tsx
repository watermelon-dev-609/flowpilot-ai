import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "../app/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => vi.unstubAllGlobals());

describe("首页", () => {
  it("展示主业务流程并连接关键工作台", () => {
    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });

    expect(within(workflow).getByRole("link", { name: "生成式优化研究" })).toHaveAttribute("href", "/geo-research");
    expect(within(workflow).getByRole("link", { name: "内容日历" })).toHaveAttribute("href", "/content-calendar");
    expect(within(workflow).getByRole("link", { name: "内容适配" })).toHaveAttribute("href", "/content-adaptation");
    expect(within(workflow).getByRole("link", { name: "发布准备" })).toHaveAttribute("href", "/publish-queue");
    expect(within(workflow).getByRole("link", { name: "监测复盘" })).toHaveAttribute("href", "/geo-monitor");
  });

  it("展示规则中心，并区分模型平台和媒体平台规则", () => {
    render(<Home />);

    expect(screen.getAllByText("规则中心").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("模型平台规则")).toBeInTheDocument();
    expect(screen.getByText("媒体平台规则")).toBeInTheDocument();
    expect(screen.getAllByText(/规则来源/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/版本/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/置信度/).length).toBeGreaterThanOrEqual(1);
  });

  it("展示监测中心、模拟数据提示和证据等级", () => {
    render(<Home />);

    expect(screen.getAllByText("监测中心").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("模拟数据不计入真实效果")).toBeInTheDocument();
    expect(screen.getByText("品牌提及")).toBeInTheDocument();
    expect(screen.getByText("页面检索")).toBeInTheDocument();
    expect(screen.getByText("来源引用")).toBeInTheDocument();
  });

  it("展示加载、空、错误等页面状态承诺", () => {
    render(<Home />);

    expect(screen.getByText("状态保障")).toBeInTheDocument();
    expect(screen.getByText("骨架屏")).toBeInTheDocument();
    expect(screen.getByText("加载中")).toBeInTheDocument();
    expect(screen.getByText("空状态")).toBeInTheDocument();
    expect(screen.getByText("错误状态")).toBeInTheDocument();
  });

  it("链接到独立工作区", () => {
    render(<Home />);

    expect(screen.getByRole("link", { name: "进入规则中心" })).toHaveAttribute("href", "/rules");
    expect(screen.getByRole("link", { name: "进入监测中心" })).toHaveAttribute("href", "/geo-monitor");
  });

  it("首页可见文案不出现旧英文界面词", () => {
    render(<Home />);

    const visibleText = document.body.textContent || "";
    expect(visibleText).not.toMatch(/FlowPilot|GEO|AI|Mock|Next|FastAPI|ComfyUI|CAD/i);
  });

  it("展示与项目能力相符的产品定位", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: "今日运营工作台" })).toBeInTheDocument();
    expect(screen.getByText("企业智能运营工作台")).toBeInTheDocument();
    expect(screen.getByText("产品图片 / 产品资料")).toBeInTheDocument();
    expect(screen.getAllByText("引用准备度").length).toBeGreaterThanOrEqual(1);
  });

  it("展示模拟模式和基础进度状态", () => {
    render(<Home />);

    expect(screen.getAllByText("模拟模式").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("项目骨架")).toBeInTheDocument();
    expect(screen.getByText("接口可访问")).toBeInTheDocument();
    expect(screen.getByText("页面可打开")).toBeInTheDocument();
  });

  it("首页运营指标从后端接口统计真实和人工数据", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) {
          return response({
            data_mode: "mixed",
            reminders: [
              {
                rule_id: "rule-1",
                channel_type: "ai",
                channel_id: "deepseek",
                channel_name: "DeepSeek",
                rule_title: "规则一",
                reasons: [],
                severity: "high",
                updated_at: "2026-09-14",
                data_mode: "manual"
              },
              {
                rule_id: "rule-2",
                channel_type: "publishing",
                channel_id: "xiaohongshu",
                channel_name: "小红书",
                rule_title: "规则二",
                reasons: [],
                severity: "medium",
                updated_at: "2026-09-14",
                data_mode: "real"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) {
          return response({
            data_mode: "mixed",
            evidence_levels: {},
            sessions: [
              { session_id: "s1", name: "真实任务", target_brand: "微艺达", target_url: "https://example.com", created_at: "2026-09-14", data_mode: "manual", total_records: 2, highest_evidence_level: 3 },
              { session_id: "s2", name: "真实任务二", target_brand: "微艺达", target_url: "https://example.com/a", created_at: "2026-09-14", data_mode: "real", total_records: 1, highest_evidence_level: 4 },
              { session_id: "s3", name: "示例任务", target_brand: "示例", target_url: "https://example.com/mock", created_at: "2026-09-14", data_mode: "mock", total_records: 9, highest_evidence_level: 4 }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              { record_id: "r1", session_id: "s1", query: "问法一", ai_channel: "deepseek", target_brand: "微艺达", target_url: "https://example.com", checked_at: "2026-09-14", evidence_level: 2, evidence_label: "品牌被提及", related_concept_found: true, brand_mentioned: true, page_retrieved: false, source_cited: false, raw_response: "原文", response_summary: "摘要", manual_review_status: "待复核", reviewer: "", data_mode: "manual" },
              { record_id: "r2", session_id: "s1", query: "问法二", ai_channel: "kimi", target_brand: "微艺达", target_url: "https://example.com", checked_at: "2026-09-14", evidence_level: 4, evidence_label: "页面作为来源被引用", related_concept_found: true, brand_mentioned: true, page_retrieved: true, source_cited: true, raw_response: "原文", response_summary: "摘要", manual_review_status: "已确认", reviewer: "运营", data_mode: "real" },
              { record_id: "r3", session_id: "s2", query: "问法三", ai_channel: "doubao", target_brand: "微艺达", target_url: "https://example.com/a", checked_at: "2026-09-14", evidence_level: 1, evidence_label: "出现相关概念", related_concept_found: true, brand_mentioned: false, page_retrieved: false, source_cited: false, raw_response: "原文", response_summary: "摘要", manual_review_status: "已驳回", reviewer: "运营", data_mode: "manual" },
              { record_id: "r4", session_id: "s3", query: "示例", ai_channel: "mock", target_brand: "示例", target_url: "https://example.com/mock", checked_at: "2026-09-14", evidence_level: 4, evidence_label: "页面作为来源被引用", related_concept_found: true, brand_mentioned: true, page_retrieved: true, source_cited: true, raw_response: "示例", response_summary: "示例", manual_review_status: "待复核", reviewer: "", data_mode: "mock" }
            ]
          });
        }
        if (url.includes("/api/content-calendar/plans")) {
          return response({ data_mode: "mixed", plans: [] });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    expect(await screen.findByText("仅统计真实 / 人工记录，排除模拟数据")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
  });

  it("首页主业务流程按真实计划和监测数据显示进度状态", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) {
          return response({ data_mode: "mixed", reminders: [] });
        }
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              {
                id: "plan-1",
                topic_title: "武汉智能沙盘厂家怎么选？",
                platform: "知乎",
                brand_name: "武汉微艺达",
                product_name: "智能沙盘",
                region: "武汉",
                target_audience: "展厅负责人",
                facts: "人工录入事实",
                overall_score: 88,
                status: "已生成",
                content_stage: "已完成",
                created_at: "2026-09-14",
                scheduled_at: "2026-09-20",
                owner: "运营",
                priority: "高",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) {
          return response({
            data_mode: "mixed",
            evidence_levels: {},
            sessions: [
              { session_id: "s1", name: "真实任务", target_brand: "微艺达", target_url: "https://example.com", created_at: "2026-09-14", data_mode: "manual", total_records: 1, highest_evidence_level: 4 }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              { record_id: "r1", session_id: "s1", query: "问法", ai_channel: "deepseek", target_brand: "微艺达", target_url: "https://example.com", checked_at: "2026-09-14", evidence_level: 4, evidence_label: "页面作为来源被引用", related_concept_found: true, brand_mentioned: true, page_retrieved: true, source_cited: true, raw_response: "原文", response_summary: "摘要", manual_review_status: "已确认", reviewer: "运营", data_mode: "manual" }
            ]
          });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });
    expect(await within(workflow).findByLabelText("内容日历进度")).toHaveTextContent("已完成");
    expect(within(workflow).getByLabelText("内容适配进度")).toHaveTextContent("已完成");
    expect(within(workflow).getByLabelText("发布准备进度")).toHaveTextContent("进行中");
    expect(within(workflow).getByLabelText("监测复盘进度")).toHaveTextContent("已完成");
  });

  it("首页主业务流程从本地发布队列识别已发布状态", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([
        {
          id: "published-1",
          versionId: "content-calendar-plan-1",
          topicTitle: "武汉智能沙盘厂家怎么选？",
          status: "published",
          publishedUrl: "https://example.com/articles/wuhan-sandbox",
          actualPublishAt: "2026-09-15T10:00:00"
        }
      ])
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) {
          return response({ data_mode: "mixed", reminders: [] });
        }
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              {
                id: "plan-1",
                topic_title: "武汉智能沙盘厂家怎么选？",
                platform: "知乎",
                brand_name: "武汉微艺达",
                product_name: "智能沙盘",
                region: "武汉",
                target_audience: "展厅负责人",
                facts: "人工录入事实",
                overall_score: 88,
                status: "已生成",
                content_stage: "已完成",
                created_at: "2026-09-14",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) {
          return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        }
        if (url.includes("/api/geo-monitor/records")) {
          return response({ data_mode: "mixed", records: [] });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });
    expect(await within(workflow).findByLabelText("发布准备进度")).toHaveTextContent("已完成");
  });
});
