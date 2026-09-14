import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GeoResearchPage from "../app/geo-research/page";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function installEmptyResearchContextFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/rules/ai-channels")) {
        return response({ channel_type: "ai", data_mode: "manual", source_policy: "manual", rules: [] });
      }

      if (url.includes("/api/rules/publishing-channels")) {
        return response({ channel_type: "publishing", data_mode: "manual", source_policy: "manual", rules: [] });
      }

      if (url.includes("/api/geo-monitor/sessions")) {
        return response({ data_mode: "manual", evidence_levels: {}, sessions: [] });
      }

      if (url.includes("/api/geo-monitor/records")) {
        return response({ data_mode: "manual", records: [] });
      }

      return response({ detail: "not found" }, 404);
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("第四阶段选题评分", () => {
  it("为生成选题展示优先级、难度、平台适配和推荐理由", async () => {
    installEmptyResearchContextFetchMock();

    render(<GeoResearchPage />);

    await screen.findByRole("region", { name: "研究数据来源概览" });
    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));

    const topicPlan = screen.getByRole("region", { name: "选题计划" });
    const websiteTopic = within(topicPlan).getByRole("article", {
      name: "武汉智能沙盘厂家推荐：武汉微艺达智能沙盘能力介绍"
    });

    expect(within(websiteTopic).getByText("优先级：高")).toBeInTheDocument();
    expect(within(websiteTopic).getByText("难度：中")).toBeInTheDocument();
    expect(within(websiteTopic).getByText(/平台适配：\d+/)).toBeInTheDocument();
    expect(within(websiteTopic).getByText(/地域 \+ 产品 \+ 厂家推荐/)).toBeInTheDocument();

    const xiaohongshuTopic = within(topicPlan).getByRole("article", {
      name: "武汉做智能沙盘，厂家到底怎么选？"
    });
    expect(within(xiaohongshuTopic).getByText(/平台适配：/)).toBeInTheDocument();
    expect(within(xiaohongshuTopic).getByText(/适合小红书/)).toBeInTheDocument();
  });

  it("根据选题评分展示前三个优先写作建议", async () => {
    installEmptyResearchContextFetchMock();

    render(<GeoResearchPage />);

    await screen.findByRole("region", { name: "研究数据来源概览" });
    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));

    const recommendationPanel = screen.getByRole("region", { name: "优先写作建议" });

    expect(within(recommendationPanel).getByText("第一优先")).toBeInTheDocument();
    expect(within(recommendationPanel).getByText("第二优先")).toBeInTheDocument();
    expect(within(recommendationPanel).getByText("第三优先")).toBeInTheDocument();
    expect(within(recommendationPanel).getByText(/武汉智能沙盘厂家推荐/)).toBeInTheDocument();
    expect(within(recommendationPanel).getAllByText(/综合评分/)).toHaveLength(3);
  });

  it("不显示旧的英文界面标签", async () => {
    installEmptyResearchContextFetchMock();

    render(<GeoResearchPage />);

    await screen.findByRole("region", { name: "研究数据来源概览" });
    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));

    const visibleText = document.body.textContent || "";

    expect(visibleText).not.toMatch(/FlowPilot|GEO Research|Research Brief|Research Context|Research Boundary|Research Evidence|Writing Priority|Topic Scoring|Platform/i);
  });
});
