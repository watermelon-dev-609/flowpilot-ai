import { describe, expect, it } from "vitest";
import { createEmptyState, createErrorState, createLoadingState, createSuccessState, resolveAsyncState } from "../lib/async-data-state";

describe("P26 异步数据状态模型", () => {
  it("构造加载状态", () => {
    expect(createLoadingState()).toEqual({ status: "loading" });
  });

  it("根据空数组构造空状态", () => {
    expect(createSuccessState([])).toEqual({ status: "empty", data: [] });
  });

  it("根据非空数据构造成功状态", () => {
    expect(createSuccessState(["选题一"])).toEqual({ status: "success", data: ["选题一"] });
  });

  it("构造错误状态时保留可展示错误信息", () => {
    expect(createErrorState(new Error("读取选题池失败"))).toEqual({ status: "error", message: "读取选题池失败" });
    expect(createErrorState("网络异常")).toEqual({ status: "error", message: "网络异常" });
  });

  it("允许显式构造空状态", () => {
    expect(createEmptyState()).toEqual({ status: "empty", data: [] });
  });

  it("统一包装异步数据读取结果", async () => {
    await expect(resolveAsyncState(async () => ["选题一"])).resolves.toEqual({ status: "success", data: ["选题一"] });
    await expect(resolveAsyncState(async () => [])).resolves.toEqual({ status: "empty", data: [] });
    await expect(
      resolveAsyncState(async () => {
        throw new Error("接口暂不可用");
      })
    ).resolves.toEqual({ status: "error", message: "接口暂不可用" });
  });
});
