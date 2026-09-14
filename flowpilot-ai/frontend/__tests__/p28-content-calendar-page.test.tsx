import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ContentCalendarPage from "../app/content-calendar/page";

const topicPoolStorageKey = "flowpilot.geoResearch.topicPool";

describe("P28 内容日历独立页面", () => {
  beforeEach(() => {
    localStorage.clear();
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

    const { container } = render(<ContentCalendarPage />);

    const textInputs = container.querySelectorAll('input:not([type="date"])');
    fireEvent.change(textInputs[0], { target: { value: "测试一" } });

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
