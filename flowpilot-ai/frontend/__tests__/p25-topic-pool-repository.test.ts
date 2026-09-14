import { describe, expect, it } from "vitest";
import { createTopicPoolRepository } from "../lib/topic-pool-repository";

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    }
  };
}

const validTopic = {
  id: "topic-1",
  topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
  platform: "知乎",
  brandName: "武汉微艺达智能科技有限公司",
  productName: "智能沙盘",
  region: "武汉",
  targetAudience: "企业展厅项目负责人",
  facts: "公开资料和真实业务信息。",
  overallScore: 91,
  status: "待适配" as const,
  createdAt: "2026-09-12T08:00:00.000Z"
};

describe("P25 研究选题池仓储层", () => {
  it("读取选题池时过滤非法数据", () => {
    const repository = createTopicPoolRepository(
      createMemoryStorage({
        "flowpilot.geoResearch.topicPool": JSON.stringify([
          validTopic,
          {
            ...validTopic,
            id: "topic-invalid",
            status: "已发布"
          }
        ])
      })
    );

    expect(repository.list()).toEqual([validTopic]);
  });

  it("保存选题池时先归一化再持久化", () => {
    const storage = createMemoryStorage();
    const repository = createTopicPoolRepository(storage);

    repository.save([
      validTopic,
      {
        ...validTopic,
        id: "",
        topicTitle: "无效选题"
      }
    ]);

    expect(JSON.parse(storage.getItem("flowpilot.geoResearch.topicPool") || "[]")).toEqual([validTopic]);
  });

  it("按 ID 更新选题状态并保留其他选题", () => {
    const secondTopic = {
      ...validTopic,
      id: "topic-2",
      topicTitle: "智能沙盘和普通沙盘有什么区别？",
      status: "适配中" as const
    };
    const repository = createTopicPoolRepository(
      createMemoryStorage({
        "flowpilot.geoResearch.topicPool": JSON.stringify([validTopic, secondTopic])
      })
    );

    const updated = repository.updateStatus("topic-1", "已生成");

    expect(updated).toEqual([{ ...validTopic, status: "已生成" }, secondTopic]);
    expect(repository.list()).toEqual([{ ...validTopic, status: "已生成" }, secondTopic]);
  });

  it("按 ID 更新选题排期字段并持久化", () => {
    const repository = createTopicPoolRepository(
      createMemoryStorage({
        "flowpilot.geoResearch.topicPool": JSON.stringify([validTopic])
      })
    );

    const updated = repository.updatePlan("topic-1", {
      scheduledAt: "2026-09-25T10:00:00.000Z",
      owner: "运营同事",
      priority: "中",
      contentStage: "生产中",
      status: "适配中"
    });

    expect(updated[0]).toMatchObject({
      scheduledAt: "2026-09-25T10:00:00.000Z",
      owner: "运营同事",
      priority: "中",
      contentStage: "生产中",
      status: "适配中"
    });
    expect(repository.list()[0]).toMatchObject(updated[0]);
  });

  it("存储内容损坏时清空对应键并返回空数组", () => {
    const storage = createMemoryStorage({
      "flowpilot.geoResearch.topicPool": "{损坏"
    });
    const repository = createTopicPoolRepository(storage);

    expect(repository.list()).toEqual([]);
    expect(storage.getItem("flowpilot.geoResearch.topicPool")).toBeNull();
  });

  it("提供选题池异步状态视图", () => {
    const repository = createTopicPoolRepository(
      createMemoryStorage({
        "flowpilot.geoResearch.topicPool": JSON.stringify([validTopic])
      })
    );

    expect(repository.listState()).toEqual({ status: "success", data: [validTopic] });
    repository.save([]);
    expect(repository.listState()).toEqual({ status: "empty", data: [] });
  });
});
