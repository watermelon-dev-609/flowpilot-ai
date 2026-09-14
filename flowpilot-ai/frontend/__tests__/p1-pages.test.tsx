import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RulesPage from "../app/rules/page";
import GeoMonitorPage from "../app/geo-monitor/page";
import RulesLoading from "../app/rules/loading";
import GeoMonitorLoading from "../app/geo-monitor/loading";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function installFetchMock() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/rules/ai-channels")) {
        return response({ channel_type: "ai", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
      }
      if (url.includes("/api/rules/publishing-channels")) {
        return response({ channel_type: "publishing", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
      }
      if (url.includes("/api/rule-source-reviews")) return response({ data_mode: "mock", reviews: [] });
      if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mock", reminders: [] });
      if (url.includes("/api/geo-monitor/sessions")) return response({ data_mode: "mock", evidence_levels: {}, sessions: [] });
      if (url.includes("/api/geo-monitor/records")) return response({ data_mode: "mock", records: [] });
      return response({ detail: "not found" }, 404);
    })
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("独立页面", () => {
  it("渲染规则中心中文页面", async () => {
    installFetchMock();
    render(<RulesPage />);
    expect(await screen.findByRole("heading", { name: "规则中心" })).toBeInTheDocument();
    expect(screen.getByText("已连接后端接口")).toBeInTheDocument();
    expect(screen.getByText("示例数据不会进入真实策略统计")).toBeInTheDocument();
  });

  it("渲染生成式监测总览中文页面", async () => {
    installFetchMock();
    render(<GeoMonitorPage />);
    expect(await screen.findByRole("heading", { name: "生成式监测总览工作台" })).toBeInTheDocument();
    expect(screen.getByText("暂无生成式监测数据")).toBeInTheDocument();
  });

  it("渲染加载状态", () => {
    render(<RulesLoading />);
    expect(screen.getByText("规则中心加载中")).toBeInTheDocument();
    render(<GeoMonitorLoading />);
    expect(screen.getByText("监测数据加载中")).toBeInTheDocument();
  });
});
