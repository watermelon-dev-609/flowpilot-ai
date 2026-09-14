# FlowPilot AI 开发日志

本文档汇总**带日期的开发记录**中的「§15 进度记录」与「§16 GEO- 历史项目吸收计划」。

- P0–P4 计划与完成记录 → `FlowPilot_AI_P0-P4记录.md`
- UI 相关完成记录 → `FlowPilot_AI_UI完成记录.md`
- 配套文档：项目计划 `FlowPilot_AI_项目计划.md`、UI 参考 `FlowPilot_AI_UI参考.md`

## 15. 进度记录

### 2026-09-15｜GEO 研究选题同步内容日历 API

状态：已完成

完成内容：

- `/geo-research` 点击「加入内容适配准备」时，继续写入本地内容适配 intake 与本地选题池。
- 在浏览器支持 `fetch` 且后端可用时，同步调用 `POST /api/content-calendar/plans` 创建后端内容计划。
- 同步成功后显示「已加入内容适配准备，并同步到内容日历 API」。
- 同步失败时保留本地选题池结果，并展示 API 同步失败原因，不伪造成后端成功。
- 前端 API 层新增 `createContentCalendarPlan`，与已有内容日历读取和更新 API 形成闭环。

验证方式：

- 先新增 GEO 研究页 API 同步失败测试，再实现页面逻辑。
- 聚焦测试：`npm.cmd run test -- __tests__/p4-0-geo-research.test.tsx --run`
- 前端全量测试：`npm.cmd run test -- --run`
- 前端生产构建：`npm.cmd run build`
- 后端回归测试：`.\.venv\Scripts\python.exe -m pytest -q`

验证结果：

- GEO 研究页聚焦测试通过：1 个测试文件、7 个测试用例通过。

下一步：

- 内容日历后端继续支持筛选、排序、日期范围和分页查询。
- 后续可逐步减少 localStorage 作为主数据源，只保留离线 Demo 兜底。

### 2026-09-14｜内容日历后端 API 最小持久化闭环

状态：已完成

完成内容：

- 后端新增内容计划本地持久化 Store：`content-calendar.local.json`。
- 后端新增内容计划 API：
  - `GET /api/content-calendar/plans`
  - `POST /api/content-calendar/plans`
  - `PATCH /api/content-calendar/plans/{plan_id}`
- 内容计划支持保存主题、平台、品牌、产品、地区、目标受众、事实、评分、状态、计划时间、负责人、优先级和内容阶段。
- 更新排期时写入审计日志，记录 `created` 与 `plan_updated`。
- 前端 `/content-calendar` 改为优先读取后端内容计划 API。
- 当前端 API 不可用或测试环境没有 `fetch` 时，继续回退到本地选题池，保留现有 Demo 可用性。
- 编辑计划时，API 模式优先 `PATCH` 后端；本地模式继续写 localStorage。
- `.gitignore` 增加后端内容计划本地数据文件，避免运行数据误提交。

验证方式：

- 先新增后端内容计划 API 失败测试，再实现 Store 与路由。
- 先新增前端 API 优先读取与更新失败测试，再接入页面。
- 后端聚焦测试：`.\.venv\Scripts\python.exe -m pytest tests\test_p34_content_calendar_api.py -q`
- 前端聚焦测试：`npm.cmd run test -- __tests__/p28-content-calendar-page.test.tsx --run`
- 前端全量测试：`npm.cmd run test -- --run`
- 前端生产构建：`npm.cmd run build`
- 后端全量测试：`.\.venv\Scripts\python.exe -m pytest -q`

验证结果：

- 后端聚焦测试通过：2 个测试用例通过。
- 前端聚焦测试通过：1 个测试文件、11 个测试用例通过。

下一步：

- 将 GEO 研究页加入选题池时，同步创建后端内容计划，减少 localStorage 和 API 数据源之间的割裂。
- 后续进入 PostgreSQL 时，将本地 JSON Store 替换为数据库 Repository。

### 2026-09-14｜内容日历运营筛选增强

状态：已完成

完成内容：

- `/content-calendar` 新增排序方式：日期最近优先、评分最高优先、优先级最高优先。
- 新增快捷日期范围操作：未来 7 天、本月。
- 新增已启用筛选数量提示，帮助运营人员判断当前视图是否被筛选条件限制。
- 无筛选且默认排序时，「清空筛选」进入禁用态，避免无效点击。
- 非默认排序会同步到 URL 的 `sort` 参数，继续保持可分享视图能力。

验证方式：

- 先新增排序、快捷日期、筛选启用状态失败测试，再实现页面逻辑。
- 聚焦测试：`npm.cmd run test -- __tests__/p28-content-calendar-page.test.tsx --run`
- 前端全量测试：`npm.cmd run test -- --run`
- 前端生产构建：`npm.cmd run build`
- 后端回归测试：`.\.venv\Scripts\python.exe -m pytest -q`

验证结果：

- 聚焦测试通过：1 个测试文件、10 个测试用例通过。

下一步：

- 内容日历后续可继续做后端持久化、分页查询和批量操作。
- 若优先补系统底座，建议进入 PostgreSQL 数据模型与 API 持久化。

### 2026-09-14｜内容日历筛选条件 URL 同步

状态：已完成

完成内容：

- `/content-calendar` 支持从 URL 参数恢复筛选条件。
- 用户调整关键词、状态、平台、负责人、优先级、开始日期、结束日期后，地址栏自动同步参数。
- 点击「清空筛选」后同时清空页面筛选状态与 URL 参数。
- 继续使用前端本地筛选，不改变现有选题池数据结构。

验证方式：

- 先新增 URL 恢复与 URL 同步失败测试，再实现页面逻辑。
- 聚焦测试：`npm.cmd run test -- __tests__/p28-content-calendar-page.test.tsx --run`
- 前端全量测试：`npm.cmd run test -- --run`
- 前端生产构建：`npm.cmd run build`
- 后端回归测试：`.\.venv\Scripts\python.exe -m pytest -q`

验证结果：

- 聚焦测试通过：1 个测试文件、9 个测试用例通过。
- 筛选 URL 参数包括：`keyword`、`status`、`platform`、`owner`、`priority`、`start`、`end`。

下一步：

- 内容日历后续可继续接后端持久化与后端查询参数。
- 当选题数量增长后，可以增加分页、排序和关键词防抖。

### 2026-09-14｜内容日历计划编辑能力

状态：已完成

完成内容：

- `/content-calendar` 内容日历卡片新增「编辑计划」操作，支持内联修改计划发布日期、负责人、优先级、内容阶段和计划状态。
- 新增选题池仓储 `updatePlan` 方法，保存后同步写回本地选题池数据，并刷新页面列表与分组统计。
- 保存成功后显示「计划已保存」反馈，避免用户不确定修改是否生效。
- 保持现有内容日历视图结构，不引入新的页面跳转或重型表单。

验证方式：

- 先新增内容日历编辑失败测试，再实现页面与仓储能力。
- 局部测试：`npm.cmd run test -- __tests__/p25-topic-pool-repository.test.ts __tests__/p28-content-calendar-page.test.tsx --run`
- 前端全量测试：`npm.cmd run test -- --run`
- 前端生产构建：`npm.cmd run build`
- 后端回归测试：`.\.venv\Scripts\python.exe -m pytest -q`

验证结果：

- 局部测试通过：2 个测试文件、13 个测试用例通过。
- 前端全量测试通过：34 个测试文件、124 个测试用例通过。
- 前端生产构建通过，包含 `/content-calendar` 路由。
- 后端回归测试通过：39 个测试用例通过。
- 浏览器插件交互验收尝试连接成功，但当前页面脚本上下文无法访问 `localStorage`，因此本次提交以自动化测试和生产构建作为验收依据。

下一步：

- 为内容日历补充筛选条件 URL 同步，方便复制当前视图给团队成员。
- 后续接入后端持久化时，将本地选题池仓储替换为 API 数据源。

### 2026-09-14｜移动端抽屉导航补齐

状态：已完成

完成内容：

- 顶部栏在移动端新增“打开移动导航”按钮。
- 移动端点击后展示侧滑抽屉导航，保留首页、规则、研究、内容、监测全部入口。
- 抽屉支持关闭按钮，点击任意导航链接后自动收起。
- 桌面端保留原有侧边栏折叠逻辑。

验证方式：

- 先新增布局测试，确认旧实现没有移动端抽屉入口。
- 实现后运行局部测试、前端全量测试、Next.js 构建、后端 pytest。
- 进行移动端和桌面端浏览器级交互验收。

验证结果：

- 移动端抽屉导航测试通过。
- 浏览器级验收通过：375px 下可打开 / 关闭抽屉，抽屉含 12 个导航入口；1440px 下桌面侧栏仍存在。
- 前端全量测试通过：34 files / 122 tests passed。
- 前端构建通过。
- 后端测试通过：39 passed。

下一步：

- 继续按计划补内容日历编辑能力或筛选 URL 同步能力。

### 2026-09-14｜GEO 总览统计口径统一

状态：已完成

完成内容：

- GEO 监测总览的监测任务数改为只统计真实 / 人工任务。
- GEO 监测总览的待复核记录、最高证据等级、来源引用记录改为只统计真实 / 人工记录。
- 与报表页保持一致，不再把模拟数据计入真实运营效果。
- 补充概览指标测试，覆盖模拟任务和模拟记录被排除的场景。

验证方式：

- 先新增失败测试复现模拟数据混入总览统计的问题。
- 修改概览组件后运行局部测试、前端全量测试、Next.js 构建、后端 pytest。

验证结果：

- GEO 总览统计口径测试通过。
- 前端全量测试通过：34 files / 121 tests passed。
- 前端构建通过。
- 后端测试通过：39 passed。

下一步：

- 继续补移动端导航与截图验收。

### 2026-09-14｜首页运营指标接入真实接口

状态：已完成

完成内容：

- 首页 4 个运营指标不再使用固定业务数字。
- 待复核规则来自规则复核提醒接口。
- 监测任务、监测记录、最高证据等级来自监测任务与监测记录接口。
- 统计口径排除模拟数据，只统计真实 / 人工任务与记录。
- 接口不可用时显示 0 和接口不可用说明，避免把旧硬编码数字当作真实运营数据。

验证方式：

- 先补充首页测试，确认旧实现无法显示接口统计口径。
- 运行首页测试、前端全量测试、Next.js 构建、后端 pytest。

验证结果：

- 首页测试通过：8 passed。
- 前端全量测试通过：33 files / 120 tests passed。
- 前端构建通过。
- 后端测试通过：39 passed。

下一步：

- 继续处理 GEO 概览与报表统计口径不一致问题。
- 继续补移动端导航与截图验收。

### 2026-09-09｜需求确认与项目计划建立

状态：已完成

完成内容：

- 明确项目必须串联个人简历能力。
- 明确三个企业级方向中优先实现方案 A。
- 明确方案 B 和方案 C 作为后续扩展。
- 建立阶段计划、验收清单、进度记录规则。

验证方式：

- 与用户确认项目目标。
- 将项目计划写入本文档，作为后续开发依据。

验证结果：

- 通过。

问题与修复：

- 暂无。

下一步：

- 等用户确认本文档内容。
- 用户确认后进入 P0 项目骨架阶段。

### 2026-09-09｜GEO 承诺边界与 AI 引用准备度设计

状态：已完成

完成内容：

- 明确项目不承诺 GEO 排名。
- 明确项目不承诺一定被 AI 平台引用。
- 将“承诺排名”调整为“提高 AI Citation Readiness，并进行 GEO Monitor 观测记录”。
- 新增 AI Citation Readiness Score 设计。
- 新增 GEO Monitor 五级状态：未出现、相关概念出现、品牌提及、页面检索、来源引用。
- 补充验收清单，要求系统不能输出“保证排名”或“保证引用”等承诺性文案。

验证方式：

- 将决策写入项目定位、MVP 主流程、阶段计划、技术设计和验收清单。

验证结果：

- 通过。

问题与修复：

- 暂无。

下一步：

- 等用户确认是否进入 P0 项目骨架阶段。

### 2026-09-09｜BOSS 岗位需求对标记录

状态：已完成

对标岗位：

- GEO / 生成式引擎优化岗位
- 全媒体运营 / 新媒体运营岗位

岗位一：GEO / 生成式引擎优化

匹配度判断：较高，约 80%。

已覆盖内容：

- GEO 内容优化。
- 大模型问答、AI 搜索、引用、曝光相关工作流。
- GEO 关键词库、实体库、问题库。
- 网站内容结构优化。
- AI Citation Readiness 检查。
- GEO Monitor 数据监测。
- AI 适配内容写作规范、模板、Prompt Library。
- 与技术侧协同的结构化标签、爬虫可访问性检查。

待补强内容：

- 编辑任务管理：岗位要求管理编辑小组、分配任务、把控质量，项目需要增加 Content Task Board。
- 报表复盘：岗位要求定期汇报收录效果，项目需要增加 GEO Report / Dashboard。
- AI 平台规则跟踪：岗位要求跟进模型检索规则更新，项目需要增加 AI Platform Rule Tracker。
- 网站技术适配：岗位要求懂自建站基础架构、爬虫、页面优化，项目需要增加 Website Audit Checklist。

岗位二：全媒体运营 / 新媒体运营

匹配度判断：中高，约 70%。

已覆盖内容：

- 多平台内容策略。
- 官网、公众号、知乎、百家号、小红书内容适配。
- 图文内容生产。
- 内容质量审核。
- 内容历史记录。
- 运营数据记录。
- AIGC Studio 预留图像/视频内容扩展。

待补强内容：

- 社交互动与粉丝增长：当前项目不做评论互动、粉丝运营。
- 营销活动策划：当前项目偏内容生产与 GEO，不做活动项目管理。
- KOL / 媒体资源管理：不建议第一阶段开发，和简历主线弱相关。
- 案例沉淀：项目需要支持导出业务 Case Study；产品页面不做个人作品集展示。

由岗位对标产生的项目优化项：

| 优化项 | 对应岗位要求 | 是否进入 MVP |
|---|---|---|
| GEO Keyword / Entity / Question Library | 搭建 GEO 关键词库 | 是 |
| AI Citation Readiness | 适配 AI 识别抓取 | 是 |
| GEO Monitor | 监控 AI 收录数据 | 是，简化版 |
| Prompt Library / Content Template | 制定 AI 适配内容规范 | 是 |
| Brand Knowledge Base | 重点品牌事实管理，防止 AI 编造 | 是 |
| Platform Rewriter | 一篇母稿生成多平台差异化版本 | 是 |
| Publish Center | 多平台发布任务、URL、状态记录 | 是，先做记录与导出，不做全自动发布 |
| Case Study Export | 输出可用于复盘、汇报和面试讲解的业务案例报告 | 是 |
| Content Task Board | 分配任务、管理编辑小组 | MVP 可做单人版，团队版后置 |
| GEO Report Dashboard | 数据报表、定期汇报 | 是，简化版 |
| Website Audit Checklist | 页面、爬虫、结构化标签 | 是，检查清单版 |
| AI Platform Rule Tracker | 跟进大模型检索规则更新 | 后置 |
| AIGC Studio | 图文、视频内容输出 | 后置 |
| Campaign / KOL 管理 | 营销活动、渠道资源 | 暂不做 |

开发顺序调整：

1. 产品中心与产品卡片。
2. 品牌知识库 Brand Knowledge Base。
3. GEO Keyword / Entity / Question Library。
4. GEO 母稿生成。
5. Platform Rewriter 多平台差异化改写。
6. Fact Check + GEO Critic。
7. AI Citation Readiness。
8. Publish Center 发布记录与导出。
9. Content Task Board 单人版。
10. GEO Monitor 简化版。
11. GEO Report Dashboard 简化版。
12. Website Audit Checklist。
13. Case Study Export。

简历表达优化方向：

项目完成后，简历中可突出：

- 面向企业 GEO 优化场景，设计产品实体库、用户问题库和 AI 适配内容工作流。
- 建立 AI Citation Readiness 评分机制，从实体清晰度、问题覆盖度、事实可信度、结构化程度、原创信息增量、爬虫可访问性等维度审核内容。
- 设计 GEO Monitor，区分品牌提及、页面检索、来源引用等不同可见性状态。
- 支持官网、公众号、知乎、百家号、小红书等多平台内容适配。
- 建立内容模板、Prompt Library 和质量审核流程，提高内容产出标准化程度。

下一步：

- 等用户确认是否按本次岗位对标结果调整 MVP。
- 若确认，进入 P0 项目骨架阶段。

## 16. GEO- 历史项目吸收计划

### 16.1 GEO- 项目事实

GitHub 仓库：`https://github.com/watermelon-dev-609/GEO-`

项目名称：GEO 生成式搜索优化系统 v2.2

项目性质：用户此前开发的 GEO 系统，可作为 FlowPilot AI 的历史能力来源与功能参考。

公开 README 中体现的已有能力：

- 文案导入与智能清洗。
- GEO 优化工坊。
- 多 AI 平台适配。
- AI 评测中心。
- 成果导出。
- 策略中心。
- YAML 动态规则引擎。
- 品牌监测。
- 批量处理。
- 定时任务。
- 数据闭环仪表盘。
- 版本管理。
- SEO 集成。
- 合规审计。
- 转化追踪。
- FastAPI 后端。
- Vue 3 + Vite + Element Plus 前端。
- LLM 适配器工厂。
- 本地 JSON + YAML 存储。

### 16.2 可复用设计

FlowPilot AI 后续优先吸收以下设计思想：

| GEO- 已有设计 | FlowPilot AI 中的复用方式 |
|---|---|
| YAML 动态规则引擎 | 用于 AI Channel 规则、Publishing Channel 模板、Prompt 模板 |
| AI 采信评测 | 升级为 AI Citation Readiness + GEO Critic |
| 品牌监测 | 升级为 GEO Monitor |
| 成果导出 | 升级为平台版本导出与 Case Study Export |
| 合规审计 | 用于广告词、绝对化用语、虚假排名承诺检查 |
| 转化追踪 | 后续接入发布 URL、UTM、询盘记录 |
| 批量处理 | 后续支持一篇母稿生成多个平台版本 |
| 定时任务 | 后续支持发布计划、监测计划、报告生成 |

### 16.3 需要避开的设计风险

FlowPilot AI 不完全照搬 GEO- 的原因：

- GEO- 当前以 GEO 优化和 AI 平台采信为中心，FlowPilot AI 需要进一步覆盖产品资料、品牌知识库、多平台内容适配和发布记录。
- GEO- 中的 “platform” 概念容易同时指 AI 平台和内容发布平台，FlowPilot AI 必须拆成 `AIChannel` 与 `PublishingChannel`。
- GEO- 使用本地 JSON + YAML 适合轻量本地系统，但后续发布记录、账号、URL、数据报表会更适合数据库。
- GEO- README 中有“优先引用、优先推荐”等强表达，FlowPilot AI 需要统一改成“提升 AI 引用准备度，不承诺排名和引用”。
- GEO- 标注为武汉微艺达内部使用，FlowPilot AI 如果用于公开简历展示，需要脱敏，避免泄露公司内部资料。

### 16.4 命名与概念边界

FlowPilot AI 中必须明确区分：

AIChannel：

- DeepSeek
- 豆包
- 文心一言
- Kimi
- 元宝
- 通义千问
- Claude
- Gemini

用途：

- 分析 AI 检索、理解、采信、引用倾向。
- 进行 AI Citation Readiness 和 GEO Monitor。

PublishingChannel：

- 企业官网
- 微信公众号
- 知乎
- 搜狐
- 百家号
- 小红书
- 今日头条

用途：

- 生成不同发布平台的内容版本。
- 管理发布任务、发布时间、发布 URL 和复盘数据。

代码、数据库、文档中不得把两类渠道都混称为 `platform`。

### 16.5 多平台内容分发需求

新增目标：

一篇 GEO 母稿不能只“改格式”后分发到不同平台，而要根据不同平台的用户意图、内容风格和搜索入口进行差异化重写。

示例：

母稿主题：武汉沙盘模型厂家推荐

| 发布渠道 | 内容定位 |
|---|---|
| 官网 | 专业长文、FAQ、结构化数据、品牌实体强化 |
| 微信公众号 | 品牌沉淀、案例说明、阅读体验 |
| 知乎 | 问答型内容，回答“武汉有哪些靠谱的沙盘厂家” |
| 搜狐 | 搜索型行业文章，地域 + 行业实体明显 |
| 百家号 | 搜索收录友好、科普型文章 |
| 小红书 | 短段落、场景化、口语化、弱广告感 |
| 今日头条 | 搜索型标题、信息密度、通俗解释 |

### 16.6 发布中心需求

MVP 中先做发布记录和导出，不直接做全平台自动发布。

发布状态：

- 待审核
- 审核通过
- 待发布
- 已复制
- 已人工发布
- 已发布 URL
- 发布失败
- 待复盘

每条发布记录至少保存：

- 母稿标题
- 平台版本标题
- 发布渠道
- 发布状态
- 发布时间
- 发布 URL
- 目标关键词
- 品牌实体
- GEO Score
- AI Citation Readiness Score
- 备注

后续自动发布 Adapter 优先级：

1. 官方 API。
2. 官方分享能力。
3. 浏览器辅助自动化。
4. 人工确认发布。

默认只保存草稿，不默认最终发布。

### 16.7 Case Study Export 需求

为了服务业务复盘、工作汇报和后续面试讲解，系统需要支持导出案例报告。导出内容围绕业务案例，不在产品页面展示个人简历标签。

示例案例：

`武汉微艺达智能沙盘 GEO 内容优化案例`

报告内容：

- 背景：为什么要做 GEO 内容。
- 输入：品牌、产品、地域、原始文章。
- GEO 分析：实体、关键词、用户问题。
- 母稿：GEO 优化文章。
- 多平台版本：官网、公众号、知乎、搜狐、百家号、小红书。
- 审核结果：Fact Check、GEO Critic、AI Citation Readiness。
- 发布记录：平台、URL、时间、状态。
- 监测结果：品牌提及、页面检索、来源引用。
- 效率对比：传统流程耗时 vs FlowPilot 流程耗时。
- 反思：哪些内容有效，下一轮如何优化。

导出格式：

- Markdown
- HTML
- 后续支持 Word / PDF

### 16.8 与当前 P0 骨架的关系

当前已经创建的 `flowpilot-ai` P0 骨架继续保留。

后续两种路线待用户选择：

路线 A：继续新项目 FlowPilot AI。

- 优点：结构干净，更适合做公开演示 Demo，且不暴露公司内部资料。
- 缺点：需要逐步重做 GEO- 中已有能力。

路线 B：以 GEO- 为底座升级 v3.0。

- 优点：复用已有大量能力，推进更快。
- 缺点：需要处理旧代码复杂度、内部项目脱敏、许可证和公司资料边界。

当前默认路线：路线 A，继续 FlowPilot AI 新骨架，同时吸收 GEO- 设计经验。

若用户明确要求“基于 GEO- 升级”，再切换路线 B。

新增决策：用户确认“能用就用，不能用不勉强”。因此后续每进入一个新模块前，需要先做轻量复用判断：

- `GEO-` 是否已有同类功能？
- 该功能是否符合 FlowPilot 当前架构？
- 复用代码是否比重新实现更省时间？
- 是否存在公司内部信息、账号、API Key、业务数据泄露风险？
- 依赖是否安全，SAST/依赖扫描是否可接受？

判断结果写入对应阶段进度记录。

### 2026-09-09｜P0 项目骨架

状态：已完成

完成内容：

- 新建 `flowpilot-ai` 子项目目录。
- 创建 Next.js 前端骨架。
- 创建 FastAPI 后端骨架。
- 创建 Mock AI 模式入口说明。
- 创建 `/api/health` 健康检查接口。
- 创建 `/api/project-plan` 项目计划摘要接口。
- 创建 P0 首页，展示 FlowPilot AI 项目定位、业务能力闭环、GEO 主流程、预留扩展边界。
- 增加骨架屏页面 `loading.tsx`。
- 增加前端 Vitest 测试。
- 增加后端 Pytest 测试。
- 增加项目 README。
- 增加 `.gitignore`，避免提交 `.audit_repos`、`node_modules`、`.venv`、`.next` 等生成目录。

验证方式：

- TDD 红灯：先写测试，确认前后端实现缺失时失败。
- 后端测试：`.venv\Scripts\python.exe -m pytest`。
- 前端测试：`npm run test`。
- 前端构建：`npm run build`。
- 前端依赖漏洞扫描：`npm audit --json --package-lock-only --registry=https://registry.npmjs.org`。
- 后端依赖漏洞扫描：`pip-audit --requirement requirements.txt`。
- SAST：Semgrep `p/security-audit` 扫描 P0 源码目录。
- 实际运行后端：启动 Uvicorn 并访问 `http://127.0.0.1:8000/api/health`。
- 实际运行前端：启动 Next.js 并访问 `http://127.0.0.1:3000`。

验证结果：

- 后端测试通过：2 passed。
- 前端测试通过：2 passed。
- 前端构建通过：Next.js build 成功。
- 前端 npm audit：0 vulnerabilities。
- 后端 pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings。
- 后端实际运行通过，`/api/health` 返回 `{"service":"FlowPilot AI","status":"ok","phase":"P0","mock_ai":true}`。
- 前端实际运行通过，首页返回内容包含 `FlowPilot AI`。

问题与修复：

- 前端首次依赖审计发现 Vitest/Vite 测试链路存在 5 个漏洞，其中 1 个 critical。已升级到 Vitest 5 / Vite 8 兼容链路，复扫为 0 vulnerabilities。
- 前端测试最初因 Vitest globals 未开启失败，已改为显式导入 `describe`、`it`、`expect`。
- 后端测试最初出现第三方 TestClient 弃用警告，已在 pytest 配置中过滤对应已知依赖警告。
- Semgrep 首次扫描被 Next `.next/dev/lock` 生成文件阻塞，已改为只扫描源码目录，结果 0 findings。

下一步：

- 进入 P1 产品中心：创建产品、保存产品基础资料、上传/记录产品图片信息。

### 2026-09-09｜GEO- 复用原则确认

状态：已完成

完成内容：

- 确认 `watermelon-dev-609/GEO-` 是用户此前开发的历史项目。
- 明确 `GEO-` 作为 FlowPilot AI 的可复用资产池和历史经验来源。
- 明确复用原则：能用就用，不能用不勉强。
- 明确不为了复用而牺牲 FlowPilot AI 的新架构清晰度、简历展示价值和安全边界。
- 要求后续每进入一个新模块前，先判断 `GEO-` 是否有可复用设计或代码，并把判断结果写入进度记录。

验证方式：

- 将复用原则写入 `GEO- 历史项目吸收计划`。
- 将复用判断标准写入路线选择规则。

验证结果：

- 通过。

问题与修复：

- 暂无。

下一步：

- 进入 P1 产品/品牌中心前，先检查 `GEO-` 中是否已有品牌、文章、规则、导出等可复用设计。

### 2026-09-09｜P1 新增需求：动态规则更新 + 真实 GEO 监测

状态：已确认，待开发

需求背景：

- GEO 内容优化依赖平台规则，如果 AI 平台或媒体平台规则过旧，系统生成的内容策略会失真。
- BOSS 岗位要求中明确包含：研究主流 AI 平台收录规则、搭建 GEO 关键词库、监控 AI 收录数据、持续迭代优化方案、输出数据报表、协同技术侧优化爬虫与结构化标签。
- 因此 FlowPilot AI 不能只做静态规则和展示型看板，必须具备规则更新、来源记录、版本管理、真实监测和人工复核能力。

核心原则：

- 规则必须可更新，不能长期写死在代码里。
- 监测数据必须真实，不能用 Mock 数据冒充实际 GEO 效果。
- 允许开发阶段使用 Mock 数据，但界面、接口和报告中必须明确标记为 `mock`、`sample` 或 `demo`。
- 系统必须区分 `品牌提及`、`页面检索`、`来源引用`，不能把 AI 回答中出现相关概念直接当作引用成功。
- 不承诺 GEO 排名，不承诺一定被 AI 引用，只做可验证的 Citation Readiness 和监测记录。

规则类型：

```text
AIChannelRule
├── DeepSeek
├── 豆包
├── 文心一言
├── 腾讯元宝
├── Kimi
├── 通义千问
└── 其他生成式 AI / AI 搜索平台

PublishingChannelRule
├── 企业官网
├── 微信公众号
├── 小红书
├── 知乎
├── 百家号
├── 搜狐号
├── 今日头条
└── 其他自媒体平台
```

规则字段要求：

```text
规则 ID
平台类型：AI 平台 / 媒体平台
平台名称
规则名称
规则说明
适用范围
规则来源
来源链接或来源说明
更新时间
版本号
置信度
是否人工确认
确认人
生效状态
历史版本
变更摘要
```

规则更新来源优先级：

```text
官方文档 / 平台公告
↓
平台后台实际提示 / 发布规范
↓
人工测试记录
↓
真实发布与监测数据反推
↓
行业资料或经验判断
```

未经确认的规则必须标记为：

```text
待确认
```

不能直接作为高置信度生产规则使用。

真实 GEO 监测分级：

```text
0 未出现
1 出现相关概念
2 品牌被提及
3 页面被检索到
4 页面作为来源被引用
```

监测记录字段：

```text
监测任务 ID
查询问题
目标 AI 平台
目标品牌
目标文章 URL
查询时间
原始回答
回答摘要
是否出现相关概念
是否品牌提及
是否页面检索
是否来源引用
证据截图或原始响应
数据来源类型：真实 / 人工录入 / Mock / Demo
人工复核状态
复核人
复核时间
备注
```

P1 功能范围：

- 建立规则中心骨架。
- 区分 AI 平台规则和媒体平台规则。
- 支持规则来源、版本、更新时间、置信度、人工确认状态。
- 建立 GEO 监测中心骨架。
- 支持记录查询问题、目标平台、目标品牌、目标文章 URL。
- 支持记录品牌提及、页面检索、来源引用三类结果。
- 支持标记数据来源类型：真实 / 人工录入 / Mock / Demo。
- Dashboard 和报告不得把 Mock 数据显示为真实数据。

P1 暂不实现：

- 不承诺自动获取所有平台最新规则。
- 不承诺自动登录所有 AI 平台完成监测。
- 不承诺 GEO 排名。
- 不承诺 AI 一定引用指定页面。
- 不直接自动发布内容到外部平台。

P1 验收清单：

- [ ] 项目计划文档中明确写入 `动态规则更新 + 真实 GEO 监测` 需求。
- [ ] 系统设计中明确区分 `AIChannelRule` 和 `PublishingChannelRule`。
- [ ] 每条规则具备来源、更新时间、版本号、置信度、人工确认状态。
- [ ] 规则状态至少包含：草稿、待确认、已确认、已过期、已废弃。
- [ ] 规则更新不需要修改核心业务代码。
- [ ] 系统能够保留规则历史版本和变更摘要。
- [ ] GEO 监测结果区分：未出现、相关概念、品牌提及、页面检索、来源引用。
- [ ] 监测记录必须保存查询问题、平台、时间、目标品牌、目标文章 URL 和原始证据。
- [ ] 监测数据必须标记来源类型：真实、人工录入、Mock、Demo。
- [ ] 前端页面中 Mock / Demo 数据必须有明确视觉标识。
- [ ] Dashboard 不允许将 Mock 数据合并进真实效果统计。
- [ ] API 返回监测数据时必须包含数据来源类型字段。
- [ ] 规则中心出现加载状态、空状态、错误状态和骨架屏状态。
- [ ] GEO 监测中心出现加载状态、空状态、错误状态和骨架屏状态。
- [ ] 桌面端 1440px、笔记本 1024px、平板 768px、手机 375px 可正常查看核心信息。
- [ ] 所有平台规则和监测记录在无网络或外部平台不可用时，不影响本地系统启动。
- [ ] 真实监测失败时，系统记录失败原因，不生成虚假成功数据。
- [ ] P1 完成后必须实际运行前端和后端，并按本清单逐项验证。

对简历的意义：

- 对应 GEO 岗位中的平台规则研究、关键词/实体策略、AI 收录监控、数据报表、持续迭代和技术协同能力。
- 体现系统不是简单 AI 写作工具，而是包含规则资产管理、真实数据监测和质量复核机制的企业级 GEO 工作台。

下一步：

- 先完成 `GEO-` 旧项目品牌、文章、规则、导出设计的复用检查。
- 根据检查结果确定 P1 是否复用旧项目 YAML 规则引擎、品牌监测字段、导出报告结构。
- 然后进入 P1 规则中心与 GEO 监测中心骨架开发。

### 2026-09-09｜GEO- 旧项目 P1 复用检查清单

状态：已完成

检查对象：

- 历史仓库：`watermelon-dev-609/GEO-`
- 本地检查路径：`.audit_repos/GEO-`
- 检查范围：品牌、文章、规则、导出、发布适配、调度、报告、监测数据结构。

总体结论：

- `GEO-` 旧项目不建议整体迁移为 FlowPilot AI 主架构。
- 旧项目适合作为 FlowPilot AI 的经验资产池和设计参考库。
- P1 阶段优先复用旧项目的规则设计、字段设计、流程设计和验收经验。
- 代码层面只在经过安全审计、编码检查、脱敏检查和架构适配后再少量迁移。
- 旧项目中的 `platform` 概念需要拆分为 `AIChannel` 和 `PublishingChannel`，避免 AI 平台规则与自媒体发布规则混淆。

复用等级定义：

```text
A：可直接复用设计，P1 优先吸收
B：参考后重写，保留业务思路但不直接搬代码
C：暂不复用，避免污染新架构或引入安全/维护风险
```

#### 1. 品牌与 GEO 监测相关

检查到的旧项目资产：

- `backend/app/core/brand_checker.py`
- `backend/app/api/brand_monitor.py`
- `backend/app/prompts/brand_monitor.py`
- `backend/data/brand_mentions/`
- `backend/data/brand_mentions/sessions/`
- `backend/data/brand_mentions/real_search/`
- `frontend/src/views/BrandMonitor.vue`
- `backend/app/core/reputation_incident.py`
- `backend/app/core/rss_monitor.py`
- `backend/app/core/competitor_monitor.py`

可复用设计：

- 品牌别名 / 品牌变体检测。
- 正则检测 + LLM 复核的品牌提及判断。
- 自定义查询问题库。
- 多 AI 平台批量检测。
- 监测 Session 记录。
- 按平台统计品牌提及率。
- 趋势统计。
- 原始响应保存。
- 负面舆情 / 声誉事件记录思路。

P1 复用决策：

- 复用等级：A / B。
- 字段设计和监测流程直接吸收。
- 代码暂不直接迁移，优先重写成 FlowPilot 的 `GEOMonitorRecord`、`GEOMonitorSession`、`BrandMentionResult`。
- 旧项目只判断 `brand_mentioned` 不够，FlowPilot 必须升级为五级结果：

```text
0 未出现
1 出现相关概念
2 品牌被提及
3 页面被检索到
4 页面作为来源被引用
```

需要避开的点：

- 旧项目监测主要围绕 AI 平台品牌提及，无法完全覆盖页面检索和来源引用。
- 部分历史数据为本地 JSON 文件，不适合作为 FlowPilot 长期业务存储。
- P1 需要明确数据来源类型：真实 / 人工录入 / Mock / Demo。

#### 2. 文章、清洗、改写与版本相关

检查到的旧项目资产：

- `backend/app/core/cleaner.py`
- `backend/app/core/rewriter.py`
- `backend/app/core/orchestrator.py`
- `backend/app/core/version_manager.py`
- `backend/app/api/cleaning.py`
- `backend/app/api/geo_rewrite.py`
- `backend/app/api/evaluation.py`
- `backend/app/api/versions.py`
- `backend/app/prompts/cleaning.py`
- `backend/app/prompts/rewrite.py`
- `backend/app/prompts/evaluation.py`
- `backend/data/versions/`
- `frontend/src/views/GEOWorkshop.vue`
- `frontend/src/views/EvaluationCenter.vue`
- `frontend/src/views/AdaptationPipeline.vue`

可复用设计：

- 原始文案清洗。
- 企业名称、数字、联系方式等关键信息保护。
- GEO 改写。
- 多 AI 平台并发改写。
- 输出校验。
- 幻觉 / 编造风险检查。
- 内容版本保存、回滚、对比。
- 闭环诊断：诊断 → 修复计划 → 执行 → 验证。

P1 复用决策：

- 复用等级：B。
- P1 暂不做完整文章生成，但要吸收旧项目的版本字段和安全检查思想。
- 后续 P2 / P3 进入文章生成与平台适配时，再参考 `cleaner.py`、`rewriter.py`、`version_manager.py` 重写。
- FlowPilot 新模型建议保留：

```text
Article
ArticleSource
ArticleVersion
ContentAuditResult
ContentRewriteRun
```

需要避开的点：

- 旧项目 `platform` 多数指 AI 平台，不应直接用于自媒体平台版本。
- 旧项目业务场景偏沙盘 GEO 文案，FlowPilot 需要扩展为产品、项目、品牌、官网、自媒体内容。
- P1 不直接引入复杂闭环诊断，避免过早扩大范围。

#### 3. AI 平台规则与媒体平台规则

检查到的旧项目资产：

- `backend/app/core/template_engine.py`
- `backend/app/core/template_watcher.py`
- `backend/app/api/template_engine.py`
- `backend/app/api/templates.py`
- `backend/app/api/platform_monitor.py`
- `backend/data/platform_templates/base.yaml`
- `backend/data/platform_templates/deepseek.yaml`
- `backend/data/platform_templates/doubao.yaml`
- `backend/data/platform_templates/kimi.yaml`
- `backend/data/platform_templates/wenxin.yaml`
- `backend/data/platform_templates/tongyi.yaml`
- `backend/data/platform_templates/yuanbao.yaml`
- `backend/data/platform_rules/xiaohongshu.json`
- `backend/data/platform_rules/weixin.json`
- `backend/data/platform_rules/douyin.json`
- `backend/data/platform_rules/deepseek.json`
- `backend/data/platform_rules/doubao.json`
- `backend/data/platform_rules/wenxin.json`

可复用设计：

- YAML 平台模板。
- 模板缓存。
- 模板校验。
- `base.yaml` 回退机制。
- 模板版本保存。
- 模板历史查询。
- 模板回滚。
- 模板差异对比。
- Watchdog 监听 YAML 变化。
- 平台规则变更记录。
- 规则来源、数据时效、变更日志。

P1 复用决策：

- 复用等级：A。
- 这是旧项目最值得吸收的部分。
- P1 规则中心应直接采用“规则外置 + 版本化 + 可回滚 + 来源记录”的设计。
- 但 FlowPilot 必须拆成两套规则：

```text
AIChannelRule
PublishingChannelRule
```

FlowPilot P1 规则字段应吸收旧项目已有信息，并升级为：

```text
rule_id
channel_type
channel_id
channel_name
rule_title
rule_summary
rule_body
source_type
source_url
source_note
knowledge_cutoff
updated_at
version
confidence
review_status
reviewer
effective_status
change_log
```

需要避开的点：

- 旧项目部分媒体平台规则来自 `llm_knowledge` 或 `web_search` 摘要，不能默认视为官方规则。
- 小红书等平台规则中存在大量“搜索结果信息不足”的记录，FlowPilot 必须保留“不确定”状态。
- 规则不能被系统自动标记为高置信度，必须经过人工确认。

#### 4. 导出、报告与结构化数据

检查到的旧项目资产：

- `export_delivery.py`
- `backend/app/core/jsonld_gen.py`
- `backend/app/core/reporter.py`
- `backend/app/core/auto_reporter.py`
- `backend/app/core/ai_structure_reporter.py`
- `backend/app/api/jsonld.py`
- `backend/app/api/reports.py`
- `delivery_package/`
- `frontend/src/views/ExportView.vue`

可复用设计：

- 客户交付包结构。
- Markdown 优化稿导出。
- JSON-LD 结构化数据导出。
- HTML 评测报告。
- 关键词 CSV。
- 周报 / 月报。
- 雷达图、柱状图等评测图表。
- Schema.org 类型映射。
- Organization、WebSite、Product、Service、FAQPage 等结构化标记。

P1 复用决策：

- 复用等级：A / B。
- P1 可先吸收“导出包结构”和“JSON-LD 作为网站适配能力”的设计。
- 具体导出功能可放到 P2 / P3。
- FlowPilot 导出包建议定义为：

```text
01_平台内容版本
02_结构化数据_JSON-LD
03_GEO评测报告
04_关键词与实体清单
05_发布建议
06_监测结果
```

需要避开的点：

- 旧项目交付包中可能含公司业务示例，公开简历项目必须脱敏。
- 旧项目 JSON-LD 依赖沙盘类型枚举，FlowPilot 需要改为更通用的 Brand / Product / Project / Article 模型。
- HTML/PDF 报告生成可以后置，不进入 P1 核心。

#### 5. 发布适配与调度

检查到的旧项目资产：

- `backend/app/core/publish_adapter.py`
- `backend/app/core/scheduler.py`
- `frontend/src/views/SchedulerView.vue`

可复用设计：

- GEO 优化稿与发布稿分层。
- 每个发布平台独立配置字数、风格、格式要求。
- 一篇母稿生成多个发布平台版本。
- 微信公众号、小红书、官网、今日头条、搜狐、知乎、百家号平台适配思路。
- 调度任务类型与运行记录。

P1 复用决策：

- 复用等级：B。
- P1 不实现真正发布。
- P1 可以吸收“PublishingChannel”概念，为后续多平台内容适配做准备。
- 后续开发发布中心时，只复用 Adapter 思想，不直接沿用旧代码。

需要避开的点：

- 旧项目 `publish_adapter.py` 主要是“平台改写适配”，不是完整外部平台发布。
- 平台提示词中有一些未经验证的平台算法表述，FlowPilot 需要改为“规则来源 + 置信度 + 人工确认”。
- 不能承诺一键后台发布所有平台，尤其是小红书、公众号等高风控平台。

#### 6. P1 实际吸收清单

P1 确定吸收：

- AI 平台规则外置设计。
- 媒体平台规则外置设计。
- 规则来源字段。
- 规则更新时间字段。
- 规则版本字段。
- 规则变更日志。
- 规则人工确认状态。
- 品牌提及检测字段。
- 监测 Session 概念。
- 监测查询问题库。
- 原始响应保存。
- 平台维度统计。
- 内容版本记录字段。
- JSON-LD / Schema.org 作为后续网站适配能力。
- 导出包目录结构思路。

P1 暂不吸收：

- 自动发布外部平台。
- 浏览器自动化发布。
- 完整文章生成闭环。
- PDF 报告生成。
- 周报 / 月报自动生成。
- 竞品监测。
- 舆情事件自动分类。
- RSS 自动抓取。

P1 需要重新设计：

- 数据存储：从本地 JSON 思路升级为后续可迁移数据库的清晰模型；P1 可先用内存 / Mock 数据，但接口字段必须接近正式模型。
- 平台命名：旧项目 `platform` 拆成 `AIChannel` 与 `PublishingChannel`。
- 监测分级：旧项目 `brand_mentioned` 升级为五级 GEO Evidence Level。
- 规则可信度：新增 `confidence`、`source_type`、`review_status`、`data_mode`。
- UI 标识：Mock / Demo / 真实数据必须明确区分。

#### 7. P1 开发前约束

- 开发 P1 前，必须先写测试或验收断言。
- P1 页面必须包含加载状态、空状态、错误状态、骨架屏状态。
- P1 接口不得返回无法区分真假的统计数据。
- P1 所有 Mock 数据必须带 `data_mode: "mock"` 或等价字段。
- P1 不接入真实外部平台账号，不保存平台 Cookie。
- 任何从 `GEO-` 迁移的代码，必须先经过 SAST、依赖漏洞扫描和脱敏检查。

#### 8. P1 复用验收清单

- [x] 已扫描旧项目品牌监测相关文件。
- [x] 已扫描旧项目文章清洗、改写、评测、版本相关文件。
- [x] 已扫描旧项目 AI 平台 YAML 模板。
- [x] 已扫描旧项目媒体平台 JSON 规则。
- [x] 已扫描旧项目导出、报告、JSON-LD 相关文件。
- [x] 已确认旧项目规则引擎设计可进入 P1。
- [x] 已确认旧项目品牌监测设计可进入 P1。
- [x] 已确认旧项目文章版本字段可进入后续内容中心。
- [x] 已确认旧项目导出包结构可进入后续导出设计。
- [x] 已确认旧项目发布适配只作为后续参考，不进入 P1 核心。
- [x] 已明确旧项目不整体迁移。
- [x] 已明确 FlowPilot AI 继续作为主项目，`GEO-` 作为复用资产池。

下一步：

- 进入 P1 骨架开发。
- 第一小步先做后端领域模型和 Mock API：

```text
/api/rules/ai-channels
/api/rules/publishing-channels
/api/geo-monitor/sessions
/api/geo-monitor/records
```

- 然后做前端两个入口：

```text
规则中心
GEO 监测中心
```

### 2026-09-09｜P1 骨架开发：规则中心 + GEO 监测中心

状态：已完成

开发内容：

- 新增后端 P1 Mock 数据模块：`flowpilot-ai/backend/app/p1_data.py`。
- 新增 AI 平台规则接口：`/api/rules/ai-channels`。
- 新增媒体平台规则接口：`/api/rules/publishing-channels`。
- 新增 GEO 监测 Session 接口：`/api/geo-monitor/sessions`。
- 新增 GEO 监测记录接口：`/api/geo-monitor/records`。
- 首页新增 `规则中心` 展示区。
- 首页新增 `GEO 监测中心` 展示区。
- 首页新增 `P1 状态保障` 展示区。
- 明确 Mock 数据视觉标识：`Mock 数据`、`Mock 数据不计入真实效果`。
- 明确五级 GEO 证据分级：未出现、相关概念、品牌提及、页面检索、来源引用。
- 明确 P1 页面必须覆盖：骨架屏、加载中、空状态、错误状态。

TDD 记录：

- 后端先新增 `tests/test_p1_rules_monitor.py`。
- 红灯结果：4 个测试因接口 404 按预期失败。
- 实现最小后端 API 后，P1 后端测试通过：4 passed。
- 前端先新增 `frontend/__tests__/p1-home.test.tsx`。
- 红灯结果：3 个测试因页面缺少 P1 文案按预期失败。
- 实现首页 P1 区块后，P1 前端测试通过：3 passed。

验证方式：

- 后端全量测试：`.venv\Scripts\python.exe -m pytest -q`。
- 前端全量测试：`npm run test`。
- 前端生产构建：`npm run build`。
- 前端依赖漏洞扫描：`npm audit --json --package-lock-only --registry=https://registry.npmjs.org`。
- 后端依赖漏洞扫描：`pip-audit --requirement flowpilot-ai\backend\requirements.txt`。
- SAST：Semgrep `p/security-audit` 扫描 P1 源码。
- 实际运行后端并访问 P1 API。
- 实际访问前端首页，确认包含 P1 关键内容。

验证结果：

- 后端全量测试通过：6 passed。
- 前端全量测试通过：5 passed。
- 前端生产构建通过：Next.js build 成功。
- 前端 npm audit：0 vulnerabilities。
- 后端 pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings。
- 后端实际运行通过：

```json
{
  "health_status": "ok",
  "health_phase": "P0",
  "ai_rule_count": 3,
  "publishing_rule_count": 3,
  "session_count": 1,
  "record_count": 3,
  "records_data_mode": "mock"
}
```

- 前端实际访问通过：

```json
{
  "has_flowpilot": true,
  "has_rule_center": true,
  "has_geo_monitor": true,
  "has_mock_notice": true
}
```

问题与修复：

- `npm audit` 首次使用 `npmmirror` 审计端点失败，原因是镜像不支持 npm security audit API。已改用官方 registry 复跑，通过。
- `pip-audit` 和 `semgrep` 首次路径错误，实际工具位于 `.audit_repos/.audit_tools/Scripts/`，修正路径后通过。
- 前端实际运行时发现 3000 端口已有同目录 Next dev server，Next 阻止重复启动。改为复用现有服务验证页面内容，并在验证后清理端口。
- PowerShell/curl 输出中文显示为问号，判断为终端编码显示问题；已用 Node fetch 做 UTF-8 内容包含校验，通过。

P1 验收清单进度：

- [x] 系统设计中明确区分 `AIChannelRule` 和 `PublishingChannelRule`。
- [x] 每条规则具备来源、更新时间、版本号、置信度、人工确认状态。
- [x] API 返回规则数据时包含 `data_mode`。
- [x] GEO 监测结果区分：未出现、相关概念、品牌提及、页面检索、来源引用。
- [x] 监测记录保存查询问题、平台、时间、目标品牌、目标文章 URL 和原始证据。
- [x] 监测数据标记来源类型：Mock。
- [x] 前端页面中 Mock 数据有明确视觉标识。
- [x] API 返回监测数据时包含数据来源类型字段。
- [x] 规则中心展示加载、空状态、错误状态和骨架屏状态要求。
- [x] GEO 监测中心展示加载、空状态、错误状态和骨架屏状态要求。
- [x] 所有平台规则和监测记录在无网络或外部平台不可用时，不影响本地系统启动。
- [x] P1 完成后已实际运行前端和后端，并按清单验证。

P1 未完成但已预留：

- [ ] 规则状态完整流转：草稿、待确认、已确认、已过期、已废弃。
- [ ] 规则历史版本和变更摘要的持久化。
- [ ] Dashboard 将 Mock 数据与真实统计彻底隔离。
- [ ] 真实监测失败原因持久化。
- [ ] 375 / 768 / 1024 / 1440 终端人工截图验收。

下一步：

- 进入 P1.1：把当前 Mock API 从首页展示升级为独立页面。
- 建议新增页面：

```text
/rules
/geo-monitor
```

- 同时补充前端真实加载状态、空状态、错误状态组件，而不只是首页说明。

### 2026-09-09｜P1.1 独立页面：规则中心 + GEO 监测中心

状态：已完成

开发内容：

- 新增共享页面组件：`flowpilot-ai/frontend/app/components/state-card.tsx`。
- 新增规则中心页面：`flowpilot-ai/frontend/app/rules/page.tsx`。
- 新增规则中心加载状态：`flowpilot-ai/frontend/app/rules/loading.tsx`。
- 新增规则中心错误状态：`flowpilot-ai/frontend/app/rules/error.tsx`。
- 新增 GEO 监测中心页面：`flowpilot-ai/frontend/app/geo-monitor/page.tsx`。
- 新增 GEO 监测中心加载状态：`flowpilot-ai/frontend/app/geo-monitor/loading.tsx`。
- 新增 GEO 监测中心错误状态：`flowpilot-ai/frontend/app/geo-monitor/error.tsx`。
- 首页新增两个独立入口：

```text
/rules
/geo-monitor
```

UI 设计依据：

- 使用 `ui-ux-pro-max` 检索企业级 GEO 规则 / 监测 Dashboard 设计系统。
- 采用 Enterprise Gateway + Dark Mode OLED 方向。
- 延续 P0 的深色企业级仪表盘风格。
- 继续使用 Lucide 图标，不使用 emoji 图标。
- 使用绿色表达可用状态，琥珀色表达 Mock / 待确认风险。

TDD 记录：

- 新增前端测试：`flowpilot-ai/frontend/__tests__/p1-pages.test.tsx`。
- 红灯结果：测试因 `/rules`、`/geo-monitor` 页面不存在而失败。
- 新增首页入口测试，红灯结果：页面缺少 `进入规则中心` 和 `进入 GEO 监测中心` 链接。
- 实现独立页面、loading、error 与首页入口后，相关测试通过。
- 修正一次测试断言：`人工复核` 在表头与状态卡中重复出现，测试改为允许多处匹配。

验证方式：

- 前端 P1.1 页面测试：`npm run test -- __tests__/p1-pages.test.tsx`。
- 前端首页入口测试：`npm run test -- __tests__/p1-home.test.tsx`。
- 后端全量测试：`.venv\Scripts\python.exe -m pytest -q`。
- 前端全量测试：`npm run test`。
- 前端生产构建：`npm run build`。
- 前端依赖漏洞扫描：`npm audit --json --package-lock-only --registry=https://registry.npmjs.org`。
- 后端依赖漏洞扫描：`.audit_repos/.audit_tools/Scripts/pip-audit.exe --requirement flowpilot-ai/backend/requirements.txt`。
- SAST：Semgrep `p/security-audit` 扫描前后端源码与测试。
- 实际启动 Next 生产服务并访问：

```text
/
/rules
/geo-monitor
```

验证结果：

- 后端全量测试通过：6 passed。
- 前端全量测试通过：9 passed。
- 前端生产构建通过，生成路由：

```text
/
/rules
/geo-monitor
```

- 前端 npm audit：0 vulnerabilities。
- 后端 pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings。
- Semgrep 确认扫描了 P1.1 新增文件：

```text
frontend/app/components/state-card.tsx
frontend/app/rules/page.tsx
frontend/app/rules/loading.tsx
frontend/app/rules/error.tsx
frontend/app/geo-monitor/page.tsx
frontend/app/geo-monitor/loading.tsx
frontend/app/geo-monitor/error.tsx
frontend/__tests__/p1-pages.test.tsx
```

- 实际访问验证通过：

```json
{
  "/": {
    "hasFlow": true,
    "homeRulesLink": true,
    "homeMonitorLink": true,
    "rulesHeading": true,
    "monitorHeading": true
  },
  "/rules": {
    "rulesHeading": true,
    "rulesPolicy": true,
    "rulesMock": true
  },
  "/geo-monitor": {
    "monitorHeading": true,
    "monitorEvidence": true,
    "monitorMock": true
  }
}
```

问题与修复：

- 系统 PATH 没有 `python`，已改用后端虚拟环境 Python 运行 `ui-ux-pro-max` 设计检索。
- Next dev 前台超时会留下不健康的 3000 端口进程，已清理并改用生产构建后的 `next start` 做实际访问验证。
- PowerShell 对长时间前台服务输出不稳定，最终以 HTTP 访问结果作为实际运行证据。

P1.1 验收清单进度：

- [x] `/rules` 页面可独立访问。
- [x] `/geo-monitor` 页面可独立访问。
- [x] 首页提供 `/rules` 入口。
- [x] 首页提供 `/geo-monitor` 入口。
- [x] 规则中心展示 `AIChannelRule` 与 `PublishingChannelRule` 分离。
- [x] 规则中心展示规则来源、版本、置信度和待确认状态。
- [x] 规则中心明确 Mock 数据不进入真实策略统计。
- [x] GEO 监测中心展示 Evidence Level 0-4。
- [x] GEO 监测中心明确 `品牌提及 ≠ 页面检索 ≠ 来源引用`。
- [x] GEO 监测中心展示原始响应、人工复核、真实数据隔离、错误状态。
- [x] `/rules/loading.tsx` 存在并可渲染。
- [x] `/geo-monitor/loading.tsx` 存在并可渲染。
- [x] `/rules/error.tsx` 存在。
- [x] `/geo-monitor/error.tsx` 存在。
- [x] 前端测试、后端测试、构建、依赖审计、SAST、实际访问均已完成。

P1.1 未完成但已预留：

- [ ] 页面暂时使用静态 Mock 展示，尚未从后端 API 动态读取。
- [ ] 规则列表尚不能新增、编辑、确认、废弃。
- [ ] GEO 监测记录尚不能创建真实任务。
- [ ] 终端适配已使用响应式布局，但尚未做 375 / 768 / 1024 / 1440 截图验收。

下一步：

- 进入 P1.2：让 `/rules` 和 `/geo-monitor` 从后端 P1 API 读取数据。
- 增加真实加载、空数据、API 错误三种可测试状态。
- 为后续数据库持久化预留接口层，不把业务逻辑写死在页面组件里。

### 2026-09-10｜P1.2 前后端真实联通：规则中心 + GEO 监测中心

状态：已完成

开发内容：

- 创建开发分支：`codex/p1-2-api-integration`。
- 新增前端 API 请求层：`flowpilot-ai/frontend/app/lib/flowpilot-api.ts`。
- `/rules` 页面由静态展示改为通过前端 API 层读取后端 P1 API。
- `/geo-monitor` 页面由静态展示改为通过前端 API 层读取后端 P1 API。
- 新增规则中心客户端工作区：`flowpilot-ai/frontend/app/rules/rules-workspace.tsx`。
- 新增 GEO 监测客户端工作区：`flowpilot-ai/frontend/app/geo-monitor/geo-monitor-workspace.tsx`。
- 保留 P1.1 已有页面骨架、Mock 数据提示、状态说明和 Evidence Level 解释。
- 新增真实加载状态、空数据状态、API 错误状态，不用静态示例冒充真实数据。
- 页面中明确展示 `读取后端 P1 API`，便于人工验收。

TDD 记录：

- 新增测试文件：`flowpilot-ai/frontend/__tests__/p1-api-integration.test.tsx`。
- RED：新增 4 个 P1.2 测试后全部失败，原因是页面仍为静态展示，没有调用后端 API。
- GREEN：新增 API 请求层和两个客户端工作区组件后，P1.2 测试通过。
- 修正一次测试断言：加载文案和证据等级文案在页面中合理重复出现，测试由 `getByText` 改为允许多处匹配。

验证方式：

- 后端测试：`.\.venv\Scripts\python.exe -m pytest -q`
- 前端测试：`npm run test`
- 前端生产构建：`npm run build`
- 前端依赖漏洞扫描：`npm audit --json --package-lock-only --registry=https://registry.npmjs.org`
- 后端依赖漏洞扫描：`pip-audit --requirement .\requirements.txt`
- SAST：Semgrep `p/security-audit` 扫描前后端源码
- 实际运行后端：`uvicorn app.main:app --host 127.0.0.1 --port 8000`
- 实际运行前端：`npm run dev`
- 实际访问页面：

```text
http://127.0.0.1:3000/
http://127.0.0.1:3000/rules
http://127.0.0.1:3000/geo-monitor
```

验证结果：

- 后端全量测试通过：6 passed。
- 前端全量测试通过：13 passed。
- 前端生产构建通过，生成路由：

```text
/
/rules
/geo-monitor
```

- 前端 npm audit：0 vulnerabilities。
- 后端 pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings。
- 后端实际 API 验证通过：

```json
{
  "ai_rule_count": 3,
  "publishing_rule_count": 3,
  "rule_policy": "official_first_manual_confirmed",
  "rules_data_mode": "mock",
  "session_count": 1,
  "record_count": 3,
  "monitor_data_mode": "mock",
  "highest_evidence": 4,
  "has_raw_response": true
}
```

- 前端实际页面访问验证通过：

```json
{
  "home_has_flowpilot": true,
  "home_has_rules_link": true,
  "home_has_monitor_link": true,
  "rules_has_p12": true,
  "rules_has_api_badge": true,
  "monitor_has_p12": true,
  "monitor_has_evidence": true
}
```

问题与修复：

- `pip-audit` 第一次运行时路径少退一层，已用正确路径重跑，通过。
- PowerShell 中 `$HOME` 是保留变量，页面验证脚本首次变量命名冲突，已改为 `$homePage` 重跑，通过。
- 前端 `npm run dev` 停止父进程后仍残留 3000 端口子进程，已按端口定位并清理。

P1.2 验收清单进度：

- [x] `/rules` 页面从后端 P1 API 读取 AI 平台规则。
- [x] `/rules` 页面从后端 P1 API 读取媒体发布平台规则。
- [x] `/geo-monitor` 页面从后端 P1 API 读取 GEO 监测任务。
- [x] `/geo-monitor` 页面从后端 P1 API 读取 GEO 监测记录。
- [x] 页面显示 API 加载状态。
- [x] 页面显示空数据状态。
- [x] 页面显示 API 错误状态。
- [x] 页面明确区分 Mock 数据，不计入真实 GEO 效果。
- [x] 页面保留 `AIChannelRule` 与 `PublishingChannelRule` 概念边界。
- [x] 页面保留 `品牌提及 ≠ 页面检索 ≠ 来源引用` 的 GEO 证据边界。
- [x] 前端 API 请求逻辑抽离到接口层，没有写死在页面组件里。
- [x] 前端测试、后端测试、生产构建、依赖审计、SAST、实际运行验证均已完成。

P1.2 未完成但已预留：

- [ ] 当前仍为 Mock API 数据，尚未接 PostgreSQL。
- [ ] 当前页面只读展示，尚未支持新增、编辑、确认、废弃规则。
- [ ] 当前 GEO 监测记录为 Mock 数据，尚未接真实 AI 平台查询或人工录入流程。
- [ ] 当前未完成 375 / 768 / 1024 / 1440 多终端截图验收。

下一步：

- 进入 P1.3：规则中心数据模型与本地持久化设计。
- 建议先实现规则的新增、编辑、人工确认、废弃、过期状态流转。
- 同时继续保持 Mock / Manual / Real 数据隔离，避免把未验证规则当作真实平台规则。


---

> 说明：自 2026-09-12 起，原 §17「P0–P4 计划与完成记录」与「UI 相关完成记录」
> 已拆分至 `FlowPilot_AI_P0-P4记录.md` 与 `FlowPilot_AI_UI完成记录.md` 两个独立文件。
> 本文档仅保留 §15 进度记录与 §16 GEO- 历史吸收计划。
