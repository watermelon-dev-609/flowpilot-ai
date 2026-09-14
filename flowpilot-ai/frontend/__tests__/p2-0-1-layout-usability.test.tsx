import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../app/page";
import GeoMonitorPage from "../app/geo-monitor/page";
import GeoMonitorRecordsPage from "../app/geo-monitor/records/page";
import GeoMonitorSessionsPage from "../app/geo-monitor/sessions/page";
import RulesPage from "../app/rules/page";

describe("布局与可用性加固", () => {
  it("首页展示全局导航和运营工作台，而不是项目说明页", () => {
    render(<Home />);

    expect(screen.getByRole("navigation", { name: "全局导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "首页工作台" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "规则中心" })).toHaveAttribute("href", "/rules");
    expect(screen.getByRole("link", { name: "监测总览" })).toHaveAttribute("href", "/geo-monitor");
    expect(screen.getByRole("link", { name: "监测任务" })).toHaveAttribute("href", "/geo-monitor/sessions");
    expect(screen.getByRole("link", { name: "监测记录" })).toHaveAttribute("href", "/geo-monitor/records");
    expect(screen.getByRole("heading", { name: "今日运营工作台" })).toBeInTheDocument();
    expect(screen.getByText("待复核规则")).toBeInTheDocument();
    expect(screen.getByText("快捷操作")).toBeInTheDocument();
  });

  it("移动端菜单按钮可以打开和关闭抽屉导航", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: "打开移动导航" }));

    const drawer = screen.getByRole("dialog", { name: "移动端导航" });

    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByRole("link", { name: "内容日历" })).toHaveAttribute("href", "/content-calendar");

    fireEvent.click(screen.getByRole("button", { name: "关闭移动导航" }));

    expect(screen.queryByRole("dialog", { name: "移动端导航" })).not.toBeInTheDocument();
  });

  it("监测总览页保留全局导航和页面主体", () => {
    render(<GeoMonitorPage />);

    expect(screen.getByRole("navigation", { name: "全局导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "监测任务" })).toHaveAttribute("href", "/geo-monitor/sessions");
    expect(screen.getByRole("link", { name: "监测记录" })).toHaveAttribute("href", "/geo-monitor/records");
  });

  it("监测任务页保留独立入口", () => {
    render(<GeoMonitorSessionsPage />);

    expect(screen.getByRole("navigation", { name: "全局导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "监测任务" })).toHaveAttribute("href", "/geo-monitor/sessions");
  });

  it("监测记录页保留独立入口", () => {
    render(<GeoMonitorRecordsPage />);

    expect(screen.getByRole("navigation", { name: "全局导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "监测记录" })).toHaveAttribute("href", "/geo-monitor/records");
  });

  it("规则中心页保留来源复核入口", () => {
    render(<RulesPage />);

    expect(screen.getByRole("navigation", { name: "全局导航" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "规则中心" })).toHaveAttribute("href", "/rules");
  });
});
