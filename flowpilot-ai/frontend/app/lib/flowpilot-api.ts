export type ChannelRule = {
  rule_id: string;
  channel_type?: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url?: string;
  updated_at: string;
  version: string;
  confidence: number;
  review_status: string;
  effective_status: string;
  data_mode?: "mock" | "demo" | "manual" | "real";
  latest_source_checked_at?: string;
  source_check_status?: string;
  source_check_summary?: string;
  audit_log?: Array<{
    action: string;
    actor: string;
    summary: string;
    at: string;
  }>;
};

export type RulesResponse = {
  channel_type: "ai" | "publishing";
  data_mode: "mock" | "demo" | "manual" | "real";
  source_policy: string;
  rules: ChannelRule[];
};

export type RulesSnapshot = {
  ai: RulesResponse;
  publishing: RulesResponse;
};

export type RuleSourceReviewTask = {
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
  source_url_check_status?: "unchecked" | "reachable" | "unreachable" | "invalid";
  source_url_checked_at?: string;
  source_url_status_code?: number;
  source_url_check_error?: string;
};

export type RuleSourceReviewsResponse = {
  data_mode: "mixed";
  reviews: RuleSourceReviewTask[];
};

export type RuleSourceReviewProposalPayload = {
  proposed_rule_summary: string;
  proposed_source_url: string;
  proposed_confidence: number;
  change_note: string;
  actor: string;
};

export type RuleUpdateReminder = {
  rule_id: string;
  channel_type: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  reasons: string[];
  severity: "high" | "medium" | "low" | string;
  updated_at: string;
  data_mode?: "mock" | "demo" | "manual" | "real";
};

export type RuleUpdateRemindersResponse = {
  data_mode: "mixed";
  reminders: RuleUpdateReminder[];
};

export type GeoMonitorSession = {
  session_id: string;
  name: string;
  target_brand: string;
  target_url: string;
  created_at: string;
  data_mode: "mock" | "demo" | "manual" | "real";
  mock_notice?: string;
  total_records: number;
  highest_evidence_level: number;
};

export type GeoMonitorRecord = {
  record_id: string;
  session_id: string;
  query: string;
  ai_channel: string;
  target_brand: string;
  target_url: string;
  checked_at: string;
  evidence_level: number;
  evidence_label: string;
  related_concept_found: boolean;
  brand_mentioned: boolean;
  page_retrieved: boolean;
  source_cited: boolean;
  raw_response: string;
  response_summary: string;
  review_status_code?: "pending" | "verified" | "rejected" | "needs_evidence";
  manual_review_status: string;
  reviewer: string;
  review_note?: string;
  reviewed_at?: string;
  evidence_attachments?: Array<{
    attachment_id: string;
    attachment_type: "source_url" | "screenshot_url" | "raw_response_excerpt" | "manual_note";
    title: string;
    url: string;
    note: string;
    created_at: string;
    actor: string;
  }>;
  audit_log?: Array<{
    action: string;
    actor: string;
    summary: string;
    at: string;
  }>;
  data_mode: "mock" | "demo" | "manual" | "real";
};

export type GeoMonitorSessionsResponse = {
  data_mode: "mock" | "demo" | "manual" | "real";
  evidence_levels: Record<string, string>;
  sessions: GeoMonitorSession[];
};

export type GeoMonitorRecordsResponse = {
  data_mode: "mock" | "demo" | "manual" | "real";
  records: GeoMonitorRecord[];
};

export type GeoMonitorSnapshot = {
  sessions: GeoMonitorSessionsResponse;
  records: GeoMonitorRecordsResponse;
  reportSnapshots: GeoReportSnapshotsResponse;
};

export type GeoReportSnapshot = {
  snapshot_id: string;
  scope_label: string;
  report_period: string;
  total_records: number;
  brand_mention_rate: number;
  page_retrieval_rate: number;
  source_citation_rate: number;
  report_text: string;
  session_id: string;
  session_name: string;
  query: string;
  source_url: string;
  created_at: string;
  data_mode: "mock" | "demo" | "manual" | "real";
};

export type GeoReportSnapshotsResponse = {
  data_mode: "manual" | "mixed";
  snapshots: GeoReportSnapshot[];
};

export type ContentCalendarPlan = {
  id: string;
  topic_title: string;
  platform: string;
  brand_name: string;
  product_name: string;
  region: string;
  target_audience: string;
  facts: string;
  overall_score: number;
  status: "待适配" | "适配中" | "已生成" | "已作废";
  created_at: string;
  scheduled_at?: string | null;
  owner?: string;
  priority?: "高" | "中" | "低";
  content_stage?: "待生产" | "生产中" | "待审核" | "已完成";
  data_mode?: "mock" | "demo" | "manual" | "real";
};

export type ContentCalendarPlansResponse = {
  data_mode: "manual" | "mixed";
  plans: ContentCalendarPlan[];
  total?: number;
  page?: number;
  page_size?: number;
};

export type ContentCalendarPlansQuery = {
  keyword?: string;
  status?: string;
  platform?: string;
  owner?: string;
  priority?: string;
  start?: string;
  end?: string;
  sort?: string;
  page?: number;
  page_size?: number;
};

export type ContentCalendarPlanUpdatePayload = {
  scheduled_at?: string;
  owner?: string;
  priority: "高" | "中" | "低";
  content_stage: "待生产" | "生产中" | "待审核" | "已完成";
  status: "待适配" | "适配中" | "已生成" | "已作废";
  actor: string;
};

export type ContentCalendarPlanCreatePayload = {
  topic_title: string;
  platform: string;
  brand_name: string;
  product_name: string;
  region: string;
  target_audience: string;
  facts: string;
  overall_score: number;
  status: "待适配" | "适配中" | "已生成" | "已作废";
  scheduled_at?: string;
  owner: string;
  priority: "高" | "中" | "低";
  content_stage: "待生产" | "生产中" | "待审核" | "已完成";
  data_mode: "manual" | "real";
  actor: string;
};

export type GeoMonitorSessionCreatePayload = {
  name: string;
  target_brand: string;
  target_url: string;
  data_mode: "manual" | "real";
  actor: string;
};

export type GeoMonitorRecordCreatePayload = {
  session_id: string;
  query: string;
  ai_channel: string;
  target_brand: string;
  target_url: string;
  related_concept_found: boolean;
  brand_mentioned: boolean;
  page_retrieved: boolean;
  source_cited: boolean;
  raw_response: string;
  response_summary: string;
  manual_review_status: string;
  reviewer: string;
  data_mode: "manual" | "real";
  actor: string;
};

export type PublishQueueDraftSummary = {
  platform_id: string;
  platform_name: string;
  title: string;
  review_status: string;
};

export type PublishQueueItem = {
  id: string;
  version_id: string;
  topic_title: string;
  source_topic_title?: string;
  platform_count: number;
  platform_drafts?: PublishQueueDraftSummary[];
  status: "ready" | "publishing" | "published" | "failed" | "cancelled";
  queued_at: string;
  publishing_channel?: string;
  operator_name?: string;
  planned_publish_at?: string;
  actual_publish_at?: string;
  published_url?: string;
  failure_reason?: string;
  operator_note?: string;
  monitor_session_id?: string;
  last_action?: string;
  last_updated_at?: string;
  data_mode?: "mock" | "demo" | "manual" | "real";
};

export type PublishQueueItemsResponse = {
  data_mode: "manual" | "mixed";
  items: PublishQueueItem[];
  total: number;
};

export type PublishQueueCreatePayload = Omit<PublishQueueItem, "last_action" | "last_updated_at" | "data_mode"> & {
  data_mode?: "manual" | "real";
  actor: string;
};

export type PublishQueueUpdatePayload = Partial<
  Pick<
    PublishQueueItem,
    | "status"
    | "publishing_channel"
    | "operator_name"
    | "planned_publish_at"
    | "actual_publish_at"
    | "published_url"
    | "failure_reason"
    | "operator_note"
  >
> & {
  actor: string;
};

export type PublishQueueMonitorSessionPayload = {
  target_brand: string;
  actor: string;
};

export type PublishQueueMonitorSessionResponse = {
  item: PublishQueueItem;
  session: GeoMonitorSession;
};

export type GeoMonitorEvidenceAttachmentPayload = {
  attachment_type: "source_url" | "screenshot_url" | "raw_response_excerpt" | "manual_note";
  title: string;
  url: string;
  note: string;
  actor: string;
};

export type GeoMonitorRecordReviewPayload = {
  review_status_code: "verified" | "rejected" | "needs_evidence";
  reviewer: string;
  review_note: string;
  actor: string;
};

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function buildApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildApiUrl(path);
  const response = init ? await fetch(url, init) : await fetch(url);

  if (!response.ok) {
    let detail = `FlowPilot API request failed: ${response.status}`;

    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      detail = `FlowPilot API request failed: ${response.status}`;
    }

    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function loadRulesSnapshot(): Promise<RulesSnapshot> {
  const [ai, publishing] = await Promise.all([
    fetchJson<RulesResponse>("/api/rules/ai-channels"),
    fetchJson<RulesResponse>("/api/rules/publishing-channels")
  ]);

  return { ai, publishing };
}

export async function loadRuleSourceReviews(status?: string): Promise<RuleSourceReviewsResponse> {
  const query = status && status !== "全部" ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJson<RuleSourceReviewsResponse>(`/api/rule-source-reviews${query}`);
}

export async function loadRuleUpdateReminders(): Promise<RuleUpdateRemindersResponse> {
  return fetchJson<RuleUpdateRemindersResponse>("/api/rules/update-reminders");
}

export async function loadGeoMonitorSnapshot(): Promise<GeoMonitorSnapshot> {
  const [sessions, records, reportSnapshots] = await Promise.all([
    fetchJson<GeoMonitorSessionsResponse>("/api/geo-monitor/sessions"),
    fetchJson<GeoMonitorRecordsResponse>("/api/geo-monitor/records"),
    fetchJson<GeoReportSnapshotsResponse>("/api/geo-monitor/report-snapshots").catch(() => ({
      data_mode: "manual" as const,
      snapshots: []
    }))
  ]);

  return { sessions, records, reportSnapshots };
}

export async function loadContentCalendarPlans(query: ContentCalendarPlansQuery = {}): Promise<ContentCalendarPlansResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return fetchJson<ContentCalendarPlansResponse>(`/api/content-calendar/plans${queryString ? `?${queryString}` : ""}`);
}

export async function createContentCalendarPlan(payload: ContentCalendarPlanCreatePayload): Promise<ContentCalendarPlan> {
  return fetchJson<ContentCalendarPlan>("/api/content-calendar/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateContentCalendarPlan(
  planId: string,
  payload: ContentCalendarPlanUpdatePayload
): Promise<ContentCalendarPlan> {
  return fetchJson<ContentCalendarPlan>(`/api/content-calendar/plans/${planId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function loadPublishQueueItems(status?: string): Promise<PublishQueueItemsResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchJson<PublishQueueItemsResponse>(`/api/publish-queue/items${query}`);
}

export async function createPublishQueueItem(payload: PublishQueueCreatePayload): Promise<PublishQueueItem> {
  return fetchJson<PublishQueueItem>("/api/publish-queue/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updatePublishQueueItem(itemId: string, payload: PublishQueueUpdatePayload): Promise<PublishQueueItem> {
  return fetchJson<PublishQueueItem>(`/api/publish-queue/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function createMonitorSessionFromPublishQueueItem(
  itemId: string,
  payload: PublishQueueMonitorSessionPayload
): Promise<PublishQueueMonitorSessionResponse> {
  return fetchJson<PublishQueueMonitorSessionResponse>(`/api/publish-queue/items/${itemId}/monitor-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function createGeoMonitorSession(payload: GeoMonitorSessionCreatePayload): Promise<GeoMonitorSession> {
  return fetchJson<GeoMonitorSession>("/api/geo-monitor/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function createGeoMonitorRecord(payload: GeoMonitorRecordCreatePayload): Promise<GeoMonitorRecord> {
  return fetchJson<GeoMonitorRecord>("/api/geo-monitor/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export type GeoReportSnapshotCreatePayload = {
  scope_label: string;
  report_period: string;
  total_records: number;
  brand_mention_rate: number;
  page_retrieval_rate: number;
  source_citation_rate: number;
  report_text: string;
  session_id: string;
  session_name: string;
  query: string;
  source_url: string;
  data_mode: "manual" | "real";
  actor: string;
};

export async function createGeoReportSnapshot(payload: GeoReportSnapshotCreatePayload): Promise<GeoReportSnapshot> {
  return fetchJson<GeoReportSnapshot>("/api/geo-monitor/report-snapshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function addGeoMonitorRecordEvidenceAttachment(
  recordId: string,
  payload: GeoMonitorEvidenceAttachmentPayload
): Promise<GeoMonitorRecord> {
  return fetchJson<GeoMonitorRecord>(`/api/geo-monitor/records/${recordId}/evidence-attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function reviewGeoMonitorRecord(
  recordId: string,
  payload: GeoMonitorRecordReviewPayload
): Promise<GeoMonitorRecord> {
  return fetchJson<GeoMonitorRecord>(`/api/geo-monitor/records/${recordId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export type RuleCreatePayload = {
  channel_type: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url: string;
  confidence: number;
  data_mode: "mock" | "demo" | "manual" | "real";
  actor: string;
};

export type RuleUpdatePayload = {
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url: string;
  confidence: number;
  actor: string;
};

export async function createRule(payload: RuleCreatePayload): Promise<ChannelRule> {
  return fetchJson<ChannelRule>("/api/rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function updateRule(ruleId: string, payload: RuleUpdatePayload): Promise<ChannelRule> {
  return fetchJson<ChannelRule>(`/api/rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function confirmRule(ruleId: string): Promise<ChannelRule> {
  return runRuleAction(ruleId, "confirm");
}

export async function expireRule(ruleId: string): Promise<ChannelRule> {
  return runRuleAction(ruleId, "expire");
}

export async function deprecateRule(ruleId: string): Promise<ChannelRule> {
  return runRuleAction(ruleId, "deprecate");
}

export async function requestRuleSourceCheck(ruleId: string): Promise<ChannelRule> {
  return fetchJson<ChannelRule>(`/api/rules/${ruleId}/source-check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "frontend-user", check_note: "前端请求检查规则来源。" })
  });
}

export async function createRuleSourceReviewProposal(
  ruleId: string,
  payload: RuleSourceReviewProposalPayload
): Promise<RuleSourceReviewTask> {
  return fetchJson<RuleSourceReviewTask>(`/api/rules/${ruleId}/source-review-proposals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export async function acceptRuleSourceReviewProposal(ruleId: string, reviewId: string): Promise<ChannelRule> {
  return runRuleSourceReviewAction(ruleId, reviewId, "accept");
}

export async function ignoreRuleSourceReviewProposal(ruleId: string, reviewId: string): Promise<ChannelRule> {
  return runRuleSourceReviewAction(ruleId, reviewId, "ignore");
}

export async function checkRuleSourceReviewUrl(reviewId: string): Promise<RuleSourceReviewTask> {
  return fetchJson<RuleSourceReviewTask>(`/api/rule-source-reviews/${reviewId}/source-url-check`, {
    method: "POST"
  });
}

async function runRuleAction(ruleId: string, action: "confirm" | "expire" | "deprecate") {
  return fetchJson<ChannelRule>(`/api/rules/${ruleId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "frontend-user" })
  });
}

async function runRuleSourceReviewAction(ruleId: string, reviewId: string, action: "accept" | "ignore") {
  return fetchJson<ChannelRule>(`/api/rules/${ruleId}/source-review-proposals/${reviewId}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor: "frontend-user", decision_note: action === "accept" ? "采用新规则。" : "忽略候选。" })
  });
}
