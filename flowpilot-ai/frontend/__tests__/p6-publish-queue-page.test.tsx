import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublishQueuePage from "../app/publish-queue/page";

const queueStorageKey = "flowpilot.contentAdaptation.publishQueue";
const topicPoolStorageKey = "flowpilot.geoResearch.topicPool";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function seedQueue(items: Array<Record<string, unknown>> = [{}]) {
  localStorage.setItem(
    queueStorageKey,
    JSON.stringify(
      items.map((overrides, index) => ({
        id: `queue-${index + 1}`,
        versionId: `version-${index + 1}`,
        topicTitle: index === 0 ? "武汉智能沙盘厂家怎么选？" : "智慧农业沙盘如何做 GEO 内容？",
        platformCount: index === 0 ? 4 : 2,
        status: "ready",
        queuedAt: "2026-09-12T00:00:00.000Z",
        sourceTopicTitle: index === 0 ? "武汉智能沙盘厂家怎么选？" : "智慧农业沙盘如何做 GEO 内容？",
        platformDrafts: [
          {
            platformId: "wechat",
            platformName: "微信公众号",
            title: index === 0 ? "武汉智能沙盘厂家怎么选？先看交付能力" : "智慧农业沙盘内容怎么写？",
            reviewStatus: "审核通过"
          }
        ],
        ...overrides
      }))
    )
  );
}

function readStoredQueue() {
  return JSON.parse(localStorage.getItem(queueStorageKey) || "[]") as Array<Record<string, string>>;
}

describe("P6 发布准备队列页面", () => {
  beforeEach(() => {
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => "blob:flowpilot-export");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("没有队列内容时显示空状态和发布边界", () => {
    render(<PublishQueuePage />);

    expect(screen.getByRole("heading", { name: "发布准备队列" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "发布准备" })).toHaveAttribute("href", "/publish-queue");
    expect(screen.getByText("暂无发布准备内容")).toBeInTheDocument();
    expect(screen.getByText("不会自动发布到外部平台")).toBeInTheDocument();
  });

  it("读取内容适配页加入的发布准备队列", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    expect(await screen.findByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("4 个平台草稿")).toBeInTheDocument();
    expect(screen.getByText("微信公众号：武汉智能沙盘厂家怎么选？先看交付能力")).toBeInTheDocument();
    expect(screen.getAllByText("待发布").length).toBeGreaterThan(0);
  });

  it("优先读取后端发布队列并保存发布记录", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/publish-queue/items") && !init) {
        return response({
          data_mode: "manual",
          total: 1,
          items: [
            {
              id: "api-queue-1",
              version_id: "content-calendar-api-plan-1",
              topic_title: "后端发布准备记录",
              source_topic_title: "后端发布准备记录",
              platform_count: 1,
              platform_drafts: [],
              status: "ready",
              queued_at: "2026-09-15T10:00:00Z"
            }
          ]
        });
      }
      if (url.includes("/api/publish-queue/items/api-queue-1") && init?.method === "PATCH") {
        return response({
          id: "api-queue-1",
          version_id: "content-calendar-api-plan-1",
          topic_title: "后端发布准备记录",
          source_topic_title: "后端发布准备记录",
          platform_count: 1,
          platform_drafts: [],
          status: "published",
          queued_at: "2026-09-15T10:00:00Z",
          actual_publish_at: "2026-09-21T09:30",
          published_url: "https://example.com/backend-published",
          last_action: "保存发布记录",
          last_updated_at: "2026-09-21T10:00:00Z"
        });
      }
      if (url.includes("/api/content-calendar/plans/api-plan-1") && init?.method === "PATCH") {
        return response({
          id: "api-plan-1",
          topic_title: "后端发布准备记录",
          platform: "知乎",
          brand_name: "FlowPilot",
          product_name: "智能沙盘",
          region: "武汉",
          target_audience: "企业展厅项目负责人",
          facts: "发布后同步测试事实。",
          overall_score: 91,
          status: "已生成",
          content_stage: "已发布",
          created_at: "2026-09-15T10:00:00Z",
          data_mode: "manual"
        });
      }
      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PublishQueuePage />);

    expect(await screen.findByText("后端发布准备记录")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-21T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), { target: { value: "https://example.com/backend-published" } });
    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/publish-queue/items/api-queue-1",
      expect.objectContaining({ method: "PATCH" })
    );
    const stageCall = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/api/content-calendar/plans/api-plan-1") && init?.method === "PATCH");
    expect(stageCall).toBeTruthy();
    expect(JSON.parse(String(stageCall?.[1]?.body))).toMatchObject({
      content_stage: "已发布",
      actor: "frontend-user"
    });
  });

  it("从主流程链接进入时定位对应发布准备记录", async () => {
    seedQueue([
      { id: "queue-linked", versionId: "content-calendar-topic-linked-plan", topicTitle: "主流程定位发布记录", sourceTopicTitle: "主流程定位发布记录" },
      { id: "queue-other", versionId: "content-calendar-topic-other", topicTitle: "其他发布记录", sourceTopicTitle: "其他发布记录" }
    ]);
    window.history.replaceState({}, "", "/publish-queue?source=content-calendar&plan=topic-linked-plan");

    render(<PublishQueuePage />);

    expect(await screen.findByText("已定位发布准备记录：主流程定位发布记录")).toBeInTheDocument();
    expect(screen.getByText("主流程定位发布记录")).toBeInTheDocument();
    expect(screen.queryByText("其他发布记录")).not.toBeInTheDocument();
  });

  it("支持批量移除选中的发布准备记录", async () => {
    seedQueue([{}, {}]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByLabelText("选择发布记录 武汉智能沙盘厂家怎么选？"));
    fireEvent.click(screen.getByRole("button", { name: "移除选中记录" }));

    expect(await screen.findByRole("status")).toHaveTextContent("已移除 1 条发布准备记录");
    expect(screen.queryByText("武汉智能沙盘厂家怎么选？")).not.toBeInTheDocument();
    expect(screen.getByText("智慧农业沙盘如何做 GEO 内容？")).toBeInTheDocument();
    expect(readStoredQueue()).toHaveLength(1);
    expect(readStoredQueue()[0].id).toBe("queue-2");
  });

  it("支持批量更新选中的发布准备记录状态", async () => {
    seedQueue([{}, {}, { status: "failed", topicTitle: "第三条发布准备记录", sourceTopicTitle: "第三条发布准备记录" }]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByLabelText("选择发布记录 武汉智能沙盘厂家怎么选？"));
    fireEvent.click(screen.getByLabelText("选择发布记录 智慧农业沙盘如何做 GEO 内容？"));
    fireEvent.change(screen.getByLabelText("批量状态"), { target: { value: "publishing" } });
    fireEvent.click(screen.getByRole("button", { name: "批量改状态" }));

    expect(await screen.findByRole("status")).toHaveTextContent("已批量更新 2 条发布准备记录");
    expect(readStoredQueue()[0].status).toBe("publishing");
    expect(readStoredQueue()[1].status).toBe("publishing");
    expect(readStoredQueue()[2].status).toBe("failed");
  });

  it("支持只导出选中的发布准备记录", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const blobParts: string[] = [];
    const OriginalBlob = globalThis.Blob;
    class TestBlob extends OriginalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        blobParts.push(String(parts[0]));
        super(parts, options);
      }
    }
    vi.stubGlobal("Blob", TestBlob);
    seedQueue([{}, {}]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByLabelText("选择发布记录 智慧农业沙盘如何做 GEO 内容？"));
    fireEvent.click(screen.getByRole("button", { name: "导出选中 Markdown" }));
    expect(await screen.findByText("已生成选中 Markdown 发布记录")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "导出选中 CSV" }));
    expect(await screen.findByText("已生成选中 CSV 发布记录")).toBeInTheDocument();

    expect(blobParts[0]).not.toContain("武汉智能沙盘厂家怎么选？");
    expect(blobParts[0]).toContain("智慧农业沙盘如何做 GEO 内容？");
    expect(blobParts[1]).not.toContain("武汉智能沙盘厂家怎么选？");
    expect(blobParts[1]).toContain("智慧农业沙盘如何做 GEO 内容？");
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("支持清空发布准备记录选择", async () => {
    seedQueue([{}, {}]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByRole("button", { name: "选择当前结果" }));
    expect(screen.getByText("已选择 2 条")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空选择" }));

    expect(screen.getByText("已选择 0 条")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出选中 Markdown" })).toBeDisabled();
  });

  it("支持发布任务状态流转并持久化", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    expect((await screen.findAllByText("待发布")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "标记发布中" }));
    expect((await screen.findAllByText("发布中")).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));
    expect((await screen.findAllByText("已发布")).length).toBeGreaterThan(0);

    expect(readStoredQueue()[0].status).toBe("published");
  });

  it("支持标记发布失败和取消发布", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.change(screen.getByLabelText("失败原因"), {
      target: { value: "平台后台要求重新登录，暂未完成发布。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));
    expect((await screen.findAllByText("发布失败")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "取消发布" }));
    expect((await screen.findAllByText("已取消")).length).toBeGreaterThan(0);
  });

  it("支持保存发布链接和操作备注", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.change(screen.getByLabelText("操作备注"), {
      target: { value: "已由运营人工发布到搜狐号，待下周复核收录情况。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      publishedUrl: "https://example.com/articles/wuhan-sandbox",
      operatorNote: "已由运营人工发布到搜狐号，待下周复核收录情况。"
    });
  });

  it("发布记录保存为已发布后提供进入监测复盘的入口", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByRole("link", { name: "进入监测复盘" })).toHaveAttribute(
      "href",
      "/geo-monitor/records?query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox"
    );
  });

  it("保存本地发布记录为已发布时同步内容计划阶段", async () => {
    localStorage.setItem(
      topicPoolStorageKey,
      JSON.stringify([
        {
          id: "plan-1",
          topicTitle: "武汉智能沙盘厂家怎么选？",
          platform: "知乎",
          brandName: "FlowPilot",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "运营负责人",
          facts: "发布后同步本地测试事实。",
          overallScore: 91,
          status: "已生成",
          createdAt: "2026-09-12T08:00:00.000Z",
          contentStage: "待发布"
        }
      ])
    );
    seedQueue([{ versionId: "content-calendar-plan-1" }]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    const storedPlans = JSON.parse(localStorage.getItem(topicPoolStorageKey) || "[]") as Array<{ id: string; contentStage: string }>;
    expect(storedPlans[0]).toMatchObject({ id: "plan-1", contentStage: "已发布" });
  });

  it("已发布记录可以创建监测任务并进入记录录入页", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/publish-queue/items") && !init) {
        return response({
          data_mode: "manual",
          total: 1,
          items: [
            {
              id: "api-queue-1",
              version_id: "content-calendar-api-plan-1",
              topic_title: "武汉智能沙盘厂家怎么选？",
              source_topic_title: "武汉智能沙盘厂家怎么选？",
              platform_count: 1,
              platform_drafts: [],
              status: "published",
              queued_at: "2026-09-15T10:00:00Z",
              actual_publish_at: "2026-09-21T09:30",
              published_url: "https://example.com/articles/wuhan-sandbox"
            }
          ]
        });
      }
      if (url.includes("/api/publish-queue/items/api-queue-1/monitor-session") && init?.method === "POST") {
        return response(
          {
            item: {
              id: "api-queue-1",
              version_id: "content-calendar-api-plan-1",
              topic_title: "武汉智能沙盘厂家怎么选？",
              source_topic_title: "武汉智能沙盘厂家怎么选？",
              platform_count: 1,
              platform_drafts: [],
              status: "published",
              queued_at: "2026-09-15T10:00:00Z",
              actual_publish_at: "2026-09-21T09:30",
              published_url: "https://example.com/articles/wuhan-sandbox",
              monitor_session_id: "geo-mon-new"
            },
            session: {
              session_id: "geo-mon-new",
              name: "发布后监测：武汉智能沙盘厂家怎么选？",
              target_brand: "武汉微艺达智能科技有限公司",
              target_url: "https://example.com/articles/wuhan-sandbox",
              created_at: "2026-09-21 10:00:00",
              data_mode: "manual",
              total_records: 0,
              highest_evidence_level: 0
            }
          },
          201
        );
      }
      if (url.includes("/api/content-calendar/plans/api-plan-1") && init?.method === "PATCH") {
        return response({
          id: "api-plan-1",
          topic_title: "武汉智能沙盘厂家怎么选？",
          platform: "知乎",
          brand_name: "FlowPilot",
          product_name: "智能沙盘",
          region: "武汉",
          target_audience: "企业展厅项目负责人",
          facts: "监测任务同步测试事实。",
          overall_score: 91,
          status: "已生成",
          content_stage: "待监测",
          created_at: "2026-09-15T10:00:00Z",
          data_mode: "manual"
        });
      }
      return response({ detail: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PublishQueuePage />);

    expect(await screen.findByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "创建监测任务" }));

    expect(await screen.findByText("已创建监测任务")).toBeInTheDocument();
    expect(within(screen.getByRole("status")).getByRole("link", { name: "录入监测记录" })).toHaveAttribute(
      "href",
      "/geo-monitor/records?session=geo-mon-new&query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox&plan=api-plan-1"
    );
    expect(screen.getAllByRole("link", { name: "录入监测记录" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("link", { name: "录入监测记录" })[1]).toHaveAttribute(
      "href",
      "/geo-monitor/records?session=geo-mon-new&query=%E6%AD%A6%E6%B1%89%E6%99%BA%E8%83%BD%E6%B2%99%E7%9B%98%E5%8E%82%E5%AE%B6%E6%80%8E%E4%B9%88%E9%80%89%EF%BC%9F&url=https%3A%2F%2Fexample.com%2Farticles%2Fwuhan-sandbox&plan=api-plan-1"
    );
    const stageCall = fetchMock.mock.calls.find(([url, init]) => String(url).includes("/api/content-calendar/plans/api-plan-1") && init?.method === "PATCH");
    expect(stageCall).toBeTruthy();
    expect(JSON.parse(String(stageCall?.[1]?.body))).toMatchObject({
      content_stage: "待监测",
      actor: "frontend-user"
    });
  });

  it("支持保存发布失败原因", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.change(screen.getByLabelText("失败原因"), {
      target: { value: "平台后台要求重新登录，暂未完成发布。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      status: "failed",
      failureReason: "平台后台要求重新登录，暂未完成发布。"
    });
  });

  it("已发布状态缺少发布链接或实际发布时间时禁止保存", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("已发布记录需要填写发布链接和实际发布时间");
    expect(readStoredQueue()[0]).not.toMatchObject({
      status: "published"
    });
  });

  it("发布失败状态缺少失败原因时禁止保存", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("发布失败记录需要填写失败原因");
    expect(readStoredQueue()[0]).not.toMatchObject({
      status: "failed"
    });
  });

  it("支持补充发布平台、发布人和发布时间，并校验发布链接格式", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布平台"), { target: { value: "搜狐号" } });
    fireEvent.change(screen.getByLabelText("发布人"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("计划发布时间"), { target: { value: "2026-09-13T09:00" } });
    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), { target: { value: "wuhan-sandbox" } });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("发布链接需要以 http:// 或 https:// 开头");
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      publishingChannel: "搜狐号",
      operatorName: "王轩",
      plannedPublishAt: "2026-09-13T09:00",
      actualPublishAt: "2026-09-13T09:30",
      publishedUrl: "https://example.com/articles/wuhan-sandbox"
    });
  });

  it("支持按照发布状态筛选队列", async () => {
    seedQueue([{ status: "published" }, { status: "failed" }]);

    render(<PublishQueuePage />);

    expect(await screen.findByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("智慧农业沙盘如何做 GEO 内容？")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("状态筛选"), { target: { value: "failed" } });

    expect(screen.queryByText("武汉智能沙盘厂家怎么选？")).not.toBeInTheDocument();
    expect(screen.getByText("智慧农业沙盘如何做 GEO 内容？")).toBeInTheDocument();
  });

  it("保存单条发布记录时不被其他历史异常记录阻断", async () => {
    seedQueue([
      { status: "published", publishedUrl: "", actualPublishAt: "" },
      { status: "ready" }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("智慧农业沙盘如何做 GEO 内容？");
    const noteInputs = screen.getAllByLabelText("操作备注");
    fireEvent.change(noteInputs[1], {
      target: { value: "先保存第二条正常记录，第一条历史异常记录后续单独补齐。" }
    });
    fireEvent.click(screen.getAllByRole("button", { name: "保存发布记录" })[1]);

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[1]).toMatchObject({
      operatorNote: "先保存第二条正常记录，第一条历史异常记录后续单独补齐。"
    });
  });

  it("保存发布记录时写入本地审计字段并展示最后操作信息", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布人"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("操作备注"), {
      target: { value: "补充发布前复核记录。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("最后操作：保存发布记录")).toBeInTheDocument();
    expect(screen.getByText(/^最后更新：/)).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      lastAction: "保存发布记录"
    });
    expect(readStoredQueue()[0].lastUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("导出发布记录时包含本地审计字段", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const blobParts: string[] = [];
    const OriginalBlob = globalThis.Blob;
    class TestBlob extends OriginalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        blobParts.push(String(parts[0]));
        super(parts, options);
      }
    }
    vi.stubGlobal("Blob", TestBlob);
    seedQueue([
      {
        status: "published",
        publishedUrl: "https://example.com/articles/wuhan-sandbox",
        actualPublishAt: "2026-09-12T16:00",
        lastAction: "保存发布记录",
        lastUpdatedAt: "2026-09-12T08:30:00.000Z"
      }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByRole("button", { name: "导出 Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(blobParts[0]).toContain("最后操作：保存发布记录");
    expect(blobParts[0]).toContain("最后更新时间：2026-09-12");
    expect(blobParts[1]).toContain("最后操作");
    expect(blobParts[1]).toContain("最后更新时间");
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("支持导出 Markdown 和 CSV 发布记录", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    seedQueue([
      {
        publishingChannel: "搜狐号",
        operatorName: "王轩",
        publishedUrl: "https://example.com/articles/wuhan-sandbox",
        status: "published"
      }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByRole("button", { name: "导出 Markdown" }));
    expect(await screen.findByText("已生成 Markdown 发布记录")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" }));
    expect(await screen.findByText("已生成 CSV 发布记录")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
