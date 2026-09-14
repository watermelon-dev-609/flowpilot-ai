export type CitationReadinessInput = {
  brandName: string;
  region: string;
  productName: string;
  topicTitle?: string;
  targetUrl?: string;
  content: string;
};

export type CitationReadinessCheck = {
  label: string;
  score: number;
  passed: boolean;
  message: string;
};

export type CitationReadinessResult = {
  overall: number;
  level: "较强" | "中等" | "较弱";
  checks: {
    entityClarity: CitationReadinessCheck;
    directAnswer: CitationReadinessCheck;
    faqCoverage: CitationReadinessCheck;
    sourceSupport: CitationReadinessCheck;
    marketingRisk: CitationReadinessCheck;
    crawlReadiness: CitationReadinessCheck;
  };
  recommendations: string[];
};

const absoluteClaims = ["行业第一", "唯一", "保证排名", "保证收录", "保证引用", "效果最好"];

export function evaluateCitationReadiness(input: CitationReadinessInput): CitationReadinessResult {
  validateCitationInput(input);

  const normalizedContent = input.content.trim();
  const checks = {
    entityClarity: evaluateEntityClarity(input, normalizedContent),
    directAnswer: evaluateDirectAnswer(input, normalizedContent),
    faqCoverage: evaluateFaqCoverage(normalizedContent),
    sourceSupport: evaluateSourceSupport(normalizedContent),
    marketingRisk: evaluateMarketingRisk(normalizedContent),
    crawlReadiness: evaluateCrawlReadiness(input.targetUrl)
  };

  const overall = Math.round(
    checks.entityClarity.score * 0.22 +
      checks.directAnswer.score * 0.18 +
      checks.faqCoverage.score * 0.16 +
      checks.sourceSupport.score * 0.18 +
      checks.marketingRisk.score * 0.16 +
      checks.crawlReadiness.score * 0.1
  );

  return {
    overall,
    level: overall >= 80 ? "较强" : overall >= 70 ? "中等" : "较弱",
    checks,
    recommendations: buildRecommendations(checks)
  };
}

function validateCitationInput(input: CitationReadinessInput) {
  if (!input.brandName.trim() || !input.region.trim() || !input.productName.trim() || !input.content.trim()) {
    throw new Error("请填写品牌名称、目标地域、产品名称和待检查内容");
  }
}

function evaluateEntityClarity(input: CitationReadinessInput, content: string): CitationReadinessCheck {
  const hitCount = [input.brandName, input.region, input.productName].filter((entity) => content.includes(entity)).length;
  const score = hitCount === 3 ? 92 : hitCount === 2 ? 78 : hitCount === 1 ? 58 : 35;

  return {
    label: "实体清晰度",
    score,
    passed: score >= 75,
    message: score >= 75 ? "品牌、地域和产品实体较清晰。" : "建议在标题、首段或正文中明确品牌、地域和产品实体。"
  };
}

function evaluateDirectAnswer(input: CitationReadinessInput, content: string): CitationReadinessCheck {
  const firstParagraph = content.split(/\n\s*\n/)[0] ?? "";
  const hasProduct = firstParagraph.includes(input.productName);
  const hasDefinition = ["是", "一类", "用于", "适合", "解决"].some((word) => firstParagraph.includes(word));
  const score = hasProduct && hasDefinition && firstParagraph.length >= 50 ? 88 : hasProduct ? 68 : 45;

  return {
    label: "首段直接回答",
    score,
    passed: score >= 75,
    message: score >= 75 ? "首段能够直接说明主题。" : "建议前 150 字直接回答“是什么、有什么用、适合谁”。"
  };
}

function evaluateFaqCoverage(content: string): CitationReadinessCheck {
  const hasFaq = /常见问题|FAQ|问：|答：|Q[:：]|A[:：]/i.test(content);
  const score = hasFaq ? 86 : 48;

  return {
    label: "FAQ 覆盖",
    score,
    passed: hasFaq,
    message: hasFaq ? "已包含问答结构。" : "建议增加 2–3 个真实用户问题，帮助 AI 抽取答案。"
  };
}

function evaluateSourceSupport(content: string): CitationReadinessCheck {
  const hasSource = ["资料来源", "公开资料", "项目图片", "产品说明", "可核验", "人工核对", "人工复核"].some((word) =>
    content.includes(word)
  );
  const score = hasSource ? 88 : 45;

  return {
    label: "事实来源支撑",
    score,
    passed: hasSource,
    message: hasSource ? "内容包含来源或复核边界。" : "建议补充资料来源、参数依据或人工复核说明。"
  };
}

function evaluateMarketingRisk(content: string): CitationReadinessCheck {
  const hasRisk = absoluteClaims.some((claim) => content.includes(claim));
  const score = hasRisk ? 35 : 90;

  return {
    label: "营销风险",
    score,
    passed: !hasRisk,
    message: hasRisk ? "存在不可验证或绝对化宣传。" : "未发现明显绝对化承诺。"
  };
}

function evaluateCrawlReadiness(targetUrl?: string): CitationReadinessCheck {
  const hasUrl = Boolean(targetUrl?.trim());
  const isHttp = !targetUrl || targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
  const score = hasUrl && isHttp ? 82 : hasUrl ? 40 : 62;

  return {
    label: "爬虫可读性提示",
    score,
    passed: score >= 70,
    message: score >= 70 ? "目标链接格式可用于后续收录记录。" : "建议填写真实目标页面链接，并保持页面可公开访问。"
  };
}

function buildRecommendations(checks: CitationReadinessResult["checks"]) {
  const recommendations: string[] = [];

  if (!checks.entityClarity.passed) {
    recommendations.push("在标题、首段和小标题中自然出现品牌、地域和产品实体。");
  }
  if (!checks.directAnswer.passed) {
    recommendations.push("把文章首段改成直接答案，优先说明“是什么、适合谁、解决什么问题”。");
  }
  if (!checks.faqCoverage.passed) {
    recommendations.push("增加 FAQ 问答区，覆盖用户会向 AI 提问的具体问题。");
  }
  if (!checks.sourceSupport.passed) {
    recommendations.push("补充资料来源、项目图片、产品说明或人工复核边界。");
  }
  if (!checks.marketingRisk.passed) {
    recommendations.push("删除“保证收录、保证引用、行业第一”等不可验证承诺。");
  }
  if (!checks.crawlReadiness.passed) {
    recommendations.push("填写真实公开页面链接，后续才能做页面检索和来源引用记录。");
  }

  recommendations.push("继续保留可核验资料和人工复核边界，不要把评分包装成排名承诺。");
  return recommendations;
}
