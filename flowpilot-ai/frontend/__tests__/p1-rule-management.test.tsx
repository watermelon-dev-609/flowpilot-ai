import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RulesPage from "../app/rules/page";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const existingRule = {
  rule_id: "existing-rule",
  channel_type: "ai",
  channel_id: "deepseek",
  channel_name: "DeepSeek",
  rule_title: "已有规则",
  rule_summary: "用于让规则中心进入已加载状态，从而展示新增规则表单。",
  source_type: "manual_verified",
  source_url: "https://example.com/deepseek",
  updated_at: "2026-09-10",
  version: "1.0.0",
  confidence: 0.8,
  review_status: "待确认",
  effective_status: "草稿",
  data_mode: "manual"
};

function installFetchMock() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/rules") && init?.method === "POST") {
      const payload = JSON.parse(String(init.body));
      return response({ ...payload, rule_id: "created-rule", review_status: "待确认", effective_status: "草稿", audit_log: [] });
    }
    if (url.includes("/api/rules/ai-channels")) {
      return response({
        channel_type: "ai",
        data_mode: "mock",
        source_policy: "official_first_manual_confirmed",
        rules: [existingRule]
      });
    }
    if (url.includes("/api/rules/publishing-channels")) {
      return response({ channel_type: "publishing", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
    }
    if (url.includes("/api/rule-source-reviews")) return response({ data_mode: "mock", reviews: [] });
    if (url.includes("/api/rules/update-reminders")) return response({ data_mode: "mock", reminders: [] });
    return response({ detail: "not found" }, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("规则管理页面", () => {
  it("可以选择模型平台并创建规则", async () => {
    const fetchMock = installFetchMock();
    render(<RulesPage />);

    expect(await screen.findByLabelText("选择模型平台")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("规则标题"), { target: { value: "模型平台新规则" } });
    fireEvent.change(screen.getByLabelText("规则摘要"), { target: { value: "用于测试的新规则。" } });
    fireEvent.click(screen.getByRole("button", { name: "新增规则" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/rules"), expect.objectContaining({ method: "POST" })));
  });
});
