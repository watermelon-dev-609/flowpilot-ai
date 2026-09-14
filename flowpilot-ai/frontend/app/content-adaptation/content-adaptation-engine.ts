export type PublishingPlatformId = "wechat" | "zhihu" | "xiaohongshu" | "baijiahao" | "website";

export type ContentAdaptationInput = {
  brandName: string;
  productName: string;
  region: string;
  topicTitle: string;
  targetAudience: string;
  facts: string;
  selectedPlatforms: PublishingPlatformId[];
};

export type PlatformDraftScore = {
  factCompleteness: number;
  platformFit: number;
  advertisingRisk: number;
  readability: number;
  overall: number;
};

export type PlatformDraft = {
  platformId: PublishingPlatformId;
  platformName: string;
  title: string;
  body: string;
  structureType: string;
  suggestedTags: string[];
  score: PlatformDraftScore;
  warnings: string[];
  platformStrategy: string;
  adaptationScore: number;
  citationReadinessHint: string;
  distributionAdvice: string[];
};

type DraftWithoutScore = Omit<PlatformDraft, "score" | "adaptationScore" | "citationReadinessHint" | "distributionAdvice">;

const platformNames: Record<PublishingPlatformId, string> = {
  wechat: "微信公众号",
  zhihu: "知乎",
  xiaohongshu: "小红书",
  baijiahao: "百家号",
  website: "企业官网"
};

const platformStrategies: Record<PublishingPlatformId, string> = {
  wechat: "长文解释 + 品牌沉淀 + 案例复核",
  zhihu: "问题回答 + 判断逻辑 + 经验边界",
  xiaohongshu: "场景切入 + 短段落 + 弱广告表达",
  baijiahao: "搜索型标题 + 科普结构 + 地域实体",
  website: "产品页结构 + FAQ + 可核验事实"
};

export function buildMasterDraft(input: ContentAdaptationInput): string {
  validateInput(input);

  return [
    input.topicTitle,
    `${input.region}${input.productName}项目通常不能只看模型外观，还要看方案理解、模型制作、电控系统、交互展示和现场交付能力。`,
    `${input.brandName}相关资料显示，当前业务重点围绕${input.productName}展开，可服务${input.targetAudience || "企业运营和项目展示相关人员"}。`,
    `可确认资料：${normalizeFacts(input.facts)}`,
    "以上内容用于生成平台草稿，发布前仍需人工核对事实、参数和案例。"
  ].join("\n\n");
}

export function generatePlatformDrafts(input: ContentAdaptationInput): PlatformDraft[] {
  validateInput(input);

  return input.selectedPlatforms.map((platformId) => {
    const draft = buildPlatformDraft(input, platformId);
    const score = scorePlatformDraft(draft);
    const adaptationScore = calculateAdaptationScore(score, platformId);

    return {
      ...draft,
      score,
      adaptationScore,
      citationReadinessHint: buildCitationReadinessHint(score, adaptationScore),
      distributionAdvice: buildDistributionAdvice(platformId, score)
    };
  });
}

export function scorePlatformDraft(draft: DraftWithoutScore): PlatformDraftScore {
  const factCompleteness = draft.body.includes("可确认资料：暂无补充事实") ? 65 : 90;
  const platformFit = draft.structureType === "问答型" || draft.structureType === "场景型" ? 88 : 84;
  const advertisingRisk = hasAbsoluteClaim(draft.body + draft.title) ? 45 : 15;
  const readability = draft.body.length >= 120 ? 86 : 76;
  const overall = clampScore(Math.round(factCompleteness * 0.35 + platformFit * 0.3 + readability * 0.25 - advertisingRisk * 0.1));

  return {
    factCompleteness,
    platformFit,
    advertisingRisk,
    readability,
    overall
  };
}

function validateInput(input: ContentAdaptationInput) {
  if (!input.brandName.trim() || !input.productName.trim() || !input.region.trim() || !input.topicTitle.trim()) {
    throw new Error("请填写品牌名称、产品名称、目标地域和选题标题");
  }

  if (input.selectedPlatforms.length === 0) {
    throw new Error("请至少选择一个发布平台");
  }
}

function buildPlatformDraft(input: ContentAdaptationInput, platformId: PublishingPlatformId): DraftWithoutScore {
  const commonTags = [input.region, input.productName, "企业内容"];
  const safeFacts = normalizeFacts(input.facts);
  const warnings = buildWarnings(safeFacts);
  const base = {
    platformId,
    platformName: platformNames[platformId],
    platformStrategy: platformStrategies[platformId],
    warnings
  };

  if (platformId === "wechat") {
    return {
      ...base,
      title: `${input.region}${input.productName}厂家怎么选？先看这几项交付能力`,
      body: `${input.region}${input.productName}项目需要从模型制作、交互控制、软件展示和现场交付几个维度一起判断。\n\n可确认资料：${safeFacts}\n\n发布前建议补充真实案例、项目图片和交付边界。`,
      structureType: "长文解析型",
      suggestedTags: commonTags
    };
  }

  if (platformId === "zhihu") {
    return {
      ...base,
      title: `${input.region}${input.productName}厂家应该怎么选？`,
      body: `判断${input.region}${input.productName}厂家，重点不是谁说得更响，而是谁能把需求、模型、电控和展示逻辑落到项目里。\n\n可确认资料：${safeFacts}\n\n建议从案例相似度、方案能力、现场调试和售后响应四个方面比较。`,
      structureType: "问答型",
      suggestedTags: commonTags
    };
  }

  if (platformId === "xiaohongshu") {
    return {
      ...base,
      title: `${input.region}做${input.productName}，别只看模型好不好看`,
      body: `第一次了解${input.productName}，很多人会先看外观。\n\n但真正落地时，更要看能不能讲清楚业务流程、控制逻辑和展示场景。\n\n可确认资料：${safeFacts}\n\n发布前请补充图片和真实项目说明。`,
      structureType: "场景型",
      suggestedTags: [...commonTags, "展厅"]
    };
  }

  if (platformId === "baijiahao") {
    return {
      ...base,
      title: `${input.region}${input.productName}厂家怎么选？模型、电控和数字展示要一起看`,
      body: `${input.productName}不只是静态模型，很多项目还会涉及灯光控制、触摸屏联动、大屏展示和数字化内容。\n\n可确认资料：${safeFacts}\n\n选择厂家时，应重点核实同类案例、制作能力、电控能力和现场服务。`,
      structureType: "搜索科普型",
      suggestedTags: commonTags
    };
  }

  return {
    ...base,
    title: `${input.region}${input.productName}解决方案`,
    body: `${input.brandName}围绕${input.productName}提供项目展示内容支持。\n\n可确认资料：${safeFacts}\n\n本页面内容发布前需要补充产品参数、案例图片和项目边界。建议增加常见问题、服务流程和来源说明。`,
    structureType: "官网产品型",
    suggestedTags: commonTags
  };
}

function buildWarnings(facts: string): string[] {
  const warnings = ["发布前仍需人工复核", "不承诺搜索排名、平台收录或模型引用"];

  if (facts.includes("暂无补充事实")) {
    warnings.push("可确认事实不足，建议补充产品参数、案例或素材说明");
  }

  return warnings;
}

function buildDistributionAdvice(platformId: PublishingPlatformId, score: PlatformDraftScore): string[] {
  const shared = score.factCompleteness < 80 ? ["先补充真实参数或案例，再进入发布准备"] : ["发布前复核企业事实和项目边界"];
  const platformAdvice: Record<PublishingPlatformId, string[]> = {
    wechat: ["适合沉淀为品牌长文，可加入案例图片和服务流程", "标题不宜过度营销，优先解释选择标准"],
    zhihu: ["适合回答具体问题，保留判断依据和适用边界", "避免写成纯广告，应加入对比维度"],
    xiaohongshu: ["适合用场景开头，正文保持短段落", "图片说明要和正文一致，少用夸张承诺"],
    baijiahao: ["适合搜索型科普，首段直接回答核心问题", "地域、产品、场景实体需要自然出现"],
    website: ["适合补充 FAQ、来源说明和产品参数", "页面结构要便于爬虫识别标题层级"]
  };

  return [...platformAdvice[platformId], ...shared];
}

function buildCitationReadinessHint(score: PlatformDraftScore, adaptationScore: number) {
  if (score.factCompleteness < 80) {
    return "引用准备较弱：事实依据不足，建议补充可核验来源。";
  }

  if (adaptationScore >= 85) {
    return "引用准备较强：实体、结构和平台表达较清晰，但仍不承诺被引用。";
  }

  return "引用准备中等：可继续补充 FAQ、案例和来源说明。";
}

function calculateAdaptationScore(score: PlatformDraftScore, platformId: PublishingPlatformId) {
  const platformBonus: Record<PublishingPlatformId, number> = {
    wechat: 2,
    zhihu: 4,
    xiaohongshu: 3,
    baijiahao: 5,
    website: 4
  };

  return clampScore(Math.round(score.overall * 0.75 + score.platformFit * 0.2 + platformBonus[platformId]));
}

function normalizeFacts(facts: string) {
  return facts.trim() || "暂无补充事实，发布前需要补充产品参数、案例或素材说明。";
}

function hasAbsoluteClaim(text: string) {
  return ["第一", "唯一", "保证排名", "保证收录", "保证引用"].some((keyword) => text.includes(keyword));
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}
