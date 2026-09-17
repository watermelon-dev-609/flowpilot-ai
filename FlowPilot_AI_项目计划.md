# FlowPilot AI 项目计划

> 本文档是 FlowPilot AI 的**稳定规格与规划大纲（源真相）**，只收录不随日常开发频繁变动的内容；所有带日期的开发记录已拆分到下方文档地图中的「开发日志 / P0–P4 记录 / UI 完成记录」三份文件。

## 文档地图

| 文档 | 角色 | 内容 |
|---|---|---|
| `FlowPilot_AI_项目计划.md` | 本文件（源真相） | 项目定位、能力映射、方案、阶段计划、技术选型、页面结构、验收清单、工程纪律 |
| `FlowPilot_AI_开发日志.md` | 开发日志（§15 / §16） | 进度记录、GEO- 历史项目吸收计划 |
| `FlowPilot_AI_P0-P4记录.md` | 开发日志（§17） | P0–P4 各阶段计划与完成记录（按日期持续追加） |
| `FlowPilot_AI_UI完成记录.md` | 开发日志（UI 段） | UI 相关完成记录（按日期持续追加） |
| `FlowPilot_AI_UI参考.md` | UI 参考 | 设计系统方向、GitHub 参考、落地原则、迭代优先级、统一验收标准 |
| `FlowPilot_AI_开发文档.md` | 技术文档 | §0 实际实现现状（权威）；§1–§15 原始技术规划（非现状） |
| `FlowPilot_AI_对抗性代码审查.md` | 安全审查 | 后端 + 前端对抗性代码审查发现（S / M / H 分级） |
| `FlowPilot_AI_后续开发计划.md` | 开发计划 | 2026-09-15 起执行、2026-09-17 更新的后续路线、任务拆解与验收标准 |

> ⚠️ **文档权威性约定（2026-09-15 起生效）**
>
> - 判断「某能力是否已实现」→ 以 `FlowPilot_AI_开发文档.md` §0 和开发日志为准。
> - 判断「后续要做什么」→ 以 `FlowPilot_AI_后续开发计划.md` 为准。
> - `项目计划.md` §6.2 与 `开发文档.md` §1–§15 均为**历史规划**，不代表已实现。


> 本文档是 FlowPilot AI 后续开发、验收、进度记录的统一依据。  
> 当前原则：先确认需求，再开发；先完成一个可运行闭环，再扩展复杂能力。

## 1. 项目定位

项目名称：FlowPilot AI

项目副标题：企业 AI 智能运营工作台

第一阶段方向：企业产品内容与 GEO 工作台

最终目标：开发一个真实可用的企业 GEO / AI 运营系统。它可以反映个人在软件工程、AI 应用、GEO 内容优化、多平台运营、官网运营、电商运营、ComfyUI/AIGC、CAD/智能沙盘项目经验上的综合能力，但产品页面本身不展示“简历能力映射”或个人求职标签。

项目不是单纯的 AI 写文章工具，也不是大而全 SaaS。它首先服务真实工作场景：把企业产品图片、产品资料、项目资料转化为结构化产品理解、GEO 内容策略、多平台内容和可审核的运营交付物。

重要边界：项目不承诺 GEO 排名，不承诺一定被 ChatGPT、DeepSeek、Kimi、Gemini、豆包等 AI 平台引用。项目承诺的是提高内容的 AI Citation Readiness（AI 引用准备度），并通过 GEO Monitor 记录不同平台中的品牌提及、页面检索和来源引用情况。

## 2. 项目能力映射（规划用，不进入产品页面）

重要说明：

- 下表只用于开发规划和面试复盘，帮助判断功能是否能自然体现个人能力。
- 不在用户可见产品页面中出现“简历能力”“求职方向”“作品集”等表达。
- 产品 UI 始终面向企业运营人员，使用“业务能力闭环”“运营数据”“GEO 监测”“规则治理”“内容分发”等真实业务语言。

| 简历能力 | FlowPilot AI 对应模块 | 证明价值 |
|---|---|---|
| 软件工程本科 | 完整 Web 系统、前后端分离、数据建模 | 有工程化开发能力 |
| Python / FastAPI | AI 后端服务、Agent 工作流、文件处理 | 能写实际业务代码 |
| MySQL / PostgreSQL | 产品、项目、内容、审核、发布记录 | 具备数据库建模能力 |
| Linux / Git / GitHub | 本地运行、版本管理、部署准备 | 具备工程规范意识 |
| ChatGPT / DeepSeek / Claude 等 LLM | LLM Adapter、内容生成、审核 | 具备大模型应用能力 |
| Prompt Engineering | Prompt Library、Prompt 版本管理 | 能把提示词沉淀为系统资产 |
| Agent / AI Workflow | Product Agent、GEO Agent、Fact Checker、Critic | 能设计 AI 工作流 |
| GEO 文章优化 | GEO Research、Entity Map、Question Map、GEO Review | 具备生成式引擎优化实践 |
| 公众号 / 知乎 / 百家号 / 小红书 | Multi-platform Content Matrix | 具备多平台内容运营能力 |
| 企业官网运营 | 官网产品页、SEO/GEO 内容结构 | 具备企业数字化运营能力 |
| 电商运营 | Product Center、商品卖点、产品介绍 | 具备产品资料转化能力 |
| ComfyUI / AIGC | AIGC Studio、图片/视频 Prompt、素材工作流 | 具备 AIGC 视觉工作流实践 |
| CAD / 智能沙盘 | Project Workspace、项目资料理解、方案辅助 | 具备实体项目业务理解 |
| 对抗性审查 | Fact Check、Critic Agent、Unsupported Claim 标记 | 能控制 AI 输出质量 |
| 运营数据 | Dashboard、效率记录、GEO Monitor | 能量化项目价值 |

## 3. 三个方向的企业级方案

### 方案 A：企业产品内容与 GEO 工作台

状态：第一阶段优先实现。

核心流程：

产品图片 / 产品资料 → AI 产品理解 → GEO 实体分析 → 用户问题分析 → 文章生成 → 事实检查 → GEO 审核 → 多平台适配 → 导出 / 记录

适合原因：

- 最贴近当前工作中的 GEO 文章优化。
- 最容易形成可演示闭环。
- 最适合尽快写进简历。
- 后续可自然扩展到企业知识库、项目资料和 AIGC。

### 方案 B：企业知识库与项目智能运营平台

状态：第二阶段扩展。

核心流程：

企业资料 / CAD / Word / Excel / 图片 → 项目知识库 → 需求摘要 → 项目方案 → 报价结构建议 → 内容沉淀

适合原因：

- 更能串联 CAD、智能沙盘、方案、报价、实体项目经验。
- 对简历中“实体行业 + AI 应用”的差异化帮助很大。

暂不优先原因：

- 第一版开发复杂度较高。
- 如果过早开发，容易拖慢可展示成果。

### 方案 C：AI 内容增长与 AIGC 视觉生产平台

状态：第三阶段扩展。

核心流程：

产品内容 → 多平台文案 → 封面图 Prompt → ComfyUI 工作流 → 视频脚本 → AIGC 素材管理 → 发布记录 / GEO Monitor

适合原因：

- 能体现 ComfyUI、AI 图片、AI 视频、短视频内容能力。
- 适合后续强化 AIGC 内容运营方向。

暂不优先原因：

- 如果第一阶段就接入图片/视频生成，容易偏离“企业运营系统”主线。
- ComfyUI 接入需要额外环境与工作流管理。

## 4. 当前决策

只先完整实现方案 A。

架构上预留方案 B 和方案 C 的扩展接口，但不在 MVP 中完整开发。

新增背景：用户已有历史项目 `watermelon-dev-609/GEO-`，该项目是此前开发的 GEO 生成式搜索优化系统。FlowPilot AI 后续不能表现为“凭空新做一个项目”，而应吸收 GEO- 的已有经验，把它作为个人能力沉淀与新项目升级来源。

两者关系：

- `GEO-`：历史项目 / GEO v2.2 能力沉淀 / 可作为功能参考与简历前置证明。
- `FlowPilot AI`：新主轴项目 / 简历核心项目 / 面向企业产品内容、GEO、多平台适配、发布记录、AI 引用准备度的升级版。

当前不强行把 `GEO-` 代码合并进 `flowpilot-ai`。原则是：能用就用，不能用不勉强。当前 P0 已经建立 FlowPilot AI 新骨架，后续开发继续沿用新项目，同时把 `GEO-` 作为可复用资产池和历史项目经验来源。

复用优先级：

1. 优先复用经过验证的产品设计思想，例如 YAML 规则、GEO 评测、品牌监测、导出、合规审计。
2. 其次复用概念模型和数据字段，例如文章版本、平台规则、品牌实体、转化追踪。
3. 只有在代码结构清晰、依赖安全、脱敏成本低、与 FlowPilot 架构一致时，才复用具体代码。
4. 如果旧代码会拖慢新项目、引入安全风险、混淆概念或暴露公司内部信息，则不复用代码，只复用经验。

开发顺序：

1. 方案 A：产品内容与 GEO 闭环。
2. 方案 B：企业知识库、项目资料、CAD/智能沙盘、方案辅助。
3. 方案 C：ComfyUI、AIGC 图片视频、GEO Monitor、运营数据闭环。

## 5. MVP 主流程

第一版只做一条真实业务链路：

```text
创建产品
→ 上传产品图片
→ 填写产品资料
→ AI 生成结构化产品卡片
→ GEO Research 生成实体图与问题图
→ 生成 GEO 产品文章
→ Fact Check 标记事实与缺失依据
→ GEO Critic 输出评分和修改建议
→ AI Citation Readiness 检查
→ 生成多平台版本
→ 保存任务历史和进度记录
```

## 6. 阶段计划

> ⚠️ 本节曾长期与实际开发进度脱节。2026-09-15 核对后重写如下。
>
> 说明：本表原为 2026-09-09 立项时的**初始设想**（P0–P10 以「产品中心 → 内容生成」为主线），
> 实际开发中采用了另一套编号体系（P0 骨架起步，随后按 P1.x / P2.x / P3.x / P4–P34 递进），
> 两套编号并存容易误读，因此本节改为**以实际路线为准**，并保留原设想供对照。

### 6.1 实际完成路线（以 `FlowPilot_AI_开发日志.md` 与 `FlowPilot_AI_P0-P4记录.md` 为准）

| 阶段 | 模块 | 完成标准 | 状态 |
|---|---|---|---|
| P0 | 项目骨架 | 前后端结构、页面可打开、API 可访问 | ✅ 已完成 |
| P1.1–P1.5 | 规则中心 | 规则资产管理、本地 JSON 持久化、平台选择 | ✅ 已完成 |
| P2.0–P2.4 | 动态规则更新 + 真实 GEO 监测 | 来源复核、监测录入、证据附件、五页拆分、筛选分页 | ✅ 已完成 |
| P3.0–P3.2 | GEO 运营报告 | 报告范围筛选、Markdown 周报、一键复制 | ✅ 已完成 |
| P4–P25 | GEO Research 到多平台适配 | 选题图谱、内容适配、引用准备度、发布队列、契约抽离、仓储层 | ✅ 已完成 |
| P26–P34 | 内容日历与数据层收敛 | 异步数据状态、内容日历页面、后端 API 持久化、查询参数与分页 | ✅ 已完成 |
| S1.1–S1.5 | content_calendar 数据层正规化 | SQLAlchemy Repository、SQLite 兜底、JSON 降级、19 个数据层测试 | ✅ 已完成 |
| 首页台账联动 | 业务入口落地 | 首页参数进入发布准备、监测记录、监测报表并筛选上下文 | ✅ 已完成 |

### 6.2 立项时的初始设想（保留对照，非当前路线）

| 阶段 | 模块 | 状态 |
|---|---|---|
| P0 | 项目骨架 | 已由实际路线覆盖 |
| P1 | 产品中心（创建产品 / 上传图片） | 未按此路径实现 |
| P2 | AI 产品理解（结构化产品卡片） | 未按此路径实现 |
| P3 | GEO Research（实体图 / 问题图） | 已由 P4–P5 以另一种形态实现 |
| P4 | 内容生成（GEO 产品文章） | 未按此路径实现 |
| P5 | Fact Check | 未按此路径实现 |
| P6 | GEO Critic | 未按此路径实现 |
| P7 | AI 引用准备度 | 已由 P7 / P9 / P10 实现 |
| P8 | 多平台适配 | 已由 P5 / P8 实现 |
| P9 | 进度与数据记录 | 已由 P17–P28 内容日历实现 |
| P10 | 验收运行 | 持续进行中 |

> 待确认：6.2 中「未按此路径实现」的模块（产品中心、产品卡片、Fact Check、GEO Critic、文章生成）
> 是否需要补做，还是确认放弃。这直接影响项目是否仍符合「方案 A：产品内容与 GEO 闭环」的原始定位。

## 7. 进度记录规则

每完成一个阶段，必须在本文档追加进度记录。

记录内容包括：

- 完成时间
- 完成模块
- 实现内容
- 验证方式
- 验证结果
- 未通过项
- 修复记录
- 下一步

进度记录模板：

```markdown
### YYYY-MM-DD｜PX 模块名称

状态：已完成 / 部分完成 / 未通过

完成内容：
- 

验证方式：
- 

验证结果：
- 

问题与修复：
- 

下一步：
- 
```

## 8. 技术选型初稿

前端：

- Next.js
- TypeScript
- Tailwind CSS
- 响应式 Web 应用

后端：

- Python
- FastAPI
- Pydantic

数据库：

- MVP 可先用 SQLite 加快开发。
- 正式展示版升级 PostgreSQL。
- RAG 阶段接入 pgvector。

AI 层：

- LLM Adapter 统一封装模型调用。
- 不把业务逻辑绑定死在某一个模型。
- Prompt 独立管理，不能散落在页面代码中。
- MVP 可先用 mock / 可替换 provider，避免没有 API Key 时项目无法演示。

后续扩展：

- RAG / 企业知识库
- ComfyUI API
- GEO Monitor
- 文件解析：PDF、DOCX、Excel、Markdown、TXT

## 8.1 AI Citation Readiness 设计

AI Citation Readiness 是第一阶段新增的质量检查模块，用于评估一篇内容是否具备被搜索引擎和生成式 AI 理解、检索、引用的基础条件。

它不等同于排名，也不等同于引用保证。

评分维度：

| 维度 | 权重 | 检查内容 |
|---|---:|---|
| 实体清晰度 | 20 | 标题、正文、产品名、公司名、技术实体是否清楚一致 |
| 问题覆盖度 | 20 | 是否覆盖用户会问的 What / Why / How / Application / Comparison 问题 |
| 事实可信度 | 20 | 产品参数、案例、数据是否有资料依据，是否标记未知信息 |
| 结构化程度 | 15 | 是否有 H2/H3、列表、表格、FAQ、摘要式回答 |
| 原创信息增量 | 15 | 是否提供真实产品图片、实际应用、企业案例，而不是通用套话 |
| 爬虫可访问性 | 10 | 官网页面是否具备被搜索引擎和 AI 搜索爬虫访问的基础条件 |

输出示例：

```text
AI Citation Readiness Score：82/100

实体清晰度：18/20
问题覆盖度：17/20
事实可信度：16/20
结构化程度：13/15
原创信息增量：11/15
爬虫可访问性：7/10

结论：内容具备较好的 AI 引用准备度，但仍需补充真实案例和 FAQ。
```

## 8.2 GEO Monitor 设计

GEO Monitor 是后续扩展模块，用于记录内容在不同 AI 平台和搜索场景中的可见性。

监测结果分级：

| 等级 | 名称 | 含义 |
|---:|---|---|
| 0 | 未出现 | AI 回答中没有出现相关概念、品牌或页面 |
| 1 | 相关概念出现 | AI 回答提到了相关行业概念，但没有提到品牌 |
| 2 | 品牌提及 | AI 回答提到了企业或产品名称 |
| 3 | 页面检索 | AI 搜索结果中出现了目标页面 |
| 4 | 来源引用 | AI 明确引用了目标页面链接或来源 |

必须遵守的判断原则：

- Mention 不等于 Retrieval。
- Retrieval 不等于 Citation。
- Citation 不等于排名承诺。
- 监测数据只记录观察结果，不包装成绝对效果保证。

## 9. 页面结构

第一阶段页面：

- 工作台 Dashboard
- 产品中心 Product Center
- 产品详情 Product Detail
- AI Workspace
- GEO Research
- 内容中心 Content Center
- Prompt Library
- 进度记录 / 任务历史

核心工作台布局：

```text
┌─────────────┬──────────────────┬─────────────┐
│ Product     │   AI Workspace   │ Context     │
│ 产品图片     │   GEO 分析        │ 企业资料     │
│ 产品资料     │   内容生成        │ 产品资料     │
│ 参数         │   审核结果        │ 引用来源     │
└─────────────┴──────────────────┴─────────────┘
```

小屏适配时，三栏自动变成单栏或折叠布局。

## 10. 异常情况要求

- 图片上传失败时必须有明确提示。
- 产品资料为空时禁止直接生成文章。
- AI 接口失败时必须显示失败原因。
- AI 输出为空时允许重新生成。
- AI 生成中不能重复提交同一任务。
- 未知产品参数不能被 AI 自动编造。
- Fact Check 必须能标记缺少依据的内容。
- 网络异常时页面不能崩溃。
- 后端异常时前端必须显示可理解错误信息。
- 无 API Key 时项目仍可用 mock 模式演示核心流程。

## 11. 骨架屏与加载状态

骨架屏：

- 产品列表加载时显示骨架屏。
- 产品详情加载时显示骨架屏。
- GEO 分析区域加载时显示骨架屏。
- 内容生成区域加载时显示骨架屏。
- 审核结果区域加载时显示骨架屏。

加载状态：

- 上传图片时显示上传中。
- AI 产品理解时显示分析中。
- GEO Research 时显示生成中。
- 文章生成时显示写作中。
- Fact Check 时显示检查中。
- 多平台适配时显示转换中。
- 所有按钮在任务执行期间进入 disabled 状态。

## 12. 终端适配

必须适配：

- 桌面端 1440px
- 笔记本 1024px
- 平板 768px
- 手机 375px

移动端允许功能简化，但不能出现布局错乱。核心内容必须可浏览，核心流程必须可执行。

## 13. 精简验收清单

### 项目背景

- [ ] 项目名称为 FlowPilot AI。
- [ ] 项目定位为企业 AI 智能运营工作台。
- [ ] 第一阶段聚焦产品内容与 GEO 工作流。
- [ ] 项目说明中明确系统服务企业 GEO / AI 运营场景，个人能力只通过项目架构和业务闭环自然体现。
- [ ] 不承诺 GEO 排名，不承诺一定被 AI 引用。

### 核心流程

- [ ] 用户可以创建产品项目。
- [ ] 用户可以上传产品图片。
- [ ] 用户可以填写产品名称、参数、说明、应用场景。
- [ ] 系统可以生成结构化产品卡片。
- [ ] 系统可以生成 GEO 实体列表。
- [ ] 系统可以生成用户问题列表。
- [ ] 系统可以生成产品文章大纲。
- [ ] 系统可以生成完整产品文章。
- [ ] 系统可以进行事实检查。
- [ ] 系统可以进行 GEO 审核评分。
- [ ] 系统可以生成 AI Citation Readiness Score。
- [ ] 系统可以生成不同平台版本内容。
- [ ] 系统可以保存生成历史和审核结果。

### 架构

- [ ] 前端使用 Web 应用形态。
- [ ] 后端提供独立 API。
- [ ] 数据层至少包含产品、项目、内容、审核记录。
- [ ] AI 调用层使用统一 LLM Adapter。
- [ ] Prompt 独立管理。
- [ ] 预留 RAG / 企业知识库扩展。
- [ ] 预留 ComfyUI / AIGC 扩展。
- [ ] 预留 GEO Monitor 扩展。
- [ ] AI Citation Readiness 作为独立质量检查模块，不与文章生成逻辑混在一起。

### 异常情况

- [ ] 图片上传失败时有明确提示。
- [ ] 产品资料为空时禁止直接生成文章。
- [ ] AI 接口失败时显示失败原因。
- [ ] AI 输出为空时允许重新生成。
- [ ] AI 生成中不能重复提交同一任务。
- [ ] 未知产品参数不能被 AI 自动编造。
- [ ] Fact Check 能标记缺少依据的内容。
- [ ] AI Citation Readiness 不能输出“保证排名”或“保证引用”等承诺性文案。
- [ ] 网络异常时页面不崩溃。
- [ ] 后端异常时前端显示可理解错误信息。
- [ ] 无 API Key 时 mock 模式可演示。

### 骨架屏

- [ ] 产品列表加载时显示骨架屏。
- [ ] 产品详情加载时显示骨架屏。
- [ ] GEO 分析区域加载时显示骨架屏。
- [ ] 内容生成区域加载时显示骨架屏。
- [ ] 审核结果区域加载时显示骨架屏。

### 加载状态

- [ ] 上传图片时显示上传中。
- [ ] AI 产品理解时显示分析中。
- [ ] GEO Research 时显示生成中。
- [ ] 文章生成时显示写作中。
- [ ] Fact Check 时显示检查中。
- [ ] 多平台适配时显示转换中。
- [ ] 所有按钮在任务执行期间进入 disabled 状态。

### 终端适配

- [ ] 桌面端 1440px 正常显示。
- [ ] 笔记本 1024px 正常显示。
- [ ] 平板 768px 可用。
- [ ] 手机 375px 可浏览核心内容。
- [ ] 三栏工作台在小屏下自动变成单栏或折叠布局。

### 最终验收

- [ ] 能用一个真实产品完成完整闭环。
- [ ] 示例产品建议使用 ROS 智能小车或真实企业产品。
- [ ] 能生成产品卡片。
- [ ] 能生成 GEO 实体图。
- [ ] 能生成用户问题图。
- [ ] 能生成文章。
- [ ] 能完成事实检查。
- [ ] 能完成 GEO 审核。
- [ ] 能完成 AI Citation Readiness 检查。
- [ ] 能区分未出现、相关概念出现、品牌提及、页面检索、来源引用五种 GEO Monitor 状态。
- [ ] 能生成至少 3 个平台版本。
- [ ] 能查看历史记录。
- [ ] 本地项目实际运行通过。
- [ ] 验收清单逐项验证并汇报结果。

## 14. 后续开发纪律

- 需求未确认前不写业务代码。
- 每个阶段完成后必须更新本文档。
- 每个阶段都要实际运行验证。
- 未通过的验收项必须继续修改，直到通过。
- 不做与简历主线无关的炫技功能。
- 不优先开发复杂权限、收费系统、手机 App、自研模型、自动发布。
- 不直接复制 Dify、FastGPT、Langflow、Open WebUI 等大系统，只吸收可复用设计。


---

## 15–16 已拆分至开发日志

原 §15 进度记录、§16 GEO- 历史项目吸收计划已整体移至 `FlowPilot_AI_开发日志.md`，便于日志独立增长。

## 17. 开发避坑与工程纪律

本章节记录 FlowPilot AI 编码过程中已经遇到的问题、根因和后续规避方法。后续每进入一个新阶段，都先检查本章节，避免重复踩坑。

### 17.1 已遇到的问题与规避方法

| 问题 | 根因 | 后续规避方法 |
|---|---|---|
| 项目最开始在 `master` 且文件未提交 | P0 / P1 文件仍是未跟踪状态，继续开发容易混乱 | 每进入新阶段先运行 `git status`，重要阶段新建 `codex/...` 分支 |
| PowerShell 显示中文乱码 | 终端编码显示问题，文件本身是 UTF-8 | 判断中文内容时不要只看 PowerShell 输出，用 Python / Node 按 UTF-8 读取验证 |
| `pip-audit` 路径错误 | 工具实际位于 `.audit_repos/.audit_tools/Scripts/`，第一次少退了一层路径 | 安全工具路径固定写入文档，后续直接复用固定命令 |
| `npm audit` 使用镜像失败 | `npmmirror` 不支持 npm security audit API | 漏洞扫描固定使用官方 registry：`https://registry.npmjs.org` |
| `npm run dev` 结束后残留 3000 端口 | Next dev 会留下子进程 | 实际运行验证后必须检查并清理 3000 / 8000 端口 |
| PowerShell `$HOME` 变量冲突 | `$HOME` 是系统保留变量 | 脚本变量避免使用 `$home`、`$env` 等保留或易冲突名称，改用 `$homePage` 等明确变量名 |
| 前端测试遇到重复文案 | UI 中“加载中”“来源引用”等文案可能在多个区域合理出现 | 测试重复 UI 文案时用 `getAllByText`，不要强行假设只出现一次 |
| 前端改版遗漏旧验收字段 | P1.3 规则卡片重构时遗漏 `version` 展示，导致 P1.2 集成测试失败 | 改版时先回看上一阶段验收清单，保留已承诺字段；测试要覆盖关键字段是否仍可见 |
| `fetch(url, undefined)` 影响测试契约 | API helper 对无配置 GET 请求也传了第二参数，导致旧测试 `toHaveBeenCalledWith(url)` 失败 | GET 请求无 `init` 时使用 `fetch(url)`，有 body / method 时再传 `init` |
| `Start-Process` 日志重定向失败 | PowerShell 不允许 `RedirectStandardOutput` 和 `RedirectStandardError` 指向同一个文件 | stdout / stderr 分开写日志文件，或不重定向后用端口和 HTTP 状态验证 |
| Next dev 端口残留导致误判 | 上一次 3013 dev server 残留，Next 提示已有服务正在运行 | 实际运行前后同时清理 3000 / 3013 / 8000，并优先按 `package.json` 默认端口验证 |
| `Invoke-WebRequest` 页面验证偶发空引用 | PowerShell 对 Next dev 页面请求返回 200 后仍可能抛空引用异常 | 页面 HTTP 状态验证改用 `curl.exe -s -o NUL -w '%{http_code}'` |
| 中文状态断言受 PowerShell 编码影响 | PowerShell 命令字符串里的中文比较可能因编码显示/传递失真 | 运行验收脚本优先断言英文审计动作、HTTP 状态码、版本号等稳定字段 |
| Windows 固定临时文件替换失败 | P2.0 全量测试中 `rules.local.json.tmp` 被锁定，`replace` 触发 `PermissionError` | 持久化写入统一使用带 `uuid` 的唯一临时文件，写入后原子替换，`finally` 清理残留临时文件 |
| 表单下拉与卡片复用同一名称 | P2.0 新增 GEO 任务表单后，任务名同时出现在 `<option>` 和任务卡片，旧测试 `findByText` 误判为重复元素 | 面向用户可见文本的测试要区分“唯一出现”和“至少出现”；下拉、导航、卡片等复用文案用 `findAllByText` 或更精确 role 查询 |
| 全局导航导致旧文案重复 | P2.0.1 增加全局导航后，“规则中心”“GEO 监测中心”等文案同时出现在导航和正文区 | 测试导航用 `getByRole('link')`，测试正文区用 heading/section 语义或 `getAllByText`，不要把全局导航引入后的重复文案当回归 |
| 移动端卡片与桌面表格共存 | 响应式实现中桌面表格和移动端卡片会在 DOM 中同时存在，只靠 CSS 控制显示 | 测试内容存在性时允许重复；如果要测试视觉显示，需要浏览器截图或 viewport 级测试，不用 jsdom 文本查询代替视觉断言 |
| P1.1 页面是静态 Mock | 页面有样子，但没有真实读取后端 | 每阶段开始前明确静态 Demo、Mock API、真实 API、真实数据分别处在哪一层 |
| Mock 数据容易被误解为真实效果 | GEO 监测天然容易被误读成“AI 引用成功” | 所有 Mock / Demo / Manual / Real 数据必须有 `data_mode`，页面也要明显提示 |
| Semgrep / SAST 扫描范围需要注意 | 扫描工具可能受 git 跟踪状态、忽略规则影响 | 每次扫描显式指定 `frontend` 和 `backend` 源码目录；正式提交后再做一次扫描 |
| 开发中容易跳功能 | 项目要串联简历，功能诱惑很多 | 每阶段只做一个闭环，不提前做发布、RAG、ComfyUI 等扩展 |

### 17.2 固定开发流程

后续每一个阶段都按下面流程执行：

```text
先写项目计划
→ 新建阶段分支
→ 先写失败测试
→ 最小实现
→ 全量测试
→ 生产构建
→ SAST / 依赖扫描
→ 实际运行验证
→ 更新项目计划文档
```

### 17.3 新阶段开工前检查清单

- [ ] 运行 `git status`，确认当前改动范围。
- [ ] 确认当前阶段目标只做一件核心事情。
- [ ] 确认是否需要新建 `codex/...` 分支。
- [ ] 先写验收清单，再写测试。
- [ ] 所有 Mock / Demo 数据必须明确标识。
- [ ] 所有规则、监测、AI 结果必须保留来源、时间和置信度。
- [ ] 不承诺 GEO 排名，不承诺一定被 AI 引用，只做可验证记录。
- [ ] 每次完成后写入 `FlowPilot_AI_项目计划.md`。

### 17.4 固定验证命令

后端测试：

```powershell
cd C:\Users\EDY\Documents\简历\flowpilot-ai\backend
.\.venv\Scripts\python.exe -m pytest -q
```

前端测试：

```powershell
cd C:\Users\EDY\Documents\简历\flowpilot-ai\frontend
npm run test
```

前端生产构建：

```powershell
cd C:\Users\EDY\Documents\简历\flowpilot-ai\frontend
npm run build
```

前端依赖漏洞扫描：

```powershell
cd C:\Users\EDY\Documents\简历\flowpilot-ai\frontend
npm.cmd audit --json --package-lock-only --registry=https://registry.npmjs.org
```

后端依赖漏洞扫描：

```powershell
cd C:\Users\EDY\Documents\简历\flowpilot-ai\backend
..\..\.audit_repos\.audit_tools\Scripts\pip-audit.exe --requirement .\requirements.txt
```

SAST 扫描：

```powershell
cd C:\Users\EDY\Documents\简历\.audit_repos
.\.audit_tools\Scripts\semgrep.exe scan --config=p/security-audit --metrics=off --json --output semgrep-flowpilot-next.json ..\flowpilot-ai\frontend ..\flowpilot-ai\backend
```

### 17.5 实际运行验证纪律

- 前端默认端口：`3000`。
- 后端默认端口：`8000`。
- 启动服务前检查端口是否已被占用。
- 验证结束后清理本次启动的服务进程。
- 页面访问至少覆盖：

```text
/
/rules
/geo-monitor
```

- API 验证至少覆盖：

```text
/api/health
/api/rules/ai-channels
/api/rules/publishing-channels
/api/geo-monitor/sessions
/api/geo-monitor/records
```

### 长期工程纪律：后续所有代码编写默认遵守

适用范围：
- 后端代码。
- 前端代码。
- API 契约。
- 测试。
- 配置。
- 文档。

通用原则：
- 遵循高内聚、低耦合。
- 遵循单一职责原则。
- 遵循 KISS，优先选择简单、可维护方案。
- 遵循 DRY，避免重复逻辑扩散。
- 遵循 YAGNI，不提前实现尚未进入验收范围的复杂能力。
- 接口契约先行，先明确请求、响应、错误结构和状态码。
- 定义统一错误码和错误响应格式。
- 采用分层架构，业务逻辑与 IO、存储、网络请求、外部服务调用分离。
- 所有外部输入必须校验，不信任前端、不信任第三方、不信任本地文件。

后端要求：
- 配置通过环境变量或配置文件管理，禁止硬编码密钥、Token、Cookie、账号密码。
- 涉及重复提交、回调、任务执行、发布记录等场景时必须考虑幂等。
- 涉及多步骤写入时必须考虑事务、失败回滚和中间状态恢复。
- 涉及并发写入时必须考虑竞态条件、文件锁、数据库约束或乐观锁。
- 数据查询使用参数化查询，禁止字符串拼接 SQL，防止注入。
- 鉴权和授权必须在后端真实执行，前端只负责展示控制。
- 日志必须脱敏，不记录密钥、Cookie、完整 Token、账号密码、敏感个人信息。
- 外部资源、文件句柄、网络连接、浏览器实例、任务进程使用后必须释放。

前端要求：
- 拆分基础组件与业务组件，避免页面文件无限膨胀。
- UI 渲染和接口请求逻辑分离。
- 使用设计 Token 统一颜色、字号、间距、圆角、阴影和状态样式。
- 页面必须覆盖 loading、空状态、报错状态、无权限状态。
- 表单必须有前端校验，并配合后端校验。
- 表单提交必须防重复点击，提交中按钮 disabled 或进入 loading 状态。
- 弹窗、抽屉等浮层必须支持 ESC 关闭。
- 做好 XSS 防护，避免直接渲染未清洗 HTML；确需渲染富文本时必须经过白名单清洗。
- 前端权限控制只用于改善体验，不作为真实安全边界。

测试要求：
- 编写单元测试覆盖正常场景、边界场景和异常场景。
- 关键功能优先采用 TDD：先写失败测试，再实现，再回归。
- 后端测试必须覆盖参数校验、错误码、幂等、异常输入和安全边界。
- 前端测试必须覆盖加载、空数据、错误、提交中、防重复、移动端关键呈现。
- 修改旧功能时必须跑相关回归测试，不能只跑新增测试。

文档与交付要求：
- 重要模块、接口、复杂业务判断必须有文档或必要注释。
- 注释解释“为什么这样做”，不重复描述代码已经清楚表达的内容。
- 每个阶段完成后记录：
  - 完成内容。
  - 修改文件。
  - 验证命令。
  - 通过 / 未通过结果。
  - 遇到的问题。
  - 后续风险。
- 最后必须列出代码潜在风险点，不把“测试通过”误当成“没有风险”。

## 2026-09-12｜P5 内容适配页面完成记录

状态：已完成。

本阶段目标：
- 完成“研究选题到多平台草稿”的最小内容适配闭环。
- 不接外部平台，不自动发布，不承诺排名、收录或模型引用。
- 页面只体现企业内容运营工作流，不展示个人简历能力映射。

完成内容：
- 新增内容适配工作台 `/content-adaptation`。
- 支持填写品牌名称、产品名称、目标地域、选题标题、目标受众和可确认事实。
- 支持选择微信公众号、知乎、小红书、百家号、企业官网等平台。
- 支持生成多平台差异化草稿，包含标题、正文、结构类型、推荐标签、综合评分和风险提示。
- 支持复制全部草稿和下载草稿文本。
- 支持本地保存最近一次草稿，并在再次进入页面时自动恢复。
- 支持内容版本记录，连续生成会形成版本列表，最多保留 10 条。
- 支持恢复指定内容版本。
- 支持最小审核状态：待审核、审核通过、需修改。
- 仅审核通过的版本可以加入“发布准备队列”。
- 发布准备队列只作为内部人工发布准备，不会自动发布到外部平台。
- 全局导航已增加“内容适配”入口。

修改文件：
- `frontend/app/content-adaptation/page.tsx`
- `frontend/app/content-adaptation/content-adaptation-engine.ts`
- `frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `frontend/app/components/state-card.tsx`
- `frontend/__tests__/p5-content-adaptation-engine.test.ts`
- `frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/content-adaptation -UseBasicParsing -TimeoutSec 10`

验证结果：
- P5 聚焦测试通过：2 个测试文件，10 条用例通过。
- 前端完整测试通过：20 个测试文件，54 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- PowerShell 终端对中文输出存在乱码显示，后续中文可见文案检查优先使用测试渲染、浏览器页面和 Node 以 UTF-8 读取文件，不以 PowerShell 原始显示作为唯一判断。
- 早期内容适配文件曾出现中文可见文案乱码，已在 P5 阶段修复为正常 UTF-8 中文。

后续风险点：
- 当前内容版本和发布准备队列仍存储在浏览器 localStorage，不适合长期保存敏感企业资料。
- 当前评分为本地规则评分，不代表真实搜索收录、AI 引用或平台推荐效果。
- 当前发布准备队列只是内部状态，不包含账号授权、真实发布、外部平台回执和失败重试。
- 后续接后端时，需要迁移到权限控制的数据层，并补充统一错误码、鉴权授权、日志脱敏、幂等和事务处理。

## 2026-09-12｜P6.0 发布准备队列页面

状态：已完成。

本阶段目标：
- 将 P5 内容适配页中的“发布准备队列”独立页面化。
- 继续保持安全边界：只做内部准备，不自动发布到外部平台。

完成内容：
- 新增 `/publish-queue` 发布准备队列页面。
- 新增全局导航入口“发布准备”。
- 页面可读取内容适配页加入的本地发布准备队列。
- 队列为空时显示“暂无发布准备内容”空状态。
- 队列有内容时显示选题标题、平台草稿数量和“准备发布”状态。
- 页面明确提示“不会自动发布到外部平台”。

修改文件：
- `frontend/app/publish-queue/page.tsx`
- `frontend/app/publish-queue/publish-queue-workspace.tsx`
- `frontend/app/components/state-card.tsx`
- `frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/publish-queue -UseBasicParsing -TimeoutSec 10`

验证结果：
- P5 + P6 聚焦测试通过：3 个测试文件，12 条用例通过。
- 前端完整测试通过：21 个测试文件，56 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

后续风险点：
- 当前发布准备队列仍使用 localStorage，刷新和本机使用可用，但不适合多人协作和长期存档。
- 当前队列没有真实平台账号、发布时间、发布结果、失败重试和回执记录。
- 下一阶段接后端时，需要把队列迁移为后端任务表，并增加审核人、发布人、状态流转、幂等键和操作日志。

## 2026-09-12｜P6.1 发布任务状态流转

状态：已完成。

本阶段目标：
- 在发布准备队列中加入最小任务状态流转。
- 仍然不接真实外部平台，不自动发布，只记录内部人工发布进度。

完成内容：
- 发布准备队列支持任务状态：
  - 待发布
  - 发布中
  - 已发布
  - 发布失败
  - 已取消
- 支持在页面内手动标记状态：
  - 标记发布中
  - 标记已发布
  - 标记失败
  - 取消发布
- 状态变更会写回本地队列存储。
- 兼容 P6.0 已存在的 `ready` 队列数据。

修改文件：
- `frontend/app/publish-queue/publish-queue-workspace.tsx`
- `frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/publish-queue -UseBasicParsing -TimeoutSec 10`

验证结果：
- P6 页面测试通过：1 个测试文件，4 条用例通过。
- P5 + P6 聚焦测试通过：3 个测试文件，14 条用例通过。
- 前端完整测试通过：21 个测试文件，58 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

后续风险点：
- 当前状态仍为前端本地状态，没有后端审计日志，不能作为真实发布凭证。
- 当前“已发布”由人工点击，不代表平台真实发布成功。
- 后续接真实平台前，需要增加发布目标平台、发布账号、发布链接、失败原因、重试次数、幂等键和操作人记录。

## 2026-09-12｜P6.2 发布记录字段

状态：已完成。

本阶段目标：
- 在发布准备队列中补充最小发布记录能力。
- 支持人工记录发布链接、失败原因和操作备注。
- 继续保持安全边界：只做内部记录，不接真实外部平台，不自动发布。

完成内容：
- 发布准备队列条目新增发布链接字段。
- 发布准备队列条目新增失败原因字段。
- 发布准备队列条目新增操作备注字段。
- 新增“保存发布记录”操作，将记录写回本地发布准备队列。
- 保存后显示“已保存发布记录”反馈。
- 发布状态流转仍保持 P6.1 的待发布、发布中、已发布、发布失败、已取消。
- 失败状态下可记录失败原因，用于后续人工复盘。

修改文件：
- `frontend/app/publish-queue/publish-queue-workspace.tsx`
- `frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/publish-queue -UseBasicParsing -TimeoutSec 10`

验证结果：
- P6 页面测试通过：1 个测试文件，6 条用例通过。
- P5 + P6 聚焦测试通过：3 个测试文件，16 条用例通过。
- 前端完整测试通过：21 个测试文件，60 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- P6.2 按 TDD 执行时，新增“发布链接”和“失败原因”测试先按预期失败，确认页面缺少对应字段后再实现。
- PowerShell 对中文文件内容存在显示干扰，中文可见文案以测试渲染和 UTF-8 文件读取为准。

后续风险点：
- 当前发布记录仍保存在浏览器 localStorage，不适合作为长期审计凭证。
- 发布链接只做人工记录，暂未校验链接是否真实可访问，也未校验是否属于目标平台。
- 失败原因和操作备注没有操作人、操作时间和审计日志，后续接后端时需要补齐。
- 当前“保存发布记录”没有后端幂等键和事务保护；后续迁移到后端任务表时需要补充幂等、权限、日志脱敏和并发控制。

## 2026-09-12｜P6.3–P6.4 发布队列收尾

状态：已完成。

本阶段目标：
- 完成 P6 发布准备队列的前端闭环收尾。
- 增加发布平台、发布人、计划发布时间、实际发布时间等运营记录字段。
- 增加状态筛选和发布记录导出能力。
- 继续保持边界：不接真实外部平台，不自动发布，不保存平台账号或 Cookie。

完成内容：
- 发布准备队列新增“状态筛选”，支持全部状态、待发布、发布中、已发布、发布失败、已取消。
- 发布记录新增字段：
  - 发布平台
  - 发布人
  - 计划发布时间
  - 实际发布时间
  - 发布链接
  - 失败原因
  - 操作备注
- 发布链接增加基础格式校验：必须以 `http://` 或 `https://` 开头。
- 新增发布记录导出：
  - Markdown 导出
  - CSV 导出
- 筛选为空时显示独立空状态。
- 页面继续明确提示“不会自动发布到外部平台”。
- P6 测试统一修正为正常 UTF-8 中文，避免后续中文可见文案验收被乱码干扰。

修改文件：
- `frontend/app/publish-queue/publish-queue-workspace.tsx`
- `frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/publish-queue -UseBasicParsing -TimeoutSec 10`

验证结果：
- P6 页面测试通过：1 个测试文件，9 条用例通过。
- P5 + P6 聚焦测试通过：3 个测试文件，19 条用例通过。
- 前端完整测试通过：21 个测试文件，63 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- 新增状态筛选后，状态文字会同时出现在筛选下拉和任务状态标签中，测试断言已调整为允许重复文案。
- 继续遇到 PowerShell 中文显示干扰，P6 文件已通过测试和页面渲染确认使用正常中文可见文案。

P6 完成范围说明：
- P6 当前完成的是“人工发布准备与发布记录”闭环。
- P6 不包含真实平台账号授权、浏览器自动化发布、平台 API 发布、真实回执、后端审计日志和多人协作。
- 后续这些能力应进入后端持久化、发布任务 API 或平台适配器阶段，不继续塞进 P6。

后续风险点：
- 当前记录仍在 localStorage，刷新本机可用，但不适合长期保存和多人协作。
- Markdown / CSV 导出只保证本地生成，不代表发布数据经过后端审计。
- URL 只做格式校验，没有检查链接是否真实可访问、是否属于目标平台、是否已收录。
- 没有操作人身份校验，发布人字段仍为人工填写。
- 后续迁移后端时需要补齐发布任务表、操作日志、权限校验、幂等键、失败重试、事务和日志脱敏。

## 2026-09-12｜P7 AI 引用准备度

状态：已完成。

本阶段目标：
- 新增 AI 引用准备度页面，用于检查内容是否更容易被机器理解、人工核验和后续复盘。
- 输出结构化评分、检查项和改进建议。
- 明确边界：评分只表示内容结构准备度，不承诺搜索排名、平台收录或模型引用。

完成内容：
- 新增 `/citation-readiness` 页面。
- 全局导航新增“引用准备度”入口。
- 新增引用准备度评分引擎，检查以下维度：
  - 实体清晰度
  - 首段直接回答
  - FAQ 覆盖
  - 事实来源支撑
  - 营销风险
  - 爬虫可读性提示
- 页面支持录入：
  - 品牌名称
  - 目标地域
  - 产品名称
  - 目标页面链接
  - 待检查内容
- 页面输出：
  - 总分
  - 等级：较强 / 中等 / 较弱
  - 各检查项得分与说明
  - 改进建议
- 对不可验证承诺进行风险提示，例如“保证收录、保证引用、行业第一”等。
- 修复首页测试中因导航新增“引用准备度”造成的重复文案断言问题。
- 重写全局导航可见中文文案，避免乱码影响后续验收。

修改文件：
- `frontend/app/citation-readiness/page.tsx`
- `frontend/app/citation-readiness/citation-readiness-workspace.tsx`
- `frontend/app/citation-readiness/citation-readiness-engine.ts`
- `frontend/app/components/state-card.tsx`
- `frontend/__tests__/p7-citation-readiness-engine.test.ts`
- `frontend/__tests__/p7-citation-readiness-page.test.tsx`
- `frontend/__tests__/home.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p7-citation-readiness-engine.test.ts __tests__/p7-citation-readiness-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `Invoke-WebRequest http://127.0.0.1:3000/citation-readiness -UseBasicParsing -TimeoutSec 10`

验证结果：
- P7 聚焦测试通过：2 个测试文件，5 条用例通过。
- 前端完整测试通过：23 个测试文件，68 条用例通过。
- 前端生产构建通过。
- 构建路由已包含 `/citation-readiness`。
- 本地页面访问 `/citation-readiness` 返回 HTTP 200。

遇到的问题：
- 全局导航新增入口后，首页中“引用准备度”同时出现在导航和正文模块中，测试已按真实页面结构改为允许重复文案。
- 全局导航文件在 PowerShell 输出中存在中文显示干扰，本阶段已重写导航可见文案为正常中文。

后续风险点：
- 当前评分为本地规则评分，不代表真实 AI 平台引用概率。
- 当前未接真实网页爬虫、Schema 检测、robots 检测和搜索收录检测。
- 当前没有保存评分历史，后续可接入内容版本或监测报表。
- 后续进入真实 GEO 监测时，需要把引用准备度评分与实际 AI 提及、页面检索、来源引用记录做区分，避免用户误读。
## 2026-09-12｜P8 多平台适配增强

状态：已完成。

本阶段目标：
- 让内容适配页从“生成多平台草稿”升级为“生成可解释的平台适配方案”。
- 每个平台草稿必须说明为什么这样写，给出适配评分、引用准备提示和发布建议。
- 修复内容适配相关文件中的用户可见中文乱码，避免后续验收和页面使用被旧乱码干扰。

完成内容：
- 内容适配引擎新增以下字段：
  - 平台策略
  - 适配评分
  - 引用准备提示
  - 发布建议
- 为微信公众号、知乎、小红书、百家号、企业官网分别建立差异化策略：
  - 微信公众号：长文解释 + 品牌沉淀 + 案例复核
  - 知乎：问题回答 + 判断逻辑 + 经验边界
  - 小红书：场景切入 + 短段落 + 弱广告表达
  - 百家号：搜索型标题 + 科普结构 + 地域实体
  - 企业官网：产品页结构 + FAQ + 可核验事实
- 内容适配页面新增展示：
  - 平台策略
  - 适配评分
  - 引用准备提示
  - 发布建议
  - 风险提示
- 复制和下载草稿时同步包含平台策略、适配评分、引用准备提示、发布建议和风险提示。
- 重写 P5 内容适配引擎测试和页面测试为正常 UTF-8 中文。
- 新增 P8 多平台适配增强测试，覆盖引擎字段和页面展示。

修改文件：
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-engine.ts`
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-engine.test.ts`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`
- `flowpilot-ai/frontend/__tests__/p8-content-platform-strategy.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p8-content-platform-strategy.test.tsx`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-engine.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p8-content-platform-strategy.test.tsx`
- 待收尾执行：`npm.cmd run test -- --run`
- 待收尾执行：`npm.cmd run build`
- 待收尾执行：访问 `/content-adaptation`

已验证结果：
- P8 聚焦测试通过：1 个测试文件，2 条用例通过。
- P5 + P8 回归通过：3 个测试文件，12 条用例通过。

遇到的问题：
- 旧内容适配引擎和测试文件存在用户可见中文乱码，影响维护和后续验收。
- 页面中“平台策略”“发布建议”等文案会随着多个平台卡片重复出现，测试断言需要使用多元素断言，而不是单元素精确匹配。
- 风险提示以列表项展示，前面带有项目符号，测试应匹配文案主体，避免被 UI 符号影响。

后续风险点：
- 当前平台策略仍是本地规则，并非实时读取平台官方规则。
- 适配评分是内部启发式评分，不代表平台推荐、搜索收录或 AI 引用概率。
- 内容适配仍保存于 localStorage，不适合多人协作和长期审计。
- 后续接入后端后，需要把平台规则、内容版本、审核记录和发布记录迁移到后端持久化，并补充权限、幂等、审计日志和输入校验。

P8 收尾验证补充：
- 前端完整测试通过：24 个测试文件，70 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 构建过程中曾出现 TypeScript 类型错误，原因是半成品草稿类型误包含 `distributionAdvice`，以及测试输入使用只读数组；已修复为明确的 `ContentAdaptationInput` 契约和正确的半成品类型。

## 2026-09-12｜P9 引用准备度历史记录

状态：已完成。

本阶段目标：
- 补齐 P7 遗留的“没有保存评分历史”问题。
- 让 AI 引用准备度页面支持评分记录沉淀、恢复和导出，便于后续复盘内容优化过程。
- 修复引用准备度相关文件中的用户可见中文乱码。

完成内容：
- 引用准备度表单新增“检查主题”字段。
- 每次生成引用准备度评分后，自动保存一条历史记录。
- 历史记录最多保留最近 10 条。
- 历史记录展示：
  - 历史记录序号
  - 检查主题
  - 品牌名称
  - 总分
  - 等级
- 支持从历史记录恢复表单内容和评分结果。
- 支持导出引用准备度历史 Markdown。
- 引用准备度页面继续明确边界：评分只表示内容结构准备度，不承诺搜索排名、平台收录或模型引用。
- 重写 P7 引用准备度引擎、页面和测试为正常 UTF-8 中文。
- 新增 P9 历史记录测试。

修改文件：
- `flowpilot-ai/frontend/app/citation-readiness/citation-readiness-engine.ts`
- `flowpilot-ai/frontend/app/citation-readiness/citation-readiness-workspace.tsx`
- `flowpilot-ai/frontend/app/citation-readiness/page.tsx`
- `flowpilot-ai/frontend/__tests__/p7-citation-readiness-engine.test.ts`
- `flowpilot-ai/frontend/__tests__/p7-citation-readiness-page.test.tsx`
- `flowpilot-ai/frontend/__tests__/p9-citation-readiness-history.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p7-citation-readiness-engine.test.ts __tests__/p7-citation-readiness-page.test.tsx __tests__/p9-citation-readiness-history.test.tsx`
- 待收尾执行：`npm.cmd run test -- --run`
- 待收尾执行：`npm.cmd run build`
- 待收尾执行：访问 `/citation-readiness`

已验证结果：
- P7 + P9 聚焦测试通过：3 个测试文件，7 条用例通过。

遇到的问题：
- 原引用准备度文件存在用户可见中文乱码，已同步重写。
- 页面存在两个“导出历史 Markdown”入口，测试需要用多元素断言选择其中一个，而不是假设页面只有一个同名按钮。
- 导出功能仍为本地浏览器生成文件，不代表后端已保存审计记录。

后续风险点：
- 历史记录仍保存在 localStorage，不适合长期审计和多人协作。
- 当前导出只包含结构化评分和建议，没有保存每个检查项完整明细；后续如做复盘报表可扩展。
- 当前引用准备度评分仍是本地规则评分，不代表真实 AI 平台引用概率。
- 后续接入真实监测时，需要把“准备度评分”和“真实 AI 提及、页面检索、来源引用”严格区分。

P9 收尾验证补充：
- 前端完整测试通过：25 个测试文件，72 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/citation-readiness` 返回 HTTP 200。

## 2026-09-12｜P10 引用准备度加入监测准备

状态：已完成。

本阶段目标：
- 打通“引用准备度评分”到“真实 GEO 监测准备”的前置衔接。
- 不直接调用真实 AI 平台，不伪造监测结果，只生成本地待录入队列。
- 保持边界清楚：准备度评分不等于真实提及、页面检索或来源引用。

完成内容：
- 引用准备度页面新增“加入监测准备”按钮。
- 未生成评分前，“加入监测准备”按钮禁用。
- 生成评分后，可将当前主题、品牌、产品、地域、目标链接、准备度分数和等级加入本地监测准备队列。
- 页面新增“监测准备队列”区块。
- 队列条目显示：
  - 检查主题
  - 目标品牌
  - 目标地域
  - 目标产品
  - 准备度分数
  - 准备度等级
- 监测准备队列保存到 `localStorage`，键名为 `flowpilot.citationReadiness.monitorQueue`。
- 页面明确提示：该队列仅为本地准备，不代表已发起真实监测。

修改文件：
- `flowpilot-ai/frontend/app/citation-readiness/citation-readiness-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p10-citation-monitor-queue.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p10-citation-monitor-queue.test.tsx`
- `npm.cmd run test -- --run __tests__/p7-citation-readiness-engine.test.ts __tests__/p7-citation-readiness-page.test.tsx __tests__/p9-citation-readiness-history.test.tsx __tests__/p10-citation-monitor-queue.test.tsx`
- 待收尾执行：`npm.cmd run test -- --run`
- 待收尾执行：`npm.cmd run build`
- 待收尾执行：访问 `/citation-readiness`

已验证结果：
- P10 聚焦测试通过：1 个测试文件，2 条用例通过。
- P7 + P9 + P10 回归通过：4 个测试文件，9 条用例通过。

遇到的问题：
- 同一检查主题会同时出现在历史记录和监测准备队列，测试断言需要允许重复文案。
- 当前队列只是 localStorage 本地队列，尚未进入真实 GEO 监测后端。

后续风险点：
- 监测准备队列未与 `/geo-monitor` 后端任务打通。
- 当前队列缺少去重策略，同一主题可以重复加入。
- 当前队列没有操作人、操作时间之外的审计上下文，后续接后端时需补充权限、幂等键、审计日志和真实监测任务状态。

P10 收尾验证补充：
- 前端完整测试通过：26 个测试文件，74 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/citation-readiness` 返回 HTTP 200。

## 2026-09-12｜P11 监测准备队列去重

状态：已完成。

本阶段目标：
- 修复引用准备度页面中同一内容可重复加入“监测准备队列”的问题。
- 在未接入真实后端前，先建立本地队列的最小幂等边界。
- 保持范围克制：只处理本地队列去重，不扩展真实监测任务创建。

完成内容：
- 新增监测准备队列去重测试。
- 当品牌、产品、地域、目标页面链接和检查主题完全一致时，重复点击“加入监测准备”不会新增第二条记录。
- 重复加入时提示：“该内容已在监测准备队列中”。
- 入队前统一清理首尾空格，避免因为表单空格导致重复记录。
- 新增本地队列身份键生成函数，用于前端去重判断。

修改文件：
- `flowpilot-ai/frontend/app/citation-readiness/citation-readiness-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p11-citation-monitor-queue-dedupe.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p11-citation-monitor-queue-dedupe.test.tsx`
- `npm.cmd run test -- --run __tests__/p7-citation-readiness-engine.test.ts __tests__/p7-citation-readiness-page.test.tsx __tests__/p9-citation-readiness-history.test.tsx __tests__/p10-citation-monitor-queue.test.tsx __tests__/p11-citation-monitor-queue-dedupe.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/citation-readiness`

已验证结果：
- P11 聚焦测试通过：1 个测试文件，1 条用例通过。
- P7 + P9 + P10 + P11 引用准备度相关回归通过：5 个测试文件，10 条用例通过。
- 前端完整测试通过：27 个测试文件，75 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/citation-readiness` 返回 HTTP 200。

遇到的问题：
- 监测准备队列目前仍是 `localStorage` 本地状态，只能做单浏览器内的去重。
- 页面中同一按钮可连续点击，必须用业务身份键做幂等，而不能依赖按钮禁用或时间戳。

后续风险点：
- 当前去重不是后端唯一约束，未来接入真实监测任务时必须增加后端幂等键、唯一索引或事务保护。
- 当前身份键只覆盖品牌、产品、地域、目标链接和检查主题；如果未来加入平台、查询词、监测周期等字段，需要同步扩展去重规则。
- 多设备、多用户、跨浏览器场景仍会产生重复任务，需要后端统一处理。

## 2026-09-12｜P12 发布队列关键状态校验

状态：已完成。

本阶段目标：
- 提高发布队列记录的真实性和可复盘性。
- 避免出现“已发布但没有发布链接 / 实际发布时间”或“发布失败但没有失败原因”的低质量记录。
- 保持范围克制：只补发布队列前端状态校验，不接入真实平台发布。

完成内容：
- 发布队列状态流转新增关键字段校验。
- 标记“已发布”前，必须填写发布链接和实际发布时间。
- 标记“发布失败”前，必须填写失败原因。
- 保存发布记录时再次执行同样校验，避免绕过状态按钮直接保存异常状态。
- 保留原有发布链接格式校验，发布链接仍需以 `http://` 或 `https://` 开头。
- 修正发布队列测试，使测试流程符合新的真实记录规则：先补充关键字段，再进入对应状态。

修改文件：
- `flowpilot-ai/frontend/app/publish-queue/publish-queue-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/publish-queue`

已验证结果：
- P6 发布队列测试通过：1 个测试文件，11 条用例通过。
- 前端完整测试通过：27 个测试文件，77 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- 原页面允许先切换成“已发布”或“发布失败”，再补充字段；这对真实监测和周报复盘不够严谨。
- 原有状态流转测试默认无字段也可标记已发布，需要同步调整为更符合业务真实流程的测试。

后续风险点：
- 当前校验仍在前端，未来接后端发布任务表时必须在后端重复校验，不能只依赖前端展示逻辑。
- 发布链接、发布时间和失败原因仍保存在 `localStorage`，没有操作人审计、权限校验和日志脱敏。
- 后续如果增加平台账号、发布目标、重试次数，需要扩展状态机规则，避免状态随意跳转。

## 2026-09-12｜P13 发布队列单条保存边界

状态：已完成。

本阶段目标：
- 修复发布队列“保存发布记录”会校验整条队列的问题。
- 让每张发布卡片的保存按钮只保存和校验当前记录。
- 避免一条历史异常记录阻断其他正常记录的补充保存。

完成内容：
- 新增单条保存边界测试。
- 当队列中存在一条历史异常记录时，保存另一条正常记录不会被阻断。
- `保存发布记录` 改为接收当前记录 ID。
- 保存时只校验当前记录的发布链接格式和状态关键字段。
- 保留 P12 的关键状态规则：
  - 已发布必须填写发布链接和实际发布时间。
  - 发布失败必须填写失败原因。

修改文件：
- `flowpilot-ai/frontend/app/publish-queue/publish-queue-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/publish-queue`

已验证结果：
- P6 发布队列测试通过：1 个测试文件，12 条用例通过。
- 前端完整测试通过：27 个测试文件，78 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- 页面视觉上是单条卡片保存，但原实现实际校验整条队列，容易被历史异常数据拖住。
- 多条发布记录共用同一个保存函数时，必须显式传入记录 ID，避免隐藏的全局副作用。

后续风险点：
- 当前仍是前端本地保存，没有后端事务；未来迁移到后端时应采用单条发布任务更新接口。
- 后端接口需要按任务 ID 做鉴权、参数校验、幂等处理和审计记录。
- 如果未来支持批量保存，需要单独设计批量校验结果，不能复用单条保存提示。

## 2026-09-12｜P14 发布队列本地审计字段

状态：已完成。

本阶段目标：
- 为发布队列增加最小本地审计字段，方便后续周报、复盘和后端审计表迁移。
- 让发布记录不只是“当前状态”，还可以看到最近一次关键操作。
- 保持范围克制：只做本地审计字段雏形，不实现多人权限和后端日志。

完成内容：
- 发布记录新增本地审计字段：
  - `lastAction`
  - `lastUpdatedAt`
- 点击“保存发布记录”后，当前记录写入：
  - 最后操作：保存发布记录
  - 最后更新时间：当前时间 ISO 字符串
- 发布队列卡片展示：
  - 最后操作
  - 最后更新
- Markdown 导出新增：
  - 最后操作
  - 最后更新时间
- CSV 导出新增：
  - 最后操作
  - 最后更新时间
- 新增日期展示格式化函数，页面和导出统一显示到分钟。

修改文件：
- `flowpilot-ai/frontend/app/publish-queue/publish-queue-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/publish-queue`

已验证结果：
- P6 发布队列测试通过：1 个测试文件，14 条用例通过。
- 前端完整测试通过：27 个测试文件，80 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- 测试中一开始使用 fake timers 会卡住 Testing Library 的异步查询，已改为检查审计字段存在和格式，而不是冻结全局计时器。
- 拦截 `Blob` 导出内容时，mock 必须像构造函数一样工作；已改用继承原生 `Blob` 的测试类。

后续风险点：
- 当前审计字段仍可被前端篡改，只能作为本地复盘辅助，不等同于可信审计日志。
- 后端阶段需要把操作人、操作时间、操作类型、变更前后内容、请求来源和幂等键写入服务端审计表。
- 当前只记录“最后一次操作”，不是完整操作流水；未来如果要满足真实协作审计，需要新增操作日志列表。

## 2026-09-12｜P15 内容适配到发布队列的版本级联动

状态：已完成。

本阶段目标：
- 打通“内容适配 → 审核通过 → 发布准备队列”的版本级信息传递。
- 让发布队列不只知道“有几个平台草稿”，还知道具体来自哪些平台版本、各平台标题是什么。
- 保持范围克制：只增强本地数据结构和页面展示，不接入真实发布平台。

完成内容：
- 内容适配页加入发布准备队列时，新增保存：
  - 原始选题标题 `sourceTopicTitle`
  - 平台草稿摘要 `platformDrafts`
- 平台草稿摘要包含：
  - 平台 ID
  - 平台名称
  - 平台标题
  - 审核状态
- 内容适配页的发布准备队列区块显示各平台版本标题。
- 发布队列页面读取并展示各平台版本标题。
- 兼容旧发布队列数据：旧数据没有 `sourceTopicTitle` 或 `platformDrafts` 时不会报错。

修改文件：
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/app/publish-queue/publish-queue-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`
- `flowpilot-ai/frontend/__tests__/p6-publish-queue-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx __tests__/p6-publish-queue-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-adaptation`
- 访问 `/publish-queue`

已验证结果：
- P5 + P6 联动测试通过：2 个测试文件，22 条用例通过。
- 前端完整测试通过：27 个测试文件，81 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/publish-queue` 返回 HTTP 200。

遇到的问题：
- 原发布队列数据只保存 `versionId / topicTitle / platformCount`，信息不足，后续无法回看具体平台标题。
- 新字段需要兼容旧 localStorage 数据，避免用户已有本地队列加载失败。

后续风险点：
- 当前只保存平台标题摘要，没有保存完整正文；未来接后端时应通过内容版本 ID 关联完整平台草稿。
- 审核状态仍是内容版本级，不是单个平台草稿级；未来如果每个平台单独审核，需要扩展为平台版本状态机。
- 发布队列仍是本地存储，未来迁移后端时要拆成内容版本表、平台版本表和发布任务表。

## 2026-09-12｜P16 研究选题到内容适配准备联动

状态：已完成。

本阶段目标：
- 打通“生成式优化研究 → 内容适配”的前置链路。
- 让研究页的优先选题可以进入内容适配工作台，减少重复录入。
- 保持范围克制：只做本地准备桥接，不自动生成内容、不自动发布。

完成内容：
- 研究页“优先写作建议”新增“加入内容适配准备”操作。
- 点击后写入本地准备数据，键名为 `flowpilot.geoResearch.contentAdaptationIntake`。
- 准备数据包含：
  - 品牌名称
  - 产品 / 业务
  - 目标地域
  - 选题标题
  - 目标受众
  - 可确认事实草稿
- 内容适配页进入时，如果没有恢复上次草稿，会自动带入研究页准备数据。
- 内容适配页带入后显示提示：“已带入生成式优化研究选题”。
- 保留优先级：如果已有上次保存的平台草稿，优先恢复草稿，不覆盖用户已有工作。

修改文件：
- `flowpilot-ai/frontend/app/geo-research/geo-research-workspace.tsx`
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p4-0-geo-research.test.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P4 + P5 联动测试通过：2 个测试文件，13 条用例通过。
- 前端完整测试通过：27 个测试文件，83 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- 原研究页只输出选题建议，没有形成下一步工作入口，容易停留在“看结果”。
- 内容适配页已有“恢复上次草稿”逻辑，因此研究选题带入不能覆盖已有草稿；本阶段明确设定为“无草稿时带入”。

后续风险点：
- 当前桥接仍通过 `localStorage` 完成，未来后端化时应改为研究任务、选题、内容任务之间的正式关联。
- 当前只带入一条优先选题，没有形成选题池；后续可做“加入选题池 / 批量进入内容计划”。
- 可确认事实仍是研究建议生成的草稿，不等于真实企业资料，发布前仍需人工补充来源和案例。

## 2026-09-12｜P17 研究选题池雏形

状态：已完成。

本阶段目标：
- 在 P16 单条“研究选题 → 内容适配准备”的基础上，增加可累积的本地选题池。
- 支持从研究页连续保存多个优先选题，为后续“选题池 / 内容计划 / 批量适配”打基础。
- 保持范围克制：只做本地持久化，不新增复杂页面，不改变内容适配页现有单条带入逻辑。

完成内容：
- 新增本地选题池存储键：`flowpilot.geoResearch.topicPool`。
- 点击“加入内容适配准备”时，同时写入：
  - 单条内容适配入口 `flowpilot.geoResearch.contentAdaptationIntake`
  - 本地选题池 `flowpilot.geoResearch.topicPool`
- 选题池条目包含：
  - 选题标题
  - 推荐平台
  - 品牌名称
  - 产品 / 业务
  - 目标地域
  - 目标受众
  - 可确认事实草稿
  - 综合评分
  - 状态 `待适配`
  - 创建时间
- 选题池按“选题标题 + 推荐平台”去重，重复加入时保留最新条目。
- 选题池最多保留 20 条，避免本地存储无限增长。
- 增加损坏数据容错：如果本地选题池 JSON 解析失败，会清理损坏数据并回退为空列表。

修改文件：
- `flowpilot-ai/frontend/app/geo-research/geo-research-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p4-0-geo-research.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P4 研究页聚焦测试通过：1 个测试文件，5 条用例通过。
- P4 + P5 联动回归通过：2 个测试文件，14 条用例通过。
- 前端完整测试通过：27 个测试文件，84 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- P16 只保存最后一条内容适配入口，连续点击多个优先选题时，前面的选题会被覆盖。
- 新增测试先验证了选题池为空导致失败，再补实现，避免把已有单条桥接误认为选题池能力。
- 页面源码中文正常，但 PowerShell 默认输出曾出现乱码；处理时尽量只用英文标识和 UTF-8 读取，避免误伤中文文案。

后续风险点：
- 当前选题池还没有独立页面展示，用户暂时只能通过后续功能消费这批数据。
- 选题池仍是浏览器本地存储，不适合作为多人协作或长期可信数据源。
- 状态目前只有 `待适配`，后续需要扩展为“待适配 / 适配中 / 已生成 / 已进入发布队列 / 已作废”等状态机。
- 后端阶段应建立正式的研究选题表，并用内容任务表关联内容适配、审核和发布队列。

## 2026-09-12｜P18 研究页选题池可视化

状态：已完成。

本阶段目标：
- 让 P17 保存的本地选题池在研究页可见。
- 支持从选题池中选择某条选题重新进入内容适配准备。
- 保持页面克制：不新增复杂筛选、不新增单独路由，只做研究页内的轻量选题池卡片。

完成内容：
- 研究页新增“本地选题池”区块。
- 当选题池为空时不展示，避免页面增加无效信息。
- 当选题池存在数据时，展示：
  - 待适配选题数量
  - 选题状态
  - 推荐平台
  - 综合评分
  - 选题标题
  - 地域和产品 / 业务
- 每条选题提供“用于内容适配”操作。
- 点击“用于内容适配”后，会把该选题重新写入 `flowpilot.geoResearch.contentAdaptationIntake`，内容适配页后续可继续读取。
- 页面反馈文案更新为“已选择选题进入内容适配准备”。

修改文件：
- `flowpilot-ai/frontend/app/geo-research/geo-research-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p4-0-geo-research.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P4 研究页聚焦测试通过：1 个测试文件，6 条用例通过。
- P4 + P5 联动测试通过：2 个测试文件，15 条用例通过。
- 前端完整测试通过：27 个测试文件，85 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- P17 只把选题池写入本地存储，但用户在页面上看不到已沉淀的选题，容易误以为点击没有长期效果。
- 选题池如果一直显示空状态会增加页面噪音，所以本阶段采用“有数据才展示”的轻量策略。
- “用于内容适配”仍复用现有单条入口，避免在 P18 同时改动内容适配页的数据恢复规则。

后续风险点：
- 当前选题池只在研究页内展示，还没有独立的“选题计划 / 内容日历”视图。
- 选题状态仍未形成完整状态机，无法区分“已适配”“已进入发布准备”“已发布”等后续阶段。
- 选题池数据仍保存在浏览器本地，换设备或清理缓存会丢失；后端阶段需要迁移到正式数据表。

## 2026-09-12｜P19 内容适配页读取研究选题池

状态：已完成。

本阶段目标：
- 让内容适配页可以读取研究页沉淀的本地选题池。
- 支持用户从多条待适配选题中手动选择一条带入表单。
- 保持流程安全：选择新选题时清空当前平台草稿，避免新旧选题内容混在一起。

完成内容：
- 内容适配页新增读取 `flowpilot.geoResearch.topicPool`。
- 当选题池存在待适配选题时，显示“研究选题池”区块。
- 选题池卡片展示：
  - 待适配状态
  - 推荐平台
  - 综合评分
  - 选题标题
  - 地域和产品 / 业务
- 每条选题新增“带入此选题”操作。
- 点击后将该选题写入内容适配表单：
  - 品牌名称
  - 产品名称
  - 目标地域
  - 选题标题
  - 目标受众
  - 可确认事实
- 点击后清空当前页面草稿，并显示提示“已从研究选题池带入选题”。
- 增加选题池损坏数据容错：JSON 解析失败时清理本地选题池并回退为空。

修改文件：
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P5 内容适配页聚焦测试通过：1 个测试文件，10 条用例通过。
- P4 + P5 联动测试通过：2 个测试文件，16 条用例通过。
- 前端完整测试通过：27 个测试文件，86 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- P18 已经让研究页可视化选题池，但内容适配页仍只能自动读取最后一条入口，无法从多条选题中主动选择。
- 内容适配页可能已有草稿，如果直接切换选题但保留旧草稿，会造成“表单是新选题、草稿是旧选题”的混乱；本阶段选择新选题时主动清空草稿。
- 为避免范围膨胀，本阶段没有实现删除、作废、筛选等管理能力。

后续风险点：
- 选题状态仍不会随着“带入内容适配”自动变更，后续 P20 需要补状态流转。
- 当前选题池仍是本地数据，刷新和跨设备协作不可靠。
- 内容适配页只是读取选题池，没有形成内容日历和发布排期。

## 2026-09-12｜P20 研究选题状态流转

状态：已完成。

本阶段目标：
- 让研究选题池不再只是静态列表，而是能随着内容适配动作推进状态。
- 先完成最小状态流转：`待适配 → 适配中 → 已生成`。
- 保持范围克制：不引入复杂状态机页面，不新增后端，只更新本地选题池状态。

完成内容：
- 内容适配页从研究选题池选择“带入此选题”后：
  - 当前选题状态从 `待适配` 更新为 `适配中`
  - 本地存储 `flowpilot.geoResearch.topicPool` 同步更新
  - 页面选题池卡片立即显示新状态
- 使用带入选题生成平台草稿后：
  - 当前选题状态从 `适配中` 更新为 `已生成`
  - 本地存储同步更新
  - 页面选题池卡片立即显示新状态
- 新增状态白名单：
  - `待适配`
  - `适配中`
  - `已生成`
- 恢复选题池时接受以上状态，避免状态更新后被过滤掉。

修改文件：
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P5 内容适配页聚焦测试通过：1 个测试文件，11 条用例通过。
- P4 + P5 联动测试通过：2 个测试文件，17 条用例通过。
- 前端完整测试通过：27 个测试文件，87 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- 原本选题池只接受 `待适配` 状态，状态变更后如果不修改恢复逻辑，会导致新状态选题被过滤消失。
- 内容适配页生成草稿时需要知道当前草稿来自哪条研究选题，因此新增当前选题 ID 记录。
- 本阶段只更新当前被带入的选题，不处理批量状态和跨页面实时同步。

后续风险点：
- 研究页如果已经打开，内容适配页改变状态后不会自动跨页面刷新，需要后续做事件同步或后端化。
- 状态仍不完整，后续还需要扩展“已进入发布准备”“已发布”“已作废”等状态。
- 当前状态变更仍依赖 localStorage，不能作为可信审计记录。

## 2026-09-12｜P21 选题池管理能力

状态：已完成。

本阶段目标：
- 避免研究选题池不断累积无效选题。
- 增加最小管理能力：作废单条选题、清理已生成选题。
- 危险操作降权展示，不使用强烈主按钮样式，避免误操作感过强。

完成内容：
- 选题状态扩展为：
  - `待适配`
  - `适配中`
  - `已生成`
  - `已作废`
- 内容适配页研究选题池卡片新增“作废选题”操作。
- 对 `已生成` 和 `已作废` 选题不展示“作废选题”按钮，避免重复操作。
- 研究选题池顶部在存在 `已生成` 选题时显示“清理已生成选题”。
- 点击“清理已生成选题”后：
  - 从本地选题池移除所有 `已生成` 选题
  - 保留 `待适配`、`适配中`、`已作废` 选题
  - 页面与 localStorage 同步更新
- 本地选题池持久化统一封装为 `persistGeoResearchTopicPool`。

修改文件：
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：
- P5 内容适配页聚焦测试通过：1 个测试文件，12 条用例通过。
- P4 + P5 联动测试通过：2 个测试文件，18 条用例通过。
- 前端完整测试通过：27 个测试文件，88 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：
- 如果所有管理按钮都放成主按钮，会削弱“生成草稿”的主操作层级；本阶段把作废和清理做成低权重边框按钮。
- 清理已生成选题不应误删作废记录，因为作废记录本身是运营判断痕迹，暂时保留。
- 作废不是物理删除，方便后续回看为什么某些选题没有继续生产。

后续风险点：
- 目前没有二次确认弹窗，误点作废后只能通过直接改本地存储恢复。
 - 选题池管理仍在内容适配页内，后续如果选题数量增加，需要独立“选题计划”页面。
 - 作废、清理操作仍不是可信审计日志，后端化后需要记录操作者、时间和原因。

## 2026-09-14｜P22 内容日历雏形

状态：已完成。

本阶段目标：

- 在内容适配页增加轻量级“内容日历”视图，把研究选题池从列表进一步转成可观察的生产计划。
- 先解决“本周有哪些选题在等内容生产”的可见性问题，不提前引入复杂拖拽排期、日历编辑和后端日程。
- 保持页面语义清晰：研究选题池负责管理，内容日历负责查看计划压力。

完成内容：

- 在内容适配页新增“内容日历”区块。
- 从本地研究选题池读取数据，自动排除 `已作废` 选题。
- 按选题 `createdAt` 日期分组展示。
- 每条日历卡片展示：
  - 选题状态
  - 目标平台
  - 选题标题
  - 地域 / 产品 / 综合评分
- 当选题池为空或仅剩已作废选题时，不显示内容日历，避免制造无效信息噪声。
- 新增测试覆盖：内容日历展示、日期分组、作废选题不进入日历。

修改文件：

- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P5 内容适配页聚焦测试通过：1 个测试文件，13 条用例通过。
- P4 + P5 联动回归测试通过：2 个测试文件，19 条用例通过。
- 前端完整测试通过：27 个测试文件，89 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 内容日历和研究选题池会同时展示同一条选题，测试中如果直接使用全局文本断言，容易被另一个区域干扰；已改为在“内容日历”区域内做作用域断言。
- `已生成` 状态在选题池和日历里可能同时出现，测试断言不能假设页面上只有一个相同文案。
- 当前日期来源是选题创建时间，不是真正的发布时间或排期时间，因此只能称为“日历雏形”。

后续风险点：

- 当前内容日历仍依赖 localStorage，无法跨设备、跨用户协作。
- 当前没有独立排期字段，后续如果要做真正内容日历，需要增加 `scheduledAt`、`owner`、`channel`、`priority` 等字段。
- 当前无法拖拽调整日期，也无法在日历里直接变更状态。
- 如果选题数量继续增加，内容适配页会变重，后续需要拆出独立“内容计划 / 内容日历”页面。

## 2026-09-14｜P23 研究选题池数据契约抽离

状态：已完成。

本阶段目标：

- 为后续后端化做准备，先把研究选题池的数据结构、状态白名单、归一化校验和内容日历分组逻辑抽离为共享契约模块。
- 避免研究页和内容适配页各自维护一套选题池规则，降低后续接 API / 数据库时的迁移成本。
- 继续保持小步推进：本阶段不引入数据库、不引入真实 API、不改变页面交互。

完成内容：

- 新增共享契约模块：`flowpilot-ai/frontend/lib/geo-research-topic-contract.ts`。
- 统一导出：
  - `GEO_RESEARCH_TOPIC_POOL_STORAGE_KEY`
  - `GeoResearchContentAdaptationIntake`
  - `GeoResearchTopicStatus`
  - `GeoResearchTopicPoolItem`
  - `ContentCalendarGroup`
  - `isGeoResearchTopicStatus`
  - `normalizeGeoResearchTopicPool`
  - `buildContentCalendarGroups`
- 将研究选题池状态白名单集中到契约模块：
  - `待适配`
  - `适配中`
  - `已生成`
  - `已作废`
- 将内容适配页的选题池恢复逻辑改为调用 `normalizeGeoResearchTopicPool`。
- 将内容适配页的内容日历分组逻辑改为调用 `buildContentCalendarGroups`。
- 将 GEO Research 页面也接入同一套选题池存储键和归一化契约。
- 新增 P23 契约测试，覆盖：
  - 状态白名单
  - 非法结构过滤
  - 非法状态过滤
  - 已作废选题不进入内容日历
  - 日期分组输出

修改文件：

- `flowpilot-ai/frontend/lib/geo-research-topic-contract.ts`
- `flowpilot-ai/frontend/app/geo-research/geo-research-workspace.tsx`
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p23-geo-research-topic-contract.test.ts`

验证命令：

- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx __tests__/p23-geo-research-topic-contract.test.ts`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx __tests__/p23-geo-research-topic-contract.test.ts`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：

- P23 契约测试先失败，失败原因为共享契约模块尚未实现，符合 TDD 红灯预期。
- P23 契约测试通过：1 个测试文件，3 条用例通过。
- P5 + P23 回归测试通过：2 个测试文件，16 条用例通过。
- P4 + P5 + P23 联动测试通过：3 个测试文件，22 条用例通过。
- 前端完整测试通过：28 个测试文件，92 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：

- 研究页和内容适配页原先都各自定义了选题池类型与存储键，后续如果继续放任，会导致状态扩展和字段迁移时出现隐性不一致。
- 内容日历分组原先写在页面组件里，属于业务规则和 UI 混在一起；本阶段已抽到契约模块。
- 当前契约模块仍服务于 localStorage，本质上还不是后端 API 契约，只是后端化前的前端共享契约。

后续风险点：

- `normalizeGeoResearchTopicPool` 当前只做基础结构校验，没有做字段长度、危险字符、XSS 清洗和权限校验。
- 当前没有统一错误码，也没有 `{ ok, code, msg, data }` 的后端响应结构；进入真实 API 阶段必须补上。
- 当前选题池没有版本号和迁移策略，后续字段增加时需要设计 `schemaVersion`。
- 当前仍缺少服务端审计字段，如创建人、更新人、状态变更原因、状态变更时间。

## 2026-09-14｜P24 本地 API 响应契约与统一错误码

状态：已完成。

本阶段目标：

- 在接入真实后端之前，先定义统一 API 响应结构，避免后续页面、接口、测试各写各的返回格式。
- 建立统一错误码枚举，为后续表单校验、权限校验、并发冲突、限流和系统异常提供稳定表达。
- 继续保持范围克制：本阶段只定义契约和测试，不新增真实后端接口，不接数据库。

完成内容：

- 新增 API 契约模块：`flowpilot-ai/frontend/lib/api-contract.ts`。
- 定义统一成功响应：
  - `ok: true`
  - `code: "OK"`
  - `msg`
  - `data`
  - `traceId`
- 定义统一失败响应：
  - `ok: false`
  - `code`
  - `msg`
  - `data: null`
  - `traceId`
  - `details`
- 定义字段级错误结构：
  - `field`
  - `message`
- 定义统一错误码：
  - `VALIDATION_ERROR`
  - `UNAUTHORIZED`
  - `FORBIDDEN`
  - `NOT_FOUND`
  - `CONFLICT`
  - `RATE_LIMITED`
  - `INTERNAL_ERROR`
- 定义分页响应结构：
  - `items`
  - `page`
  - `pageSize`
  - `total`
  - `totalPages`
- 新增分页边界规整：
  - `page <= 0` 时使用 `1`
  - `pageSize <= 0` 时使用 `10`
  - `total < 0` 时使用 `0`

修改文件：

- `flowpilot-ai/frontend/lib/api-contract.ts`
- `flowpilot-ai/frontend/__tests__/p24-api-contract.test.ts`

验证命令：

- `npm.cmd run test -- --run __tests__/p24-api-contract.test.ts`
- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts __tests__/p24-api-contract.test.ts`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：

- P24 测试先失败，失败原因为 API 契约模块尚未实现，符合 TDD 红灯预期。
- P24 契约测试通过：1 个测试文件，3 条用例通过。
- P23 + P24 契约回归通过：2 个测试文件，6 条用例通过。
- 前端完整测试通过：29 个测试文件，95 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：

- 目前项目页面仍主要使用本地数据和直接函数调用，API 契约暂时没有被页面大规模接入；这是刻意保守推进，避免在没有后端时制造“伪 API 层”。
- 错误码已经定义，但还没有和具体业务表单、权限、状态流转失败场景绑定。
- 分页结构已定义，但当前选题池和内容日历仍未真正分页。

后续风险点：

- 如果后续真实后端返回格式与本契约不一致，需要优先调整后端或 Adapter，不建议让页面直接适配多个响应格式。
- 目前没有 HTTP 状态码映射表，后续应补充 `ApiErrorCode -> HTTP status` 映射。
- 目前没有 traceId 生成器，真实后端阶段需要由服务端生成并贯穿日志。
- 目前字段级错误仅定义结构，没有统一前端展示组件，后续表单接 API 时需要补。

## 2026-09-14｜P25 研究选题池仓储层抽象

状态：已完成。

本阶段目标：

- 将研究选题池的读写从页面组件中抽离，避免页面直接操作 `localStorage`。
- 为后续从本地存储迁移到 API / 数据库打基础，降低页面改动范围。
- 保持当前页面交互不变，只改变数据访问边界。

完成内容：

- 新增选题池仓储模块：`flowpilot-ai/frontend/lib/topic-pool-repository.ts`。
- 定义最小仓储接口：
  - `list()`
  - `save(items)`
  - `updateStatus(itemId, status)`
- 支持注入存储对象，便于单元测试，不强绑定浏览器环境。
- 新增浏览器仓储工厂：`createBrowserTopicPoolRepository()`。
- 仓储层复用 P23 的选题池契约：
  - 存储键统一
  - 数据归一化统一
  - 状态白名单统一
  - 损坏数据清理统一
- GEO Research 页面改为通过仓储层读取和保存选题池。
- 内容适配页面改为通过仓储层读取、保存、更新状态。

修改文件：

- `flowpilot-ai/frontend/lib/topic-pool-repository.ts`
- `flowpilot-ai/frontend/__tests__/p25-topic-pool-repository.test.ts`
- `flowpilot-ai/frontend/app/geo-research/geo-research-workspace.tsx`
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p25-topic-pool-repository.test.ts`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx __tests__/p23-geo-research-topic-contract.test.ts __tests__/p25-topic-pool-repository.test.ts`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：

- P25 测试先失败，失败原因为仓储模块尚未实现，符合 TDD 红灯预期。
- P25 仓储测试通过：1 个测试文件，4 条用例通过。
- P4 + P5 + P23 + P25 联动测试通过：4 个测试文件，26 条用例通过。
- 前端完整测试通过：30 个测试文件，99 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：

- 页面原先既负责展示，又负责存储恢复、数据清洗、状态更新，职责偏重；本阶段已把选题池 IO 边界抽到 Repository。
- 研究页和内容适配页都依赖同一个选题池，若继续各自读写 localStorage，后续接 API 时会出现多处迁移点。
- 当前仓储层是同步接口，适配 localStorage 很自然，但未来接 HTTP API 时需要改成异步接口或新增 API Repository。

后续风险点：

- 当前 Repository 仍然没有鉴权、审计、事务和并发控制，只是本地数据访问抽象。
- `updateStatus` 当前是读取后整体写回，未来多人协作时会有覆盖风险。
- 当前没有幂等请求 ID，真实后端状态更新时需要增加幂等键。
- 当前页面还没有 loading / error 状态来承接异步仓储，后续接 API 前需要补异步状态模型。

## 2026-09-14｜P26 异步数据状态模型

状态：已完成。

本阶段目标：

- 为后续从本地同步仓储迁移到 API 异步读取做准备。
- 先建立统一的数据访问状态模型，避免未来每个页面单独写 `loading / empty / error / success`。
- 保持范围克制：本阶段只做共享状态模型和仓储状态视图，不大规模改页面 UI。

完成内容：

- 新增异步数据状态模块：`flowpilot-ai/frontend/lib/async-data-state.ts`。
- 定义统一状态：
  - `loading`
  - `empty`
  - `success`
  - `error`
- 新增状态构造函数：
  - `createLoadingState()`
  - `createEmptyState()`
  - `createSuccessState(data)`
  - `createErrorState(error)`
  - `resolveAsyncState(loader)`
- `createSuccessState([])` 自动转为空状态，减少页面重复判断。
- `createErrorState` 支持 `Error`、字符串和未知错误输入。
- 选题池 Repository 新增 `listState()`，提供选题池状态视图：
  - 有数据时返回 `success`
  - 空数组时返回 `empty`

修改文件：

- `flowpilot-ai/frontend/lib/async-data-state.ts`
- `flowpilot-ai/frontend/__tests__/p26-async-data-state.test.ts`
- `flowpilot-ai/frontend/lib/topic-pool-repository.ts`
- `flowpilot-ai/frontend/__tests__/p25-topic-pool-repository.test.ts`

验证命令：

- `npm.cmd run test -- --run __tests__/p26-async-data-state.test.ts`
- `npm.cmd run test -- --run __tests__/p25-topic-pool-repository.test.ts __tests__/p26-async-data-state.test.ts`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx __tests__/p23-geo-research-topic-contract.test.ts __tests__/p24-api-contract.test.ts __tests__/p25-topic-pool-repository.test.ts __tests__/p26-async-data-state.test.ts`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/geo-research`
- 访问 `/content-adaptation`

已验证结果：

- P26 测试先失败，失败原因为异步状态模块尚未实现，符合 TDD 红灯预期。
- P26 聚焦测试通过：1 个测试文件，6 条用例通过。
- P25 + P26 仓储状态回归通过：2 个测试文件，11 条用例通过。
- P4 + P5 + P23 + P24 + P25 + P26 联动测试通过：6 个测试文件，36 条用例通过。
- 前端完整测试通过：31 个测试文件，106 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/geo-research` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。

遇到的问题：

- 当前页面仍以同步 localStorage 为主，异步状态模型暂时只在仓储层提供状态视图，尚未全面驱动 UI。
- 如果马上把所有页面状态都改成异步，会造成一次性改动过大；本阶段选择先完成底层契约。
- `createSuccessState([])` 自动转 `empty` 对列表数据很方便，但对“空数组也是成功结果”的特殊场景，后续可能需要显式配置。

后续风险点：

- 当前页面还没有统一的 `DataStateView` 组件，后续需要补 loading / empty / error 的可视化组件。
- 异步状态模型还没有取消请求、竞态保护和重试机制。
- 接真实 API 后，需要防止旧请求晚返回覆盖新请求结果。
- 错误信息目前只做展示文本，没有接入错误码、字段级错误和日志 traceId。

## 2026-09-14｜P27 数据状态展示组件

状态：已完成。

本阶段目标：

- 建立统一的数据状态展示组件，避免后续每个页面重复写 loading / empty / error / success。
- 为后续接入 API、异步仓储、请求失败重试做 UI 基础。
- 保持用户可见文案中文化，不把技术细节直接暴露给运营用户。

完成内容：

- 新增组件：`flowpilot-ai/frontend/app/components/data-state-view.tsx`。
- 支持状态：
  - `loading`
  - `empty`
  - `error`
  - `success`
- 加载状态使用骨架屏样式和 `role="status"`。
- 错误状态使用 `role="alert"`，支持可选“重试”按钮。
- 空状态支持自定义标题和说明。
- 成功状态通过 render props 渲染业务内容，避免组件绑定具体业务。

修改文件：

- `flowpilot-ai/frontend/app/components/data-state-view.tsx`
- `flowpilot-ai/frontend/__tests__/p27-data-state-view.test.tsx`

验证结果：

- P27 测试先失败，失败原因为组件尚未实现，符合 TDD 红灯预期。
- P27 聚焦测试通过：1 个测试文件，4 条用例通过。

后续风险点：

- 当前组件只做展示层，没有内置请求取消、竞态保护和自动重试。
- 字段级错误尚未展示，后续表单接 API 时需要扩展。
- 错误文案当前由调用方传入，后续应和 P24 错误码映射联动。

## 2026-09-14｜P28 内容日历独立页面

状态：已完成。

本阶段目标：

- 将内容日历从内容适配页中独立出来，避免内容适配页继续变重。
- 独立页面先承担“查看内容生产计划压力”的职责，不提前做复杂排期。
- 复用 P23 选题池契约、P25 仓储层、P26 异步状态模型和 P27 数据状态组件。

完成内容：

- 新增页面路由：`/content-calendar`。
- 新增页面文件：`flowpilot-ai/frontend/app/content-calendar/page.tsx`。
- 新增工作区组件：`flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`。
- 内容日历页面从选题池仓储读取数据。
- 自动排除 `已作废` 选题。
- 按创建日期分组展示选题。
- 展示：
  - 选题状态
  - 平台
  - 综合评分
  - 选题标题
  - 地域
  - 产品
  - 品牌
- 空数据时展示统一空状态。
- 全局导航新增“内容日历”入口。

修改文件：

- `flowpilot-ai/frontend/app/content-calendar/page.tsx`
- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/app/components/state-card.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p27-data-state-view.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p4-0-geo-research.test.tsx __tests__/p5-content-adaptation-page.test.tsx __tests__/p25-topic-pool-repository.test.ts __tests__/p26-async-data-state.test.ts __tests__/p27-data-state-view.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P28 测试先失败，失败原因为页面尚未实现，符合 TDD 红灯预期。
- P27 + P28 聚焦测试通过：2 个测试文件，6 条用例通过。
- 相关链路回归通过：6 个测试文件，36 条用例通过。
- 前端完整测试通过：33 个测试文件，112 条用例通过。
- 前端生产构建通过，构建产物包含 `/content-calendar`。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 当前内容日历仍使用 `createdAt` 作为日期分组依据，不是真正计划发布时间。
- 独立页面解决了“内容适配页变重”的一部分问题，但内容适配页内仍保留了轻量日历预览。
- 当前没有筛选、搜索、拖拽、改期、负责人等功能。

后续风险点：

- 后续 P29 需要增加 `scheduledAt` 字段，区分创建时间和计划发布时间。
- 后续 P30 需要增加筛选和搜索，否则选题数量增长后页面会变重。
- 后续接 API 时，内容日历页面需要处理请求失败、重试、旧请求覆盖新请求等问题。
- 当前导航已新增入口，但移动端侧边导航仍依赖现有布局，后续需要做移动端导航专项检查。

## 2026-09-14｜P29 内容日历排期字段

状态：已完成。

本阶段目标：

- 将内容日历从“按创建时间查看选题”升级为“优先按计划发布时间查看选题”。
- 增加最小排期字段，为后续真正排期、负责人分配、优先级筛选和内容阶段流转做准备。
- 不做拖拽、不做编辑弹窗、不做后端保存，避免一次性过度设计。

完成内容：

- 研究选题池契约新增可选字段：
  - `scheduledAt`
  - `owner`
  - `priority`
  - `contentStage`
- `priority` 暂定：
  - `高`
  - `中`
  - `低`
- `contentStage` 暂定：
  - `待生产`
  - `生产中`
  - `待审核`
  - `已完成`
- 内容日历分组逻辑调整：
  - 优先使用 `scheduledAt`
  - 没有 `scheduledAt` 时回退 `createdAt`
- 独立内容日历页面展示：
  - 负责人
  - 优先级
  - 内容阶段
- 内容适配页内的轻量内容日历预览同步展示：
  - 负责人
  - 优先级
  - 内容阶段
- 无排期字段时使用安全默认展示：
  - 负责人：`未分配`
  - 优先级：`中`
  - 阶段：`待生产`

修改文件：

- `flowpilot-ai/frontend/lib/geo-research-topic-contract.ts`
- `flowpilot-ai/frontend/__tests__/p23-geo-research-topic-contract.test.ts`
- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`
- `flowpilot-ai/frontend/app/content-adaptation/content-adaptation-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p5-content-adaptation-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts`
- `npm.cmd run test -- --run __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p5-content-adaptation-page.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P29 契约测试先失败，失败原因是日历仍按 `createdAt` 分组，符合 TDD 红灯预期。
- P23 契约测试通过：1 个测试文件，4 条用例通过。
- P28 页面测试先失败，失败原因是页面尚未展示排期字段，符合 TDD 红灯预期。
- P5 + P28 页面测试通过：2 个测试文件，15 条用例通过。
- P23 + P5 + P28 联动测试通过：3 个测试文件，19 条用例通过。
- 前端完整测试通过：33 个测试文件，113 条用例通过。
- 前端生产构建通过。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 内容适配页测试中，新增排期字段时最初命中了另一个测试样本，不是内容日历样本；后续修正为对目标日历测试数据补字段。
- `contentStage` 默认值会让多个选题同时显示“阶段 待生产”，测试断言不能假设页面只有一个相同文案。
- 当前排期字段只是契约和展示，不支持用户在页面上编辑。

后续风险点：

- `scheduledAt` 目前没有输入表单，也没有合法时间校验。
- `owner` 目前是自由文本，未来需要接用户体系或成员列表。
- `priority` 和 `contentStage` 还没有筛选、排序和状态流转规则。
- 没有审计记录，后续排期变更必须记录修改人、修改时间和原因。

## 2026-09-14｜P30 内容日历筛选与搜索

状态：已完成。

本阶段目标：

- 给内容日历增加最小可用筛选能力，避免选题数量增长后页面只能靠人工滚动查找。
- 支持按关键词、状态、平台、负责人、优先级筛选内容计划。
- 保持本阶段克制：不做后端筛选、不做 URL 查询参数持久化、不做复杂排序和拖拽排期。

完成内容：

- 内容日历页面新增“内容日历筛选”区域。
- 新增关键词搜索，覆盖标题、品牌、产品、地域、平台、负责人等字段。
- 新增状态筛选：待适配、适配中、已生成。
- 新增平台筛选，平台选项从当前选题池动态提取。
- 新增负责人筛选，负责人选项从当前选题池动态提取，缺省值显示为“未分配”。
- 新增优先级筛选，优先级选项从当前选题池动态提取。
- 新增筛选结果数量提示。
- 当筛选后没有匹配内容时，显示独立空状态，提示用户放宽筛选条件。
- 筛选结果继续复用原有日期分组展示逻辑。

修改文件：

- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P30 筛选测试先失败，失败原因是页面尚未提供“关键词搜索 / 状态筛选 / 平台筛选 / 负责人筛选 / 优先级筛选”等控件，符合 TDD 红灯预期。
- P28 内容日历聚焦测试通过：1 个测试文件，3 条用例通过。
- 前端完整测试通过：33 个测试文件，114 条用例通过。
- 前端生产构建通过，构建产物包含 `/content-calendar`。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 当前内容日历筛选仍然是纯前端本地筛选，后续数据量变大后需要迁移到后端查询或分页查询。
- 平台、负责人、优先级目前从当前数据动态提取，空数据状态下不会显示预设完整选项。
- 为了避免过度设计，本阶段没有加入日期范围筛选、排序、拖拽排期和批量操作。

后续风险点：

- 筛选条件没有同步到 URL，刷新页面后不会保留。
- 关键词搜索没有防抖；当前数据量小影响不大，后续接 API 或大数据量时需要补上。
- 移动端筛选区控件增多后可能变长，需要后续做移动端专项检查。
- 当前筛选不涉及权限、负责人真实用户体系和审计记录，接入后端后需要补齐。

## 2026-09-14｜P31 内容日历日期范围筛选

状态：已完成。

本阶段目标：

- 在 P30 已有关键词、状态、平台、负责人、优先级筛选基础上，补齐按计划发布日期范围查看内容计划的能力。
- 让运营人员可以快速查看某一周、某一月或某个活动周期内的内容生产安排。
- 保持最小闭环：只做本地日期范围筛选，不做拖拽排期、不做后端查询、不做 URL 参数持久化。

完成内容：

- 内容日历筛选区新增：
  - 开始日期
  - 结束日期
- 日期范围筛选优先使用 `scheduledAt`。
- 当选题没有 `scheduledAt` 时，回退使用 `createdAt`，与当前内容日历分组逻辑保持一致。
- 日期筛选与原有关键词、状态、平台、负责人、优先级筛选可以叠加使用。
- 无匹配结果时，空状态文案同步补充“日期范围”提示。
- 顺手将内容日历工作区组件整理为干净中文可见文案，避免后续维护时继续被终端编码显示影响。

修改文件：

- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P31 日期范围筛选测试先失败，失败原因是页面尚未提供“开始日期”控件，符合 TDD 红灯预期。
- P28 内容日历聚焦测试通过：1 个测试文件，4 条用例通过。
- P23 + P5 + P28 相关回归通过：3 个测试文件，21 条用例通过。
- 前端完整测试通过：33 个测试文件，115 条用例通过。
- 前端生产构建通过，构建产物包含 `/content-calendar`。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 旧文件在 PowerShell 里显示为乱码，普通上下文补丁容易匹配失败。
- 为了降低后续维护成本，本阶段将 `content-calendar-workspace.tsx` 整体整理为干净中文版本，而不是继续在乱码上下文里局部修补。
- 日期筛选目前只支持闭区间，不支持快捷选项，例如“本周”“本月”“未来 7 天”。

后续风险点：

- 日期筛选没有做开始日期晚于结束日期的表单提示，目前结果会自然为空，后续需要更明确的错误状态。
- 筛选条件仍未写入 URL，刷新后不会保留。
- 日期范围筛选仍为前端本地筛选，接入后端数据后需要改为接口参数。
- `scheduledAt` 仍没有页面编辑入口，后续如果要做真正排期，需要新增编辑、审计和冲突检查。

## 2026-09-14｜P32 内容日历日期范围异常提示

状态：已完成。

本阶段目标：

- 解决“开始日期晚于结束日期”时页面只显示普通空状态的问题。
- 给运营用户明确反馈筛选条件错误，避免误以为当前周期没有内容计划。
- 保持最小实现：只做前端校验提示，不引入复杂表单库、不改数据结构、不接后端。

完成内容：

- 内容日历增加日期范围合法性判断。
- 当开始日期晚于结束日期时，显示错误提示：
  - `开始日期不能晚于结束日期`
  - `请调整日期范围后再查看内容计划。`
- 错误提示使用 `role="alert"`，方便测试和辅助技术识别。
- 日期范围错误时不再显示普通“没有匹配的内容计划”空状态。

修改文件：

- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P32 异常测试先失败，失败原因是页面尚未显示“开始日期不能晚于结束日期”，符合 TDD 红灯预期。
- P28 内容日历聚焦测试通过：1 个测试文件，5 条用例通过。
- P23 + P5 + P28 相关回归通过：3 个测试文件，22 条用例通过。
- 前端完整测试通过：33 个测试文件，116 条用例通过。
- 前端生产构建通过，构建产物包含 `/content-calendar`。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 日期输入在测试中使用 `input[type="date"]` 选择，避免历史文件终端编码显示不稳定导致 label 匹配脆弱。
- 当前错误提示只处理日期先后关系，不处理非法日期字符串，因为浏览器原生 date input 已经限制基础格式。

后续风险点：

- 当前错误提示没有禁用其他筛选控件，用户仍可以调整其他条件；这不是功能错误，但后续可考虑更明确的筛选状态管理。
- 日期范围错误没有写入统一错误码体系，后续接接口或统一表单校验时需要纳入错误契约。
- 当前仍未提供 `scheduledAt` 编辑入口，日期筛选只能消费已有数据，不能在本页直接排期。

## 2026-09-14｜P33 内容日历一键清空筛选

状态：已完成。

本阶段目标：

- 解决内容日历叠加多个筛选条件后，需要逐个手动清空的问题。
- 提供一个低风险、高频使用的“清空筛选”操作，提升运营查看内容计划的效率。
- 保持最小实现：只重置前端筛选状态，不改数据、不接后端、不引入复杂状态管理。

完成内容：

- 内容日历筛选区新增“清空筛选”按钮。
- 点击后会同时清空：
  - 关键词
  - 状态
  - 平台
  - 负责人
  - 优先级
  - 开始日期
  - 结束日期
- 清空后列表恢复展示全部内容计划。
- 顺手将内容日历工作区组件整理为干净中文可见文案，降低后续维护成本。

修改文件：

- `flowpilot-ai/frontend/app/content-calendar/content-calendar-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p28-content-calendar-page.test.tsx`

验证命令：

- `npm.cmd run test -- --run __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run __tests__/p23-geo-research-topic-contract.test.ts __tests__/p5-content-adaptation-page.test.tsx __tests__/p28-content-calendar-page.test.tsx`
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- 访问 `/content-calendar`
- 访问 `/content-adaptation`
- 访问 `/geo-research`

已验证结果：

- P33 清空筛选测试先失败，失败原因是页面尚未提供“清空筛选”按钮，符合 TDD 红灯预期。
- P28 内容日历聚焦测试通过：1 个测试文件，6 条用例通过。
- P23 + P5 + P28 相关回归通过：3 个测试文件，23 条用例通过。
- 前端完整测试通过：33 个测试文件，117 条用例通过。
- 前端生产构建通过，构建产物包含 `/content-calendar`。
- 本地页面访问 `/content-calendar` 返回 HTTP 200。
- 本地页面访问 `/content-adaptation` 返回 HTTP 200。
- 本地页面访问 `/geo-research` 返回 HTTP 200。

遇到的问题：

- 内容日历组件文件在终端中存在历史编码显示问题，局部补丁对部分旧中文上下文不稳定。
- 本阶段选择重写单一职责组件文件，保持功能不变并整理为干净中文文案，避免继续在乱码上下文中维护。

后续风险点：

- 清空筛选只清空本地 React 状态；如果后续筛选条件同步到 URL，需要同步清理 URL 参数。
- 当前按钮始终显示，即使没有筛选条件也可点击；后续可增加禁用态，但本阶段暂不引入额外复杂度。
- 日期范围、筛选条件和未来后端查询参数之间还没有统一契约，接入 API 时需要统一字段定义。
