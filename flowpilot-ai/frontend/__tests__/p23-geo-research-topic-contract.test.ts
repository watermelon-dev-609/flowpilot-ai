import { describe, expect, it } from "vitest";
import {
  buildContentCalendarGroups,
  GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY,
  isGeoResearchTopicStatus,
  normalizeGeoResearchTopicPool
} from "../lib/geo-research-topic-contract";

describe("P23 研究选题池数据契约", () => {
  it("只接受明确声明的选题状态", () => {
    expect(isGeoResearchTopicStatus("待适配")).toBe(true);
    expect(isGeoResearchTopicStatus("适配中")).toBe(true);
    expect(isGeoResearchTopicStatus("已生成")).toBe(true);
    expect(isGeoResearchTopicStatus("已作废")).toBe(true);
    expect(isGeoResearchTopicStatus("已发布")).toBe(false);
    expect(isGeoResearchTopicStatus("")).toBe(false);
  });

  it("归一化选题池时过滤结构不完整和状态非法的数据", () => {
    const normalized = normalizeGeoResearchTopicPool([
      {
        id: "topic-1",
        topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
        platform: "知乎",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "公开资料和真实业务信息。",
        overallScore: 91,
        status: "待适配",
        createdAt: "2026-09-12T08:00:00.000Z"
      },
      {
        id: "topic-invalid-status",
        topicTitle: "非法状态选题",
        platform: "公众号",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "非法状态。",
        overallScore: 70,
        status: "已发布",
        createdAt: "2026-09-13T08:00:00.000Z"
      },
      {
        id: "topic-missing-title",
        topicTitle: "",
        platform: "小红书",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "缺少标题。",
        overallScore: 60,
        status: "待适配",
        createdAt: "2026-09-14T08:00:00.000Z"
      },
      null
    ]);

    expect(GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY).toBe("flowpilot.geoResearch.topicPool");
    expect(normalized).toHaveLength(1);
    expect(normalized[0]).toEqual(
      expect.objectContaining({
        id: "topic-1",
        status: "待适配",
        overallScore: 91
      })
    );
  });

  it("生成内容日历分组时排除已作废选题并按日期归档", () => {
    const groups = buildContentCalendarGroups([
      {
        id: "topic-1",
        topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
        platform: "知乎",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "计划事实一。",
        overallScore: 91,
        status: "待适配",
        createdAt: "2026-09-12T08:00:00.000Z"
      },
      {
        id: "topic-2",
        topicTitle: "智能沙盘和普通沙盘有什么区别？",
        platform: "公众号",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "计划事实二。",
        overallScore: 86,
        status: "适配中",
        createdAt: "2026-09-13T08:00:00.000Z"
      },
      {
        id: "topic-3",
        topicTitle: "已作废选题不进入日历",
        platform: "小红书",
        brandName: "武汉微艺达智能科技有限公司",
        productName: "智能沙盘",
        region: "武汉",
        targetAudience: "企业展厅项目负责人",
        facts: "计划事实三。",
        overallScore: 70,
        status: "已作废",
        createdAt: "2026-09-14T08:00:00.000Z"
      }
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.dateLabel)).toEqual(["9月12日", "9月13日"]);
    expect(groups.flatMap((group) => group.items).map((item) => item.id)).toEqual(["topic-1", "topic-2"]);
  });

  it("内容日历优先按计划发布时间归档并保留排期字段", () => {
    const groups = buildContentCalendarGroups(
      normalizeGeoResearchTopicPool([
        {
          id: "topic-scheduled-1",
          topicTitle: "武汉智能沙盘厂家推荐文章怎么写？",
          platform: "知乎",
          brandName: "武汉微艺达智能科技有限公司",
          productName: "智能沙盘",
          region: "武汉",
          targetAudience: "企业展厅项目负责人",
          facts: "计划事实一。",
          overallScore: 91,
          status: "待适配",
          createdAt: "2026-09-12T08:00:00.000Z",
          scheduledAt: "2026-09-20T10:00:00.000Z",
          owner: "王轩",
          priority: "高",
          contentStage: "待生产"
        }
      ])
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].dateLabel).toBe("9月20日");
    expect(groups[0].items[0]).toEqual(
      expect.objectContaining({
        scheduledAt: "2026-09-20T10:00:00.000Z",
        owner: "王轩",
        priority: "高",
        contentStage: "待生产"
      })
    );
  });
});
