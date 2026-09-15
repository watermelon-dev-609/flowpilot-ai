import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentCalendarPage from "../app/content-calendar/page";

const topicPoolStorageKey = "flowpilot.geoResearch.topicPool";
const publishQueueStorageKey = "flowpilot.contentAdaptation.publishQueue";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("P28 内容日历独立页面", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/content-calendar");
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("supports selecting visible content plans in bulk", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-bulk-1",
          topicTitle: "Bulk selectable plan one",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量选择测试事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "Owner",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-bulk-2",
          topicTitle: "Bulk selectable plan two",
          platform: "公众号",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量选择测试事实二。",
          overallScore: 88,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-21T10:00:00.000Z",
          owner: "Owner",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );

    render(<ContentCalendarPage />);

    expect(screen.getByText("已选择 0 条")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "选择当前结果" }));

    expect(screen.getByText("已选择 2 条")).toBeInTheDocument();
    expect(screen.getByLabelText("选择计划 Bulk selectable plan one")).toBeChecked();
    expect(screen.getByLabelText("选择计划 Bulk selectable plan two")).toBeChecked();

    fireEvent.click(screen.getByLabelText("选择计划 Bulk selectable plan one"));

    expect(screen.getByText("已选择 1 条")).toBeInTheDocument();
    expect(screen.getByLabelText("选择计划 Bulk selectable plan one")).not.toBeChecked();
    expect(screen.getByLabelText("选择计划 Bulk selectable plan two")).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "清空选择" }));

    expect(screen.getByText("已选择 0 条")).toBeInTheDocument();
    expect(screen.getByLabelText("选择计划 Bulk selectable plan two")).not.toBeChecked();
  });

  it("shows workload summary grouped by owner and content status", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-workload-1",
          topicTitle: "Workload plan one",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "排期工作量测试事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "Alice",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-workload-2",
          topicTitle: "Workload plan two",
          platform: "公众号",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "排期工作量测试事实二。",
          overallScore: 88,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-21T10:00:00.000Z",
          owner: "Alice",
          priority: "中",
          contentStage: "生产中"
        },
        {
          id: "topic-workload-3",
          topicTitle: "Workload plan three",
          platform: "小红书",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "排期工作量测试事实三。",
          overallScore: 86,
          status: "已生成",
          createdAt: "2026-09-14T08:00:00.000Z",
          scheduledAt: "2026-09-22T10:00:00.000Z",
          owner: "",
          priority: "低",
          contentStage: "已完成"
        }
      ])
    );

    render(<ContentCalendarPage />);

    const aliceRow = within(screen.getByLabelText("负责人 Alice 排期工作量")).getByText("Alice").closest("article");
    expect(aliceRow).not.toBeNull();
    expect(within(aliceRow as HTMLElement).getByText("待适配 1")).toBeInTheDocument();
    expect(within(aliceRow as HTMLElement).getByText("适配中 1")).toBeInTheDocument();
    expect(within(aliceRow as HTMLElement).getByText("已生成 0")).toBeInTheDocument();
    expect(within(aliceRow as HTMLElement).getByText("合计 2")).toBeInTheDocument();

    const unassignedRow = within(screen.getByLabelText("负责人 未分配 排期工作量")).getByText("未分配").closest("article");
    expect(unassignedRow).not.toBeNull();
    expect(within(unassignedRow as HTMLElement).getByText("已生成 1")).toBeInTheDocument();
  });

  it("adds selected content plans to the publish queue without duplicates", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-publish-1",
          topicTitle: "Calendar plan ready for publish one",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "发布准备测试事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "Owner",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-publish-2",
          topicTitle: "Calendar plan ready for publish two",
          platform: "公众号",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "发布准备测试事实二。",
          overallScore: 88,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-21T10:00:00.000Z",
          owner: "Owner",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.click(screen.getByRole("button", { name: "选择当前结果" }));
    fireEvent.click(screen.getByRole("button", { name: "加入发布准备" }));

    expect(screen.getByRole("status")).toHaveTextContent("已加入发布准备 2 条");
    let queue = JSON.parse(localStorage.getItem(publishQueueStorageKey) || "[]") as Array<{
      sourceTopicTitle: string;
      status: string;
      versionId: string;
      platformDrafts: Array<{ platformName: string; title: string; reviewStatus: string }>;
    }>;

    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({
      sourceTopicTitle: "Calendar plan ready for publish one",
      topicTitle: "Calendar plan ready for publish one",
      platformCount: 1,
      status: "ready",
      versionId: "content-calendar-topic-publish-1"
    });
    expect(queue[0].platformDrafts[0]).toMatchObject({
      platformName: "知乎",
      title: "Calendar plan ready for publish one",
      reviewStatus: "待人工复核"
    });

    fireEvent.click(screen.getByRole("button", { name: "加入发布准备" }));

    queue = JSON.parse(localStorage.getItem(publishQueueStorageKey) || "[]");
    expect(queue).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("选中计划已在发布准备中");
  });

  it("bulk updates the selected content plan status", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-bulk-status-1",
          topicTitle: "Bulk status plan one",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量状态测试事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "Owner",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-bulk-status-2",
          topicTitle: "Bulk status plan two",
          platform: "公众号",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量状态测试事实二。",
          overallScore: 88,
          status: "待适配",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-21T10:00:00.000Z",
          owner: "Owner",
          priority: "中",
          contentStage: "生产中"
        },
        {
          id: "topic-bulk-status-3",
          topicTitle: "Unselected status plan",
          platform: "小红书",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量状态测试事实三。",
          overallScore: 86,
          status: "待适配",
          createdAt: "2026-09-14T08:00:00.000Z",
          scheduledAt: "2026-09-22T10:00:00.000Z",
          owner: "Owner",
          priority: "低",
          contentStage: "待生产"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.click(screen.getByLabelText("选择计划 Bulk status plan one"));
    fireEvent.click(screen.getByLabelText("选择计划 Bulk status plan two"));
    fireEvent.change(screen.getByLabelText("批量状态"), { target: { value: "已生成" } });
    fireEvent.click(screen.getByRole("button", { name: "批量改状态" }));

    expect(screen.getByRole("status")).toHaveTextContent("已批量更新 2 条计划");
    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; status: string }>;
    expect(topicPool.find((item) => item.id === "topic-bulk-status-1")?.status).toBe("已生成");
    expect(topicPool.find((item) => item.id === "topic-bulk-status-2")?.status).toBe("已生成");
    expect(topicPool.find((item) => item.id === "topic-bulk-status-3")?.status).toBe("待适配");
  });

  it("bulk updates the selected content plan owner", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-bulk-owner-1",
          topicTitle: "Bulk owner plan one",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量负责人测试事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "Old Owner",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-bulk-owner-2",
          topicTitle: "Bulk owner plan two",
          platform: "公众号",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量负责人测试事实二。",
          overallScore: 88,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-21T10:00:00.000Z",
          owner: "Old Owner",
          priority: "中",
          contentStage: "生产中"
        },
        {
          id: "topic-bulk-owner-3",
          topicTitle: "Unselected owner plan",
          platform: "小红书",
          brandName: "FlowPilot",
          productName: "Content Calendar",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "批量负责人测试事实三。",
          overallScore: 86,
          status: "待适配",
          createdAt: "2026-09-14T08:00:00.000Z",
          scheduledAt: "2026-09-22T10:00:00.000Z",
          owner: "Keep Owner",
          priority: "低",
          contentStage: "待生产"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.click(screen.getByLabelText("选择计划 Bulk owner plan one"));
    fireEvent.click(screen.getByLabelText("选择计划 Bulk owner plan two"));
    fireEvent.change(screen.getByLabelText("批量负责人"), { target: { value: "New Owner" } });
    fireEvent.click(screen.getByRole("button", { name: "批量改负责人" }));

    expect(screen.getByRole("status")).toHaveTextContent("已批量更新负责人 2 条");
    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; owner: string }>;
    expect(topicPool.find((item) => item.id === "topic-bulk-owner-1")?.owner).toBe("New Owner");
    expect(topicPool.find((item) => item.id === "topic-bulk-owner-2")?.owner).toBe("New Owner");
    expect(topicPool.find((item) => item.id === "topic-bulk-owner-3")?.owner).toBe("Keep Owner");
  });

  it("supports API pagination and syncs URL params", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content-calendar/plans")) {
        const searchParams = new URL(url).searchParams;
        const page = Number(searchParams.get("page") || "1");
        const pageSize = Number(searchParams.get("page_size") || "2");
        const planTitle = page === 2 ? "Page two plan" : "Page one plan";

        return response({
          data_mode: "manual",
          total: 3,
          page,
          page_size: pageSize,
          plans: [
            {
              id: `api-page-plan-${page}`,
              topic_title: planTitle,
              platform: "鐭ヤ箮",
              brand_name: "FlowPilot",
              product_name: "Content Calendar",
              region: "武汉",
              target_audience: "运营负责人",
              facts: "分页测试事实。",
              overall_score: 90,
              status: "寰呴€傞厤",
              created_at: "2026-09-12T08:00:00.000Z",
              scheduled_at: "2026-09-20T10:00:00.000Z",
              owner: "Owner",
              priority: "楂?",
              content_stage: "寰呯敓浜?",
              data_mode: "manual",
              audit_log: []
            }
          ]
        });
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState({}, "", "/content-calendar?page_size=2");

    render(<ContentCalendarPage />);

    expect(await screen.findByText("Page one plan")).toBeInTheDocument();
    expect(screen.getByText("共 3 条")).toBeInTheDocument();
    expect(screen.getByText("第 1 / 2 页")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "下一页" }));

    expect(await screen.findByText("Page two plan")).toBeInTheDocument();
    expect(window.location.search).toContain("page=2");
    expect(window.location.search).toContain("page_size=2");

    fireEvent.change(screen.getByLabelText("每页数量"), { target: { value: "1" } });

    expect(await screen.findByText("Page one plan")).toBeInTheDocument();
    expect(window.location.search).toContain("page_size=1");
    expect(window.location.search).not.toContain("page=2");
    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = String(input);
        return url.includes("page=1") && url.includes("page_size=1");
      })
    ).toBe(true);
  });

  it("优先从后端 API 读取并更新内容计划", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/content-calendar/plans") && init?.method === "PATCH") {
        return response({
          id: "api-plan-1",
          topic_title: "API 内容计划选题",
          platform: "知乎",
          brand_name: "武汉微艺达智能科技有限公司",
          product_name: "智能沙盘",
          region: "武汉",
          target_audience: "企业展厅项目负责人",
          facts: "API 计划事实。",
          overall_score: 91,
          status: "适配中",
          created_at: "2026-09-12T08:00:00.000Z",
          scheduled_at: "2026-09-25T10:00:00.000Z",
          owner: "API 运营",
          priority: "中",
          content_stage: "生产中",
          data_mode: "manual",
          audit_log: []
        });
      }

      if (url.includes("/api/content-calendar/plans")) {
        return response({
          data_mode: "manual",
          plans: [
            {
              id: "api-plan-1",
              topic_title: "API 内容计划选题",
              platform: "知乎",
              brand_name: "武汉微艺达智能科技有限公司",
              product_name: "智能沙盘",
              region: "武汉",
              target_audience: "企业展厅项目负责人",
              facts: "API 计划事实。",
              overall_score: 91,
              status: "待适配",
              created_at: "2026-09-12T08:00:00.000Z",
              scheduled_at: "2026-09-20T10:00:00.000Z",
              owner: "王轩",
              priority: "高",
              content_stage: "待生产",
              data_mode: "manual",
              audit_log: []
            }
          ]
        });
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContentCalendarPage />);

    expect(await screen.findByText("API 内容计划选题")).toBeInTheDocument();
    expect(screen.getByText("已连接后端内容计划 API")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "编辑计划" }));
    fireEvent.change(screen.getByLabelText("计划发布日期"), { target: { value: "2026-09-25" } });
    fireEvent.change(screen.getByLabelText("负责人"), { target: { value: "API 运营" } });
    fireEvent.change(screen.getByLabelText("优先级"), { target: { value: "中" } });
    fireEvent.change(screen.getByLabelText("内容阶段"), { target: { value: "生产中" } });
    fireEvent.change(screen.getByLabelText("计划状态"), { target: { value: "适配中" } });
    fireEvent.click(screen.getByRole("button", { name: "保存计划" }));

    expect(await screen.findByText("计划已保存")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/content-calendar/plans/api-plan-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          scheduled_at: "2026-09-25T10:00:00.000Z",
          owner: "API 运营",
          priority: "中",
          content_stage: "生产中",
          status: "适配中",
          actor: "frontend-user"
        })
      })
    );
    expect(screen.getByText("负责人 API 运营")).toBeInTheDocument();
  });

  it("API 模式下筛选排序时请求后端查询参数", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/content-calendar/plans")) {
        return response({
          data_mode: "manual",
          total: 1,
          page: 1,
          page_size: 50,
          plans: [
            {
              id: "api-query-plan-1",
              topic_title: "API 查询参数命中选题",
              platform: "知乎",
              brand_name: "武汉微艺达智能科技有限公司",
              product_name: "智能沙盘",
              region: "武汉",
              target_audience: "企业展厅项目负责人",
              facts: "API 查询事实。",
              overall_score: 96,
              status: "待适配",
              created_at: "2026-09-12T08:00:00.000Z",
              scheduled_at: "2026-09-20T10:00:00.000Z",
              owner: "王轩",
              priority: "高",
              content_stage: "待生产",
              data_mode: "manual",
              audit_log: []
            }
          ]
        });
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContentCalendarPage />);

    expect(await screen.findByText("API 查询参数命中选题")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("关键词搜索"), { target: { value: "查询参数" } });
    fireEvent.change(screen.getByLabelText("状态筛选"), { target: { value: "待适配" } });
    fireEvent.change(screen.getByLabelText("平台筛选"), { target: { value: "知乎" } });
    fireEvent.change(screen.getByLabelText("负责人筛选"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("优先级筛选"), { target: { value: "高" } });
    fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText("排序方式"), { target: { value: "score_desc" } });

    expect(
      fetchMock.mock.calls.some(([input]) => {
        const url = String(input);
        return (
          url.includes("/api/content-calendar/plans") &&
          url.includes("keyword=%E6%9F%A5%E8%AF%A2%E5%8F%82%E6%95%B0") &&
          url.includes("status=%E5%BE%85%E9%80%82%E9%85%8D") &&
          url.includes("platform=%E7%9F%A5%E4%B9%8E") &&
          url.includes("owner=%E7%8E%8B%E8%BD%A9") &&
          url.includes("priority=%E9%AB%98") &&
          url.includes("start=2026-09-01") &&
          url.includes("end=2026-09-30") &&
          url.includes("sort=score_desc")
        );
      })
    ).toBe(true);
  });

  it("展示独立内容日历页面并排除已作废选题", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-calendar-1",
          topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-calendar-2",
          topicTitle: "智能沙盘和普通沙盘有什么区别？",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 86,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z"
        },
        {
          id: "topic-calendar-3",
          topicTitle: "已作废选题不进入日历",
          platform: "小红书",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实三。",
          overallScore: 70,
          status: "已作废",
          createdAt: "2026-09-14T08:00:00.000Z"
        }
      ])
    );

    render(<ContentCalendarPage />);

    expect(screen.getByRole("heading", { name: "内容日历" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "内容日历" })).toHaveAttribute("href", "/content-calendar");
    expect(screen.getByText("计划选题 2 条")).toBeInTheDocument();

    const calendar = screen.getByRole("region", { name: "内容日历列表" });
    expect(within(calendar).getByText("9月20日")).toBeInTheDocument();
    expect(within(calendar).getByText("9月13日")).toBeInTheDocument();
    expect(within(calendar).getByText("武汉智能沙盘厂家推荐文章怎么写？")).toBeInTheDocument();
    expect(within(calendar).getByText("负责人 王轩")).toBeInTheDocument();
    expect(within(calendar).getByText("优先级 高")).toBeInTheDocument();
    expect(within(calendar).getAllByText("阶段 待生产").length).toBeGreaterThanOrEqual(1);
    expect(within(calendar).getByText("智能沙盘和普通沙盘有什么区别？")).toBeInTheDocument();
    expect(within(calendar).queryByText("已作废选题不进入日历")).not.toBeInTheDocument();
  });

  it("没有计划选题时展示空状态", () => {
    render(<ContentCalendarPage />);

    expect(screen.getByText("暂无内容计划")).toBeInTheDocument();
    expect(screen.getByText("在生成式优化研究页加入选题后，内容计划会出现在这里。")).toBeInTheDocument();
  });

  it("支持按关键词、状态、平台、负责人和优先级筛选内容计划", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-filter-1",
          topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-filter-2",
          topicTitle: "智能沙盘和普通沙盘有什么区别？",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 86,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          owner: "运营同事",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.change(screen.getByLabelText("关键词搜索"), { target: { value: "厂家推荐" } });
    fireEvent.change(screen.getByLabelText("状态筛选"), { target: { value: "待适配" } });
    fireEvent.change(screen.getByLabelText("平台筛选"), { target: { value: "知乎" } });
    fireEvent.change(screen.getByLabelText("负责人筛选"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("优先级筛选"), { target: { value: "高" } });

    const calendar = screen.getByRole("region", { name: "内容日历列表" });
    expect(screen.getByText("筛选结果 1 条")).toBeInTheDocument();
    expect(within(calendar).getByText("武汉智能沙盘厂家推荐文章怎么写？")).toBeInTheDocument();
    expect(within(calendar).queryByText("智能沙盘和普通沙盘有什么区别？")).not.toBeInTheDocument();
  });

  it("支持从 URL 参数恢复内容日历筛选条件", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-url-filter-1",
          topicTitle: "URL 参数筛选命中选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-url-filter-2",
          topicTitle: "URL 参数筛选排除选题",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 86,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-10-02T10:00:00.000Z",
          owner: "运营同事",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );
    window.history.replaceState(
      {},
      "",
      "/content-calendar?keyword=命中&status=待适配&platform=知乎&owner=王轩&priority=高&start=2026-09-01&end=2026-09-30"
    );

    render(<ContentCalendarPage />);

    expect(screen.getByLabelText("关键词搜索")).toHaveValue("命中");
    expect(screen.getByLabelText("状态筛选")).toHaveValue("待适配");
    expect(screen.getByLabelText("平台筛选")).toHaveValue("知乎");
    expect(screen.getByLabelText("负责人筛选")).toHaveValue("王轩");
    expect(screen.getByLabelText("优先级筛选")).toHaveValue("高");
    expect(screen.getByLabelText("开始日期")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("结束日期")).toHaveValue("2026-09-30");
    expect(screen.getByText("筛选结果 1 条")).toBeInTheDocument();
    expect(screen.getByText("URL 参数筛选命中选题")).toBeInTheDocument();
    expect(screen.queryByText("URL 参数筛选排除选题")).not.toBeInTheDocument();
  });

  it("用户调整内容日历筛选后同步更新 URL 参数", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-url-sync-1",
          topicTitle: "URL 同步测试选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.change(screen.getByLabelText("关键词搜索"), { target: { value: "同步测试" } });
    fireEvent.change(screen.getByLabelText("状态筛选"), { target: { value: "待适配" } });
    fireEvent.change(screen.getByLabelText("平台筛选"), { target: { value: "知乎" } });
    fireEvent.change(screen.getByLabelText("负责人筛选"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("优先级筛选"), { target: { value: "高" } });
    fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-09-30" } });

    expect(window.location.search).toBe(
      "?keyword=%E5%90%8C%E6%AD%A5%E6%B5%8B%E8%AF%95&status=%E5%BE%85%E9%80%82%E9%85%8D&platform=%E7%9F%A5%E4%B9%8E&owner=%E7%8E%8B%E8%BD%A9&priority=%E9%AB%98&start=2026-09-01&end=2026-09-30"
    );

    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));

    expect(window.location.pathname).toBe("/content-calendar");
    expect(window.location.search).toBe("");
  });

  it("支持排序、快捷日期范围和筛选启用状态", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-advanced-filter-1",
          topicTitle: "低分高优先级选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 70,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-16T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-advanced-filter-2",
          topicTitle: "高分低优先级选题",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 96,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-09-23T10:00:00.000Z",
          owner: "运营同事",
          priority: "低",
          contentStage: "生产中"
        },
        {
          id: "topic-advanced-filter-3",
          topicTitle: "十月远期选题",
          platform: "小红书",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实三。",
          overallScore: 88,
          status: "待适配",
          createdAt: "2026-09-14T08:00:00.000Z",
          scheduledAt: "2026-10-06T10:00:00.000Z",
          owner: "王轩",
          priority: "中",
          contentStage: "待生产"
        }
      ])
    );

    render(<ContentCalendarPage />);

    expect(screen.getByText("已启用筛选 0 项")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "清空筛选" })).toBeDisabled();

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    fireEvent.click(screen.getByRole("button", { name: "未来 7 天" }));

    expect(screen.getByLabelText("开始日期")).toHaveValue(formatDateInputValue(today));
    expect(screen.getByLabelText("结束日期")).toHaveValue(formatDateInputValue(nextWeek));
    expect(screen.getByText("已启用筛选 2 项")).toBeInTheDocument();
    expect(screen.getByText("筛选结果 1 条")).toBeInTheDocument();
    expect(screen.getByText("低分高优先级选题")).toBeInTheDocument();
    expect(screen.queryByText("高分低优先级选题")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));
    fireEvent.change(screen.getByLabelText("排序方式"), { target: { value: "score_desc" } });

    const calendar = screen.getByRole("region", { name: "内容日历列表" });
    const cards = within(calendar).getAllByText(/选题$/);
    expect(cards[0]).toHaveTextContent("高分低优先级选题");
    expect(window.location.search).toBe("?sort=score_desc");
  });
  it("支持按计划发布日期范围筛选内容计划", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-date-range-1",
          topicTitle: "九月下旬智能沙盘发布计划",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-date-range-2",
          topicTitle: "十月智能沙盘发布计划",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 86,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-10-02T10:00:00.000Z",
          owner: "运营同事",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.change(screen.getByLabelText("开始日期"), { target: { value: "2026-09-19" } });
    fireEvent.change(screen.getByLabelText("结束日期"), { target: { value: "2026-09-30" } });

    const calendar = screen.getByRole("region", { name: "内容日历列表" });
    expect(screen.getByText("筛选结果 1 条")).toBeInTheDocument();
    expect(within(calendar).getByText("九月下旬智能沙盘发布计划")).toBeInTheDocument();
    expect(within(calendar).queryByText("十月智能沙盘发布计划")).not.toBeInTheDocument();
  });
  it("开始日期晚于结束日期时显示明确错误提示", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-invalid-date-1",
          topicTitle: "日期错误校验示例选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        }
      ])
    );

    const { container } = render(<ContentCalendarPage />);
    const dateInputs = container.querySelectorAll('input[type="date"]');

    fireEvent.change(dateInputs[0], { target: { value: "2026-10-01" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-09-01" } });

    expect(screen.getByText("开始日期不能晚于结束日期")).toBeInTheDocument();
    expect(screen.queryByText("没有匹配的内容计划")).not.toBeInTheDocument();
  });
  it("支持一键清空所有筛选条件", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-reset-filter-1",
          topicTitle: "清空筛选测试一",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-reset-filter-2",
          topicTitle: "清空筛选测试二",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实二。",
          overallScore: 86,
          status: "适配中",
          createdAt: "2026-09-13T08:00:00.000Z",
          scheduledAt: "2026-10-02T10:00:00.000Z",
          owner: "运营同事",
          priority: "中",
          contentStage: "生产中"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.change(screen.getByLabelText("关键词搜索"), { target: { value: "测试一" } });

    expect(screen.getByText("筛选结果 1 条")).toBeInTheDocument();
    expect(screen.getByText("清空筛选测试一")).toBeInTheDocument();
    expect(screen.queryByText("清空筛选测试二")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));

    expect(screen.getByText("筛选结果 2 条")).toBeInTheDocument();
    expect(screen.getByText("清空筛选测试一")).toBeInTheDocument();
    expect(screen.getByText("清空筛选测试二")).toBeInTheDocument();
  });

  it("支持编辑内容计划并保存排期字段", () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-edit-1",
          topicTitle: "内容日历编辑计划测试",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王舟",
          priority: "高",
          contentStage: "待生产"
        }
      ])
    );

    render(<ContentCalendarPage />);

    fireEvent.click(screen.getByRole("button", { name: "编辑计划" }));
    fireEvent.change(screen.getByLabelText("计划发布日期"), { target: { value: "2026-09-25" } });
    fireEvent.change(screen.getByLabelText("负责人"), { target: { value: "运营同事" } });
    fireEvent.change(screen.getByLabelText("优先级"), { target: { value: "中" } });
    fireEvent.change(screen.getByLabelText("内容阶段"), { target: { value: "生产中" } });
    fireEvent.change(screen.getByLabelText("计划状态"), { target: { value: "适配中" } });
    fireEvent.click(screen.getByRole("button", { name: "保存计划" }));

    const storedItems = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]");
    expect(storedItems[0]).toMatchObject({
      scheduledAt: "2026-09-25T10:00:00.000Z",
      owner: "运营同事",
      priority: "中",
      contentStage: "生产中",
      status: "适配中"
    });
    expect(screen.getByText("计划已保存")).toBeInTheDocument();
    expect(screen.getByText("负责人 运营同事")).toBeInTheDocument();
  });
});

function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}
