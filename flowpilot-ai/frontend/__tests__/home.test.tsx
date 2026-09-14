import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../app/page";

describe("首页", () => {
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
});
