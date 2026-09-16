import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ContentCalendarPage from "../app/content-calendar/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Content calendar product context", () => {
  it("shows product source context from GEO research plans", async () => {
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
                id: "plan-product-context-1",
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

    render(<ContentCalendarPage />);

    expect(await screen.findByText("智能沙盘展厅负责人选型指南")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "产品资料 智能沙盘" })).toBeInTheDocument();
    expect(screen.getByText("目标客户：展厅负责人")).toBeInTheDocument();
    expect(screen.getByText("事实依据：已有展厅案例")).toBeInTheDocument();
    expect(screen.getByText("目标页面：https://example.com/sandbox")).toBeInTheDocument();
  });
});
