import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GeoMonitorRecordsPage from "../app/geo-monitor/records/page";

const evidenceLevels = {
  "0": "未出现",
  "1": "出现相关概念",
  "2": "品牌被提及",
  "3": "页面被检索到",
  "4": "页面作为来源被引用"
};

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GEO monitor product lead", () => {
  it("shows the product carried from publish queue monitor links", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/geo-monitor/records") && init?.method === "POST") {
        const payload = JSON.parse(String(init.body));
        return response(
          {
            ...payload,
            record_id: "geo-record-product",
            checked_at: "2026-09-16 11:20:00",
            evidence_level: 2,
            evidence_label: "品牌被提及",
            review_status_code: "pending",
            review_note: "",
            reviewed_at: "",
            evidence_attachments: [],
            audit_log: [],
          },
          201
        );
      }

      if (url.includes("/api/geo-monitor/sessions")) {
        return response({
          data_mode: "manual",
          evidence_levels: evidenceLevels,
          sessions: [
            {
              session_id: "geo-product-session",
              name: "发布后监测：智能沙盘展厅负责人选型指南",
              target_brand: "武汉微艺达",
              target_url: "https://example.com/articles/sandbox",
              created_at: "2026-09-16 11:05:00",
              data_mode: "manual",
              total_records: 0,
              highest_evidence_level: 0
            }
          ]
        });
      }

      if (url.includes("/api/geo-monitor/records")) {
        return response({ data_mode: "manual", records: [] });
      }

      if (url.includes("/api/geo-monitor/report-snapshots")) {
        return response({ data_mode: "manual", snapshots: [] });
      }

      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    window.history.replaceState(
      {},
      "",
      "/geo-monitor/records?session=geo-product-session&query=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA%E9%80%89%E5%9E%8B%E6%8C%87%E5%8D%97&url=https%3A%2F%2Fexample.com%2Farticles%2Fsandbox&product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&plan=api-product-plan"
    );

    render(<GeoMonitorRecordsPage />);

    expect(await screen.findByText("已从发布记录带入监测线索")).toBeInTheDocument();
    expect(screen.getByText("产品：智能沙盘")).toBeInTheDocument();
    expect(screen.getByDisplayValue("智能沙盘展厅负责人选型指南")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/articles/sandbox")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("原始模型响应"), {
      target: { value: "人工录入模型回答，提到了武汉微艺达智能沙盘。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "录入监测记录" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input, init]) => String(input).includes("/api/geo-monitor/records") && init?.method === "POST")
      ).toBe(true)
    );

    const postCall = fetchMock.mock.calls.find(
      ([input, init]) => String(input).includes("/api/geo-monitor/records") && init?.method === "POST"
    );
    expect(JSON.parse(String(postCall?.[1]?.body || "{}"))).toMatchObject({ product_name: "智能沙盘" });
    expect(await screen.findByRole("link", { name: "查看聚焦报告" })).toHaveAttribute(
      "href",
      "/geo-monitor/report?session=geo-product-session&query=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%B1%95%E5%8E%85%E8%B4%9F%E8%B4%A3%E4%BA%BA%E9%80%89%E5%9E%8B%E6%8C%87%E5%8D%97&url=https%3A%2F%2Fexample.com%2Farticles%2Fsandbox&product=%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98&plan=api-product-plan"
    );
  });
});
