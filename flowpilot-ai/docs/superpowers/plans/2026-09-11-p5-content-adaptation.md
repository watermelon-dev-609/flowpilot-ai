# P5 母稿生成与多平台内容适配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不接入真实模型接口的前提下，先完成“研究选题 → 内容母稿 → 多平台差异化改写 → 质量检查 → 导出草稿”的前端最小闭环。

**Architecture:** P5 先做纯前端、规则驱动、可测试的内容适配闭环，避免与当前中文化审计收尾和后端持久化任务冲突。核心生成逻辑放在独立纯函数文件，页面只负责表单、状态和展示，后续再把纯函数替换为后端接口或模型工作流。

**Tech Stack:** Next.js App Router、React、TypeScript、Tailwind CSS、Vitest、Testing Library。

**Spec:** `C:\Users\EDY\Documents\简历\FlowPilot_AI_项目计划.md`

## Global Constraints

- 当前另一个 AI 正在处理中文化审计收尾，执行本计划前必须先确认该分支测试与构建已经稳定。
- 只处理用户可见文案时使用中文；代码变量、接口路径、库名、测试文件名可以保留英文。
- 不承诺搜索排名、模型引用、搜索收录或来源引用，只表达“内容适配建议、发布前检查、内部质量评分”。
- P5 不接入真实模型接口，不联网搜索，不自动发布外部平台。
- P5 不保存账号、密钥、Cookie，不做平台登录和浏览器自动化发布。
- 页面必须包含加载、空、错误、表单校验、提交防重复状态。
- 生成逻辑必须可单元测试，业务规则与页面渲染分离。
- 执行 UI 代码前需要补跑 UI-UX-Pro-Max 设计系统查询；当前环境没有 `python` 命令，执行者应先解决 Python 路径或用已有 Ant Design Pro 风格延续。

---

## File Structure

- Create: `frontend/app/content-adaptation/content-adaptation-engine.ts`
  - 负责内容母稿、多平台草稿、质量评分的纯函数。
- Create: `frontend/app/content-adaptation/content-adaptation-workspace.tsx`
  - 负责 P5 页面交互、表单状态、生成状态、草稿预览。
- Create: `frontend/app/content-adaptation/page.tsx`
  - 负责页面标题、描述和工作区挂载。
- Create: `frontend/__tests__/p5-content-adaptation-engine.test.ts`
  - 覆盖纯函数正常、边界、异常场景。
- Create: `frontend/__tests__/p5-content-adaptation-page.test.tsx`
  - 覆盖页面交互、空状态、错误状态、多平台卡片。
- Modify: `frontend/app/components/state-card.tsx`
  - 在全局导航增加“内容适配”入口。
- Modify: `FlowPilot_AI_项目计划.md`
  - P5 完成后追加进度记录。注意先确认文件编码，避免追加乱码。

---

### Task 1: 内容适配纯函数

**Files:**
- Create: `frontend/app/content-adaptation/content-adaptation-engine.ts`
- Test: `frontend/__tests__/p5-content-adaptation-engine.test.ts`

**Interfaces:**
- Produces:
  - `type ContentAdaptationInput`
  - `type PublishingPlatformId`
  - `type PlatformDraft`
  - `function buildMasterDraft(input: ContentAdaptationInput): string`
  - `function generatePlatformDrafts(input: ContentAdaptationInput): PlatformDraft[]`
  - `function scorePlatformDraft(draft: PlatformDraft): PlatformDraft["score"]`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { generatePlatformDrafts } from "../app/content-adaptation/content-adaptation-engine";

describe("P5 内容适配引擎", () => {
  it("从同一份业务资料生成差异明显的多平台草稿", () => {
    const drafts = generatePlatformDrafts({
      brandName: "武汉微艺达智能科技有限公司",
      productName: "智能沙盘",
      region: "武汉",
      topicTitle: "武汉智能沙盘厂家怎么选？",
      targetAudience: "企业展厅和智慧园区项目负责人",
      facts: "支持实体模型、灯光控制、触摸屏联动和数字孪生展示。",
      selectedPlatforms: ["wechat", "zhihu", "xiaohongshu", "baijiahao"]
    });

    expect(drafts).toHaveLength(4);
    expect(drafts.map((draft) => draft.title)).toEqual([
      "武汉智能沙盘厂家怎么选？先看这几项交付能力",
      "武汉智能沙盘厂家应该怎么选？",
      "武汉做智能沙盘，别只看模型好不好看",
      "武汉智能沙盘厂家怎么选？模型、电控和数字展示要一起看"
    ]);
    expect(new Set(drafts.map((draft) => draft.structureType)).size).toBeGreaterThan(1);
    expect(drafts.every((draft) => draft.score.overall >= 70)).toBe(true);
  });

  it("缺少核心资料时返回可读错误", () => {
    expect(() =>
      generatePlatformDrafts({
        brandName: "",
        productName: "智能沙盘",
        region: "武汉",
        topicTitle: "武汉智能沙盘厂家怎么选？",
        targetAudience: "企业客户",
        facts: "支持触摸屏联动。",
        selectedPlatforms: ["wechat"]
      })
    ).toThrow("请填写品牌名称、产品名称、目标地域和选题标题");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts
```

Expected: FAIL because `content-adaptation-engine.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**

Create `frontend/app/content-adaptation/content-adaptation-engine.ts`:

```ts
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

export type PlatformDraft = {
  platformId: PublishingPlatformId;
  platformName: string;
  title: string;
  body: string;
  structureType: string;
  suggestedTags: string[];
  score: {
    factCompleteness: number;
    platformFit: number;
    advertisingRisk: number;
    readability: number;
    overall: number;
  };
};

const platformNames: Record<PublishingPlatformId, string> = {
  wechat: "微信公众号",
  zhihu: "知乎",
  xiaohongshu: "小红书",
  baijiahao: "百家号",
  website: "企业官网"
};

export function buildMasterDraft(input: ContentAdaptationInput): string {
  validateInput(input);
  return [
    `${input.topicTitle}`,
    `${input.region}${input.productName}项目通常不能只看模型外观，还要看方案理解、模型制作、电控系统、交互展示和现场交付能力。`,
    `${input.brandName}相关资料显示，当前业务重点围绕${input.productName}展开，可服务${input.targetAudience}。`,
    `可确认资料：${input.facts}`,
    "以上内容用于生成平台草稿，发布前仍需人工核对事实、参数和案例。"
  ].join("\n\n");
}

export function generatePlatformDrafts(input: ContentAdaptationInput): PlatformDraft[] {
  validateInput(input);
  return input.selectedPlatforms.map((platformId) => {
    const draft = buildPlatformDraft(input, platformId);
    return { ...draft, score: scorePlatformDraft(draft) };
  });
}

export function scorePlatformDraft(draft: Omit<PlatformDraft, "score">): PlatformDraft["score"] {
  const factCompleteness = draft.body.includes("可确认资料") ? 90 : 70;
  const platformFit = draft.structureType === "问答型" || draft.structureType === "场景型" ? 88 : 82;
  const advertisingRisk = draft.body.includes("最") || draft.body.includes("第一") ? 40 : 15;
  const readability = draft.body.length > 120 ? 86 : 76;
  const overall = Math.round(factCompleteness * 0.35 + platformFit * 0.3 + readability * 0.25 - advertisingRisk * 0.1);

  return { factCompleteness, platformFit, advertisingRisk, readability, overall };
}

function validateInput(input: ContentAdaptationInput) {
  if (!input.brandName.trim() || !input.productName.trim() || !input.region.trim() || !input.topicTitle.trim()) {
    throw new Error("请填写品牌名称、产品名称、目标地域和选题标题");
  }
  if (input.selectedPlatforms.length === 0) {
    throw new Error("请至少选择一个发布平台");
  }
}

function buildPlatformDraft(input: ContentAdaptationInput, platformId: PublishingPlatformId): Omit<PlatformDraft, "score"> {
  const commonTags = [input.region, input.productName, "企业内容"];

  if (platformId === "wechat") {
    return {
      platformId,
      platformName: platformNames[platformId],
      title: `${input.region}${input.productName}厂家怎么选？先看这几项交付能力`,
      structureType: "长文解析型",
      suggestedTags: commonTags,
      body: `${input.region}${input.productName}项目需要从模型制作、交互控制、软件展示和现场交付几个维度一起判断。\n\n可确认资料：${input.facts}\n\n发布前建议补充真实案例、项目图片和交付边界。`
    };
  }

  if (platformId === "zhihu") {
    return {
      platformId,
      platformName: platformNames[platformId],
      title: `${input.region}${input.productName}厂家应该怎么选？`,
      structureType: "问答型",
      suggestedTags: commonTags,
      body: `判断${input.region}${input.productName}厂家，重点不是谁说得更响，而是谁能把需求、模型、电控和展示逻辑落到项目里。\n\n可确认资料：${input.facts}\n\n建议从案例相似度、方案能力、现场调试和售后响应四个方面比较。`
    };
  }

  if (platformId === "xiaohongshu") {
    return {
      platformId,
      platformName: platformNames[platformId],
      title: `${input.region}做${input.productName}，别只看模型好不好看`,
      structureType: "场景型",
      suggestedTags: [...commonTags, "展厅"],
      body: `第一次了解${input.productName}，很多人会先看外观。\n\n但真正落地时，更要看能不能讲清楚业务流程、控制逻辑和展示场景。\n\n可确认资料：${input.facts}\n\n发布前请补充图片和真实项目说明。`
    };
  }

  if (platformId === "baijiahao") {
    return {
      platformId,
      platformName: platformNames[platformId],
      title: `${input.region}${input.productName}厂家怎么选？模型、电控和数字展示要一起看`,
      structureType: "搜索科普型",
      suggestedTags: commonTags,
      body: `${input.productName}不只是静态模型，很多项目还会涉及灯光控制、触摸屏联动、大屏展示和数字化内容。\n\n可确认资料：${input.facts}\n\n选择厂家时，应重点核实同类案例、制作能力、电控能力和现场服务。`
    };
  }

  return {
    platformId,
    platformName: platformNames[platformId],
    title: `${input.region}${input.productName}解决方案`,
    structureType: "官网产品型",
    suggestedTags: commonTags,
    body: `${input.brandName}围绕${input.productName}提供项目展示内容支持。\n\n可确认资料：${input.facts}\n\n本页面内容发布前需要补充产品参数、案例图片和项目边界。`
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/app/content-adaptation/content-adaptation-engine.ts frontend/__tests__/p5-content-adaptation-engine.test.ts
git commit -m "feat: add content adaptation engine"
```

---

### Task 2: 内容适配页面最小闭环

**Files:**
- Create: `frontend/app/content-adaptation/page.tsx`
- Create: `frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- Test: `frontend/__tests__/p5-content-adaptation-page.test.tsx`

**Interfaces:**
- Consumes:
  - `generatePlatformDrafts(input: ContentAdaptationInput): PlatformDraft[]`
- Produces:
  - `/content-adaptation` route
  - 页面包含“内容适配工作台”“生成平台草稿”“暂无平台草稿”“发布前仍需人工复核”等中文可见文案。

- [ ] **Step 1: Write the failing test**

```ts
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ContentAdaptationPage from "../app/content-adaptation/page";

describe("P5 内容适配页面", () => {
  it("填写业务资料后生成多平台草稿卡片", async () => {
    render(<ContentAdaptationPage />);

    expect(screen.getByRole("heading", { name: "内容适配工作台" })).toBeInTheDocument();
    expect(screen.getByText("暂无平台草稿")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
    fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
    fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
    fireEvent.change(screen.getByLabelText("选题标题"), { target: { value: "武汉智能沙盘厂家怎么选？" } });
    fireEvent.change(screen.getByLabelText("目标受众"), { target: { value: "企业展厅和智慧园区项目负责人" } });
    fireEvent.change(screen.getByLabelText("可确认事实"), { target: { value: "支持实体模型、灯光控制、触摸屏联动和数字孪生展示。" } });
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

    expect(await screen.findByText("微信公众号")).toBeInTheDocument();
    expect(screen.getByText("知乎")).toBeInTheDocument();
    expect(screen.getByText("小红书")).toBeInTheDocument();
    expect(screen.getAllByText(/综合评分/).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("发布前仍需人工复核")).toBeInTheDocument();
  });

  it("缺少必填项时显示错误状态", async () => {
    render(<ContentAdaptationPage />);
    fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("请填写品牌名称、产品名称、目标地域和选题标题");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: FAIL because route/page does not exist.

- [ ] **Step 3: Write minimal page implementation**

Implement page with:

- A form section named “新建 / 录入操作区”
- Required inputs:
  - 品牌名称
  - 产品名称
  - 目标地域
  - 选题标题
  - 目标受众
  - 可确认事实
- Platform checkboxes:
  - 微信公众号
  - 知乎
  - 小红书
  - 百家号
  - 企业官网
- Empty state:
  - “暂无平台草稿”
- Draft card:
  - platform name
  - title
  - structure type
  - score
  - tags
  - body preview
- Boundary warning:
  - “发布前仍需人工复核”
  - “本功能不承诺搜索排名、模型引用或平台收录。”

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/app/content-adaptation/page.tsx frontend/app/content-adaptation/content-adaptation-workspace.tsx frontend/__tests__/p5-content-adaptation-page.test.tsx
git commit -m "feat: add content adaptation workspace"
```

---

### Task 3: 全局导航接入

**Files:**
- Modify: `frontend/app/components/state-card.tsx`
- Test: `frontend/__tests__/p5-content-adaptation-page.test.tsx`

**Interfaces:**
- Consumes:
  - `/content-adaptation` route from Task 2
- Produces:
  - 全局导航出现“内容适配”入口，链接到 `/content-adaptation`

- [ ] **Step 1: Write the failing test**

Add to `frontend/__tests__/p5-content-adaptation-page.test.tsx`:

```ts
it("全局导航包含内容适配入口", () => {
  render(<ContentAdaptationPage />);
  const link = screen.getByRole("link", { name: "内容适配" });
  expect(link).toHaveAttribute("href", "/content-adaptation");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: FAIL because navigation link is missing.

- [ ] **Step 3: Add navigation entry**

Modify `frontend/app/components/state-card.tsx` navigation items:

```ts
{
  group: "内容",
  items: [
    { href: "/geo-research", label: "生成式优化研究", icon: Network },
    { href: "/content-adaptation", label: "内容适配", icon: FileText }
  ]
}
```

If `FileText` is not imported from `lucide-react`, add it to the existing import list.

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/app/components/state-card.tsx frontend/__tests__/p5-content-adaptation-page.test.tsx
git commit -m "feat: add content adaptation navigation"
```

---

### Task 4: 导出草稿文本

**Files:**
- Modify: `frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- Test: `frontend/__tests__/p5-content-adaptation-page.test.tsx`

**Interfaces:**
- Consumes:
  - Generated `PlatformDraft[]`
- Produces:
  - “复制全部草稿” button
  - “下载草稿文本” button

- [ ] **Step 1: Write the failing test**

Add:

```ts
it("支持复制和下载平台草稿", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });

  render(<ContentAdaptationPage />);
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
  fireEvent.change(screen.getByLabelText("选题标题"), { target: { value: "武汉智能沙盘厂家怎么选？" } });
  fireEvent.change(screen.getByLabelText("目标受众"), { target: { value: "企业展厅负责人" } });
  fireEvent.change(screen.getByLabelText("可确认事实"), { target: { value: "支持触摸屏联动。" } });
  fireEvent.click(screen.getByRole("button", { name: "生成平台草稿" }));

  fireEvent.click(await screen.findByRole("button", { name: "复制全部草稿" }));
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining("微信公众号"));
  expect(screen.getByText("已复制平台草稿")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: FAIL because copy/download actions are missing.

- [ ] **Step 3: Implement copy and download**

Implement helper inside workspace:

```ts
function serializeDrafts(drafts: PlatformDraft[]) {
  return drafts
    .map((draft) => [`## ${draft.platformName}`, draft.title, draft.body, `综合评分：${draft.score.overall}`].join("\n\n"))
    .join("\n\n---\n\n");
}
```

Buttons:

- `复制全部草稿`
- `下载草稿文本`

Download file name:

```ts
content-drafts.txt
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add frontend/app/content-adaptation/content-adaptation-workspace.tsx frontend/__tests__/p5-content-adaptation-page.test.tsx
git commit -m "feat: export adapted content drafts"
```

---

### Task 5: Verification and project record

**Files:**
- Modify: `FlowPilot_AI_项目计划.md`

**Interfaces:**
- Consumes:
  - All P5 tests from previous tasks
- Produces:
  - P5 progress record in the project plan

- [ ] **Step 1: Run focused P5 tests**

Run:

```powershell
npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full frontend tests**

Run:

```powershell
npm.cmd run test -- --run
```

Expected: PASS. If tests fail because another AI is still changing中文化审计 files, stop and report the exact failures before editing.

- [ ] **Step 3: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Check local page**

If dev server is running:

```powershell
Invoke-WebRequest http://127.0.0.1:3000/content-adaptation -UseBasicParsing -TimeoutSec 10
```

Expected: HTTP 200.

- [ ] **Step 5: Append project progress record**

Append to `C:\Users\EDY\Documents\简历\FlowPilot_AI_项目计划.md` only after confirming file encoding is safe. If terminal displays乱码, use an editor or a UTF-8 safe script; do not blindly append broken text.

Record:

```markdown
### 2026-09-11｜P5.0 母稿生成与多平台内容适配

状态：已完成 / 部分完成 / 未通过

完成内容：
- 新增内容适配工作台。
- 新增规则驱动的内容母稿与多平台草稿生成。
- 支持微信公众号、知乎、小红书、百家号、企业官网草稿。
- 支持草稿质量评分、复制和文本下载。

验证方式：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-adaptation`

验证结果：
- 

问题与修复：
- 

潜在风险点：
- 当前为本地规则驱动，不代表真实平台推荐机制。
- 当前草稿不自动发布，仍需人工复核。
- 当前评分仅用于内部内容决策，不承诺收录、排名或引用。

下一步：
- 进入 P5.1：从研究页选题一键带入内容适配。
```

- [ ] **Step 6: Commit**

```powershell
git add C:\Users\EDY\Documents\简历\FlowPilot_AI_项目计划.md
git commit -m "docs: record p5 content adaptation progress"
```

---

## Self-Review

**Spec coverage:**  
This plan covers P5 “母稿生成与多平台内容适配” as a safe next stage after P4.2. It does not cover automatic publishing, backend persistence, model invocation, or external monitoring because those belong to later phases.

**Placeholder scan:**  
No task contains TBD/TODO placeholders. Each task includes files, interfaces, test command, expected failure, implementation outline, verification, and commit command.

**Type consistency:**  
`ContentAdaptationInput`, `PublishingPlatformId`, `PlatformDraft`, `buildMasterDraft`, `generatePlatformDrafts`, and `scorePlatformDraft` are introduced in Task 1 and reused consistently in later tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-11-p5-content-adaptation.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, faster but requires clean workspace coordination.
2. **Inline Execution** - Execute tasks in this session with checkpoints, safer while another AI is still editing nearby files.

Recommended choice for this project right now: **Inline Execution after the other AI finishes中文化审计**, because P5 will touch navigation and new pages, and should not run while global UI copy tests are unstable.
