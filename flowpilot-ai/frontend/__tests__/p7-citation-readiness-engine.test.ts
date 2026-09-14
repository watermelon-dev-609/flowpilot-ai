import { describe, expect, it } from "vitest";
import { evaluateCitationReadiness } from "../app/citation-readiness/citation-readiness-engine";

describe("P7 AI 引用准备度评分引擎", () => {
  it("对结构清晰、实体明确、包含 FAQ 和事实来源的内容给出较高评分", () => {
    const result = evaluateCitationReadiness({
      brandName: "武汉微艺达智能科技有限公司",
      region: "武汉",
      productName: "智能沙盘",
      targetUrl: "https://example.com/wuhan-smart-sandbox",
      content: [
        "武汉智能沙盘是一类将实体模型、灯光电控、触摸屏和数字展示内容结合起来的项目展示系统，常用于企业展厅、智慧交通、智慧农业和智能制造场景。",
        "",
        "## 武汉智能沙盘适合哪些场景？",
        "武汉智能沙盘适合企业展厅、工业流程展示、交通运行演示、农业物联网展示等场景。",
        "",
        "## 可核验资料",
        "本文依据企业公开资料、项目图片和产品说明整理，发布前需要人工核对参数。",
        "",
        "## 常见问题",
        "问：智能沙盘和普通沙盘有什么区别？",
        "答：智能沙盘更强调交互控制、动态演示和数字内容联动。"
      ].join("\n")
    });

    expect(result.overall).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("较强");
    expect(result.checks.entityClarity.passed).toBe(true);
    expect(result.checks.faqCoverage.passed).toBe(true);
    expect(result.recommendations).toContain("继续保留可核验资料和人工复核边界，不要把评分包装成排名承诺。");
  });

  it("对缺少实体、FAQ 和来源说明且存在绝对化承诺的内容给出风险建议", () => {
    const result = evaluateCitationReadiness({
      brandName: "武汉微艺达智能科技有限公司",
      region: "武汉",
      productName: "智能沙盘",
      targetUrl: "sandbox",
      content: "我们是行业第一，保证收录，保证被 AI 引用，效果最好，欢迎咨询。"
    });

    expect(result.overall).toBeLessThan(70);
    expect(result.level).toBe("较弱");
    expect(result.checks.sourceSupport.passed).toBe(false);
    expect(result.checks.marketingRisk.passed).toBe(false);
    expect(result.checks.crawlReadiness.passed).toBe(false);
    expect(result.recommendations).toContain("删除“保证收录、保证引用、行业第一”等不可验证承诺。");
  });
});
