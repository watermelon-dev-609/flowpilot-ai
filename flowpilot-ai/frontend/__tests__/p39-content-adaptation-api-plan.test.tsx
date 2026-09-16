import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ContentAdaptationPage from "../app/content-adaptation/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("Content adaptation API plan handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/content-adaptation?plan=api-product-plan");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("loads a linked content calendar API plan into the adaptation form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes("/api/content-calendar/plans")) {
          return response({
            data_mode: "manual",
            total: 1,
            page: 1,
            page_size: 50,
            plans: [
              {
                id: "api-product-plan",
                topic_title: "智能沙盘展厅负责人选型指南",
                platform: "知乎",
                brand_name: "武汉微艺达",
                product_name: "智能沙盘",
                region: "武汉",
                target_audience: "展厅负责人",
                facts: "产品中心事实依据：已有展厅案例\n产品目标页面：https://example.com/sandbox\n目标客户：展厅负责人",
                overall_score: 94,
                status: "待适配",
                created_at: "2026-09-16T10:00:00.000Z",
                scheduled_at: "2026-09-20T10:00:00.000Z",
                owner: "内容运营",
                priority: "高",
                content_stage: "待生产",
                data_mode: "manual",
                audit_log: []
              }
            ]
          });
        }

        return response({ detail: "not found" }, 404);
      })
    );

    render(<ContentAdaptationPage />);

    expect(await screen.findByText("已从内容日历 API 带入计划")).toBeInTheDocument();
    expect(screen.getByLabelText("品牌名称")).toHaveValue("武汉微艺达");
    expect(screen.getByLabelText("产品名称")).toHaveValue("智能沙盘");
    expect(screen.getByLabelText("目标地域")).toHaveValue("武汉");
    expect(screen.getByLabelText("选题标题")).toHaveValue("智能沙盘展厅负责人选型指南");
    expect(screen.getByLabelText("目标受众")).toHaveValue("展厅负责人");
    expect((screen.getByLabelText("可确认事实") as HTMLTextAreaElement).value).toContain("产品目标页面：https://example.com/sandbox");
  });
});
