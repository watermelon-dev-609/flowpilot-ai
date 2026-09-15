import { afterEach, describe, expect, it, vi } from "vitest";
import { createMonitorSessionFromPublishQueueItem, createPublishQueueItem, loadPublishQueueItems, updatePublishQueueItem } from "../app/lib/flowpilot-api";

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("P35 发布队列 API 封装", () => {
  it("从后端读取发布准备队列", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response({
          data_mode: "manual",
          total: 1,
          items: [
            {
              id: "queue-plan-1",
              version_id: "content-calendar-plan-1",
              topic_title: "武汉智能沙盘厂家怎么选？",
              platform_count: 2,
              status: "ready",
              queued_at: "2026-09-15T10:00:00Z",
              platform_drafts: []
            }
          ]
        })
      )
    );

    const result = await loadPublishQueueItems();

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: "queue-plan-1",
      version_id: "content-calendar-plan-1",
      topic_title: "武汉智能沙盘厂家怎么选？",
      status: "ready"
    });
  });

  it("更新发布记录时提交到指定后端记录", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        id: "queue-plan-1",
        version_id: "content-calendar-plan-1",
        topic_title: "武汉智能沙盘厂家怎么选？",
        platform_count: 2,
        status: "published",
        queued_at: "2026-09-15T10:00:00Z",
        actual_publish_at: "2026-09-21T09:30",
        published_url: "https://example.com/articles/wuhan-sandbox",
        platform_drafts: []
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const updated = await updatePublishQueueItem("queue-plan-1", {
      status: "published",
      actual_publish_at: "2026-09-21T09:30",
      published_url: "https://example.com/articles/wuhan-sandbox",
      actor: "frontend-user"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/publish-queue/items/queue-plan-1",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(updated.status).toBe("published");
  });

  it("加入发布准备时提交到后端队列", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        id: "queue-plan-1",
        version_id: "content-calendar-plan-1",
        topic_title: "武汉智能沙盘厂家怎么选？",
        platform_count: 1,
        platform_drafts: [],
        status: "ready",
        queued_at: "2026-09-15T10:00:00Z"
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await createPublishQueueItem({
      id: "queue-plan-1",
      version_id: "content-calendar-plan-1",
      topic_title: "武汉智能沙盘厂家怎么选？",
      platform_count: 1,
      platform_drafts: [],
      status: "ready",
      queued_at: "2026-09-15T10:00:00Z",
      actor: "frontend-user"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/publish-queue/items",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("从已发布记录创建监测任务", async () => {
    const fetchMock = vi.fn(async () =>
      response({
        item: {
          id: "queue-plan-1",
          version_id: "content-calendar-plan-1",
          topic_title: "武汉智能沙盘厂家怎么选？",
          platform_count: 1,
          platform_drafts: [],
          status: "published",
          queued_at: "2026-09-15T10:00:00Z",
          monitor_session_id: "geo-mon-1"
        },
        session: {
          session_id: "geo-mon-1",
          name: "发布后监测：武汉智能沙盘厂家怎么选？",
          target_brand: "武汉微艺达智能科技有限公司",
          target_url: "https://example.com/articles/wuhan-sandbox",
          created_at: "2026-09-21 10:00:00",
          data_mode: "manual",
          total_records: 0,
          highest_evidence_level: 0
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createMonitorSessionFromPublishQueueItem("queue-plan-1", {
      target_brand: "武汉微艺达智能科技有限公司",
      actor: "frontend-user"
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/publish-queue/items/queue-plan-1/monitor-session",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.session.session_id).toBe("geo-mon-1");
  });
});
