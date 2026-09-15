import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ContentAdaptationPage from "../app/content-adaptation/page";

const publishQueueStorageKey = "flowpilot.contentAdaptation.publishQueue";
const contentAdaptationIntakeKey = "flowpilot.geoResearch.contentAdaptationIntake";
const topicPoolStorageKey = "flowpilot.geoResearch.topicPool";

function fillRequiredFields(topicTitle = "武汉智能沙盘厂家怎么选？") {
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
  fireEvent.change(screen.getByLabelText("选题标题"), { target: { value: topicTitle } });
  fireEvent.change(screen.getByLabelText("目标受众"), { target: { value: "企业展厅和智慧园区项目负责人" } });
  fireEvent.change(screen.getByLabelText("可确认事实"), {
    target: { value: "支持实体模型、灯光控制、触摸屏联动和数字孪生展示。" }
  });
}

describe("P5 内容适配页面", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("填写业务资料后生成多平台草稿卡片", async () => {
    render(<ContentAdaptationPage />);

    expect(screen.getByRole("heading", { name: "内容适配工作台" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "内容适配" })).toHaveAttribute("href", "/content-adaptation");
    expect(screen.getByText("暂无平台草稿")).toBeInTheDocument();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    expect((await screen.findAllByText("微信公众号")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("知乎").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("小红书").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("百家号").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/综合评分/).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/不承诺搜索排名、平台收录或模型引用/).length).toBeGreaterThanOrEqual(4);
  });

  it("进入页面时自动带入生成式优化研究选题", async () => {
    localStorage.setItem(
      contentAdaptationIntakeKey,
      JSON.stringify({
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        topicTitle: "武汉智能沙盘厂家推荐：武汉微艺达智能沙盘能力介绍",
        targetAudience: "生成式优化内容受众",
        facts: "来自生成式优化研究：优先覆盖地域、产品和厂家推荐意图。"
      })
    );

    render(<ContentAdaptationPage />);

    expect(await screen.findByText("已带入生成式优化研究选题")).toBeInTheDocument();
    expect(screen.getByDisplayValue("武汉微艺达智能科技有限公司")).toBeInTheDocument();
    expect(screen.getByDisplayValue("智能沙盘")).toBeInTheDocument();
    expect(screen.getByDisplayValue("武汉")).toBeInTheDocument();
    expect(screen.getByDisplayValue("武汉智能沙盘厂家推荐：武汉微艺达智能沙盘能力介绍")).toBeInTheDocument();
  });

  it("展示研究选题池并支持选择选题带入表单", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-pool-1",
          topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "生成式优化内容受众",
          facts: "来自选题池：优先回答厂家推荐和选型问题。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-pool-2",
          topicTitle: "智能沙盘和普通沙盘有什么区别？",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "来自选题池：需要解释实体模型、控制系统和数字孪生联动。",
          overallScore: 86,
          status: "待适配",
          createdAt: "2026-09-12T08:10:00.000Z"
        }
      ])
    );

    render(<ContentAdaptationPage />);

    expect(await screen.findByRole("region", { name: "研究选题池" })).toBeInTheDocument();
    expect(screen.getByText("待适配选题 2 条")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "带入此选题" })[1]);

    expect(await screen.findByText("已从研究选题池带入选题")).toBeInTheDocument();
    expect(screen.getByDisplayValue("智能沙盘和普通沙盘有什么区别？")).toBeInTheDocument();
    expect(screen.getByDisplayValue("企业展厅项目负责人")).toBeInTheDocument();
    expect(screen.getByDisplayValue("来自选题池：需要解释实体模型、控制系统和数字孪生联动。")).toBeInTheDocument();
  });

  it("从内容日历链接进入时按计划 ID 自动带入选题", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-linked-plan",
          topicTitle: "内容日历跳转到内容适配的选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "从内容日历进入内容适配时需要保留的事实。",
          overallScore: 92,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        }
      ])
    );
    window.history.replaceState({}, "", "/content-adaptation?plan=topic-linked-plan");

    render(<ContentAdaptationPage />);

    expect(await screen.findByText("已从内容日历带入选题")).toBeInTheDocument();
    expect(screen.getByDisplayValue("内容日历跳转到内容适配的选题")).toBeInTheDocument();
    expect(screen.getByDisplayValue("运营负责人")).toBeInTheDocument();
    expect(screen.getByDisplayValue("从内容日历进入内容适配时需要保留的事实。")).toBeInTheDocument();

    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; status: string }>;
    expect(topicPool[0]).toEqual(expect.objectContaining({ id: "topic-linked-plan", status: "适配中" }));
  });

  it("选题带入和生成草稿时更新研究选题池状态", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-pool-status-1",
          topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "生成式优化内容受众",
          facts: "来自选题池：优先回答厂家推荐和选型问题。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z"
        }
      ])
    );

    render(<ContentAdaptationPage />);

    fireEvent.click(await screen.findByRole("button", { name: "带入此选题" }));
    let topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; status: string }>;
    expect(topicPool[0]).toEqual(expect.objectContaining({ id: "topic-pool-status-1", status: "适配中" }));
    expect(screen.getAllByText("适配中").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    expect(await screen.findByText("已保存本次平台草稿")).toBeInTheDocument();

    topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; status: string }>;
    expect(topicPool[0]).toEqual(expect.objectContaining({ id: "topic-pool-status-1", status: "已生成" }));
    expect(screen.getAllByText("已生成").length).toBeGreaterThanOrEqual(1);
  });

  it("支持作废单条选题并清理已生成选题", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "topic-pool-manage-1",
          topicTitle: "待处理选题",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "生成式优化内容受众",
          facts: "待处理事实。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        },
        {
          id: "topic-pool-manage-2",
          topicTitle: "已生成选题",
          platform: "公众号",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "已生成事实。",
          overallScore: 86,
          status: "已生成",
          createdAt: "2026-09-12T08:10:00.000Z"
        }
      ])
    );

    render(<ContentAdaptationPage />);

    fireEvent.click(await screen.findByRole("button", { name: "作废选题" }));
    expect(await screen.findByText("已作废该选题")).toBeInTheDocument();
    expect(screen.getByText("已作废")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清理已生成选题" }));

    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; status: string }>;
    expect(topicPool).toHaveLength(1);
    expect(topicPool[0]).toEqual(expect.objectContaining({ id: "topic-pool-manage-1", status: "已作废" }));
    expect(screen.queryByText("已生成选题")).not.toBeInTheDocument();
  });

  it("根据研究选题池展示内容日历雏形", async () => {
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
          targetAudience: "生成式优化内容受众",
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
          createdAt: "2026-09-13T08:10:00.000Z"
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
          createdAt: "2026-09-14T08:10:00.000Z"
        }
      ])
    );

    render(<ContentAdaptationPage />);

    const calendar = await screen.findByRole("region", { name: "内容日历" });
    expect(calendar).toBeInTheDocument();
    expect(within(calendar).getByText("计划选题 2 条")).toBeInTheDocument();
    expect(within(calendar).getByText("9月20日")).toBeInTheDocument();
    expect(within(calendar).getByText("9月13日")).toBeInTheDocument();
    expect(within(calendar).getByText("武汉智能沙盘厂家推荐文章怎么写？")).toBeInTheDocument();
    expect(within(calendar).getByText("负责人 王轩")).toBeInTheDocument();
    expect(within(calendar).getByText("优先级 高")).toBeInTheDocument();
    expect(within(calendar).getByText("智能沙盘和普通沙盘有什么区别？")).toBeInTheDocument();
    expect(within(calendar).queryByText("已作废选题不进入日历")).not.toBeInTheDocument();
  });

  it("缺少必填项时显示错误状态", async () => {
    render(<ContentAdaptationPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("请填写品牌名称、产品名称、目标地域和选题标题");
  });

  it("支持复制全部平台草稿", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ContentAdaptationPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    fireEvent.click(await screen.findByRole("button", { name: "复制全部草稿" }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("微信公众号"));
    expect(await screen.findByText("已复制平台草稿")).toBeInTheDocument();
  });

  it("生成后保存草稿，下次进入页面自动恢复", async () => {
    const firstRender = render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    expect(await screen.findByText("已保存本次平台草稿")).toBeInTheDocument();

    firstRender.unmount();
    render(<ContentAdaptationPage />);

    await waitFor(() => {
      expect(screen.getByText("已恢复上次保存的平台草稿")).toBeInTheDocument();
    });
    expect(screen.getAllByText("微信公众号").length).toBeGreaterThanOrEqual(2);
  });

  it("连续生成多次时形成内容版本列表，并支持恢复指定版本", async () => {
    render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    expect(await screen.findByText("已保存本次平台草稿")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("选题标题"), { target: { value: "智慧园区沙盘内容怎么写？" } });
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    expect(await screen.findByText("内容版本记录")).toBeInTheDocument();
    expect(screen.getByText("版本 2")).toBeInTheDocument();
    expect(screen.getByText("版本 1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "恢复此版本" })[1]);

    expect(await screen.findByText("已恢复所选内容版本")).toBeInTheDocument();
    expect(screen.getByDisplayValue("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
  });

  it("内容版本支持审核状态，并且通过后可以加入发布准备队列", async () => {
    render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    expect(await screen.findByText("待审核")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "标记通过" }));

    expect(await screen.findByText("审核通过")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "加入发布准备" }));

    expect(await screen.findByText("发布准备队列")).toBeInTheDocument();
    expect(screen.getAllByText("武汉智能沙盘厂家怎么选？").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("准备发布")).toBeInTheDocument();
  });

  it("加入发布准备队列时保存平台版本摘要", async () => {
    render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    fireEvent.click(await screen.findByRole("button", { name: "标记通过" }));
    fireEvent.click(screen.getByRole("button", { name: "加入发布准备" }));

    const queue = JSON.parse(localStorage.getItem(publishQueueStorageKey) || "[]") as Array<{
      sourceTopicTitle: string;
      platformDrafts: Array<{ platformName: string; title: string; reviewStatus: string }>;
    }>;
    expect(queue[0].sourceTopicTitle).toBe("武汉智能沙盘厂家怎么选？");
    expect(queue[0].platformDrafts.length).toBeGreaterThanOrEqual(4);
    expect(queue[0].platformDrafts[0]).toEqual(
      expect.objectContaining({
        platformName: expect.any(String),
        title: expect.any(String),
        reviewStatus: "审核通过"
      })
    );
  });

  it("需要修改的版本不能加入发布准备队列", async () => {
    render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    fireEvent.click(await screen.findByRole("button", { name: "标记需修改" }));
    fireEvent.click(screen.getByRole("button", { name: "加入发布准备" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("只有审核通过的内容版本才能加入发布准备队列");
    expect(screen.queryByText("发布准备队列")).not.toBeInTheDocument();
  });
});
