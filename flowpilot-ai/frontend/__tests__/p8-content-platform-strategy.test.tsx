import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContentAdaptationPage from "../app/content-adaptation/page";
import { ContentAdaptationInput, generatePlatformDrafts } from "../app/content-adaptation/content-adaptation-engine";

const input: ContentAdaptationInput = {
  brandName: "武汉微艺达智能科技有限公司",
  productName: "智能沙盘",
  region: "武汉",
  topicTitle: "武汉智能沙盘厂家怎么选？",
  targetAudience: "企业展厅和智慧园区项目负责人",
  facts: "支持实体模型、灯光控制、触摸屏联动和数字孪生展示。",
  selectedPlatforms: ["wechat", "zhihu", "xiaohongshu", "baijiahao", "website"]
};

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: input.brandName } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: input.productName } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: input.region } });
  fireEvent.change(screen.getByLabelText("选题标题"), { target: { value: input.topicTitle } });
  fireEvent.change(screen.getByLabelText("目标受众"), { target: { value: input.targetAudience } });
  fireEvent.change(screen.getByLabelText("可确认事实"), { target: { value: input.facts } });
}

describe("P8 多平台适配增强", () => {
  it("为每个平台生成不同的平台策略、适配评分、引用准备提示和发布建议", () => {
    const drafts = generatePlatformDrafts(input);

    expect(drafts).toHaveLength(5);
    expect(new Set(drafts.map((draft) => draft.platformStrategy)).size).toBe(5);
    expect(drafts.every((draft) => draft.adaptationScore >= 70)).toBe(true);
    expect(drafts.every((draft) => draft.citationReadinessHint.includes("引用准备"))).toBe(true);
    expect(drafts.every((draft) => draft.distributionAdvice.length >= 2)).toBe(true);
  });

  it("在内容适配页面展示平台策略、适配评分、引用准备提示和发布建议", async () => {
    localStorage.clear();
    render(<ContentAdaptationPage />);

    fillRequiredFields();
    fireEvent.click(screen.getByLabelText("企业官网"));
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    expect((await screen.findAllByText("平台策略")).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(/适配评分/).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText(/引用准备/).length).toBeGreaterThanOrEqual(5);
    expect(screen.getAllByText("发布建议").length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText("长文解释 + 品牌沉淀 + 案例复核")).toBeInTheDocument();
  });
});
