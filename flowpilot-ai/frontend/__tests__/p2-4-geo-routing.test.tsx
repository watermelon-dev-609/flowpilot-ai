import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GeoMonitorPage from "../app/geo-monitor/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/geo-monitor/sessions")) {
        return response({ data_mode: "mock", evidence_levels: { "0": "未出现", "1": "出现相关概念", "2": "品牌被提及", "3": "页面被检索到", "4": "页面作为来源被引用" }, sessions: [] });
      }
      if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mock", records: [] });
      return response({ detail: "not found" }, 404);
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("监测模块路由", () => {
  it("总览页提供拆分后的子模块入口", async () => {
    installFetchMock();
    render(<GeoMonitorPage />);
    expect(await screen.findByRole("heading", { name: "生成式监测总览工作台" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /监测任务管理/ })).toHaveAttribute("href", "/geo-monitor/sessions");
    expect(screen.getByRole("link", { name: /监测记录库/ })).toHaveAttribute("href", "/geo-monitor/records");
    expect(screen.getByRole("link", { name: /证据复核中心/ })).toHaveAttribute("href", "/geo-monitor/review");
    expect(screen.getByRole("link", { name: /生成式监测数据报表/ })).toHaveAttribute("href", "/geo-monitor/report");
  });

  it("子页面标题保持独立", async () => {
    installFetchMock();
    const { default: SessionsPage } = await import("../app/geo-monitor/sessions/page");
    const { default: RecordsPage } = await import("../app/geo-monitor/records/page");
    const { default: ReviewPage } = await import("../app/geo-monitor/review/page");
    const { default: ReportPage } = await import("../app/geo-monitor/report/page");
    for (const [Page, heading] of [[SessionsPage, "监测任务管理"], [RecordsPage, "监测记录库"], [ReviewPage, "证据复核中心"], [ReportPage, "生成式监测数据报表"]] as const) {
      const view = render(<Page />);
      expect(await screen.findByRole("heading", { name: heading })).toBeInTheDocument();
      view.unmount();
    }
  });
});
