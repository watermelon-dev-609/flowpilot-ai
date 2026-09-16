import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PublishQueuePage from "../app/publish-queue/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Publish queue to GEO monitor product context", () => {
  it("uses queued brand and product when creating a monitor task", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/publish-queue/items") && !init) {
        return response({
          data_mode: "manual",
          total: 1,
          items: [
            {
              id: "api-product-published",
              version_id: "api-product-version",
              topic_title: "智能沙盘展厅负责人选型指南",
              source_topic_title: "智能沙盘展厅负责人选型指南",
              brand_name: "武汉微艺达",
              product_name: "智能沙盘",
              target_audience: "展厅负责人",
              target_url: "https://example.com/sandbox",
              facts: "产品中心事实依据：已有展厅案例",
              platform_count: 1,
              platform_drafts: [],
              status: "published",
              queued_at: "2026-09-16T10:00:00Z",
              actual_publish_at: "2026-09-16T11:00",
              published_url: "https://example.com/articles/sandbox"
            }
          ]
        });
      }

      if (url.includes("/api/publish-queue/items/api-product-published/monitor-session") && init?.method === "POST") {
        return response(
          {
            item: {
              id: "api-product-published",
              version_id: "api-product-version",
              topic_title: "智能沙盘展厅负责人选型指南",
              source_topic_title: "智能沙盘展厅负责人选型指南",
              brand_name: "武汉微艺达",
              product_name: "智能沙盘",
              target_audience: "展厅负责人",
              target_url: "https://example.com/sandbox",
              facts: "产品中心事实依据：已有展厅案例",
              platform_count: 1,
              platform_drafts: [],
              status: "published",
              queued_at: "2026-09-16T10:00:00Z",
              actual_publish_at: "2026-09-16T11:00",
              published_url: "https://example.com/articles/sandbox",
              monitor_session_id: "geo-product-session"
            },
            session: {
              session_id: "geo-product-session",
              name: "发布后监测：智能沙盘展厅负责人选型指南",
              target_brand: "武汉微艺达",
              target_url: "https://example.com/articles/sandbox",
              created_at: "2026-09-16 11:05:00",
              data_mode: "manual",
              total_records: 0,
              highest_evidence_level: 0
            }
          },
          201
        );
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PublishQueuePage />);

    expect(await screen.findByText("智能沙盘展厅负责人选型指南")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "创建监测任务" }));

    expect(await screen.findByText("已创建监测任务")).toBeInTheDocument();
    const postCall = fetchMock.mock.calls.find(([input, init]) => String(input).includes("/monitor-session") && init?.method === "POST");
    expect(JSON.parse(String(postCall?.[1]?.body || "{}"))).toMatchObject({ target_brand: "武汉微艺达" });
    expect(within(screen.getByRole("status")).getByRole("link", { name: "录入监测记录" })).toHaveAttribute(
      "href",
      "/geo-monitor/records?session=geo-product-session&query=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA%E9%80%89%E5%9E%8B%E6%8C%87%E5%8D%97&url=https%3A%2F%2Fexample.com%2Farticles%2Fsandbox&product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98"
    );
  });
});
