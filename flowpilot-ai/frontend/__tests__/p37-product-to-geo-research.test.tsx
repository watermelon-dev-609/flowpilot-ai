import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GeoResearchPage from "../app/geo-research/page";

const contentAdaptationIntakeKey = "flowpilot.geoResearch.contentAdaptationIntake";

describe("Product center to GEO research handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("prefills research input from product center query params", () => {
    window.history.replaceState(
      {},
      "",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&brand=%E6%AD%A6%E6%B1%89%E5%BE%AE%E8%89%BA%E8%BE%BE&url=https%3A%2F%2Fexample.com%2Fsandbox&audience=%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA&facts=%E5%B7%B2%E6%9C%89%E5%B1%95%E5%8E%85%E6%A1%88%E4%BE%8B"
    );

    render(<GeoResearchPage />);

    expect(screen.getByLabelText("品牌名称")).toHaveValue("武汉微艺达");
    expect(screen.getByLabelText("产品 / 业务")).toHaveValue("智能沙盘");
    expect(screen.getByLabelText("研究目标")).toHaveValue("面向展厅负责人验证已有展厅案例");
    expect(screen.getByRole("region", { name: "AI 产品卡" })).toBeInTheDocument();
    expect(screen.getByText("待核查")).toBeInTheDocument();
    expect(screen.getByText("已从产品中心带入产品资料")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/sandbox")).toBeInTheDocument();
  });

  it("prefills research goal from GEO monitor product risk", () => {
    window.history.replaceState(
      {},
      "",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&source=geo-monitor&risk=%E9%AB%98%E9%A3%8E%E9%99%A9&action=%E4%BC%98%E5%85%88%E8%A1%A5%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8&facts=%E5%93%81%E7%89%8C%E6%8F%90%E5%8F%8A%E7%8E%87%20100%25%EF%BC%8C%E9%A1%B5%E9%9D%A2%E6%A3%80%E7%B4%A2%E7%8E%87%200%25%EF%BC%8C%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8%E7%8E%87%200%25"
    );

    render(<GeoResearchPage />);

    expect(screen.getByLabelText("产品 / 业务")).toHaveValue("智能沙盘");
    expect(screen.getByLabelText("研究目标")).toHaveValue("高风险产品，优先补来源引用");
    expect(screen.getByRole("region", { name: "AI 产品卡" })).toHaveTextContent("已从 GEO 监测风险带入产品资料");
    expect(screen.getByText("品牌提及率 100%，页面检索率 0%，来源引用率 0%")).toBeInTheDocument();
  });

  it("carries product facts into content adaptation intake", () => {
    window.history.replaceState(
      {},
      "",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&brand=%E6%AD%A6%E6%B1%89%E5%BE%AE%E8%89%BA%E8%BE%BE&url=https%3A%2F%2Fexample.com%2Fsandbox&audience=%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA&facts=%E5%B7%B2%E6%9C%89%E5%B1%95%E5%8E%85%E6%A1%88%E4%BE%8B"
    );

    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入内容适配准备" })[0]);

    const intake = JSON.parse(localStorage.getItem(contentAdaptationIntakeKey) || "{}") as {
      targetAudience: string;
      facts: string;
    };
    expect(intake.targetAudience).toBe("展厅负责人");
    expect(intake.facts).toContain("已有展厅案例");
    expect(intake.facts).toContain("https://example.com/sandbox");
  });

  it("syncs product facts to content calendar API payload", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/rules/ai-channels")) {
        return { ok: true, status: 200, json: async () => ({ channel_type: "ai", data_mode: "manual", source_policy: "", rules: [] }) } as Response;
      }
      if (url.includes("/api/rules/publishing-channels")) {
        return { ok: true, status: 200, json: async () => ({ channel_type: "publishing", data_mode: "manual", source_policy: "", rules: [] }) } as Response;
      }
      if (url.includes("/api/geo-monitor/sessions")) {
        return { ok: true, status: 200, json: async () => ({ data_mode: "manual", evidence_levels: {}, sessions: [] }) } as Response;
      }
      if (url.includes("/api/geo-monitor/records")) {
        return { ok: true, status: 200, json: async () => ({ data_mode: "manual", records: [] }) } as Response;
      }
      if (url.includes("/api/content-calendar/plans") && init?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: "plan-from-product",
            topic_title: "智能沙盘展厅负责人选型指南",
            platform: "知乎",
            brand_name: "武汉微艺达",
            product_name: "智能沙盘",
            region: "武汉",
            target_audience: "展厅负责人",
            facts: JSON.parse(String(init.body)).facts,
            overall_score: 90,
            status: "待适配",
            created_at: "2026-09-16T10:00:00.000Z",
            scheduled_at: null,
            owner: "",
            priority: "高",
            content_stage: "待生产",
            data_mode: "manual"
          })
        } as Response;
      }

      return { ok: false, status: 404, json: async () => ({ detail: "not found" }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(
      {},
      "",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&brand=%E6%AD%A6%E6%B1%89%E5%BE%AE%E8%89%BA%E8%BE%BE&url=https%3A%2F%2Fexample.com%2Fsandbox&audience=%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA&facts=%E5%B7%B2%E6%9C%89%E5%B1%95%E5%8E%85%E6%A1%88%E4%BE%8B"
    );

    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入内容适配准备" })[0]);

    await screen.findByText("已加入内容适配准备，并同步到内容日历 API");
    const postCall = fetchMock.mock.calls.find(([input, init]) => String(input).includes("/api/content-calendar/plans") && init?.method === "POST");
    const payload = JSON.parse(String(postCall?.[1]?.body || "{}")) as { target_audience: string; facts: string };

    expect(payload.target_audience).toBe("展厅负责人");
    expect(payload.facts).toContain("产品中心事实依据：已有展厅案例");
    expect(payload.facts).toContain("产品目标页面：https://example.com/sandbox");
  });

  it("syncs GEO risk topics to content calendar as high-priority production work", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/rules/ai-channels")) {
        return { ok: true, status: 200, json: async () => ({ channel_type: "ai", data_mode: "manual", source_policy: "", rules: [] }) } as Response;
      }
      if (url.includes("/api/rules/publishing-channels")) {
        return { ok: true, status: 200, json: async () => ({ channel_type: "publishing", data_mode: "manual", source_policy: "", rules: [] }) } as Response;
      }
      if (url.includes("/api/geo-monitor/sessions")) {
        return { ok: true, status: 200, json: async () => ({ data_mode: "manual", evidence_levels: {}, sessions: [] }) } as Response;
      }
      if (url.includes("/api/geo-monitor/records")) {
        return { ok: true, status: 200, json: async () => ({ data_mode: "manual", records: [] }) } as Response;
      }
      if (url.includes("/api/content-calendar/plans") && init?.method === "POST") {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            id: "risk-plan",
            topic_title: "智能沙盘来源引用补强选题",
            platform: "官网",
            brand_name: "武汉微艺达",
            product_name: "智能沙盘",
            region: "武汉",
            target_audience: "生成式优化内容受众",
            facts: JSON.parse(String(init.body)).facts,
            overall_score: 90,
            status: "待适配",
            created_at: "2026-09-16T10:00:00.000Z",
            scheduled_at: null,
            owner: "",
            priority: JSON.parse(String(init.body)).priority,
            content_stage: JSON.parse(String(init.body)).content_stage,
            data_mode: "manual"
          })
        } as Response;
      }

      return { ok: false, status: 404, json: async () => ({ detail: "not found" }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    window.history.replaceState(
      {},
      "",
      "/geo-research?product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&brand=%E6%AD%A6%E6%B1%89%E5%BE%AE%E8%89%BA%E8%BE%BE&source=geo-monitor&risk=%E9%AB%98%E9%A3%8E%E9%99%A9&action=%E4%BC%98%E5%85%88%E8%A1%A5%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8&facts=%E5%93%81%E7%89%8C%E6%8F%90%E5%8F%8A%E7%8E%87%20100%25%EF%BC%8C%E9%A1%B5%E9%9D%A2%E6%A3%80%E7%B4%A2%E7%8E%87%200%25%EF%BC%8C%E6%9D%A5%E6%BA%90%E5%BC%95%E7%94%A8%E7%8E%87%200%25"
    );

    render(<GeoResearchPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成研究结果" }));
    fireEvent.click(screen.getAllByRole("button", { name: "加入内容适配准备" })[0]);

    await screen.findByText("已加入内容适配准备，并同步到内容日历 API");
    const postCall = fetchMock.mock.calls.find(([input, init]) => String(input).includes("/api/content-calendar/plans") && init?.method === "POST");
    const payload = JSON.parse(String(postCall?.[1]?.body || "{}")) as { facts: string; priority: string; content_stage: string };

    expect(payload.priority).toBe("高");
    expect(payload.content_stage).toBe("待生产");
    expect(payload.facts).toContain("GEO 风险来源：高风险");
    expect(payload.facts).toContain("GEO 补强动作：优先补来源引用");
    expect(payload.facts).toContain("品牌提及率 100%，页面检索率 0%，来源引用率 0%");
  });
});
