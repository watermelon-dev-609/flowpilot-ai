import { describe, expect, it } from "vitest";
import { ApiErrorCode, createApiError, createApiSuccess, createPaginatedResponse } from "../lib/api-contract";

describe("P24 API 响应契约", () => {
  it("构造统一成功响应", () => {
    const response = createApiSuccess({
      data: { id: "topic-1", title: "武汉智能沙盘厂家推荐文章怎么写？" },
      traceId: "trace-001"
    });

    expect(response).toEqual({
      ok: true,
      code: "OK",
      msg: "请求成功",
      data: { id: "topic-1", title: "武汉智能沙盘厂家推荐文章怎么写？" },
      traceId: "trace-001"
    });
  });

  it("构造统一失败响应并保留字段级错误", () => {
    const response = createApiError({
      code: ApiErrorCode.ValidationError,
      msg: "选题标题不能为空",
      traceId: "trace-002",
      details: [{ field: "topicTitle", message: "请填写选题标题" }]
    });

    expect(response).toEqual({
      ok: false,
      code: "VALIDATION_ERROR",
      msg: "选题标题不能为空",
      data: null,
      traceId: "trace-002",
      details: [{ field: "topicTitle", message: "请填写选题标题" }]
    });
  });

  it("构造分页响应并规整分页边界", () => {
    const response = createPaginatedResponse({
      items: ["选题一", "选题二"],
      page: 0,
      pageSize: 0,
      total: 23,
      traceId: "trace-003"
    });

    expect(response.ok).toBe(true);
    expect(response.data).toEqual({
      items: ["选题一", "选题二"],
      page: 1,
      pageSize: 10,
      total: 23,
      totalPages: 3
    });
  });
});
