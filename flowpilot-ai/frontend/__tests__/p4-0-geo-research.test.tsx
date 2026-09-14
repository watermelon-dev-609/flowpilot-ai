import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GeoResearchPage from "../app/geo-research/page";
import { GlobalNavigation } from "../app/components/state-card";

const contentAdaptationIntakeKey = "flowpilot.geoResearch.contentAdaptationIntake";
const topicPoolStorageKey = "flowpilot.geoResearch.topicPool";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("第四阶段研究工作台", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("在全局导航中使用中文入口", () => {
    render(<GlobalNavigation />);

    expect(screen.getByRole("link", { name: "生成式优化研究" })).toHaveAttribute("href", "/geo-research");
    expect(screen.queryByText("GEO Research")).not.toBeInTheDocument();
  });

  it("根据业务研究简报生成实体、问题和选题图谱", () => {
    render(<GeoResearchPage />);

    expect(screen.getByRole("heading", { name: "生成式优化研究" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "生成式优化研究输入" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "研究结果边界" })).toBeInTheDocument();
    expect(screen.getByText(/研究建议不等同于模型平台排名/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
    fireEvent.change(screen.getByLabelText("产品 / 业务"), { target: { value: "智能沙盘" } });
    fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
    fireEvent.change(screen.getByLabelText("研究目标"), { target: { value: "厂家推荐" } });
    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));

    expect(screen.getByRole("region", { name: "实体图谱" })).toBeInTheDocument();
    expect(screen.getByText("品牌实体")).toBeInTheDocument();
    expect(screen.getByText("武汉微艺达智能科技有限公司")).toBeInTheDocument();
    expect(screen.getByText("地域实体")).toBeInTheDocument();
    expect(screen.getByText("武汉")).toBeInTheDocument();
    expect(screen.getByText("产品实体")).toBeInTheDocument();
    expect(screen.getByText("智能沙盘")).toBeInTheDocument();
    expect(screen.getByText("数字孪生")).toBeInTheDocument();
    expect(screen.getByText("智慧交通沙盘")).toBeInTheDocument();

    expect(screen.getByRole("region", { name: "问题图谱" })).toBeInTheDocument();
    expect(screen.getByText("是什么类")).toBeInTheDocument();
    expect(screen.getByText("智能沙盘是什么？")).toBeInTheDocument();
    expect(screen.getByText("怎么选类")).toBeInTheDocument();
    expect(screen.getByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("厂家推荐类")).toBeInTheDocument();
    expect(screen.getByText("武汉有哪些智能沙盘厂家值得了解？")).toBeInTheDocument();

    expect(screen.getByRole("region", { name: "选题计划" })).toBeInTheDocument();
    expect(screen.getByText("官网")).toBeInTheDocument();
    expect(screen.getAllByText("武汉智能沙盘厂家推荐：武汉微艺达智能沙盘能力介绍").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("知乎")).toBeInTheDocument();
    expect(screen.getAllByText("武汉有哪些靠谱的智能沙盘制作公司？").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("小红书")).toBeInTheDocument();
    expect(screen.getAllByText("武汉做智能沙盘，厂家到底怎么选？").length).toBeGreaterThanOrEqual(1);
  });

  it("支持将优先选题加入内容适配准备", async () => {
    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入内容适配准备" })[0]);

    const intake = JSON.parse(localStorage.getItem(contentAdaptationIntakeKey) || "{}") as {
      brandName: string;
      productName: string;
      region: string;
      topicTitle: string;
      targetAudience: string;
      facts: string;
    };
    expect(await screen.findByText("已加入内容适配准备")).toBeInTheDocument();
    expect(intake).toMatchObject({
      brandName: "武汉微艺达智能科技有限公司",
      productName: "智能沙盘",
      region: "武汉",
      targetAudience: "生成式优化内容受众"
    });
    expect(intake.topicTitle).toContain("智能沙盘");
    expect(intake.facts).toContain("来自生成式优化研究");
  });

  it("支持把多个优先选题保存到选题池", async () => {
    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    const queueButtons = screen.getAllByRole("button", { name: "加入内容适配准备" });
    fireEvent.click(queueButtons[0]);
    fireEvent.click(queueButtons[1]);

    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{
      topicTitle: string;
      platform: string;
      status: string;
    }>;
    expect(topicPool).toHaveLength(2);
    expect(topicPool[0]).toEqual(
      expect.objectContaining({
        topicTitle: expect.any(String),
        platform: expect.any(String),
        status: "待适配"
      })
    );
    expect(topicPool[0].topicTitle).not.toBe(topicPool[1].topicTitle);
  });

  it("加入选题池时同步创建后端内容计划", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/rules/ai-channels")) {
        return response({ channel_type: "ai", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
      }

      if (url.includes("/api/rules/publishing-channels")) {
        return response({ channel_type: "publishing", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
      }

      if (url.includes("/api/geo-monitor/sessions")) {
        return response({ data_mode: "mock", evidence_levels: {}, sessions: [] });
      }

      if (url.includes("/api/geo-monitor/records")) {
        return response({ data_mode: "mock", records: [] });
      }

      if (url.includes("/api/content-calendar/plans") && init?.method === "POST") {
        return response(
          {
            id: "content-plan-api-1",
            topic_title: "武汉智能沙盘厂家推荐：武汉微艺达智能沙盘能力介绍",
            platform: "官网",
            brand_name: "武汉微艺达智能科技有限公司",
            product_name: "智能沙盘",
            region: "武汉",
            target_audience: "生成式优化内容受众",
            facts: "来自生成式优化研究。",
            overall_score: 94,
            status: "待适配",
            created_at: "2026-09-15T10:00:00.000Z",
            scheduled_at: null,
            owner: "",
            priority: "高",
            content_stage: "待生产",
            data_mode: "manual"
          },
          201
        );
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入内容适配准备" })[0]);

    expect(await screen.findByText("已加入内容适配准备，并同步到内容日历 API")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/content-calendar/plans",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("武汉智能沙盘厂家推荐")
      })
    );
  });

  it("展示本地选题池并支持选择选题进入内容适配", async () => {
    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    const queueButtons = screen.getAllByRole("button", { name: "加入内容适配准备" });
    fireEvent.click(queueButtons[0]);
    fireEvent.click(queueButtons[1]);

    expect(screen.getByRole("region", { name: "本地选题池" })).toBeInTheDocument();
    expect(screen.getByText("待适配选题 2 条")).toBeInTheDocument();
    expect(screen.getAllByText("待适配").length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getAllByRole("button", { name: "用于内容适配" })[1]);

    const intake = JSON.parse(localStorage.getItem(contentAdaptationIntakeKey) || "{}") as {
      topicTitle: string;
    };
    const topicPool = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{
      topicTitle: string;
    }>;
    expect(intake.topicTitle).toBe(topicPool[1].topicTitle);
    expect(await screen.findByText("已选择选题进入内容适配准备")).toBeInTheDocument();
  });

  it("必填研究输入缺失时显示校验错误", () => {
    render(<GeoResearchPage />);

    fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("产品 / 业务"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));

    expect(screen.getByRole("alert")).toHaveTextContent("请填写品牌名称、产品 / 业务和目标地域");
    expect(screen.queryByRole("region", { name: "实体图谱" })).not.toBeInTheDocument();
  });
});
