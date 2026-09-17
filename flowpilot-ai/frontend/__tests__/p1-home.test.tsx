import { fireEvent, render, screen, within } from "@testing-library/react";
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

    expect(within(workflow).getByRole("link", { name: "产品资料" })).toHaveAttribute("href", "/products");
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

  it("首页主业务流程优先从后端发布队列识别已发布状态", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
      if (url.includes("/api/content-calendar/plans")) {
        return response({
          data_mode: "mixed",
          plans: [
            {
              id: "plan-1",
              topic_title: "后端发布队列选题",
              platform: "知乎",
              brand_name: "微艺达",
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
              data_mode: "manual"
            }
          ]
        });
      }
      if (url.includes("/api/publish-queue/items")) {
        return response({
          data_mode: "manual",
          total: 1,
          items: [
            {
              id: "api-published-1",
              version_id: "version-1",
              topic_title: "后端发布队列选题",
              platform_count: 1,
              status: "published",
              queued_at: "2026-09-15T09:00:00",
              actual_publish_at: "2026-09-15T10:00:00",
              published_url: "https://example.com/backend-published",
              monitor_session_id: "geo-mon-backend",
              data_mode: "manual"
            }
          ]
        });
      }
      if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
      if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mixed", records: [] });
      if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });
    expect(await within(workflow).findByLabelText("发布准备进度")).toHaveTextContent("已完成");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("/geo-monitor/records?");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("session=geo-mon-backend");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("url=https%3A%2F%2Fexample.com%2Fbackend-published");
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/api/publish-queue/items"))).toBe(true);
  });

  it("首页展示当前业务卡点和下一步直达入口", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([
        {
          id: "published-1",
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
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
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
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mixed", records: [] });
        if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const businessFocus = await screen.findByRole("region", { name: "当前业务卡点" });
    expect(within(businessFocus).getByText("当前卡点：监测复盘")).toBeInTheDocument();
    expect(within(businessFocus).getByText("下一步：录入监测证据")).toBeInTheDocument();
    expect(within(businessFocus).getByRole("link", { name: "去处理当前卡点" }).getAttribute("href")).toContain("/geo-monitor/records?");
  });

  it("首页在已有监测记录但无报告快照时提示生成运营报告", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([{ id: "published-1", status: "published", publishedUrl: "https://example.com/a" }])
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
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
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              { record_id: "r1", session_id: "s1", query: "武汉智能沙盘厂家怎么选？", ai_channel: "deepseek", target_brand: "微艺达", target_url: "https://example.com/a", checked_at: "2026-09-15", evidence_level: 4, evidence_label: "页面作为来源被引用", related_concept_found: true, brand_mentioned: true, page_retrieved: true, source_cited: true, raw_response: "原文", response_summary: "摘要", manual_review_status: "已确认", reviewer: "运营", data_mode: "manual" }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const businessFocus = await screen.findByRole("region", { name: "当前业务卡点" });
    expect(within(businessFocus).getByText("当前卡点：运营报告")).toBeInTheDocument();
    expect(within(businessFocus).getByText("下一步：生成运营报告")).toBeInTheDocument();
    expect(within(businessFocus).getByRole("link", { name: "去处理当前卡点" }).getAttribute("href")).toContain("/geo-monitor/report?");
    expect(within(businessFocus).getByRole("link", { name: "去处理当前卡点" }).getAttribute("href")).toContain("session=s1");
    expect(within(businessFocus).getByRole("link", { name: "去处理当前卡点" }).getAttribute("href")).toContain("url=https%3A%2F%2Fexample.com%2Fa");
  });

  it("首页当前业务卡点展示任务面板和缺口来源", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([{ id: "published-1", status: "published", topicTitle: "武汉智能沙盘厂家怎么选？", publishedUrl: "https://example.com/a" }])
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
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
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mixed", records: [] });
        if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const businessFocus = await screen.findByRole("region", { name: "当前业务卡点" });
    expect(within(businessFocus).getByText("任务面板")).toBeInTheDocument();
    expect(within(businessFocus).getByText("关联对象")).toBeInTheDocument();
    expect(within(businessFocus).getByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(within(businessFocus).getByText("待补缺口")).toBeInTheDocument();
    expect(within(businessFocus).getByText("缺少真实或人工监测记录")).toBeInTheDocument();
    expect(within(businessFocus).getByText("处理状态")).toBeInTheDocument();
    expect(within(businessFocus).getByText("待处理")).toBeInTheDocument();
  });

  it("首页主业务流程展示每个阶段的下一步动作", async () => {
    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });

    expect(within(workflow).getByLabelText("生成式优化研究下一步")).toHaveTextContent("梳理产品资料");
    expect(within(workflow).getByLabelText("内容日历下一步")).toHaveTextContent("安排生产排期");
    expect(within(workflow).getByLabelText("内容适配下一步")).toHaveTextContent("生成平台版本");
    expect(within(workflow).getByLabelText("发布准备下一步")).toHaveTextContent("确认发布记录");
    expect(within(workflow).getByLabelText("监测复盘下一步")).toHaveTextContent("录入监测证据");
  });

  it("首页主业务流程完成后展示查看或进入下一环动作", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([{ id: "published-1", status: "published", publishedUrl: "https://example.com/a" }])
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
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
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
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
    expect(await within(workflow).findByLabelText("内容日历下一步")).toHaveTextContent("查看排期");
    expect(within(workflow).getByLabelText("内容适配下一步")).toHaveTextContent("进入发布准备");
    expect(within(workflow).getByLabelText("发布准备下一步")).toHaveTextContent("进入监测复盘");
    expect(within(workflow).getByLabelText("监测复盘下一步")).toHaveTextContent("生成运营报告");
  });

  it("首页主业务流程完成后把入口指向下一环工作台", async () => {
    localStorage.setItem(
      "flowpilot.contentAdaptation.publishQueue",
      JSON.stringify([
        {
          id: "published-1",
          versionId: "content-calendar-plan-1",
          status: "published",
          topicTitle: "武汉智能沙盘厂家怎么选？",
          publishedUrl: "https://example.com/articles/wuhan-sandbox",
          actualPublishAt: "2026-09-15T10:00:00"
        }
      ])
    );

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
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
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              { record_id: "r1", session_id: "s1", query: "武汉智能沙盘厂家怎么选？", ai_channel: "deepseek", target_brand: "微艺达", target_url: "https://example.com/articles/wuhan-sandbox", checked_at: "2026-09-15", evidence_level: 4, evidence_label: "页面作为来源被引用", related_concept_found: true, brand_mentioned: true, page_retrieved: true, source_cited: true, raw_response: "原文", response_summary: "摘要", manual_review_status: "已确认", reviewer: "运营", data_mode: "manual" }
            ]
          });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const workflow = screen.getByRole("region", { name: "主业务流程" });
    expect(await within(workflow).findByLabelText("内容适配进度")).toHaveTextContent("已完成");
    expect(within(workflow).getByRole("link", { name: "生成式优化研究" })).toHaveAttribute("href", "/content-calendar");
    expect(within(workflow).getByRole("link", { name: "内容适配" })).toHaveAttribute("href", "/publish-queue?plan=plan-1");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("/geo-monitor/records?");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox");
    expect(within(workflow).getByRole("link", { name: "发布准备" }).getAttribute("href")).toContain("plan=plan-1");
    expect(within(workflow).getByRole("link", { name: "监测复盘" }).getAttribute("href")).toContain("/geo-monitor/report?");
    expect(within(workflow).getByRole("link", { name: "监测复盘" }).getAttribute("href")).toContain("session=s1");
    expect(within(workflow).getByRole("link", { name: "监测复盘" }).getAttribute("href")).toContain("url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox");
  });

  it("首页展示内容生命周期阶段概览", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              buildPlanForStage("plan-ready", "待发布"),
              buildPlanForStage("plan-published", "已发布"),
              buildPlanForStage("plan-monitor", "待监测"),
              buildPlanForStage("plan-reviewed", "已复盘")
            ]
          });
        }
        if (url.includes("/api/publish-queue/items")) return response({ data_mode: "manual", total: 0, items: [] });
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mixed", records: [] });
        if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const lifecycle = await screen.findByRole("region", { name: "内容生命周期概览" });
    expect(within(lifecycle).getByLabelText("待发布数量")).toHaveTextContent("1");
    expect(within(lifecycle).getByLabelText("已发布数量")).toHaveTextContent("1");
    expect(within(lifecycle).getByLabelText("待监测数量")).toHaveTextContent("1");
    expect(within(lifecycle).getByLabelText("已复盘数量")).toHaveTextContent("1");
    expect(within(lifecycle).getByText("优先处理：待发布")).toBeInTheDocument();
  });

  it("首页展示按内容计划汇总的主流程状态台账", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              {
                id: "plan-reviewed",
                topic_title: "已复盘主流程计划",
                platform: "知乎",
                brand_name: "武汉微艺达",
                product_name: "智能沙盘",
                region: "武汉",
                target_audience: "展厅负责人",
                facts: "人工录入事实",
                overall_score: 91,
                status: "已生成",
                content_stage: "待监测",
                created_at: "2026-09-14",
                scheduled_at: "2026-09-20",
                owner: "运营",
                data_mode: "manual"
              },
              {
                id: "plan-monitor",
                topic_title: "待监测主流程计划",
                platform: "公众号",
                brand_name: "武汉微艺达",
                product_name: "数字展厅",
                region: "武汉",
                target_audience: "市场负责人",
                facts: "人工录入事实",
                overall_score: 86,
                status: "已生成",
                content_stage: "已发布",
                created_at: "2026-09-14",
                scheduled_at: "2026-09-21",
                owner: "运营",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/publish-queue/items")) {
          return response({
            data_mode: "manual",
            total: 2,
            items: [
              {
                id: "queue-reviewed",
                version_id: "content-calendar-plan-reviewed",
                topic_title: "已复盘主流程计划",
                source_topic_title: "已复盘主流程计划",
                platform_count: 1,
                status: "published",
                queued_at: "2026-09-15T09:00:00",
                actual_publish_at: "2026-09-15T10:00:00",
                published_url: "https://example.com/reviewed",
                monitor_session_id: "session-reviewed",
                data_mode: "manual"
              },
              {
                id: "queue-monitor",
                version_id: "content-calendar-plan-monitor",
                topic_title: "待监测主流程计划",
                source_topic_title: "待监测主流程计划",
                platform_count: 1,
                status: "published",
                queued_at: "2026-09-15T09:00:00",
                actual_publish_at: "2026-09-15T10:00:00",
                published_url: "https://example.com/monitor",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              {
                record_id: "record-reviewed",
                session_id: "session-reviewed",
                query: "已复盘主流程计划",
                ai_channel: "deepseek",
                target_brand: "微艺达",
                target_url: "https://example.com/reviewed",
                checked_at: "2026-09-16",
                evidence_level: 4,
                evidence_label: "页面作为来源被引用",
                related_concept_found: true,
                brand_mentioned: true,
                page_retrieved: true,
                source_cited: true,
                raw_response: "原文",
                response_summary: "摘要",
                manual_review_status: "已确认",
                reviewer: "运营",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/report-snapshots")) {
          return response({
            data_mode: "manual",
            snapshots: [
              {
                snapshot_id: "snapshot-reviewed",
                created_at: "2026-09-16T12:00:00",
                scope_label: "内容计划：plan-reviewed",
                report_period: "2026-09-16",
                total_records: 1,
                brand_mention_rate: 100,
                page_retrieval_rate: 100,
                source_citation_rate: 100,
                report_text: "# 周报\n\n- 内容计划：plan-reviewed",
                session_id: "session-reviewed",
                session_name: "已复盘主流程计划",
                query: "已复盘主流程计划",
                source_url: "https://example.com/reviewed",
                product_name: "智能沙盘",
                data_mode: "manual"
              }
            ]
          });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    render(<Home />);

    const ledger = await screen.findByRole("region", { name: "主流程状态台账" });
    const reviewedRow = within(ledger).getByLabelText("计划 已复盘主流程计划");
    expect(within(reviewedRow).getByText("已复盘")).toBeInTheDocument();
    expect(within(reviewedRow).getByRole("link", { name: "查看复盘报告" }).getAttribute("href")).toContain("/geo-monitor/report?");
    expect(within(reviewedRow).getByRole("link", { name: "查看复盘报告" }).getAttribute("href")).toContain("plan=plan-reviewed");

    const monitorRow = within(ledger).getByLabelText("计划 待监测主流程计划");
    expect(within(monitorRow).getByText("待监测")).toBeInTheDocument();
    expect(within(monitorRow).getByText("缺少真实或人工监测记录")).toBeInTheDocument();
    expect(within(monitorRow).getByRole("link", { name: "录入监测记录" }).getAttribute("href")).toContain("/geo-monitor/records?");
    expect(within(monitorRow).getByRole("link", { name: "录入监测记录" }).getAttribute("href")).toContain("plan=plan-monitor");
  });

  it("首页主流程状态台账支持按待处理和已复盘筛选", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              buildPlanForStage("plan-reviewed", "待监测"),
              buildPlanForStage("plan-monitor", "已发布")
            ]
          });
        }
        if (url.includes("/api/publish-queue/items")) {
          return response({
            data_mode: "manual",
            total: 2,
            items: [
              {
                id: "queue-reviewed",
                version_id: "content-calendar-plan-reviewed",
                topic_title: "待监测选题",
                source_topic_title: "待监测选题",
                platform_count: 1,
                status: "published",
                queued_at: "2026-09-15T09:00:00",
                actual_publish_at: "2026-09-15T10:00:00",
                published_url: "https://example.com/reviewed",
                data_mode: "manual"
              },
              {
                id: "queue-monitor",
                version_id: "content-calendar-plan-monitor",
                topic_title: "已发布选题",
                source_topic_title: "已发布选题",
                platform_count: 1,
                status: "published",
                queued_at: "2026-09-15T09:00:00",
                actual_publish_at: "2026-09-15T10:00:00",
                published_url: "https://example.com/monitor",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) {
          return response({
            data_mode: "mixed",
            records: [
              {
                record_id: "record-reviewed",
                session_id: "session-reviewed",
                query: "待监测选题",
                ai_channel: "deepseek",
                target_brand: "微艺达",
                target_url: "https://example.com/reviewed",
                checked_at: "2026-09-16",
                evidence_level: 4,
                evidence_label: "页面作为来源被引用",
                related_concept_found: true,
                brand_mentioned: true,
                page_retrieved: true,
                source_cited: true,
                raw_response: "原文",
                response_summary: "摘要",
                manual_review_status: "已确认",
                reviewer: "运营",
                data_mode: "manual"
              }
            ]
          });
        }
        if (url.includes("/api/geo-monitor/report-snapshots")) {
          return response({
            data_mode: "manual",
            snapshots: [
              {
                snapshot_id: "snapshot-reviewed",
                created_at: "2026-09-16T12:00:00",
                scope_label: "内容计划：plan-reviewed",
                report_period: "2026-09-16",
                total_records: 1,
                brand_mention_rate: 100,
                page_retrieval_rate: 100,
                source_citation_rate: 100,
                report_text: "# 周报\n\n- 内容计划：plan-reviewed",
                session_id: "session-reviewed",
                session_name: "待监测选题",
                query: "待监测选题",
                source_url: "https://example.com/reviewed",
                product_name: "智能沙盘",
                data_mode: "manual"
              }
            ]
          });
        }
        return response({ detail: "not found" }, 404);
      })
    );

    window.history.replaceState({}, "", "/?ledger=todo");
    render(<Home />);

    const ledger = await screen.findByRole("region", { name: "主流程状态台账" });
    expect(within(ledger).queryByLabelText("计划 待监测选题")).not.toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 已发布选题")).toBeInTheDocument();

    fireEvent.click(within(ledger).getByRole("button", { name: "全部计划" }));
    expect(window.location.search).toBe("");
    expect(within(ledger).getByLabelText("计划 待监测选题")).toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 已发布选题")).toBeInTheDocument();

    fireEvent.click(within(ledger).getByRole("button", { name: "只看待处理" }));
    expect(window.location.search).toBe("?ledger=todo");
    expect(within(ledger).queryByLabelText("计划 待监测选题")).not.toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 已发布选题")).toBeInTheDocument();

    fireEvent.click(within(ledger).getByRole("button", { name: "只看已复盘" }));
    expect(window.location.search).toBe("?ledger=reviewed");
    expect(within(ledger).getByLabelText("计划 待监测选题")).toBeInTheDocument();
    expect(within(ledger).queryByLabelText("计划 已发布选题")).not.toBeInTheDocument();
  });

  it("首页主流程状态台账支持按产品负责人和平台筛选", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mixed", reminders: [] });
        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "mixed",
            plans: [
              buildPlanForStage("plan-sandbox", "已发布", {
                topic_title: "智能沙盘知乎计划",
                product_name: "智能沙盘",
                owner: "运营",
                platform: "知乎"
              }),
              buildPlanForStage("plan-showroom", "已发布", {
                topic_title: "数字展厅公众号计划",
                product_name: "数字展厅",
                owner: "市场",
                platform: "公众号"
              }),
              buildPlanForStage("plan-farm", "待发布", {
                topic_title: "智慧农业小红书计划",
                product_name: "智慧农业",
                owner: "运营",
                platform: "小红书"
              })
            ]
          });
        }
        if (url.includes("/api/publish-queue/items")) return response({ data_mode: "manual", total: 0, items: [] });
        if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mixed", evidence_levels: {}, sessions: [] });
        if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mixed", records: [] });
        if (url.includes("/api/geo-monitor/report-snapshots")) return response({ data_mode: "manual", snapshots: [] });
        return response({ detail: "not found" }, 404);
      })
    );

    window.history.replaceState({}, "", "/");
    render(<Home />);

    const ledger = await screen.findByRole("region", { name: "主流程状态台账" });
    expect(within(ledger).getByLabelText("计划 智能沙盘知乎计划")).toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 数字展厅公众号计划")).toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 智慧农业小红书计划")).toBeInTheDocument();

    fireEvent.change(within(ledger).getByLabelText("台账产品"), { target: { value: "数字展厅" } });
    expect(within(ledger).queryByLabelText("计划 智能沙盘知乎计划")).not.toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 数字展厅公众号计划")).toBeInTheDocument();
    expect(within(ledger).queryByLabelText("计划 智慧农业小红书计划")).not.toBeInTheDocument();

    fireEvent.change(within(ledger).getByLabelText("台账负责人"), { target: { value: "市场" } });
    fireEvent.change(within(ledger).getByLabelText("台账平台"), { target: { value: "公众号" } });
    expect(within(ledger).getByLabelText("计划 数字展厅公众号计划")).toBeInTheDocument();

    fireEvent.click(within(ledger).getByRole("button", { name: "清空台账筛选" }));
    expect(within(ledger).getByLabelText("计划 智能沙盘知乎计划")).toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 数字展厅公众号计划")).toBeInTheDocument();
    expect(within(ledger).getByLabelText("计划 智慧农业小红书计划")).toBeInTheDocument();
  });
});

function buildPlanForStage(id: string, contentStage: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    topic_title: `${contentStage}选题`,
    platform: "知乎",
    brand_name: "武汉微艺达",
    product_name: "智能沙盘",
    region: "武汉",
    target_audience: "展厅负责人",
    facts: "人工录入事实",
    overall_score: 88,
    status: "已生成",
    content_stage: contentStage,
    created_at: "2026-09-14",
    scheduled_at: "2026-09-20",
    owner: "运营",
    data_mode: "manual",
    ...overrides
  };
}
