import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataStateView } from "../app/components/data-state-view";

describe("P27 数据状态展示组件", () => {
  it("展示加载状态", () => {
    render(
      <DataStateView state={{ status: "loading" }} emptyTitle="暂无数据">
        {() => <p>成功内容</p>}
      </DataStateView>
    );

    expect(screen.getByRole("status")).toHaveTextContent("正在加载数据");
  });

  it("展示空状态", () => {
    render(
      <DataStateView state={{ status: "empty", data: [] }} emptyTitle="暂无内容计划" emptyDescription="生成研究选题后会出现在这里。">
        {() => <p>成功内容</p>}
      </DataStateView>
    );

    expect(screen.getByText("暂无内容计划")).toBeInTheDocument();
    expect(screen.getByText("生成研究选题后会出现在这里。")).toBeInTheDocument();
  });

  it("展示错误状态并支持重试", () => {
    const onRetry = vi.fn();

    render(
      <DataStateView state={{ status: "error", message: "读取失败" }} emptyTitle="暂无数据" onRetry={onRetry}>
        {() => <p>成功内容</p>}
      </DataStateView>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("读取失败");
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("展示成功内容", () => {
    render(
      <DataStateView state={{ status: "success", data: ["选题一"] }} emptyTitle="暂无数据">
        {(items) => <p>{items[0]}</p>}
      </DataStateView>
    );

    expect(screen.getByText("选题一")).toBeInTheDocument();
  });
});
