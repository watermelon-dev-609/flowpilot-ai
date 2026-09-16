import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import ProductCenterPage from "../app/products/page";

beforeEach(() => {
  localStorage.clear();
});

describe("P36 产品中心", () => {
  it("展示产品资料录入、资产列表和下一步入口", () => {
    render(<ProductCenterPage />);

    expect(screen.getByRole("heading", { name: "产品中心" })).toBeInTheDocument();
    expect(screen.getByLabelText("产品名称")).toBeInTheDocument();
    expect(screen.getByLabelText("品牌名称")).toBeInTheDocument();
    expect(screen.getByLabelText("目标页面链接")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "产品资产列表" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "进入生成式优化研究" })).toHaveAttribute("href", "/geo-research");
  });

  it("保存产品资料后生成可进入 GEO 研究的产品资产", () => {
    render(<ProductCenterPage />);

    fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
    fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达" } });
    fireEvent.change(screen.getByLabelText("目标页面链接"), { target: { value: "https://example.com/sandbox" } });
    fireEvent.change(screen.getByLabelText("目标客户"), { target: { value: "展厅负责人" } });
    fireEvent.change(screen.getByLabelText("核心卖点"), { target: { value: "多媒体联动、三维展示、方案定制" } });
    fireEvent.change(screen.getByLabelText("事实依据"), { target: { value: "已有展厅案例和产品资料。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存产品资料" }));

    const list = screen.getByRole("region", { name: "产品资产列表" });
    expect(within(list).getByText("智能沙盘")).toBeInTheDocument();
    expect(within(list).getByText("武汉微艺达")).toBeInTheDocument();
    expect(within(list).getByRole("link", { name: "带入 GEO 研究" }).getAttribute("href")).toContain("/geo-research?");
    expect(within(list).getByRole("link", { name: "带入 GEO 研究" }).getAttribute("href")).toContain("product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98");
    expect(within(list).getByRole("link", { name: "带入 GEO 研究" }).getAttribute("href")).toContain("brand=%E6%AD%A6%E6%B1%89%E5%BE%AE%E8%89%BA%E8%BE%BE");
  });

  it("缺少必填资料时提示补齐而不是保存空资产", () => {
    render(<ProductCenterPage />);

    fireEvent.click(screen.getByRole("button", { name: "保存产品资料" }));

    expect(screen.getByRole("alert")).toHaveTextContent("请填写产品名称、品牌名称和目标页面链接");
    expect(screen.queryByText("未命名产品")).not.toBeInTheDocument();
  });
});
