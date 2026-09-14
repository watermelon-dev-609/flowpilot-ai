import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RulesPage from "../app/rules/page";

type TestRule = {
  rule_id: string;
  channel_type: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url: string;
  updated_at: string;
  version: string;
  confidence: number;
  review_status: string;
  effective_status: string;
  data_mode: "manual" | "real" | "mock";
  audit_log: Array<{ action: string; actor: string; summary: string; at: string }>;
};

type TestReview = {
  review_id: string;
  rule_id: string;
  channel_type: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  old_rule_summary: string;
  old_source_url: string;
  old_confidence: number;
  old_version: string;
  proposed_rule_summary: string;
  proposed_source_url: string;
  proposed_confidence: number;
  change_note: string;
  status: string;
  created_at: string;
  reviewed_at: string;
  actor: string;
  reviewer: string;
  decision_note: string;
};

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}

function createRule(overrides: Partial<TestRule> = {}): TestRule {
  return {
    rule_id: "rule-p2-1",
    channel_type: "publishing",
    channel_id: "zhihu",
    channel_name: "知乎",
    rule_title: "知乎 GEO 来源规则",
    rule_summary: "旧规则：知乎内容需要问题导向和案例支撑。",
    source_type: "manual_verified",
    source_url: "https://example.com/old-rule",
    updated_at: "2026-09-10",
    version: "0.1.0",
    confidence: 0.7,
    review_status: "待确认",
    effective_status: "草稿",
    data_mode: "manual",
    audit_log: [{ action: "created", actor: "seed", summary: "seed", at: "2026-09-10T08:00:00" }],
    ...overrides
  };
}

function createReview(overrides: Partial<TestReview> = {}): TestReview {
  return {
    review_id: "source-review-p2-1",
    rule_id: "rule-p2-1",
    channel_type: "publishing",
    channel_id: "zhihu",
    channel_name: "知乎",
    rule_title: "知乎 GEO 来源规则",
    old_rule_summary: "旧规则：知乎内容需要问题导向和案例支撑。",
    old_source_url: "https://example.com/old-rule",
    old_confidence: 0.7,
    old_version: "0.1.0",
    proposed_rule_summary: "新规则候选：知乎内容需要明确回答问题，并降低硬广表达。",
    proposed_source_url: "https://example.com/new-rule",
    proposed_confidence: 0.86,
    change_note: "根据人工复核来源更新。",
    status: "待复核",
    created_at: "2026-09-10T09:00:00",
    reviewed_at: "",
    actor: "frontend-user",
    reviewer: "",
    decision_note: "",
    ...overrides
  };
}

function installSourceReviewFetchMock({ failCreate = false } = {}) {
  const rules = [createRule()];
  const reviews = [createReview()];

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";

    if (url.includes("/api/rules/ai-channels")) {
      return response({ channel_type: "ai", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] });
    }

    if (url.includes("/api/rules/publishing-channels")) {
      return response({
        channel_type: "publishing",
        data_mode: "mock",
        source_policy: "official_first_manual_confirmed",
        rules
      });
    }

    if (url.includes("/api/rule-source-reviews") && method === "GET") {
      return response({ data_mode: "mixed", reviews });
    }

    if (url.includes("/source-review-proposals") && method === "POST" && !url.includes("/accept") && !url.includes("/ignore")) {
      if (failCreate) {
        return response({ detail: "候选来源 URL 无法验证" }, 400);
      }
      const payload = JSON.parse(String(init?.body));
      const created = createReview({
        review_id: "source-review-created",
        proposed_rule_summary: payload.proposed_rule_summary,
        proposed_source_url: payload.proposed_source_url,
        proposed_confidence: payload.proposed_confidence,
        change_note: payload.change_note
      });
      reviews.unshift(created);
      return response(created, 201);
    }

    if (url.includes("/accept") && method === "POST") {
      reviews[0] = { ...reviews[0], status: "已采用", reviewed_at: "2026-09-10T10:00:00", decision_note: "采用新规则。" };
      rules[0] = {
        ...rules[0],
        rule_summary: reviews[0].proposed_rule_summary,
        source_url: reviews[0].proposed_source_url,
        confidence: reviews[0].proposed_confidence,
        version: "0.1.1",
        audit_log: [...rules[0].audit_log, { action: "source_review_accepted", actor: "frontend-user", summary: "accepted", at: "2026-09-10T10:00:00" }]
      };
      return response(rules[0]);
    }

    if (url.includes("/ignore") && method === "POST") {
      reviews[0] = { ...reviews[0], status: "已忽略", reviewed_at: "2026-09-10T10:00:00", decision_note: "忽略候选。" };
      rules[0] = {
        ...rules[0],
        audit_log: [...rules[0].audit_log, { action: "source_review_ignored", actor: "frontend-user", summary: "ignored", at: "2026-09-10T10:00:00" }]
      };
      return response(rules[0]);
    }

    return response({ detail: "not found" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("P2.1 rule source review queue", () => {
  it("shows the source review queue with old and proposed rule comparison", async () => {
    installSourceReviewFetchMock();

    render(<RulesPage />);

    expect(await screen.findByText("规则来源复核队列")).toBeInTheDocument();
    expect(screen.getByText("旧规则")).toBeInTheDocument();
    expect(screen.getByText("新规则候选")).toBeInTheDocument();
    expect(screen.getAllByText("旧规则：知乎内容需要问题导向和案例支撑。").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("新规则候选：知乎内容需要明确回答问题，并降低硬广表达。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "采用新规则 知乎 GEO 来源规则" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "忽略候选 知乎 GEO 来源规则" })).toBeInTheDocument();
  });

  it("creates a source review proposal from the rule center", async () => {
    const fetchMock = installSourceReviewFetchMock();

    render(<RulesPage />);

    expect(await screen.findByText("规则来源复核队列")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("选择待复核规则"), { target: { value: "rule-p2-1" } });
    fireEvent.change(screen.getByLabelText("新规则候选摘要"), { target: { value: "新规则候选：知乎回答需要先给直接结论。" } });
    fireEvent.change(screen.getByLabelText("新来源链接"), { target: { value: "https://example.com/newer-rule" } });
    fireEvent.change(screen.getByLabelText("候选置信度"), { target: { value: "0.9" } });
    fireEvent.change(screen.getByLabelText("变更说明"), { target: { value: "补充直接回答要求。" } });
    fireEvent.click(screen.getByRole("button", { name: "保存新规则候选" }));

    expect(await screen.findByText("新规则候选：知乎回答需要先给直接结论。")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/rules/rule-p2-1/source-review-proposals"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("accepts source review proposals without fabricating success", async () => {
    installSourceReviewFetchMock();

    render(<RulesPage />);

    expect(await screen.findByText("规则来源复核队列")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "采用新规则 知乎 GEO 来源规则" }));
    expect(await screen.findByText("source_review_accepted")).toBeInTheDocument();
  });

  it("ignores source review proposals without changing the rule summary", async () => {
    installSourceReviewFetchMock();

    render(<RulesPage />);

    expect(await screen.findByText("规则来源复核队列")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "忽略候选 知乎 GEO 来源规则" }));
    expect(await screen.findByText("source_review_ignored")).toBeInTheDocument();
    expect(screen.getAllByText("旧规则：知乎内容需要问题导向和案例支撑。").length).toBeGreaterThanOrEqual(1);
  });

  it("shows the real API error when creating a proposal fails", async () => {
    installSourceReviewFetchMock({ failCreate: true });

    render(<RulesPage />);

    expect(await screen.findByText("规则来源复核队列")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("新规则候选摘要"), { target: { value: "新规则候选：测试失败提示。" } });
    fireEvent.change(screen.getByLabelText("新来源链接"), { target: { value: "https://example.com/error" } });
    fireEvent.click(screen.getByRole("button", { name: "保存新规则候选" }));

    expect(await screen.findByText("候选来源 URL 无法验证")).toBeInTheDocument();
  });
});
