import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../app/page";

describe("首页规则与监测入口", () => {
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
});
