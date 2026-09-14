import { describe, expect, it } from "vitest";
import { ContentAdaptationInput, generatePlatformDrafts } from "../app/content-adaptation/content-adaptation-engine";

const validInput: ContentAdaptationInput = {
  brandName: "武汉微艺达智能科技有限公司",
  productName: "智能沙盘",
  region: "武汉",
  topicTitle: "武汉智能沙盘厂家怎么选？",
  targetAudience: "企业展厅和智慧园区项目负责人",
  facts: "支持实体模型、灯光控制、触摸屏联动和数字孪生展示。",
  selectedPlatforms: ["wechat", "zhihu", "xiaohongshu", "baijiahao"]
};

describe("P5 内容适配引擎", () => {
  it("从同一份业务资料生成差异明显的多平台草稿", () => {
    const drafts = generatePlatformDrafts(validInput);

    expect(drafts).toHaveLength(4);
    expect(drafts.map((draft) => draft.title)).toEqual([
      "武汉智能沙盘厂家怎么选？先看这几项交付能力",
      "武汉智能沙盘厂家应该怎么选？",
      "武汉做智能沙盘，别只看模型好不好看",
      "武汉智能沙盘厂家怎么选？模型、电控和数字展示要一起看"
    ]);
    expect(new Set(drafts.map((draft) => draft.structureType)).size).toBeGreaterThan(1);
    expect(drafts.every((draft) => draft.score.overall >= 70)).toBe(true);
    expect(drafts.every((draft) => draft.warnings.includes("发布前仍需人工复核"))).toBe(true);
  });

  it("缺少核心资料时返回可读错误", () => {
    expect(() =>
      generatePlatformDrafts({
        ...validInput,
        brandName: ""
      })
    ).toThrow("请填写品牌名称、产品名称、目标地域和选题标题");
  });

  it("未选择平台时返回可读错误", () => {
    expect(() =>
      generatePlatformDrafts({
        ...validInput,
        selectedPlatforms: []
      })
    ).toThrow("请至少选择一个发布平台");
  });
});
