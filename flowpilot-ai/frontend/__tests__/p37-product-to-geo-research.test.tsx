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
});
