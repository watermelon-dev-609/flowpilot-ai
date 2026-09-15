import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GeoMonitorRecordsPage from "../app/geo-monitor/records/page";
import GeoMonitorSessionsPage from "../app/geo-monitor/sessions/page";

const evidenceLevels = {
  "0": "未出现",
  "1": "出现相关概念",
  "2": "品牌被提及",
  "3": "页面被检索到",
  "4": "页面作为来源被引用"
};

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function installGeoMonitorFetchMock() {
  const sessions: any[] = [];
  const records: any[] = [];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/api/geo-monitor/sessions") && method === "GET") {
      return response({ data_mode: "mock", evidence_levels: evidenceLevels, sessions });
    }

    if (url.includes("/api/geo-monitor/records") && method === "GET") {
      return response({ data_mode: "mock", records });
    }

    if (url.includes("/api/geo-monitor/sessions") && method === "POST") {
      const payload = JSON.parse(String(init?.body));
      const created = {
        ...payload,
        session_id: "session-created",
        created_at: "2026-09-10 10:00:00",
        total_records: 0,
        highest_evidence_level: 0,
        audit_log: [{ action: "created", actor: "frontend-user", summary: "created", at: "2026-09-10T10:00:00" }]
      };
      sessions.push(created);
      return response(created, 201);
    }

    if (url.includes("/api/geo-monitor/records") && method === "POST") {
      const payload = JSON.parse(String(init?.body));
      const created = {
        ...payload,
        record_id: "record-created",
        checked_at: "2026-09-10 10:05:00",
        evidence_level: 4,
        evidence_label: "页面作为来源被引用",
        audit_log: [{ action: "created", actor: "frontend-user", summary: "created", at: "2026-09-10T10:05:00" }]
      };
      records.push(created);
      return response(created, 201);
    }

    return response({ detail: "not found" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  window.history.replaceState({}, "", "/geo-monitor/records");
});

describe("P2.0 GEO monitor entry UI", () => {
  it("prefills monitor record leads from publish workflow links", async () => {
    const fetchMock = installGeoMonitorFetchMock();

    window.history.replaceState(
      {},
      "",
      "/geo-monitor/records?query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox"
    );

    render(<GeoMonitorRecordsPage />);

    expect(await screen.findByDisplayValue("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("已从发布记录带入监测线索")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/articles/wuhan-sandbox")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("creates a monitor session from published record leads", async () => {
    const fetchMock = installGeoMonitorFetchMock();

    window.history.replaceState(
      {},
      "",
      "/geo-monitor/records?query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox"
    );

    render(<GeoMonitorRecordsPage />);

    fireEvent.click(await screen.findByRole("button", { name: "用发布链接创建监测任务" }));

    await waitFor(() => expect(screen.getByLabelText("选择监测任务")).toHaveValue("session-created"));

    const sessionPostCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes("/api/geo-monitor/sessions") && init?.method === "POST"
    );
    const payload = JSON.parse(String(sessionPostCall?.[1]?.body));
    expect(payload).toMatchObject({
      name: "发布链接监测：武汉智能沙盘厂家怎么选？",
      target_url: "https://example.com/articles/wuhan-sandbox",
      target_brand: "武汉微艺达智能科技有限公司",
      data_mode: "manual"
    });
  });

  it("creates a manual monitor session and records real evidence without fabricating citation", async () => {
    const fetchMock = installGeoMonitorFetchMock();

    const sessionsView = render(<GeoMonitorSessionsPage />);

    expect(await screen.findByText("暂无生成式监测数据")).toBeInTheDocument();
    expect(screen.getByLabelText("监测任务名称")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("监测任务名称"), { target: { value: "武汉微艺达真实监测" } });
    fireEvent.change(screen.getByLabelText("目标品牌"), { target: { value: "武汉微艺达智能科技有限公司" } });
    fireEvent.change(screen.getByLabelText("目标页面链接"), { target: { value: "https://example.com/wuhan-sandtable" } });
    fireEvent.click(screen.getByRole("button", { name: "创建监测任务" }));

    expect((await screen.findAllByText("武汉微艺达真实监测")).length).toBeGreaterThanOrEqual(1);
    sessionsView.unmount();

    render(<GeoMonitorRecordsPage />);

    expect(screen.getByLabelText("选择监测任务")).toBeInTheDocument();

    fireEvent.change(await screen.findByLabelText("选择监测任务"), { target: { value: "session-created" } });
    fireEvent.change(screen.getByLabelText("查询问题"), { target: { value: "武汉智能沙盘厂家有哪些？" } });
    fireEvent.change(screen.getByLabelText("模型平台"), { target: { value: "deepseek" } });
    fireEvent.click(screen.getByLabelText("相关概念出现"));
    fireEvent.click(screen.getByLabelText("品牌被提及"));
    fireEvent.click(screen.getByLabelText("页面被检索"));
    fireEvent.click(screen.getByLabelText("来源被引用"));
    fireEvent.change(screen.getByLabelText("原始模型响应"), {
      target: { value: "真实人工录入：回答出现武汉微艺达，并引用了目标 URL。" }
    });
    fireEvent.change(screen.getByLabelText("响应摘要"), {
      target: { value: "品牌、页面和来源引用都需要人工复核。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "录入监测记录" }));

    expect(await screen.findByText("页面作为来源被引用")).toBeInTheDocument();

    const recordPostCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url).includes("/api/geo-monitor/records") && init?.method === "POST"
    );
    const payload = JSON.parse(String(recordPostCall?.[1]?.body));
    expect(payload).toMatchObject({
      data_mode: "manual",
      raw_response: "真实人工录入：回答出现武汉微艺达，并引用了目标 URL。",
      source_cited: true
    });
  });
});
