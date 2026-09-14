import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RulesPage from "../app/rules/page";

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function createRule() {
  return {
    rule_id: "rule-p2-2",
    channel_type: "publishing",
    channel_id: "zhihu",
    channel_name: "知乎",
    rule_title: "知乎 GEO 来源规则",
    rule_summary: "旧规则：知乎内容需要问题导向。",
    source_type: "manual_verified",
    source_url: "",
    updated_at: "2026-09-10",
    version: "0.1.0",
    confidence: 0.7,
    review_status: "待确认",
    effective_status: "草稿",
    data_mode: "manual",
    audit_log: [{ action: "created", actor: "seed", summary: "seed", at: "2026-09-10T08:00:00" }]
  };
}

function createReview(overrides: Record<string, unknown> = {}) {
  return {
    review_id: "source-review-p2-2",
    rule_id: "rule-p2-2",
    channel_type: "publishing",
    channel_id: "zhihu",
    channel_name: "知乎",
    rule_title: "知乎 GEO 来源规则",
    old_rule_summary: "旧规则：知乎内容需要问题导向。",
    old_source_url: "",
    old_confidence: 0.7,
    old_version: "0.1.0",
    proposed_rule_summary: "新规则候选：知乎内容需要先给结论。",
    proposed_source_url: "not-a-valid-url",
    proposed_confidence: 0.86,
    change_note: "验证 URL 检查。",
    status: "待复核",
    created_at: "2026-09-10T09:00:00",
    reviewed_at: "",
    actor: "frontend-user",
    reviewer: "",
    decision_note: "",
    ...overrides
  };
}

function installP2_2FetchMock({ failUrlCheck = false } = {}) {
  const rules = [createRule()];
  const pendingReview = createReview();
  const acceptedReview = createReview({
    review_id: "source-review-accepted",
    status: "已采用",
    proposed_rule_summary: "已采用候选：知乎内容需要增加来源说明。"
  });

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/api/rules/ai-channels")) {
      return response({ channel_type: "ai", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
    }

    if (url.includes("/api/rules/publishing-channels")) {
      return response({ channel_type: "publishing", data_mode: "mixed", source_policy: "official_first_manual_confirmed", rules });
    }

    if (url.includes("/api/rules/update-reminders")) {
      return response({
        data_mode: "mixed",
        reminders: [
          {
            rule_id: "rule-p2-2",
            channel_type: "publishing",
            channel_id: "zhihu",
            channel_name: "知乎",
            rule_title: "知乎 GEO 来源规则",
            reasons: ["缺少来源 URL", "存在待复核候选"],
            severity: "high",
            updated_at: "2026-09-10",
            data_mode: "manual"
          }
        ]
      });
    }

    if (url.includes("/api/rule-source-reviews/source-review-p2-2/source-url-check") && method === "POST") {
      if (failUrlCheck) {
        return response({ detail: "候选来源链接检查失败" }, 503);
      }

      return response({
        ...pendingReview,
        source_url_check_status: "invalid",
        source_url_checked_at: "2026-09-10T10:00:00",
        source_url_status_code: 0,
        source_url_check_error: "URL 必须以 http 或 https 开头，并包含域名"
      });
    }

    if (url.includes("/api/rule-source-reviews") && method === "GET") {
      if (url.includes("status=%E5%B7%B2%E9%87%87%E7%94%A8")) {
        return response({ data_mode: "mixed", reviews: [acceptedReview] });
      }
      return response({ data_mode: "mixed", reviews: [pendingReview, acceptedReview] });
    }

    return response({ detail: "not found" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("P2.2 rule review operations", () => {
  it("shows rule update reminders from the backend", async () => {
    installP2_2FetchMock();

    render(<RulesPage />);

    expect(await screen.findByText("规则更新提醒")).toBeInTheDocument();
    expect(screen.getByText(/缺少来源 URL/)).toBeInTheDocument();
    expect(screen.getByText(/存在待复核候选/)).toBeInTheDocument();
  });

  it("filters source review queue by status through the API", async () => {
    const fetchMock = installP2_2FetchMock();

    render(<RulesPage />);

    expect(await screen.findByLabelText("来源复核队列状态筛选")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "已采用" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/rule-source-reviews?status=%E5%B7%B2%E9%87%87%E7%94%A8"));
    });
    expect(await screen.findByText("已采用候选：知乎内容需要增加来源说明。")).toBeInTheDocument();
  });

  it("checks candidate source URL and displays invalid result", async () => {
    installP2_2FetchMock();

    render(<RulesPage />);

    expect((await screen.findAllByText("知乎 GEO 来源规则")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "检查候选来源链接 知乎 GEO 来源规则" })[0]);

    expect(await screen.findByText("来源检查：无效")).toBeInTheDocument();
    expect(screen.getByText("URL 必须以 http 或 https 开头，并包含域名")).toBeInTheDocument();
  });

  it("shows real API error when source URL check fails", async () => {
    installP2_2FetchMock({ failUrlCheck: true });

    render(<RulesPage />);

    expect((await screen.findAllByText("知乎 GEO 来源规则")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "检查候选来源链接 知乎 GEO 来源规则" })[0]);

    expect(await screen.findByText("候选来源链接检查失败")).toBeInTheDocument();
  });
});
