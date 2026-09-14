# FlowPilot AI · P0–P4 计划与完成记录

本文件为「开发日志」中 §17 的拆分产物，记录各阶段（P0–P4）的计划与完成详情。

- 返回：开发日志 `FlowPilot_AI_开发日志.md`
- UI 完成记录 `FlowPilot_AI_UI完成记录.md`；项目计划 `FlowPilot_AI_项目计划.md`

## 17. P0–P4 计划与完成记录

### 2026-09-10｜P1.3 计划：规则中心数据模型与本地持久化设计

状态：已完成

阶段目标：

- 将 P1.2 的只读规则展示升级为可管理的规则资产中心。
- 先使用内存存储模拟本地持久化接口，接口字段对齐后续 PostgreSQL 数据模型。
- 支持规则新增、编辑、人工确认、标记过期、标记废弃。
- 保持 `AIChannelRule` 与 `PublishingChannelRule` 的概念边界。
- 保持 `Mock / Manual / Real` 数据隔离，不把未验证规则当作真实平台规则。

P1.3 技术边界：

- P1.3 不接真实 PostgreSQL。
- P1.3 不做真实平台规则联网更新。
- P1.3 不做发布平台账号授权。
- P1.3 不做真实 GEO 查询任务。
- P1.3 只完成规则资产管理闭环，为 P2 的真实规则更新和 P3 的内容策略提供基础。

后端验收清单：

- [x] 提供统一规则列表 API，可按 `channel_type=ai|publishing` 筛选。
- [x] 提供规则创建 API。
- [x] 提供规则编辑 API。
- [x] 提供规则人工确认 API。
- [x] 提供规则标记过期 API。
- [x] 提供规则标记废弃 API。
- [x] 每条规则包含 `rule_id`、`channel_type`、`channel_id`、`channel_name`、`rule_title`、`rule_summary`、`source_type`、`source_url`、`updated_at`、`version`、`confidence`、`review_status`、`effective_status`、`data_mode`。
- [x] 每次创建、编辑和状态变更都会追加 `audit_log`。
- [x] 不允许把 `data_mode=mock` 的规则直接人工确认为真实规则。
- [x] 不允许确认缺少 `source_type` 的规则。
- [x] 不允许确认置信度低于 `0.6` 的规则。

前端验收清单：

- [x] `/rules` 页面显示规则总数、待确认数、已确认数、已过期/已废弃数。
- [x] `/rules` 页面提供新增规则表单。
- [x] `/rules` 页面支持编辑规则标题、摘要、来源、置信度。
- [x] `/rules` 页面支持人工确认规则。
- [x] `/rules` 页面支持标记过期。
- [x] `/rules` 页面支持标记废弃。
- [x] `/rules` 页面在操作失败时显示真实错误，不伪造成功状态。
- [x] `/rules` 页面保留加载、空数据、错误状态。
- [x] `/rules` 页面显示最近一次审计记录，体现规则变更可追踪。

验证要求：

- [x] 后端新增测试先红后绿。
- [x] 前端新增测试先红后绿。
- [x] 后端全量测试通过。
- [x] 前端全量测试通过。
- [x] 前端生产构建通过。
- [x] npm audit 通过。
- [x] pip-audit 通过。
- [x] Semgrep SAST 通过。
- [x] 实际运行后端和前端，访问 `/rules` 并完成至少一次新增、编辑、确认/失败、过期或废弃的操作验证。

下一步执行顺序：

```text
后端规则生命周期测试
→ 后端规则 Store / API
→ 前端规则管理测试
→ 前端规则管理 UI
→ 全量验证
→ 更新本计划文档
```

P1.3 完成记录：

- 完成日期：2026-09-10。
- 后端新增：`app/rule_store.py`，提供统一规则资产模型、内存规则 Store、创建/编辑/确认/过期/废弃状态流转。
- 后端接口：`GET /api/rules`、`POST /api/rules`、`PATCH /api/rules/{rule_id}`、`POST /api/rules/{rule_id}/confirm`、`POST /api/rules/{rule_id}/expire`、`POST /api/rules/{rule_id}/deprecate`。
- 前端新增：`/rules` 页面支持规则统计、新增、编辑、人工确认、标记过期、标记废弃、操作失败提示、版本展示和最近审计动作展示。
- 数据纪律：`data_mode=mock` 的规则不能被直接确认为真实规则；缺少来源或置信度低于 `0.6` 的规则不能确认。
- TDD 记录：后端新增测试先出现 404 / 缺少 `rule_id` 等失败，再实现 Store 与 API 后通过；前端新增测试先覆盖生命周期 UI，再修正重复文案断言后通过。

P1.3 验证结果：

- 后端新增测试：`5 passed`。
- 后端全量测试：`11 passed`。
- 前端 P1.3 测试：`3 passed`。
- 前端全量测试：`16 passed`。
- 前端生产构建：`next build` 通过，生成 `/`、`/rules`、`/geo-monitor` 静态页面。
- npm audit：0 vulnerabilities。
- pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings，0 blocking。
- 实际运行验收：后端 `backend_health_ok=True`，前端 `/`、`/rules`、`/geo-monitor` 均返回 200；规则创建、编辑、确认、过期、废弃动作均写入审计日志；mock 规则确认被 400 阻断。

P1.3 遗留事项：

- [ ] 当前规则 Store 仍为内存实现，重启后不保留数据；P1.4 / P2 需要接入本地文件或 PostgreSQL。
- [ ] 当前新增规则表单默认偏 AI 规则，后续需要增加 `channel_type`、`channel_id` 的显式选择。
- [ ] 当前规则来源仍由人工填写，后续 P2 需要接入定时规则更新、来源抓取、人工复核队列。
- [ ] 当前未完成浏览器级可视化截图验收，后续 UI 阶段补 375 / 768 / 1024 / 1440 断点截图。

下一步：

- 进入 P1.4：规则中心本地持久化与平台选择。
- 优先解决“新增规则默认偏 AI 规则”和“内存 Store 重启丢数据”两个问题。

### 2026-09-10｜P1.4 计划：规则中心本地持久化与平台选择

状态：已完成

阶段目标：

- 将 P1.3 的内存规则 Store 升级为本地 JSON 持久化 Store。
- 保持种子 Mock 规则来自代码，人工新增/编辑/状态流转的规则写入本地数据文件。
- 前端新增规则时必须显式选择 `AI 平台规则` 或 `媒体平台规则`。
- 前端选择平台后自动填充 `channel_id` 与 `channel_name`，避免 AI 平台规则和媒体发布平台规则混用。
- 保持 P1.3 的规则生命周期、审计日志和 Mock/Manual/Real 隔离不退化。

P1.4 技术边界：

- P1.4 不接 PostgreSQL，先使用本地 JSON 文件模拟持久化。
- P1.4 不做联网规则更新。
- P1.4 不做真实发布平台授权。
- P1.4 不做真实 GEO 查询。
- P1.4 不处理多用户并发写入，只保证单人本地开发/演示可用。

后端验收清单：

- [x] 新增规则写入本地 JSON 数据文件。
- [x] 编辑规则后本地 JSON 数据文件同步更新。
- [x] 规则确认、过期、废弃后本地 JSON 数据文件同步更新。
- [x] 服务重启后，人工新增规则仍可通过 `/api/rules` 读取。
- [x] 本地 JSON 只保存非 `mock` 规则，Mock 种子规则仍由代码提供。
- [x] 本地 JSON 文件不存在时系统可正常启动并自动使用空数据。
- [x] 本地 JSON 文件损坏时 API 返回明确错误，不静默生成虚假规则。
- [x] 持久化数据保留 `audit_log`、`data_mode`、`channel_type`、`channel_id`、`channel_name` 等关键字段。

前端验收清单：

- [x] `/rules` 新增规则表单包含“规则类型”选择。
- [x] 规则类型可选 `AI 平台规则` 与 `媒体平台规则`。
- [x] 选择 `AI 平台规则` 后显示 AI 平台下拉。
- [x] 选择 `媒体平台规则` 后显示媒体平台下拉。
- [x] 平台下拉选择后自动写入对应 `channel_id` 与 `channel_name`。
- [x] 新增 AI 规则后进入 `AIChannelRule` 列表。
- [x] 新增媒体规则后进入 `PublishingChannelRule` 列表。
- [x] 表单仍保留加载、错误、空状态兼容。
- [x] 所有按钮保留 `cursor-pointer`、可访问标签和清晰 hover/focus 状态。

验证要求：

- [x] 后端新增持久化测试先红后绿。
- [x] 前端新增平台选择测试先红后绿。
- [x] 后端全量测试通过。
- [x] 前端全量测试通过。
- [x] 前端生产构建通过。
- [x] npm audit 通过。
- [x] pip-audit 通过。
- [x] Semgrep SAST 通过。
- [x] 实际启动项目，完成新增 AI 规则、新增媒体规则、服务重启后规则仍存在的验证。

执行顺序：

```text
后端持久化失败测试
→ JSON Rule Repository / Store 持久化
→ 后端重启持久化验证
→ 前端平台选择失败测试
→ 前端规则类型与平台选择 UI
→ 全量验证
→ 更新本计划文档
```

P1.4 完成记录：

- 完成日期：2026-09-10。
- 后端新增：`RuleStore(storage_path=...)`，支持从本地 JSON 加载非 mock 规则。
- 后端持久化策略：种子 Mock 规则仍由 `p1_data.py` 提供；人工新增、编辑、确认、过期、废弃后的非 mock 规则写入 `flowpilot-ai/backend/data/rules.local.json`。
- 后端安全边界：本地 JSON 文件损坏时抛出明确错误 `规则持久化文件损坏`，不静默回退成空数据或伪造成功。
- 前端新增：规则类型选择器，支持 `AI 平台规则` 与 `媒体平台规则`。
- 前端新增：AI 平台下拉与媒体平台下拉，选择后自动同步 `channel_id` 与 `channel_name`。
- 工程纪律：`flowpilot-ai/backend/data/rules.local.json` 已加入 `.gitignore`，避免把本地演示数据误提交。

P1.4 验证结果：

- 后端 P1.4 持久化测试：`4 passed`。
- 后端全量测试：`15 passed`。
- 前端 P1.4 平台选择测试：`4 passed`。
- 前端全量测试：`17 passed`。
- 前端生产构建：`next build` 通过。
- npm audit：0 vulnerabilities。
- pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings，0 blocking。
- 实际运行验收：后端 `/api/health` 正常；前端 `/`、`/rules`、`/geo-monitor` 均返回 200；新增 AI 规则、新增小红书媒体规则后重启后端，两条规则仍可读取；本地 JSON 中未写入 mock 种子规则。

P1.4 遗留事项：

- [ ] 当前本地 JSON 不适合多人并发编辑，后续进入 PostgreSQL 后解决。
- [ ] 当前平台选项仍写在前端常量中，后续可改为后端返回可配置平台列表。
- [ ] 当前持久化没有后台管理“清理测试数据”功能，后续可增加规则导入/导出/重置。
- [ ] 当前未做浏览器截图级响应式验收，后续 UI 阶段补 375 / 768 / 1024 / 1440。

下一步：

- 进入 P1.5：规则导入 / 导出与本地数据治理。
- 也可以改走 P2.0：动态规则更新与真实 GEO 监测的最小闭环。若优先贴合 Boss 岗位要求，建议进入 P2.0。

### 2026-09-10｜P2.0 计划：动态规则更新与真实 GEO 监测最小闭环

状态：已完成

阶段目标：

- 从 P1 的“规则资产管理”进入 P2 的“真实运营证据记录”。
- 动态规则更新不直接编造平台规则，只记录规则来源检查、检查时间、检查状态和人工复核结果。
- 真实 GEO 监测不自动宣称排名或引用，只允许录入真实查询问题、AI 平台、目标品牌、目标 URL、原始响应和人工判断证据。
- 系统根据证据字段自动计算 `0-4` 级证据等级，避免手填“引用成功”。
- 继续保持 `Mock / Demo / Manual / Real` 数据隔离。

P2.0 技术边界：

- P2.0 不接真实 AI 平台 API Key。
- P2.0 不自动登录豆包、DeepSeek、文心一言、元宝等平台。
- P2.0 不绕过验证码、反爬或平台风控。
- P2.0 不承诺 GEO 排名，不承诺一定被 AI 引用。
- P2.0 不做定时爬虫，只做“来源检查任务记录 + 人工复核队列”的最小闭环。
- P2.0 的真实数据来源优先为人工录入的真实查询结果，保留原始响应作为证据。

后端验收清单：

- [x] 提供创建 GEO 监测任务 API。
- [x] 提供创建 GEO 监测记录 API。
- [x] 监测记录包含 `query`、`ai_channel`、`target_brand`、`target_url`、`raw_response`、`response_summary`、`data_mode`、`manual_review_status`。
- [x] 系统根据 `related_concept_found`、`brand_mentioned`、`page_retrieved`、`source_cited` 自动计算 `evidence_level`。
- [x] `source_cited=True` 时必须同时提供 `target_url` 和 `raw_response`。
- [x] 非 mock GEO 监测任务和记录写入本地 JSON。
- [x] 服务重启后，真实/人工 GEO 监测任务和记录仍可读取。
- [x] 本地 JSON 只保存非 mock 监测数据，Mock 示例仍由代码提供。
- [x] 提供规则来源检查 API，用于记录规则来源复核时间、状态和审计日志。
- [x] 没有 `source_url` 的规则不能进入来源检查完成状态。

前端验收清单：

- [x] `/geo-monitor` 页面提供创建真实监测任务表单。
- [x] `/geo-monitor` 页面提供录入真实查询记录表单。
- [x] 录入记录时由用户填写原始 AI 响应，不允许系统伪造响应。
- [x] 页面显示自动计算后的证据等级。
- [x] 页面明确显示 `品牌提及 ≠ 页面检索 ≠ 来源引用`。
- [x] 页面区分 Mock 数据和 Manual / Real 数据。
- [x] `/rules` 页面提供“检查来源”操作入口。
- [x] 规则来源检查失败时显示真实错误。
- [x] 所有新增表单保留标签、focus 状态、加载/错误状态。

验证要求：

- [x] 后端 GEO 监测新增测试先红后绿。
- [x] 后端规则来源检查新增测试先红后绿。
- [x] 前端 GEO 录入测试先红后绿。
- [x] 前端规则来源检查测试先红后绿。
- [x] 后端全量测试通过。
- [x] 前端全量测试通过。
- [x] 前端生产构建通过。
- [x] npm audit 通过。
- [x] pip-audit 通过。
- [x] Semgrep SAST 通过。
- [x] 实际启动项目，创建真实监测任务和监测记录，重启后端后数据仍存在。
- [x] 实际启动项目，对至少一条人工规则执行来源检查，审计日志记录 `source_check_requested`。

执行顺序：

```text
后端 GEO Store 失败测试
→ GEO Store / API
→ 后端规则来源检查失败测试
→ RuleStore 来源检查 API
→ 前端 GEO 录入失败测试
→ 前端 GEO 监测录入 UI
→ 前端规则来源检查失败测试
→ 前端规则来源检查按钮
→ 全量验证
→ 更新本计划文档
```

P2.0 完成记录：

- 完成日期：2026-09-10。
- 后端新增：`GeoMonitorStore`，支持创建 GEO 监测任务、创建监测记录、自动计算 `evidence_level`、本地持久化非 mock 监测数据。
- 后端新增 API：`POST /api/geo-monitor/sessions`、`POST /api/geo-monitor/records`、`POST /api/rules/{rule_id}/source-check`。
- 后端规则来源检查：记录 `latest_source_checked_at`、`source_check_status`、`source_check_summary`，并写入审计动作 `source_check_requested`。
- 后端安全边界：`source_cited=True` 时必须同时提供 `target_url` 与 `raw_response`；缺少 `source_url` 的规则不能创建来源检查任务。
- 前端新增：`/geo-monitor` 创建真实监测任务表单、录入真实查询记录表单、证据布尔项选择、原始 AI 响应录入。
- 前端新增：`/rules` 规则卡片“检查来源”操作入口。
- 工程纪律：`flowpilot-ai/backend/data/geo-monitor.local.json` 已加入 `.gitignore`，避免把真实/演示监测数据误提交。
- 稳定性修复：规则持久化与 GEO 监测持久化均改为唯一临时文件写入，避免 Windows 下固定 `.tmp` 文件替换导致锁冲突。

P2.0 验证结果：

- 后端定向修复验证：`test_expire_and_deprecate_rule_are_recorded_as_auditable_state_changes`，`1 passed`。
- 前端定向修复验证：`p1-api-integration.test.tsx`，`4 passed`。
- 后端全量测试：`24 passed`。
- 前端全量测试：`19 passed`。
- 前端生产构建：`next build` 通过，`/`、`/rules`、`/geo-monitor` 均完成静态构建。
- npm audit：0 vulnerabilities。
- pip-audit：No known vulnerabilities found。
- Semgrep SAST：0 findings，0 blocking。
- 实际运行验收：后端 `/api/health` 正常；前端 `/`、`/rules`、`/geo-monitor` 均返回 200。
- 实际 API 闭环：创建规则 `rule-91b582d71869` 后执行来源检查，审计日志最后一条为 `source_check_requested`。
- 实际 GEO 监测闭环：创建真实监测任务 `geo-mon-0f1ad4feaa4a` 与记录 `geo-rec-9ecfd4b8864a`，系统自动计算 `evidence_level=4`。
- 持久化验证：重启后端后，真实监测任务、监测记录和规则来源检查状态仍可读取。

P2.0 遗留事项：

- [ ] 当前“动态规则更新”仍是来源检查请求与人工复核队列，不是自动联网抓取最新平台规则。
- [ ] 当前“真实 GEO 监测”依赖人工录入真实 AI 响应，不自动登录豆包、DeepSeek、文心一言、元宝等平台。
- [ ] 当前本地 JSON 适合单人演示，不适合多人并发协作；后续进入 PostgreSQL 后解决。
- [ ] 当前未接入真实 AI 平台规则源、搜索引擎收录源、网站访问统计源。
- [ ] 当前未完成 375 / 768 / 1024 / 1440 截图级响应式验收。

下一步：

- 建议进入 P2.1：规则来源复核队列与真实规则版本对比。
- P2.1 重点不是“自动更新规则”，而是把规则检查任务变成可复核、可比较、可归档的规则更新流程。

### 2026-09-10｜P2.0.1 计划：页面实用性与信息架构修补

状态：已完成

阶段目标：

- 把当前“项目说明页”升级为更接近真实运营人员每日使用的“运营工作台”。
- 增加全局导航，让首页、规则中心、GEO 监测中心之间可以稳定跳转。
- 优化 GEO 监测页的信息层级，先看数据概览，再进入新建/录入操作。
- 降低危险操作误触风险，让规则中心更符合企业后台的操作习惯。
- 保持 P2.0 的真实证据原则：不伪造 AI 响应，不承诺 GEO 排名，不把品牌提及误判为来源引用。

P2.0.1 技术边界：

- 不新增后端业务模型。
- 不接入真实外部 AI 平台。
- 不做自动发布。
- 不做复杂权限。
- 不改变 P2.0 已通过的 API 契约。
- 本阶段只做页面信息架构、响应式布局、操作命名与交互可用性修补。

验收清单：

- [x] 所有页面具备全局导航，可访问首页、规则中心、GEO 监测中心。
- [x] 首页标题和核心模块从“项目说明”转为“今日运营工作台”。
- [x] 首页显示待复核规则、GEO 监测任务、监测记录、最高证据等级等运营摘要。
- [x] 首页提供快捷操作入口：发起来源复核、创建监测任务、录入监测记录。
- [x] GEO 监测页增加数据概览区。
- [x] GEO 监测页新建任务和录入记录表单收进“新建/录入操作区”。
- [x] GEO 监测记录桌面端保留表格式密度展示。
- [x] GEO 监测记录移动端改成卡片式展示，避免长问题挤压表格。
- [x] 规则中心危险操作“标记过期 / 标记废弃”视觉降权。
- [x] 规则中心“检查来源”改名为“发起来源复核”。
- [x] 表单、按钮、导航保留可见 focus 状态和清晰 hover 状态。
- [x] 不使用 emoji 作为 UI 图标，继续使用 Lucide 图标体系。
- [~] 375 / 768 / 1024 / 1440 断点不出现明显横向滚动或内容遮挡；当前完成响应式代码与测试级验证，尚未完成截图级人工验收。

验证要求：

- [x] 前端测试先红后绿，覆盖全局导航、首页工作台文案、GEO 操作区、移动端记录卡片、危险操作降权与“发起来源复核”文案。
- [x] 前端全量测试通过。
- [x] 前端生产构建通过。
- [x] 实际启动项目，访问 `/`、`/rules`、`/geo-monitor` 均返回 200。
- [x] 更新本文档记录完成情况、验证结果和新增避坑。

P2.0.1 完成记录：

- 完成日期：2026-09-10。
- 新增全局导航组件：所有页面都可访问首页工作台、规则中心、GEO 监测中心。
- 首页改造：从项目说明页调整为“今日运营工作台”，增加运营摘要和快捷操作。
- GEO 监测页改造：增加 `GEO 数据概览`，展示监测任务、真实/人工记录、待复核记录、最高证据等级。
- GEO 监测页表单改造：创建任务和录入记录收进 `新建 / 录入操作区`。
- GEO 监测记录改造：桌面端保留表格密度，移动端增加卡片式记录，降低长问题造成的横向挤压风险。
- 规则中心改造：`检查来源` 改名为 `发起来源复核`。
- 规则中心危险操作降权：`标记过期`、`标记废弃` 使用 `danger-ghost` 弱危险样式。

P2.0.1 验证结果：

- P2.0.1 新增前端测试：先红，3 个测试失败，失败原因分别为缺少全局导航、缺少 GEO 数据概览 / 操作区 / 移动端卡片、规则来源按钮文案未更新。
- P2.0.1 新增前端测试修复后：`3 passed`。
- 前端全量测试：`22 passed`。
- 前端生产构建：`next build` 通过。
- npm audit：0 vulnerabilities。
- Semgrep SAST：0 findings，0 blocking。
- 实际运行验收：本地后端与前端服务可访问，`/`、`/rules`、`/geo-monitor` 均返回 200。

P2.0.1 遗留事项：

- [ ] 响应式布局已通过代码与测试级验证，但还没有 375 / 768 / 1024 / 1440 截图级验收。
- [ ] 首页运营摘要当前为静态展示，后续可接入真实 API 汇总规则、任务和记录数量。
- [ ] 全局导航当前不显示当前页面高亮，后续可接入 pathname 做 active 状态。
- [ ] 表单仍直接展开在操作区内，后续可改为折叠面板或抽屉，进一步降低首屏压力。

下一步：

- 建议进入 P2.1：规则来源复核队列与真实规则版本对比。
- P2.1 可以在当前 UI 基础上，把“发起来源复核”升级成“复核任务列表 + 旧规则 / 新规则对比 + 人工确认归档”。

### 2026-09-10｜P2.1-A 计划：规则来源复核队列与版本对比最小闭环

状态：计划已确认，尚未进入编码。

阶段目标：

- 把 P2.0 的“发起来源复核”从单次按钮操作，升级为可追踪、可对比、可人工确认的规则复核流程。
- 让 AI 平台规则和媒体平台规则都能进入同一套复核队列。
- 每一次规则变化必须保留旧规则、新规则候选、来源 URL、置信度、提交人、审核人、审核结论和版本记录。
- 保持真实数据原则：系统只记录人工输入或可验证来源，不自动伪造“最新规则”。

P2.1-A 小阶段边界：

- 本小阶段只完成计划拆分、验收清单、基线状态记录。
- 不写后端业务代码。
- 不写前端页面代码。
- 不创建新的数据文件。
- 不接入真实平台 API。
- 不做自动联网抓取。

P2.1 后续拆分：

| 小阶段 | 名称 | 目标 | 停止点 |
|---|---|---|---|
| P2.1-A | 计划与验收清单 | 明确复核队列的数据、API、UI、异常、验证标准 | 写入本文档后暂停 |
| P2.1-B | 后端 RED 测试 | 写出规则候选创建、采用、忽略、重复决策失败测试 | 看到测试因功能缺失失败后暂停或继续 |
| P2.1-C | 后端实现 | 实现复核队列持久化、API、审计日志、版本更新 | 后端定向测试通过后暂停 |
| P2.1-D | 前端 RED 测试 | 写出规则复核队列 UI、旧/新规则对比、采用/忽略操作测试 | 看到测试因 UI 缺失失败后暂停或继续 |
| P2.1-E | 前端实现 | 在规则中心增加复核队列、候选录入、对比卡片、人工决策 | 前端定向测试通过后暂停 |
| P2.1-F | 全量验收 | 跑后端、前端、构建、安全扫描、实际页面/API 验证 | 逐项更新验收结果后暂停 |

P2.1 验收清单：

后端验收：

- [ ] 提供 `GET /api/rule-source-reviews`，可查看全部规则来源复核任务。
- [ ] 提供 `POST /api/rules/{rule_id}/source-review-proposals`，可为某条规则提交新规则候选。
- [ ] 提供 `POST /api/rules/{rule_id}/source-review-proposals/{review_id}/accept`，可人工采用候选规则。
- [ ] 提供 `POST /api/rules/{rule_id}/source-review-proposals/{review_id}/ignore`，可人工忽略候选规则。
- [ ] 创建候选时记录旧规则摘要、旧来源 URL、旧置信度、旧版本。
- [ ] 创建候选时记录新规则摘要、新来源 URL、新置信度、变更说明。
- [ ] 采用候选后，原规则的 `rule_summary`、`source_url`、`confidence` 被更新。
- [ ] 采用候选后，原规则 `version` 自动递增。
- [ ] 采用候选后，写入 `change_log` 和 `audit_log`。
- [ ] 忽略候选后，不修改原规则正文、来源和置信度。
- [ ] 已采用或已忽略的候选，不能被重复采用或重复忽略。
- [ ] Mock 规则不能被误写入本地真实规则文件。
- [ ] 本地 JSON 损坏时返回明确错误，不静默生成假数据。

前端验收：

- [ ] `/rules` 页面增加“规则来源复核队列”区域。
- [ ] 复核队列能展示待复核、已采用、已忽略状态。
- [ ] 用户可以选择一条规则，录入新规则候选摘要、来源 URL、置信度和变更说明。
- [ ] 复核卡片必须并排或上下展示“旧规则”和“新规则候选”。
- [ ] 复核卡片必须展示旧版本、新版本状态、来源 URL、置信度差异。
- [ ] 待复核任务显示“采用新规则”和“忽略候选”操作。
- [ ] 已采用或已忽略任务不再显示高优先级决策按钮。
- [ ] 操作中按钮进入 loading / disabled 状态，避免重复提交。
- [ ] API 失败时显示真实错误信息，不伪造成成功。
- [ ] 移动端复核卡片使用单列布局，不依赖宽表格。
- [ ] 所有输入框有 label，按钮有清晰 aria-label，保留可见 focus 状态。

异常情况验收：

- [ ] rule_id 不存在时返回 404。
- [ ] 新规则候选摘要为空时返回校验错误。
- [ ] 新来源 URL 为空时不能创建候选。
- [ ] 置信度小于 0 或大于 1 时不能提交。
- [ ] 重复采用同一候选时返回明确错误。
- [ ] 重复忽略同一候选时返回明确错误。
- [ ] 前端加载复核队列失败时显示错误状态。
- [ ] 前端复核队列为空时显示空状态说明。

骨架屏与加载状态验收：

- [ ] 规则中心加载时保留现有规则列表骨架屏。
- [ ] 复核队列加载时显示独立骨架屏或加载提示。
- [ ] 创建候选时提交按钮显示处理中状态。
- [ ] 采用或忽略候选时，对应按钮 disabled。
- [ ] 后端错误返回后，页面恢复可操作状态。

终端适配验收：

- [ ] 桌面端 1440px：规则列表与复核队列可并行或分区清晰展示。
- [ ] 笔记本 1024px：内容不被导航遮挡，按钮可点击。
- [ ] 平板 768px：旧/新规则对比能自然换行。
- [ ] 手机 375px：复核任务使用卡片单列展示，无明显横向滚动。

验证要求：

- [ ] 后端 P2.1 新增测试必须先红后绿。
- [ ] 前端 P2.1 新增测试必须先红后绿。
- [ ] 后端全量测试通过。
- [ ] 前端全量测试通过。
- [ ] 前端生产构建通过。
- [ ] npm audit 通过。
- [ ] pip-audit 通过。
- [ ] Semgrep SAST 通过。
- [ ] 实际启动项目，验证 `/rules` 可访问。
- [ ] 实际通过 API 创建候选、采用候选、忽略候选，并检查持久化数据。

P2.1-A 基线记录：

- 后端基线测试：`24 passed`。
- 前端基线测试：`22 passed`。
- 当前分支：`codex/p2-0-dynamic-rules-real-geo-monitor`。
- 当前决定：完成 P2.1-A 后暂停，等待用户确认是否进入 P2.1-B。

### 2026-09-10｜P2.1-B 执行记录：后端规则来源复核队列 RED 测试

状态：已完成 RED 测试，尚未实现功能。

本小阶段目标：

- 只新增后端失败测试，不实现生产代码。
- 用测试锁定 P2.1-C 必须实现的后端契约。
- 验证当前系统确实缺少“规则来源复核队列 + 旧/新规则对比 + 人工采用/忽略”能力。

新增测试文件：

- `flowpilot-ai/backend/tests/test_p2_1_rule_source_reviews.py`

测试覆盖：

- 创建规则来源复核候选时，必须记录旧规则摘要、旧来源 URL、旧置信度、旧版本。
- 创建规则来源复核候选时，必须记录新规则摘要、新来源 URL、新置信度和变更说明。
- 候选任务必须能进入复核队列，并可通过列表读取。
- 人工采用候选后，原规则必须更新摘要、来源 URL、置信度，并自动递增版本。
- 人工采用候选后，必须写入 `change_log` 和 `audit_log`。
- 人工忽略候选后，原规则正文、来源 URL、置信度和版本不能被误改。
- 同一候选已采用后，不能再次被忽略或重复处理。
- API 必须提供候选创建、队列读取、采用、忽略四个入口。

RED 验证命令：

```powershell
.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests\test_p2_1_rule_source_reviews.py
```

RED 验证结果：

- 测试收集：`collected 5 items`
- 结果：`5 failed`
- 失败原因符合预期：
  - `RuleStore` 尚无 `create_source_review_proposal` 方法。
  - `/api/rules/{rule_id}/source-review-proposals` 尚未注册，返回 `404 Not Found`。

未做事项：

- 未实现 `RuleSourceReviewProposalRequest`。
- 未实现 `RuleSourceReviewActionRequest`。
- 未实现复核队列持久化。
- 未实现采用 / 忽略逻辑。
- 未修改前端页面。
- 未修改 API 路由。

下一步：

- 进入 P2.1-C：后端实现。
- P2.1-C 目标是让本小阶段新增的 5 个 RED 测试转为通过，并保持后端全量测试通过。

### 2026-09-10｜P2.1-C / D / E / F 完成记录：规则来源复核队列完整闭环

状态：已完成。

完成内容：

- 后端实现规则来源复核候选模型：
  - `RuleSourceReviewProposalRequest`
  - `RuleSourceReviewActionRequest`
- 后端实现规则来源复核队列能力：
  - 创建新规则候选。
  - 列出全部复核任务。
  - 人工采用候选。
  - 人工忽略候选。
  - 已处理候选禁止重复决策。
- 后端新增 API：
  - `GET /api/rule-source-reviews`
  - `POST /api/rules/{rule_id}/source-review-proposals`
  - `POST /api/rules/{rule_id}/source-review-proposals/{review_id}/accept`
  - `POST /api/rules/{rule_id}/source-review-proposals/{review_id}/ignore`
- 后端采用候选后自动更新：
  - `rule_summary`
  - `source_url`
  - `confidence`
  - `version`
  - `change_log`
  - `audit_log`
- 后端忽略候选后保持原规则正文、来源、置信度和版本不变，只记录审计日志。
- 前端 API 客户端新增规则来源复核类型和调用方法。
- `/rules` 页面新增“规则来源复核队列”区域。
- `/rules` 页面支持：
  - 选择待复核规则。
  - 录入新规则候选摘要。
  - 录入新来源 URL。
  - 录入候选置信度。
  - 录入变更说明。
  - 展示旧规则 / 新规则候选对比。
  - 采用新规则。
  - 忽略候选。
  - 显示 API 真实错误。
  - 操作中按钮 disabled，避免重复提交。

新增 / 修改文件：

- `flowpilot-ai/backend/app/rule_store.py`
- `flowpilot-ai/backend/app/main.py`
- `flowpilot-ai/backend/tests/test_p2_1_rule_source_reviews.py`
- `flowpilot-ai/frontend/app/lib/flowpilot-api.ts`
- `flowpilot-ai/frontend/app/rules/rules-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p2-1-source-review-queue.test.tsx`

TDD 记录：

- P2.1-B 后端 RED：
  - 定向测试收集 `5 items`。
  - 结果 `5 failed`。
  - 失败原因：`RuleStore` 缺少 `create_source_review_proposal`；API 路由返回 `404 Not Found`。
- P2.1-C 后端 GREEN：
  - 后端定向测试 `5 passed`。
  - 后端全量测试 `29 passed`。
- P2.1-D 前端 RED：
  - 定向测试收集 `4 tests`。
  - 结果 `4 failed`。
  - 失败原因：页面缺少“规则来源复核队列”。
- P2.1-E 前端 GREEN：
  - 前端定向测试调整为 5 个更准确的行为测试。
  - 前端定向测试 `5 passed`。

P2.1-F 验证结果：

- 后端全量测试：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests`
  - 结果：`29 passed`
- 前端全量测试：
  - 命令：`npm.cmd test -- --run`
  - 结果：`8 passed / 27 passed`
- 前端生产构建：
  - 命令：`npm.cmd run build`
  - 结果：构建通过，`/`、`/_not-found`、`/geo-monitor`、`/rules` 均完成静态构建。
- npm audit：
  - 首次使用 `npmmirror` 审计端点失败，原因是镜像源不支持 npm security advisories API。
  - 改用官方源：`npm.cmd audit --json --package-lock-only --registry=https://registry.npmjs.org`
  - 结果：`0 vulnerabilities`
- pip-audit：
  - 实际可用路径：`.\.audit_repos\.audit_tools\Scripts\pip-audit.exe`
  - 命令：`.\.audit_repos\.audit_tools\Scripts\pip-audit.exe -r flowpilot-ai\backend\requirements.txt`
  - 结果：`No known vulnerabilities found`
- Semgrep SAST：
  - 命令：`.\.audit_repos\.audit_tools\Scripts\semgrep.exe scan --config=p/security-audit --metrics=off --json --output semgrep-flowpilot-p2-1.json flowpilot-ai`
  - 结果：`0 findings / 0 blocking`
- 实际运行验证：
  - 后端 `/api/health` 返回 `200`。
  - 前端 `/rules` 返回 `200`。
  - 实际 API 创建规则、创建候选、采用候选、创建第二个候选、忽略候选均成功。
  - 实际 API 验证结果：
    - `accepted_version=0.1.1`
    - `accepted_audit=source_review_accepted`
    - `ignored_audit=source_review_ignored`
    - Python UTF-8 断言队列包含 `已采用` 和 `已忽略`：`runtime_queue_accept_ignore_verified=True`

问题与修复：

- 问题：前端 P2.1 测试中，旧规则摘要同时出现在规则列表和复核对比卡片，`getByText` 因多匹配失败。
  - 修复：改为 `getAllByText(...).length >= 1`，避免把合理重复内容误判为错误。
- 问题：前端测试最初尝试对同一个候选先采用再忽略，与“已处理候选禁止重复决策”的业务规则冲突。
  - 修复：拆成“采用候选”和“忽略候选”两个独立测试。
- 问题：实际 API 验证首次返回 `404 Not Found`。
  - 根因：运行中的 uvicorn 后端进程没有重启，仍加载旧路由表。
  - 修复：停止 8000 端口旧进程，重新启动后端服务，再次验证通过。
- 问题：PowerShell 对中文状态字符串比较返回 False，但 API 实际数据正确。
  - 修复：用 Python UTF-8 脚本读取 API 并断言 `已采用` / `已忽略` 状态，避免终端编码误判。
- 问题：npm audit 默认 registry 指向 `npmmirror`，镜像源不支持安全审计接口。
  - 修复：审计时显式使用 `--registry=https://registry.npmjs.org`。
- 问题：最初使用的 `.\.audit_tools\Scripts\pip-audit.exe` 路径不存在。
  - 修复：定位实际路径为 `.\.audit_repos\.audit_tools\Scripts\pip-audit.exe`。

P2.1 遗留事项：

- [ ] 当前复核队列仍保存在规则 JSON 内，适合单人演示；后续多用户协作需迁移 PostgreSQL。
- [ ] 当前候选来源 URL 只做非空校验，暂未进行联网可达性检测。
- [ ] 当前复核队列没有筛选器，后续可增加“待复核 / 已采用 / 已忽略”筛选。
- [ ] 当前前端没有截图级 375 / 768 / 1024 / 1440 响应式验收。
- [ ] 当前仍不自动抓取 AI 平台规则，也不承诺规则最新，只记录人工复核证据。

下一步：

- 建议进入 P2.2：规则复核队列筛选、来源 URL 可达性检查、规则更新提醒。
- 如果优先服务简历展示，也可以先进入 P3.0：把规则中心和 GEO 监测组合成一个可演示的“GEO 运营日报 / 周报”。

### 2026-09-10｜P2.2 计划：复核队列筛选、来源 URL 可达性检查、规则更新提醒

状态：进行中。

阶段目标：

- 在 P2.1 规则来源复核队列基础上，提升运营可用性。
- 让用户可以按 `全部 / 待复核 / 已采用 / 已忽略` 查看规则复核任务。
- 对新规则候选的来源 URL 做最小可达性检查，记录状态码、检测时间和错误信息。
- 增加规则更新提醒，帮助运营人员发现“缺少来源、长期未复核、存在待处理候选”的规则。

关键边界：

- P2.2 不自动抓取 AI 平台或媒体平台的最新规则。
- P2.2 不自动判断某条规则一定真实或最新。
- URL 可达不等于规则可信，只代表该来源链接当前可以访问。
- URL 不可达也不等于规则错误，只代表需要人工复核。
- 所有规则是否采用，仍由人工确认。

后端验收清单：

- [ ] `GET /api/rule-source-reviews?status=待复核` 只返回待复核任务。
- [ ] `GET /api/rule-source-reviews?status=已采用` 只返回已采用任务。
- [ ] `GET /api/rule-source-reviews?status=已忽略` 只返回已忽略任务。
- [ ] 提供 `POST /api/rule-source-reviews/{review_id}/source-url-check`。
- [ ] URL 检查结果写入复核任务：`source_url_check_status`、`source_url_checked_at`、`source_url_status_code`、`source_url_check_error`。
- [ ] URL 无效时返回明确的 `invalid` 状态，不抛未处理异常。
- [ ] 提供 `GET /api/rules/update-reminders`。
- [ ] 更新提醒能识别缺少来源 URL 的规则。
- [ ] 更新提醒能识别存在待复核候选的规则。
- [ ] 更新提醒能识别长期未做来源复核的规则。

前端验收清单：

- [ ] `/rules` 的复核队列增加状态筛选器。
- [ ] 筛选器包含 `全部`、`待复核`、`已采用`、`已忽略`。
- [ ] 点击筛选器后，复核队列按状态刷新。
- [ ] 每个候选卡片提供“检查候选来源 URL”操作。
- [ ] URL 检查后展示可达、不可达或无效状态。
- [ ] URL 检查失败时展示真实错误，不伪造成成功。
- [ ] `/rules` 页面增加“规则更新提醒”区域。
- [ ] 提醒区域展示缺少来源、待复核候选、长期未复核等原因。
- [ ] 移动端筛选器可换行，候选卡片仍保持单列可读。

验证要求：

- [ ] 后端 P2.2 测试先红后绿。
- [ ] 前端 P2.2 测试先红后绿。
- [ ] 后端全量测试通过。
- [ ] 前端全量测试通过。
- [ ] 前端生产构建通过。
- [ ] npm audit 通过。
- [ ] pip-audit 通过。
- [ ] Semgrep SAST 通过。
- [ ] 实际运行项目并验证 `/rules` 页面 200。
- [ ] 实际 API 创建候选后可检查来源 URL，并可按状态筛选队列。

### 2026-09-10｜P2.2 完成记录：复核队列筛选、来源 URL 可达性检查、规则更新提醒

状态：已完成。

完成内容：

- 后端新增复核队列状态筛选能力：
  - `GET /api/rule-source-reviews?status=待复核`
  - `GET /api/rule-source-reviews?status=已采用`
  - `GET /api/rule-source-reviews?status=已忽略`
- 后端新增候选来源 URL 可达性检查：
  - `POST /api/rule-source-reviews/{review_id}/source-url-check`
  - 写入 `source_url_check_status`
  - 写入 `source_url_checked_at`
  - 写入 `source_url_status_code`
  - 写入 `source_url_check_error`
- 后端新增规则更新提醒：
  - `GET /api/rules/update-reminders`
  - 可识别缺少来源 URL。
  - 可识别存在待复核候选。
  - 可识别长期未做来源复核的人工/真实规则。
- 前端 `/rules` 页面新增规则更新提醒区。
- 前端 `/rules` 页面新增复核队列筛选器：
  - 全部
  - 待复核
  - 已采用
  - 已忽略
- 前端复核卡片新增候选来源 URL 检查按钮。
- 前端复核卡片新增来源检查状态展示：
  - 未检查
  - 可达
  - 不可达
  - 无效
- 前端保留真实 API 错误提示，不伪造成成功状态。

新增 / 修改文件：

- `flowpilot-ai/backend/app/rule_store.py`
- `flowpilot-ai/backend/app/main.py`
- `flowpilot-ai/backend/tests/test_p2_2_rule_review_operations.py`
- `flowpilot-ai/frontend/app/lib/flowpilot-api.ts`
- `flowpilot-ai/frontend/app/rules/rules-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p2-2-rule-review-operations.test.tsx`
- `semgrep-flowpilot-p2-2.json`

P2.2 验收结果：

- [x] 后端 P2.2 RED 测试先失败：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests\test_p2_2_rule_review_operations.py`
  - 初始结果：`4 failed, 1 passed`
  - 失败原因符合预期：缺少 `check_source_review_url`、`list_update_reminders` 和 URL 检查 API。
- [x] 后端 P2.2 GREEN：
  - 结果：`5 passed`
- [x] 后端全量测试：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests`
  - 结果：`34 passed`
- [x] 前端 P2.2 专属测试：
  - 命令：`npm.cmd run test -- --run __tests__/p2-2-rule-review-operations.test.tsx`
  - 结果：`4 passed`
- [x] 前端全量测试：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`9 passed / 31 passed`
- [x] 前端生产构建：
  - 命令：`npm.cmd run build`
  - 结果：构建通过，`/`、`/_not-found`、`/geo-monitor`、`/rules` 均完成静态构建。
- [x] npm audit：
  - 命令：`npm.cmd audit --json --package-lock-only --registry=https://registry.npmjs.org`
  - 结果：`0 vulnerabilities`
- [x] pip-audit：
  - 命令：`.\.audit_repos\.audit_tools\Scripts\pip-audit.exe -r flowpilot-ai\backend\requirements.txt`
  - 结果：`No known vulnerabilities found`
- [x] Semgrep SAST：
  - 命令：`.\.audit_repos\.audit_tools\Scripts\semgrep.exe scan --config=p/security-audit --metrics=off --json --output semgrep-flowpilot-p2-2.json flowpilot-ai`
  - 最终结果：`0 findings / 0 blocking`
- [x] 实际运行 API 验证：
  - 创建规则成功。
  - 创建来源复核候选成功。
  - `GET /api/rule-source-reviews?status=待复核` 能返回新建候选。
  - `POST /api/rule-source-reviews/{review_id}/source-url-check` 对无效 URL 返回 `invalid`。
  - `GET /api/rules/update-reminders` 能返回规则更新提醒。
  - 实际验证输出：
    - `filtered_contains_review=true`
    - `url_check_status=invalid`
    - `reminder_count=53`
- [x] 实际运行页面验证：
  - `http://127.0.0.1:3000/rules`
  - 结果：`200`

P2.2 编码中遇到的问题与避免方法：

- 问题：前端文件包含历史中文编码显示异常，导致大块补丁上下文容易匹配失败。
  - 避免方法：后续优先使用更小的补丁点，围绕稳定的英文变量名、函数名、CSS class 或接口名定位，不用大段中文文案作为补丁上下文。
- 问题：前端创建候选后，本地乐观更新和测试 mock 的内存更新叠加，导致同一个 `review_id` 出现重复卡片。
  - 避免方法：任何列表本地合并都按主键去重，尤其是 `review_id`、`rule_id`、`record_id` 这类业务 ID。
- 问题：P2.2 测试最初使用 `getByText` / `getByRole` 要求唯一匹配，但规则标题和候选按钮在一个页面内合理重复出现。
  - 避免方法：测试要验证用户行为和关键结果，不要把“文本唯一”误当成业务约束；合理使用 `getAllBy...` 或更精确的容器范围。
- 问题：Semgrep 报告动态 `urllib` 使用存在安全风险，即使业务上已限制 `http/https`。
  - 避免方法：处理用户可控 URL 时优先使用更明确的协议白名单和受限客户端。本次改为 `http.client.HTTPConnection / HTTPSConnection`，拒绝非 `http/https` URL。
- 问题：来源 URL 可达性容易被误解成“规则可信”。
  - 避免方法：UI 和文档继续明确：URL 可达只表示链接能访问，不代表规则真实、最新、官方或可直接采用；最终采用仍必须人工确认。

P2.2 遗留事项：

- [ ] 当前 URL 检查只做 HEAD 最小可达性检查，部分站点可能拒绝 HEAD，后续可增加安全的 GET fallback。
- [ ] 当前更新提醒仍是规则级提示，后续可增加“提醒类型筛选”和“提醒处理记录”。
- [ ] 当前按钮 aria-label 对同一规则下多个候选可能重复，后续可追加候选 `review_id` 或创建时间提升可访问性。
- [ ] 当前规则数据仍存本地 JSON，适合单人演示；后续进入多用户或长期运营时迁移 PostgreSQL。

下一步建议：

- 进入 P2.3：真实 GEO 监测记录的复核状态流转与证据附件。
- 或进入 P3.0：把规则中心 + GEO 监测组合成可展示的“GEO 运营周报 / 业务案例报告”。

### 2026-09-11｜P2.3 计划：真实 GEO 监测记录复核流转与证据附件

状态：进行中。

阶段目标：

- 把 GEO 监测记录从“录入一条数据”升级为“可复核、可驳回、可补证、可追溯”的证据闭环。
- 支持运营人员给每条 GEO 监测记录追加证据附件，例如来源 URL、截图链接、原始回答摘录、人工备注。
- 支持人工把监测记录标记为：
  - `pending`：待复核。
  - `verified`：已确认。
  - `rejected`：已驳回。
  - `needs_evidence`：需补充证据。
- 明确区分“AI 提到相关概念”“品牌被提及”“页面被检索”“页面作为来源被引用”，不把低等级证据包装成高等级成果。

关键边界：

- P2.3 不做自动访问豆包、DeepSeek、文心一言、元宝等 AI 平台。
- P2.3 不承诺 AI 收录、引用或排名。
- P2.3 不做真实图片/文件上传，只保存证据元数据，避免过早引入文件存储、安全扫描和权限复杂度。
- P2.3 不让系统自动判断证据为真，最终状态仍由人工复核。
- P2.3 的证据附件 URL 只允许 `http` / `https`，禁止 `file://` 等本地路径或高风险协议。

后端验收清单：

- [ ] 新增 `POST /api/geo-monitor/records/{record_id}/evidence-attachments`。
- [ ] 证据附件支持 `source_url`、`screenshot_url`、`raw_response_excerpt`、`manual_note` 四类。
- [ ] 证据附件必须至少包含 `url` 或 `note` 之一。
- [ ] `source_url` / `screenshot_url` 类型的附件必须提供合法 `http/https` URL。
- [ ] 创建证据附件后，附件写入监测记录的 `evidence_attachments` 数组。
- [ ] 创建证据附件后，监测记录写入 `audit_log`。
- [ ] 新增 `POST /api/geo-monitor/records/{record_id}/review`。
- [ ] 复核状态支持 `verified`、`rejected`、`needs_evidence`。
- [ ] 复核后写入 `review_status_code`、`manual_review_status`、`reviewer`、`review_note`、`reviewed_at`。
- [ ] 复核后写入 `audit_log`。
- [ ] record_id 不存在时返回 404。
- [ ] 非法复核状态返回明确校验错误。
- [ ] `verified` 状态要求监测记录存在原始回答或至少一条证据附件，避免空证据被确认。

前端验收清单：

- [ ] `/geo-monitor` 每条监测记录展示复核状态。
- [ ] `/geo-monitor` 每条监测记录展示证据附件数量。
- [ ] `/geo-monitor` 每条监测记录可录入证据附件。
- [ ] 证据附件录入支持类型、URL、备注。
- [ ] URL 类型证据校验失败时展示真实 API 错误。
- [ ] 每条监测记录可执行“确认有效”“驳回记录”“要求补证”。
- [ ] 复核操作过程中按钮进入 loading / disabled 状态，避免重复提交。
- [ ] 复核完成后前端记录状态即时更新。
- [ ] 移动端仍以卡片形式展示监测记录、证据数量和复核操作，不依赖宽表格。

骨架屏与加载状态验收：

- [ ] GEO 监测数据加载时保留现有骨架屏。
- [ ] 证据附件提交时，对应按钮显示处理中或禁用。
- [ ] 复核提交时，对应按钮显示处理中或禁用。
- [ ] API 失败后页面恢复可操作状态。

异常情况验收：

- [ ] 未选择记录时不能提交证据附件。
- [ ] 证据附件 URL 协议非法时返回错误，不写入记录。
- [ ] 证据附件内容为空时返回错误，不写入记录。
- [ ] 空证据记录不能直接标记为已确认。
- [ ] Mock 数据允许展示，但真实效果统计仍应区分 `data_mode`。

终端适配验收：

- [ ] 桌面端 1440px：记录表格和复核操作清晰可读。
- [ ] 笔记本 1024px：操作按钮不遮挡主要内容。
- [ ] 平板 768px：证据区和复核区自然换行。
- [ ] 手机 375px：监测记录、证据附件和复核按钮为单列卡片，无明显横向滚动。

验证要求：

- [ ] 后端 P2.3 测试先红后绿。
- [ ] 前端 P2.3 测试先红后绿。
- [ ] 后端全量测试通过。
- [ ] 前端全量测试通过。
- [ ] 前端生产构建通过。
- [ ] npm audit 通过。
- [ ] pip-audit 通过。
- [ ] Semgrep SAST 通过。
- [ ] 实际运行项目并验证 `/geo-monitor` 页面 200。
- [ ] 实际 API 能创建监测记录、追加证据附件、执行复核流转。

### 2026-09-11｜P2.3 完成记录：真实 GEO 监测记录复核流转与证据附件

状态：已完成。

完成内容：

- 后端新增 GEO 监测记录证据附件能力：
  - `POST /api/geo-monitor/records/{record_id}/evidence-attachments`
  - 支持 `source_url`、`screenshot_url`、`raw_response_excerpt`、`manual_note` 四类证据。
  - URL 类证据只允许 `http` / `https`，拒绝 `file://` 等高风险协议。
  - 附件写入记录 `evidence_attachments`，并追加 `audit_log`。
- 后端新增 GEO 监测记录人工复核能力：
  - `POST /api/geo-monitor/records/{record_id}/review`
  - 支持 `verified`、`rejected`、`needs_evidence` 三种人工复核状态。
  - 写入 `review_status_code`、`manual_review_status`、`reviewer`、`review_note`、`reviewed_at`。
  - `verified` 要求记录存在原始回答或至少一条证据附件，避免空证据被确认为真实成果。
- 前端 `/geo-monitor` 新增“证据与复核”操作区：
  - 每条监测记录显示证据附件数量。
  - 支持录入证据类型、证据标题、证据 URL、证据备注。
  - 支持确认有效、驳回记录、要求补证。
  - 提交时按钮进入 disabled / loading 状态，避免重复提交。
  - API 失败时显示真实错误，不伪造成功状态。
- 移动端监测记录继续保持卡片化展示，并补充证据附件数量。
- 前端 API 客户端新增证据附件与复核状态类型，避免无结构字段扩散。

新增 / 修改文件：

- `flowpilot-ai/backend/app/geo_store.py`
- `flowpilot-ai/backend/app/main.py`
- `flowpilot-ai/backend/tests/test_p2_3_geo_review_evidence.py`
- `flowpilot-ai/frontend/app/lib/flowpilot-api.ts`
- `flowpilot-ai/frontend/app/geo-monitor/geo-monitor-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p2-3-geo-review-evidence.test.tsx`
- `flowpilot-ai/frontend/__tests__/p1-rule-management.test.tsx`

TDD 记录：

- 后端 P2.3 RED：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests\test_p2_3_geo_review_evidence.py`
  - 初始结果：`5 failed`
  - 失败原因符合预期：缺少证据附件方法、复核方法和 API 路由。
- 后端 P2.3 GREEN：
  - 结果：`5 passed`
- 前端 P2.3 RED：
  - 命令：`npm.cmd run test -- --run __tests__/p2-3-geo-review-evidence.test.tsx`
  - 初始结果：`4 failed`
  - 失败原因符合预期：页面缺少“证据与复核”区域和交互。
- 前端 P2.3 GREEN：
  - 结果：`4 passed`

P2.3 验收结果：

- [x] 后端 P2.3 测试先红后绿。
- [x] 前端 P2.3 测试先红后绿。
- [x] 后端全量测试通过：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\python.exe -m pytest flowpilot-ai\backend\tests`
  - 结果：`39 passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`10 passed / 35 passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：`/`、`/_not-found`、`/geo-monitor`、`/rules` 均完成静态构建。
- [x] npm audit 通过：
  - 命令：`npm.cmd audit --audit-level=moderate --registry=https://registry.npmjs.org`
  - 结果：`found 0 vulnerabilities`
- [x] pip-audit 通过：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\pip-audit.exe`
  - 结果：`No known vulnerabilities found`
- [x] Semgrep SAST 通过：
  - 命令：`.\flowpilot-ai\backend\.venv\Scripts\semgrep.exe --config auto flowpilot-ai\backend flowpilot-ai\frontend`
  - 最终结果：`0 findings / 0 blocking`
- [x] 实际运行页面验证通过：
  - 后端：`GET http://127.0.0.1:8000/api/health`
  - 结果：`200`
  - 前端：`GET http://127.0.0.1:3000/geo-monitor`
  - 结果：`200`
- [x] 实际 API 闭环验证通过：
  - 创建 GEO 监测 session：成功。
  - 创建 GEO 监测 record：成功。
  - 追加证据附件：成功，`attachment_count=1`。
  - 人工复核为 `verified`：成功。
  - 审计日志写入：成功，`audit_log_count=3`。

P2.3 编码中遇到的问题与避免方法：

- 问题：PowerShell 默认编码会把部分中文显示成乱码，容易误判文件内容已损坏。
  - 避免方法：涉及中文断言或补丁定位时，用 Node 按 UTF-8 读取文件确认真实内容，不直接相信终端乱码展示。
- 问题：前端状态“已确认”同时出现在桌面表格、移动卡片和复核卡片里，导致测试无法唯一定位。
  - 避免方法：状态展示分层处理；表格和移动摘要使用“复核：/ 状态：”前缀，复核卡片保留精确状态文本。
- 问题：npm 默认 registry 指向 `npmmirror`，该镜像不支持 npm security advisories API，导致审计失败。
  - 避免方法：安全审计固定使用 `--registry=https://registry.npmjs.org`。
- 问题：后端 venv 起初没有 `pip-audit` / `semgrep`，不能把“工具不存在”当作安全通过。
  - 避免方法：将扫描工具安装到项目 venv 后再执行扫描。
- 问题：`pip-audit` 报告 pip 自身版本漏洞。
  - 避免方法：升级 venv 内 pip 后重新审计。
- 问题：Semgrep 报测试 Mock 中的 `Object.assign(rule!, payload, ...)` 存在 mass assignment 风险。
  - 避免方法：即使是测试代码，也使用显式字段更新，避免把不安全写法沉淀成团队示例。

P2.3 遗留事项：

- [ ] 当前证据附件只保存 URL / 文本元数据，还没有真实文件上传、截图存储和文件安全扫描。
- [ ] 当前 GEO 监测仍是人工录入真实结果，尚未自动访问豆包、DeepSeek、文心一言、元宝等平台。
- [ ] 当前复核记录保存在本地 JSON，适合单人演示；后续长期使用建议迁移 PostgreSQL。
- [ ] 当前页面尚未做浏览器视觉截图回归，只完成测试、构建、页面 200 和 API 闭环验证。

下一步建议：

- 进入 P2.4：实际运行 `/geo-monitor` 页面并完成一条真实 API 闭环演示数据，再把结果沉淀为“业务案例记录”。
- 或进入 P3.0：把规则中心 + GEO 监测 + 证据复核组合成可展示的 GEO 运营周报 / 业务案例报告。

### 2026-09-11｜P2.4 计划：GEO 监测模块信息架构拆分

状态：待确认。

阶段判断：

- 当前 `/geo-monitor` 页面已经承载：
  - GEO 监测说明；
  - 数据概览；
  - 新建监测任务；
  - 录入监测记录；
  - 监测任务列表；
  - 监测记录表格；
  - 证据附件；
  - 人工复核；
  - 底部说明卡片。
- 继续堆在一页会造成：
  - 首屏信息过载；
  - 运营人员找不到当前最该处理的任务；
  - 复核动作和录入动作混在一起，容易误操作；
  - 后续加入报表、分页、筛选、真实监测时页面难维护；
  - 移动端页面会过长，实际操作效率下降。

P2.4 目标：

- 把 GEO 监测从“单页功能堆叠”升级为“企业级后台模块”。
- 保留当前已完成能力，不推翻 P2.0 / P2.1 / P2.2 / P2.3。
- 通过路由拆分，让每个页面只承担一个主要任务。
- 为后续 P3.0 GEO 运营报告、业务案例报告、真实案例沉淀打基础。

推荐页面结构：

```text
/geo-monitor
GEO 监测总览工作台

/geo-monitor/sessions
监测任务管理

/geo-monitor/records
监测记录库

/geo-monitor/review
证据复核中心

/geo-monitor/report
GEO 数据报表
```

页面职责：

#### `/geo-monitor`：总览工作台

用途：

- 让用户一眼看到当前 GEO 运营状态。

保留：

- 数据概览；
- 最近监测记录；
- 待复核数量；
- 最高证据等级；
- 快捷入口。

移出：

- 完整录入表单；
- 完整复核表单；
- 全量记录表格；
- 长说明卡片。

验收标准：

- [ ] 页面首屏能回答“现在 GEO 监测整体怎么样”。
- [ ] 页面提供进入任务、记录、复核、报表的入口。
- [ ] 不在总览页直接塞完整大表单。
- [ ] 移动端单列卡片展示，无明显横向滚动。

#### `/geo-monitor/sessions`：监测任务管理

用途：

- 管理品牌、产品、关键词维度的 GEO 监测任务。

包含：

- 创建监测任务表单；
- 任务列表；
- 每个任务的目标品牌、目标 URL、记录数量、最高证据等级；
- 后续可加入任务状态、监测周期。

验收标准：

- [ ] 可创建监测任务。
- [ ] 可查看所有监测任务。
- [ ] 创建成功后任务列表即时更新。
- [ ] API 失败时显示真实错误。

#### `/geo-monitor/records`：监测记录库

用途：

- 查看和录入 AI 平台查询结果。

包含：

- 录入真实查询记录；
- 查询问题；
- AI 平台；
- 证据等级；
- 品牌提及 / 页面检索 / 来源引用；
- 筛选入口；
- 分页或分组展示。

验收标准：

- [ ] 可录入监测记录。
- [ ] 记录列表展示证据等级和复核状态。
- [ ] 桌面端使用表格或列表，移动端使用卡片。
- [ ] 记录较多时不把所有内容一次性堆在首屏。

#### `/geo-monitor/review`：证据复核中心

用途：

- 专门处理待复核、需补证、已确认、已驳回的 GEO 证据。

包含：

- 状态筛选：全部 / 待复核 / 已确认 / 已驳回 / 需补证；
- 证据附件数量；
- 证据附件录入；
- 复核人；
- 复核备注；
- 确认有效 / 驳回记录 / 要求补证；
- 原始 AI 回答摘要。

验收标准：

- [ ] 待复核记录能集中展示。
- [ ] 每条记录可添加证据附件。
- [ ] 每条记录可执行人工复核状态流转。
- [ ] 操作中按钮 disabled，避免重复提交。
- [ ] URL 类证据失败时展示后端真实错误。

#### `/geo-monitor/report`：GEO 数据报表

用途：

- 把数据变成工作汇报、运营复盘和后续面试讲解都能说清楚的业务成果。

包含：

- 品牌提及率；
- 页面检索率；
- 来源引用率；
- 不同 AI 平台表现；
- 证据等级分布；
- 待复核趋势；
- 周报 / 月报导出预留。

验收标准：

- [ ] 页面能展示核心指标。
- [ ] 区分 `Mention`、`Retrieval`、`Citation`，不把低等级证据包装成高等级成果。
- [ ] 明确提示当前数据来自人工录入或真实监测，不承诺 AI 排名。
- [ ] 后续可作为业务案例截图；页面本身不出现个人简历标签。

P2.4 开发拆分：

#### P2.4-A：路由与导航规划

- 新增 `/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report` 页面骨架。
- 全局导航或 GEO 模块内导航增加上述入口。
- `/geo-monitor` 改为总览页，不再承担所有操作。

验收：

- [ ] 五个页面均可访问。
- [ ] 导航入口清楚。
- [ ] 页面标题与职责一致。
- [ ] `next build` 能识别所有路由。

#### P2.4-B：组件拆分

- 从 `geo-monitor-workspace.tsx` 中拆出：
  - `GeoMonitorOverviewPanel`
  - `GeoMonitorSessionPanel`
  - `GeoMonitorRecordPanel`
  - `GeoMonitorReviewPanel`
  - `GeoMonitorReportPanel`
- 保留共享数据类型和 API 客户端。
- 避免一个组件继续膨胀到 800 行以上。

验收：

- [ ] 总览、任务、记录、复核、报表组件职责清楚。
- [ ] 原有创建任务、录入记录、添加证据、人工复核功能不丢失。
- [ ] 前端测试覆盖每个入口页面。

#### P2.4-C：列表分页与筛选最小实现

- 监测记录页增加状态筛选。
- 复核中心增加复核状态筛选。
- 前端先做本地筛选和分页，不急着改后端分页接口。
- 每页默认展示 10 条记录。

验收：

- [ ] 记录页可按 AI 平台 / 证据等级 / 复核状态筛选。
- [ ] 复核页可按待复核 / 已确认 / 已驳回 / 需补证筛选。
- [ ] 记录超过 10 条时分页。
- [ ] 移动端分页按钮可点击且不挤压。

#### P2.4-D：实际运行与回归验证

- 保留 P2.3 已有 API 能力。
- 跑全量测试、构建、安全扫描。
- 启动项目，实际访问五个页面。
- 完成一次从任务创建到复核确认的真实 API / 页面闭环。

验收：

- [ ] 后端全量测试通过。
- [ ] 前端全量测试通过。
- [ ] 前端生产构建通过。
- [ ] npm audit 通过。
- [ ] pip-audit 通过。
- [ ] Semgrep SAST 通过。
- [ ] `/geo-monitor` 返回 200。
- [ ] `/geo-monitor/sessions` 返回 200。
- [ ] `/geo-monitor/records` 返回 200。
- [ ] `/geo-monitor/review` 返回 200。
- [ ] `/geo-monitor/report` 返回 200。

P2.4 非目标：

- [ ] 不接入真实 AI 平台自动查询。
- [ ] 不做自动发布。
- [ ] 不做登录权限。
- [ ] 不迁移 PostgreSQL。
- [ ] 不承诺 AI 收录、引用或排名。
- [ ] 不做复杂图表库，报表先用数字卡片和简单分布。

推荐执行顺序：

1. P2.4-A：先拆路由和导航。
2. P2.4-B：再拆组件，降低单文件复杂度。
3. P2.4-C：补筛选和分页。
4. P2.4-D：统一验收和记录。

下一步：

- 建议先执行 P2.4-A。
- 原因：先把页面边界拆出来，后续组件拆分、筛选分页、报表页才不会继续挤在 `/geo-monitor` 单页里。

### 2026-09-11｜P2.4-A 完成记录：GEO 监测路由与导航拆分

阶段目标：
- 将 `/geo-monitor` 从“所有功能堆在一页”调整为“GEO 监测总览工作台”。
- 新增独立子页面承接任务管理、记录录入、证据复核和数据报表。
- 保留 P2.0 / P2.1 / P2.2 / P2.3 已完成能力，不丢失真实监测、证据附件、人工复核等功能。

本次完成：
- 新增 `/geo-monitor/sessions`：监测任务管理页。
- 新增 `/geo-monitor/records`：监测记录库页。
- 新增 `/geo-monitor/review`：证据复核中心页。
- 新增 `/geo-monitor/report`：GEO 数据报表页。
- 更新全局导航，将 GEO 模块拆成：
  - GEO 总览
  - 监测任务
  - 监测记录
  - 证据复核
  - GEO 报表
- 调整 `/geo-monitor` 总览页职责：
  - 保留 GEO 数据概览。
  - 保留证据等级说明。
  - 增加四个模块入口。
  - 不再直接展示“创建真实监测任务”和“录入真实查询记录”的完整表单。
- 将任务创建表单移动到 `/geo-monitor/sessions`。
- 将真实查询记录录入表单移动到 `/geo-monitor/records`。
- 将证据复核卡片集中到 `/geo-monitor/review`。
- 增加 `/geo-monitor/report` 的基础指标卡片，区分品牌提及率、页面检索率、来源引用率。

涉及文件：
- `flowpilot-ai/frontend/app/components/state-card.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/page.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/geo-monitor-workspace.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/sessions/page.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/records/page.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/review/page.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/report/page.tsx`
- `flowpilot-ai/frontend/__tests__/p2-4-geo-routing.test.tsx`
- `flowpilot-ai/frontend/__tests__/p1-api-integration.test.tsx`
- `flowpilot-ai/frontend/__tests__/p1-pages.test.tsx`
- `flowpilot-ai/frontend/__tests__/p2-0-1-layout-usability.test.tsx`
- `flowpilot-ai/frontend/__tests__/p2-geo-monitor-entry.test.tsx`
- `flowpilot-ai/frontend/__tests__/p2-3-geo-review-evidence.test.tsx`

TDD 与验证记录：
- 先新增 P2.4 路由拆分测试，初次运行失败，原因是子路由尚未实现，符合预期。
- 实现子页面和导航后，P2.4 路由测试通过。
- 修正旧测试中“GEO 监测中心单页承载所有表单”的旧预期，改为验证总览页与子页面职责边界。
- 前端全量测试通过：`11 passed / 11 files，39 passed / 39 tests`。
- 前端生产构建通过：`next build` 成功，并识别 `/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`。
- 本地页面访问验证通过：
  - `/geo-monitor` 返回 200
  - `/geo-monitor/sessions` 返回 200
  - `/geo-monitor/records` 返回 200
  - `/geo-monitor/review` 返回 200
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- 旧测试仍按“单页 GEO 监测中心”断言完整表单和记录展示，和新信息架构冲突。
- 报表页曾出现外层页面标题和内部组件标题重复，导致无障碍 heading 查询不唯一。
- 任务页初版只有创建表单，没有展示创建后的任务列表，不利于用户确认创建结果。

避免方法：
- 后续每次页面职责调整后，同步更新测试命名和测试断言，避免测试仍锁死旧交互模型。
- 页面标题和组件标题要分层，避免同一页面出现多个同名一级语义标题。
- 任何创建类页面都应提供“创建后可见”的反馈区域，不让用户提交后还要切换页面确认。

当前阶段结论：
- P2.4-A 已完成。
- GEO 监测模块已经从单页堆叠进入多页面后台结构。
- 下一阶段建议进入 P2.4-B：组件拆分，将 `geo-monitor-workspace.tsx` 中的总览、任务、记录、复核、报表拆成独立组件，降低单文件复杂度。

### 2026-09-11｜P2.4-B 完成记录：GEO 监测组件拆分

阶段目标：
- 将 `geo-monitor-workspace.tsx` 从“大型页面组件”调整为“状态与 API 编排层”。
- 将总览、任务、记录、复核、报表拆入独立组件文件。
- 不新增业务功能，不改变 API 契约，不改变后端数据结构。

本次完成：
- 新增共享类型与常量文件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/shared.ts`
- 新增总览组件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-overview-panel.tsx`
  - 承接证据等级说明、GEO 数据概览、模块入口、说明卡片、loading / empty / error 状态。
- 新增任务组件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-session-panel.tsx`
  - 承接真实监测任务创建和任务列表。
- 新增记录组件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-record-panel.tsx`
  - 承接真实查询记录录入、记录表格、移动端记录卡片。
- 新增复核组件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-review-panel.tsx`
  - 承接复核页入口，复用记录面板的数据展示与证据复核能力。
- 新增报表组件：
  - `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
  - 承接 GEO 报表核心指标。
- 重写 `flowpilot-ai/frontend/app/geo-monitor/geo-monitor-workspace.tsx`：
  - 保留数据加载。
  - 保留表单状态。
  - 保留 API 提交处理。
  - 保留本地状态更新。
  - 不再直接定义大型 UI 子组件。

TDD 记录：
- 新增组件边界测试：
  - `flowpilot-ai/frontend/__tests__/p2-4-component-boundaries.test.ts`
- RED：
  - 初次运行失败，原因是 5 个目标组件文件不存在。
- GREEN：
  - 完成组件拆分后，组件边界测试通过。

验证结果：
- [x] P2.4-B 组件边界测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p2-4-component-boundaries.test.ts`
  - 结果：`1 passed`
- [x] GEO 监测相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p2-4-geo-routing.test.tsx __tests__/p2-geo-monitor-entry.test.tsx __tests__/p2-3-geo-review-evidence.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`4 passed / 12 passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`12 passed / 40 passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`。
- [x] 本地页面访问验证通过：
  - `/geo-monitor` 返回 200
  - `/geo-monitor/sessions` 返回 200
  - `/geo-monitor/records` 返回 200
  - `/geo-monitor/review` 返回 200
  - `/geo-monitor/report` 返回 200

拆分后文件规模：
- `geo-monitor-workspace.tsx`：约 275 行。
- `geo-monitor-overview-panel.tsx`：约 182 行。
- `geo-monitor-session-panel.tsx`：约 103 行。
- `geo-monitor-record-panel.tsx`：约 470 行。
- `geo-monitor-review-panel.tsx`：约 41 行。
- `geo-monitor-report-panel.tsx`：约 26 行。
- `shared.ts`：约 103 行。

潜在风险点：
- `geo-monitor-record-panel.tsx` 仍然偏大，里面同时包含记录录入、记录表格、移动端卡片和复核卡片。当前没有超过不可维护阈值，但 P2.4-C 做筛选分页时建议继续拆成：
  - `geo-monitor-record-entry-form.tsx`
  - `geo-monitor-record-table.tsx`
  - `geo-monitor-mobile-record-card.tsx`
  - `geo-record-evidence-review-card.tsx`
- 复核面板目前是薄封装，主要为了路由职责命名清晰。后续增加复核筛选时再扩展其内部逻辑。
- 本次只做前端组件拆分，没有改后端、权限、数据存储和安全扫描。

当前阶段结论：
- P2.4-B 已完成。
- 下一阶段建议进入 P2.4-C：监测记录筛选与分页最小实现。

### 2026-09-11｜P2.4-C 完成记录：监测记录筛选与分页最小实现

阶段目标：
- 在不改动后端 API 契约的前提下，为 GEO 监测记录增加前端本地筛选与分页。
- 优先解决记录逐渐增多后“全量堆在一页、查找困难、移动端阅读压力大”的可用性问题。
- 保持 P2.4-A 的多页面结构与 P2.4-B 的组件拆分成果，不把新逻辑重新塞回单页大组件。

本次完成：
- 在监测记录页增加筛选与分页区域，区域语义为“监测记录筛选与分页”。
- 支持按 AI 平台筛选。
- 支持按证据等级筛选。
- 支持按复核状态筛选。
- 筛选条件变化后自动回到第 1 页，避免当前页码超过筛选后的总页数。
- 默认每页显示 10 条记录。
- 增加分页状态说明：
  - 当前显示条数。
  - 筛选后总条数。
  - 全部记录数。
  - 当前页 / 总页数。
- 增加“上一页 / 下一页”分页按钮，并在边界页禁用不可用操作。
- 监测记录列表增加独立 region 语义，便于测试和后续无障碍增强。
- 调整旧测试中“已确认”文本唯一性的断言，适配新增的复核状态筛选选项。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-record-panel.tsx`
- `flowpilot-ai/frontend/__tests__/p2-4-record-filters-pagination.test.tsx`
- `flowpilot-ai/frontend/__tests__/p2-3-geo-review-evidence.test.tsx`

TDD 记录：
- 先新增 P2.4-C 筛选分页测试。
- RED：
  - 初始失败原因是页面尚无“监测记录筛选与分页”区域。
  - 复核状态筛选尚未实现。
  - 大量记录没有分页。
- GREEN：
  - 完成筛选、分页和页码重置逻辑后，P2.4-C 目标测试通过。
- 回归调整：
  - 新增复核状态筛选后，旧测试里“已确认”文本不再唯一。
  - 已将旧断言改为允许多个匹配，避免测试错误绑定到 UI 文案唯一性。

验证结果：
- [x] P2.4-C 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p2-4-record-filters-pagination.test.tsx`
  - 结果：`1 passed / 2 tests passed`
- [x] GEO 监测相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p2-4-record-filters-pagination.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-geo-monitor-entry.test.tsx __tests__/p2-3-geo-review-evidence.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`6 passed / 15 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`13 passed / 42 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor` 返回 200
  - `/geo-monitor/sessions` 返回 200
  - `/geo-monitor/records` 返回 200
  - `/geo-monitor/review` 返回 200
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- 桌面表格和移动端卡片会同时渲染同一批记录内容，测试中如果直接使用单个文本断言，容易遇到重复匹配。
- 新增筛选控件后，旧页面文本不再唯一，旧测试需要从“文本唯一”改为“语义区域 + 多匹配容忍”。
- 当前筛选与分页都在前端本地完成，虽然满足最小闭环，但还不是大数据量场景下的最终方案。

避免方法：
- 后续测试优先使用 role、region、label、within 等语义选择器，少依赖页面文案唯一性。
- 新增筛选、分页、排序时，要同步检查旧测试是否隐含“页面文本唯一”的假设。
- 记录列表规模扩大前，需要把筛选和分页下沉到后端查询参数，不让前端一次性承载所有数据。

潜在风险点：
- 当前分页是前端本地分页，数据量很大时会影响首屏加载和交互性能。
- 当前筛选条件没有同步到 URL，刷新页面或分享链接后筛选状态会丢失。
- 当前没有后端分页接口，未来如果真实监测记录持续增长，需要补充 `page`、`page_size`、`ai_channel`、`evidence_level`、`review_status` 等查询参数。
- `geo-monitor-record-panel.tsx` 仍然偏大，虽然 P2.4-B 已经拆分主工作台，但记录面板后续继续增加导出、排序、批量复核时应继续拆分。
- 当前没有做权限状态，后续接入用户体系后需要补齐无权限页面状态和后端真实权限校验。

当前阶段结论：
- P2.4-C 已完成。
- GEO 监测模块现在具备：多页面拆分、组件边界、记录筛选、前端分页、复核入口和基础报表。
- 下一小阶段建议进入 P2.4-D：P2 阶段收口验收，做一次页面、测试、构建、风险、计划文档的完整核对；确认无误后再进入 P3。

### 2026-09-11｜P2.4-D 完成记录：P2 阶段收口验收

阶段目标：
- 不新增业务功能。
- 对 P2 阶段已完成的“动态规则更新 + 真实 GEO 监测 + 页面信息架构拆分”做一次完整验收。
- 验证后端、前端、构建、安全扫描、页面访问和真实 API 闭环。
- 明确哪些能力已经可以作为阶段性交付，哪些能力仍属于后续 P3 / P4 范围。

本次验收范围：
- 后端 API 测试。
- 前端组件与页面测试。
- 前端生产构建。
- npm 依赖漏洞扫描。
- Python 依赖漏洞扫描。
- Semgrep SAST 扫描。
- GEO 监测五个页面本地访问。
- 从创建监测任务到记录录入、证据附件、复核确认的真实 HTTP API 闭环。

验收结果：
- [x] 后端全量测试通过：
  - 命令：`.\.venv\Scripts\python.exe -m pytest`
  - 结果：`39 passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`13 passed / 42 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] npm audit 通过：
  - 首次命令：`npm.cmd audit --audit-level=moderate`
  - 首次结果：失败，原因是当前默认 registry `npmmirror` 不支持 npm audit 接口：`[NOT_IMPLEMENTED] /-/npm/v1/security/* not implemented yet`
  - 复核命令：`npm.cmd audit --audit-level=moderate --registry=https://registry.npmjs.org/`
  - 复核结果：`found 0 vulnerabilities`
- [x] pip-audit 通过：
  - 命令：`.\.venv\Scripts\python.exe -m pip_audit -r requirements.txt`
  - 结果：`No known vulnerabilities found`
- [x] Semgrep SAST 通过：
  - 后端扫描命令：`.\.venv\Scripts\semgrep.exe --config p/owasp-top-ten --json --output ..\..\semgrep-flowpilot-p2-4-d.json .`
  - 后端扫描结果：`0 findings`
  - 全项目源码扫描命令：`.\backend\.venv\Scripts\semgrep.exe --config p/owasp-top-ten --json --output ..\semgrep-flowpilot-p2-4-d-source.json .\backend\app .\backend\tests .\frontend\app .\frontend\__tests__`
  - 全项目源码扫描结果：`0 findings`
  - 备注：直接对整个项目执行 `--no-git-ignore` 时被 `.next/dev/lock` 构建产物锁文件阻塞，因此最终扫描范围限定为后端源码、后端测试、前端源码、前端测试。
- [x] 本地页面访问验证通过：
  - `/geo-monitor` 返回 200
  - `/geo-monitor/sessions` 返回 200
  - `/geo-monitor/records` 返回 200
  - `/geo-monitor/review` 返回 200
  - `/geo-monitor/report` 返回 200
- [x] 真实 API 闭环通过：
  - 启动后端：`python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
  - 健康检查：`/api/health` 返回 200
  - 创建监测任务成功：
    - `POST /api/geo-monitor/sessions`
    - 返回 `session_id = geo-mon-7fd878589962`
  - 创建监测记录成功：
    - `POST /api/geo-monitor/records`
    - 返回 `record_id = geo-rec-179c56aa3544`
  - 添加证据附件成功：
    - `POST /api/geo-monitor/records/{record_id}/evidence-attachments`
    - 复核后 `evidence_attachments = 1`
  - 复核确认成功：
    - `POST /api/geo-monitor/records/{record_id}/review`
    - 返回 `review_status_code = verified`
    - 返回 `audit_log = 3`

P2 阶段已形成的可交付能力：
- 规则中心支持本地持久化。
- AI 平台规则和媒体平台规则有来源复核入口。
- 规则危险操作已降权，不再像主操作一样突出。
- GEO 监测支持真实人工录入，不把模拟数据包装成真实数据。
- GEO 监测区分：
  - 品牌提及。
  - 页面检索。
  - 来源引用。
  - 证据等级。
- GEO 监测支持任务创建、记录录入、证据附件和人工复核。
- `/geo-monitor` 已从单页堆叠拆成：
  - 总览。
  - 监测任务。
  - 监测记录。
  - 证据复核。
  - GEO 报表。
- 监测记录支持前端筛选和分页。
- 页面包含基础 loading / empty / error 状态。
- P2 阶段所有核心能力都有测试覆盖。

本次遇到的问题：
- npm audit 在 `npmmirror` 下不可用，必须显式指定官方 registry 才能完成漏洞扫描。
- Semgrep 对全项目无差别扫描时会扫到 `.next` 构建产物，导致锁文件权限错误。
- 当前 Git 工作区内大量项目文件仍是未跟踪状态，Semgrep 输出中会提示 tracked by git，这会影响扫描范围判断。
- PowerShell 输出中文接口字段时出现编码乱码，但接口状态码、字段结构和状态更新均可验证。

避免方法：
- 安全扫描命令固定写入计划：
  - npm audit 使用 `--registry=https://registry.npmjs.org/`
  - Semgrep 扫描源码目录，而不是扫 `.next`、`node_modules`、`.venv` 等生成物目录。
- 后续如果进入正式仓库管理，应尽快完成合理的 `.gitignore` 与首次提交，避免安全扫描和 diff 判断受未跟踪文件影响。
- API 验收以状态码、结构化字段、测试断言为准，不依赖 PowerShell 控制台中文显示。

潜在风险点：
- 当前真实 GEO 监测仍然是“人工录入真实查询结果”，尚未接入豆包、DeepSeek、Kimi、文心、元宝等平台的自动查询。
- 当前无法承诺 AI 收录、引用或排名，只能记录真实查询样本和证据链。
- 当前分页和筛选仍然是前端本地实现，数据规模上来以后需要后端分页和查询参数。
- 当前没有登录、鉴权、角色权限，后续多人协作或真实部署前必须补齐。
- 当前数据仍以本地文件持久化为主，后续进入多用户、并发、报表统计时应迁移数据库。
- Semgrep 使用社区规则集，不能替代完整人工源码审计和业务安全审查。
- 当前页面访问验证是 HTTP 200 与测试层验证，没有做完整浏览器视觉回归。

当前阶段结论：
- P2.4-D 已完成。
- P2 阶段可以收口。
- 项目已经具备一个可演示的“规则中心 + 真实 GEO 监测 + 证据复核 + 基础报表”后台雏形。
- 下一阶段建议进入 P3.0：GEO 运营报告 / 周报生成，把规则中心、监测记录、证据复核和报表指标整合成可展示、可导出的业务成果。

### 2026-09-11｜P3.0-A 完成记录：GEO 运营报告预览最小闭环

阶段目标：
- 把 P2 阶段的真实 GEO 监测记录整理成可展示的运营报告雏形。
- 不调用 AI，不做 PDF / Word 导出，不接入自动查询，不承诺排名。
- 先用规则生成关键发现，确保报告内容可解释、可测试、可控。

本次完成：
- 在 `/geo-monitor/report` 的报表区域新增“GEO 运营报告预览”。
- 报告只统计 `manual` / `real` 数据，不把 Mock 数据包装成真实 GEO 成果。
- 新增报告基础指标：
  - 报告周期。
  - 查询记录数。
  - 已确认数量。
  - 待复核数量。
  - 需补证 / 已驳回数量。
  - 品牌提及率。
  - 页面检索率。
  - 来源引用率。
- 新增“关键发现”规则摘要：
  - 品牌提及率高 / 低。
  - 来源引用偏少 / 表现较好。
  - 页面检索率低于品牌提及时提醒“AI 可能知道品牌，但未稳定检索目标页面”。
  - 存在待复核、需补证、已驳回记录时提醒正式汇报前处理证据状态。
- 新增“报告边界”提示：
  - 当前数据来自人工录入或真实复核记录。
  - 不代表 AI 平台排名承诺。
  - 不等同于稳定收录或持续引用。
- 新增无真实记录时的空状态：
  - 提示暂无可生成报告的真实 GEO 监测记录。
  - 引导先到监测记录页录入人工或真实查询结果。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
- `flowpilot-ai/frontend/__tests__/p3-0-geo-report-preview.test.tsx`

TDD 记录：
- RED：
  - 先新增 P3.0-A 报告预览测试。
  - 初次运行失败，原因是组件尚无“GEO 运营报告预览”语义区域、关键发现和空状态。
- GREEN：
  - 实现报告预览、指标卡、关键发现、报告边界和空状态后，目标测试通过。
- 测试调整：
  - 页面检索率和来源引用率可能出现相同百分比，例如都是 `33%`。
  - 测试从单一文本匹配改为 `getAllByText("33%")`，避免错误假设百分比唯一。

验证结果：
- [x] P3.0-A 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx`
  - 结果：`1 passed / 2 tests passed`
- [x] GEO 报表相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-4-record-filters-pagination.test.tsx`
  - 结果：`4 passed / 7 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`14 passed / 44 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- 现有 `OverviewMetric` 组件显示的是数字值，不带 `%`。报告语境下百分比必须明确，因此本次没有修改全局组件，而是使用报告专用指标卡。
- 测试中 `33%` 出现两次是合理业务结果，不能假设每个指标数值唯一。
- PowerShell 中 `try/catch` 直接接管道容易出现空管道语法错误，后续应先赋值再输出。

避免方法：
- 报告页指标使用语义清晰的文案，百分比必须显式带 `%`。
- 测试页面指标时，如果数值可能重复，使用语义区域或 `getAllByText`，不要依赖唯一文本。
- PowerShell 验证命令统一采用 `$result = try { ... } catch { ... }; $result | Format-List`。

潜在风险点：
- 当前关键发现是规则生成，不是 AI 生成，因此表达稳定但不够灵活。
- 当前报告只是页面预览，尚未支持 Markdown / Word / PDF 导出。
- 当前没有选择报告周期，默认根据所有真实 / 人工记录自动计算。
- 当前没有按任务、品牌、AI 平台筛选报告范围。
- 当前报告没有持久化为独立报告实体，刷新后仍依赖现有监测记录实时计算。
- 当前没有完整视觉回归测试，仅验证了组件行为、构建和页面 200。

当前阶段结论：
- P3.0-A 已完成。
- 项目已经从“监测后台”向“可汇报业务成果”迈出第一步。
- 下一小阶段建议进入 P3.0-B：报告范围筛选与报告生成入口，例如按任务、AI 平台、复核状态生成一份更明确的 GEO 周报。

### 2026-09-11｜P3.0-B 完成记录：报告范围筛选与生成入口

阶段目标：
- 在 P3.0-A 的报告预览基础上，增加“报告生成范围”操作区。
- 允许运营人员先选择统计范围，再生成当前范围下的报告预览。
- 保持前端最小闭环，不新增后端报告实体，不做导出，不调用 AI。

本次完成：
- 在 `/geo-monitor/report` 新增“报告生成范围”区域。
- 支持按 AI 平台筛选报告范围。
- 支持按复核状态筛选报告范围：
  - 全部状态。
  - 已确认。
  - 待复核。
  - 需补证。
  - 已驳回。
- 支持按最低证据等级筛选报告范围：
  - 证据等级 ≥ 0 / 1 / 2 / 3 / 4。
- 新增“生成当前范围报告”按钮。
- 点击生成后，报告预览才应用当前筛选条件。
- 生成后展示当前报告范围摘要，例如：
  - `范围：DeepSeek / 已确认 / 证据等级 ≥ 4`
- 当前筛选范围没有记录时，展示空状态：
  - 当前筛选范围内暂无可生成报告的记录。
  - 提示放宽筛选条件或补充真实 / 人工 GEO 监测记录。
- 保留 P3.0-A 的报告边界提示，继续强调不承诺排名、收录或持续引用。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
- `flowpilot-ai/frontend/__tests__/p3-0-geo-report-preview.test.tsx`

TDD 记录：
- RED：
  - 先新增 P3.0-B 报告筛选测试。
  - 初次运行失败，原因是页面尚无“报告生成范围”区域。
- GREEN：
  - 实现 AI 平台、复核状态、最低证据等级筛选，以及“生成当前范围报告”按钮后，目标测试通过。
- 测试重点：
  - 选择 `DeepSeek`。
  - 选择 `已确认`。
  - 选择 `证据等级 ≥ 4`。
  - 点击生成报告。
  - 验证报告范围摘要、记录数和 100% 指标。

验证结果：
- [x] P3.0-B 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx`
  - 结果：`1 passed / 3 tests passed`
- [x] GEO 报表相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-4-record-filters-pagination.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`5 passed / 13 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`14 passed / 45 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- 如果筛选项一改变就自动刷新报告，用户很难区分“正在编辑筛选条件”和“已经生成报告”。因此本次保留草稿筛选与已应用筛选两套状态。
- 复核状态同时存在 `review_status_code` 和中文 `manual_review_status`，需要做归一化，避免不同来源数据筛选结果不一致。

避免方法：
- 报告类页面采用“草稿条件 → 点击生成 → 应用条件”的交互，不让报告在用户编辑筛选时不停变化。
- 复核状态统一通过归一化函数处理，后续不要在多个组件里散落硬编码判断。
- 如果后续继续扩展筛选条件，应优先抽出独立的报告筛选工具函数或 hooks，避免报表组件继续膨胀。

潜在风险点：
- 当前筛选仍然是前端本地计算，数据量较大后需要后端查询参数。
- 当前报告没有持久化，点击生成只是前端应用筛选条件，不会形成历史报告记录。
- 当前没有按任务 / 品牌 / 日期范围筛选，下一阶段如果做周报，应补齐这些关键条件。
- 当前没有导出能力，仍然只能在页面内查看。
- 当前没有权限控制，任何可访问页面的用户都能查看报告数据。

当前阶段结论：
- P3.0-B 已完成。
- 报告页已经具备“选择范围 → 生成当前范围报告 → 查看指标与关键发现”的最小闭环。
- 下一小阶段建议进入 P3.0-C：增加日期范围 / 任务范围筛选，或者进入 P3.1：Markdown 周报导出。

### 2026-09-11｜P3.0-C 完成记录：任务范围与日期范围筛选

阶段目标：
- 在 P3.0-B 的报告范围筛选基础上，补齐周报所需的关键范围条件。
- 支持按监测任务和查询日期范围生成报告。
- 保持前端最小闭环，不新增后端报告实体，不做导出，不调用 AI。

本次完成：
- 报表组件接收 `sessions` 数据，用于展示监测任务名称。
- `/geo-monitor/report` 的“报告生成范围”新增：
  - 报告监测任务。
  - 开始日期。
  - 结束日期。
- 支持按监测任务筛选报告记录。
- 支持按 `checked_at` 的日期部分筛选报告记录。
- 范围摘要只在用户选择对应条件后追加任务和日期，不让默认文案变得冗长。
- 当用户选择任务和日期后，范围摘要示例：
  - `范围：全部平台 / 全部状态 / 证据等级 ≥ 0 / 武汉智能沙盘周报任务 / 2026-09-05 至 2026-09-11`
- 更新 `GeoMonitorWorkspace`，在报表页向 `GeoMonitorReportPanel` 传入 sessions。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
- `flowpilot-ai/frontend/app/geo-monitor/geo-monitor-workspace.tsx`
- `flowpilot-ai/frontend/__tests__/p3-0-geo-report-preview.test.tsx`

TDD 记录：
- RED：
  - 先新增 P3.0-C 任务和日期范围筛选测试。
  - 初次运行失败，原因是页面没有“报告监测任务”筛选项。
- GREEN：
  - 实现任务筛选、开始日期、结束日期、任务名称范围摘要后，目标测试通过。
- 过程中发现的问题：
  - 筛选已经生效，但范围摘要没有显示。
  - 原因是 `areDefaultFilters` 只判断了 P3.0-B 的旧字段，没有判断 `sessionId`、`startDate`、`endDate`。
  - 已补齐默认筛选判断。

验证结果：
- [x] P3.0-C 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx`
  - 结果：`1 passed / 4 tests passed`
- [x] GEO 报表相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-4-record-filters-pagination.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`5 passed / 14 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`14 passed / 46 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- 报表组件原来只接收 records，无法展示任务名称，只能用 session_id。为避免报告范围对用户不友好，已让组件接收 sessions。
- 新增筛选字段后，旧的“是否应用筛选”判断容易漏字段。
- 日期筛选当前基于字符串格式 `YYYY-MM-DD` 比较，依赖 `checked_at` 前 10 位是标准日期。

避免方法：
- 后续新增筛选字段时，必须同步更新：
  - 默认筛选对象。
  - 筛选函数。
  - 范围摘要。
  - 是否默认筛选判断。
  - 测试数据。
- 报告范围展示优先使用用户可读名称，例如任务名称，不直接暴露内部 ID。
- 后续如果日期格式来源变复杂，应抽出统一日期解析工具，避免在组件里直接切字符串。

潜在风险点：
- 当前日期筛选仍在前端完成，数据量大后应下沉到后端。
- 当前没有校验开始日期晚于结束日期的情况。
- 当前日期筛选只按 `checked_at` 日期，不支持创建日期、复核日期等其他时间维度。
- 当前任务筛选依赖 sessions 数据完整，如果记录引用了不存在的 session，只能按 ID 兜底。
- 当前报告仍未持久化，无法形成历史周报。
- 当前还没有 Markdown / Word / PDF 导出。

当前阶段结论：
- P3.0-C 已完成。
- 报告页现在具备按任务、AI 平台、复核状态、证据等级、日期范围生成报告预览的能力。
- 下一小阶段建议进入 P3.1：Markdown 周报导出，把页面报告变成可以复制到简历项目说明、工作汇报或公众号内部复盘的文本成果。

### 2026-09-11｜P3.1 完成记录：Markdown 周报导出

阶段目标：
- 将当前报告范围下的 GEO 运营报告转成可复制的 Markdown 周报文本。
- 先做前端可复制文本预览，不做 Word / PDF，不做下载文件，不做后端持久化。
- 服务真实工作场景：周报、复盘、简历项目说明、业务案例沉淀。

本次完成：
- 在 `/geo-monitor/report` 新增“Markdown 周报导出”区域。
- 新增“生成 Markdown 周报”按钮。
- 点击后根据当前已应用的报告范围生成 Markdown 文本。
- Markdown 内容包含：
  - `# GEO 运营周报`
  - 报告范围。
  - 报告周期。
  - 统计范围。
  - 查询记录数。
  - 已确认 / 待复核 / 需补证 / 已驳回。
  - 品牌提及率。
  - 页面检索率。
  - 来源引用率。
  - 关键发现。
  - 报告边界。
- Markdown 文本使用只读 textarea 展示，方便用户复制。
- 当前报告范围重新生成后，会清空旧 Markdown，避免复制过期周报。
- 当筛选范围内没有记录时，导出按钮禁用。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
- `flowpilot-ai/frontend/__tests__/p3-0-geo-report-preview.test.tsx`

TDD 记录：
- RED：
  - 先新增 Markdown 周报导出测试。
  - 初次运行失败，原因是页面没有“生成 Markdown 周报”按钮。
- GREEN：
  - 实现 Markdown 导出区域、按钮、只读文本框和 Markdown 生成函数后，目标测试通过。
- 测试重点：
  - 先选择任务和日期范围。
  - 点击“生成当前范围报告”。
  - 再点击“生成 Markdown 周报”。
  - 验证 Markdown 中包含标题、报告范围、核心指标、关键发现和报告边界。

验证结果：
- [x] P3.1 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx`
  - 结果：`1 passed / 5 tests passed`
- [x] GEO 报表相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-4-record-filters-pagination.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`5 passed / 15 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`14 passed / 47 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor/report` 返回 200

本次遇到的问题：
- Markdown 导出不能直接复用页面 JSX，需要单独生成纯文本结构。
- 如果用户修改报告范围后不清空旧 Markdown，容易复制到过期内容。
- 当前 textarea 只能展示和复制，不具备“一键复制到剪贴板”的交互。

避免方法：
- 报告文本生成逻辑用独立纯函数维护，不把 Markdown 拼接散落在 JSX 中。
- 任何会改变报告范围的操作，都清空旧 Markdown。
- 后续若加一键复制，需要处理 Clipboard API 权限失败和浏览器兼容性。

潜在风险点：
- 当前 Markdown 只在前端即时生成，没有保存历史版本。
- 当前没有下载 `.md` 文件功能。
- 当前没有一键复制按钮。
- 当前 Markdown 内容为规则模板，不是 AI 润色版，因此更稳定但表达不够灵活。
- 当前没有对 Markdown 内容进行字段脱敏，后续如果包含客户敏感信息，需要增加脱敏策略。
- 当前没有后端导出接口，多人协作或审计场景下需要后端生成并记录导出行为。

当前阶段结论：
- P3.1 已完成。
- 报告页已经从“可看”进化到“可复制、可汇报、可沉淀”。
- 下一小阶段建议进入 P3.2：一键复制 Markdown + 日期范围校验，或进入 P4：GEO Research 选题 / 实体 / 问题图谱。

### 2026-09-11｜P3.2 完成记录：一键复制 Markdown + 日期范围校验

阶段目标：
- 在 P3.1 Markdown 周报导出的基础上，补齐更贴近日常使用的两个小闭环：
  - 日期范围输入错误时阻止生成报告。
  - Markdown 周报生成后支持一键复制到剪贴板。
- 继续保持前端最小闭环，不新增后端报表实体，不做下载文件，不调用 AI。

本次完成：
- 在 `/geo-monitor/report` 报告范围筛选中增加日期合法性校验。
- 当开始日期晚于结束日期时：
  - 阻止应用当前筛选条件。
  - 显示错误提示：`开始日期不能晚于结束日期`。
  - 不展示“已按当前筛选条件生成报告”的成功提示。
- 在 Markdown 周报生成后显示 `复制 Markdown` 按钮。
- 点击复制后调用浏览器 Clipboard API，将当前 Markdown 周报内容写入剪贴板。
- 复制成功后显示：`已复制 Markdown 周报`。
- Clipboard API 不可用或复制失败时显示：`复制失败，请手动复制 Markdown 内容`。
- 重新生成报告范围或重新生成 Markdown 时，清理旧的复制状态，避免误导用户。

涉及文件：
- `flowpilot-ai/frontend/app/geo-monitor/components/geo-monitor-report-panel.tsx`
- `flowpilot-ai/frontend/__tests__/p3-0-geo-report-preview.test.tsx`

TDD 记录：
- RED：
  - 先新增日期范围失败测试。
  - 先新增 Markdown 一键复制测试。
  - 初次运行失败符合预期：
    - 页面尚未显示 `开始日期不能晚于结束日期`。
    - 页面尚未提供 `复制 Markdown` 按钮。
- GREEN：
  - 实现日期范围校验、Clipboard 复制、成功 / 失败反馈后，目标测试通过。
- 测试重点：
  - 输入开始日期 `2026-09-11`、结束日期 `2026-09-05`，点击生成报告后应出现错误提示。
  - 无效日期不应进入成功应用状态。
  - 生成 Markdown 周报后，点击 `复制 Markdown` 应调用 `navigator.clipboard.writeText`。
  - 复制成功后应显示成功反馈。

验证结果：
- [x] P3.2 目标测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx`
  - 结果：`1 passed / 7 tests passed`
- [x] GEO 报表相关回归测试通过：
  - 命令：`npm.cmd run test -- --run __tests__/p3-0-geo-report-preview.test.tsx __tests__/p2-4-geo-routing.test.tsx __tests__/p2-4-component-boundaries.test.ts __tests__/p2-4-record-filters-pagination.test.tsx __tests__/p2-0-1-layout-usability.test.tsx`
  - 结果：`5 passed / 17 tests passed`
- [x] 前端全量测试通过：
  - 命令：`npm.cmd run test -- --run`
  - 结果：`14 passed / 49 tests passed`
- [x] 前端生产构建通过：
  - 命令：`npm.cmd run build`
  - 结果：Next 成功构建 `/`、`/rules`、`/geo-monitor`、`/geo-monitor/sessions`、`/geo-monitor/records`、`/geo-monitor/review`、`/geo-monitor/report`
- [x] 本地页面访问验证通过：
  - `/geo-monitor/report` 返回 200。

本次遇到的问题：
- 日期范围原本只参与记录筛选，没有输入合法性校验，用户可能生成明显错误的时间范围报告。
- Markdown 周报虽然可以在 textarea 内手动复制，但缺少一键复制，实际汇报场景仍然不够顺手。
- Clipboard API 在测试环境中需要显式 mock，否则无法稳定验证复制行为。

避免方法：
- 涉及日期区间、数值区间、范围选择的功能，必须在应用筛选前先做合法性校验。
- 可复制内容不要只依赖 textarea 手动操作，应优先提供明确的一键复制动作和成功 / 失败反馈。
- 依赖浏览器能力的功能必须在测试中 mock 外部 API，避免测试依赖真实浏览器权限。
- 所有改变报告范围的操作都要清空旧导出内容或旧复制状态，避免用户复制过期周报。

潜在风险点：
- Clipboard API 可能在非安全上下文、权限受限浏览器或部分内嵌环境中失败；当前已有失败提示，但尚未实现传统 `select + execCommand` 兜底。
- 日期校验仍然是前端校验；后续如果增加后端报表生成接口，后端必须再次校验开始 / 结束日期。
- 当前只支持复制 Markdown 文本，没有 `.md` 文件下载。
- 当前周报没有后端持久化和导出审计记录，不适合多人协作或正式审计场景。
- 当前复制成功状态只在页面内即时显示，不会保存到历史记录。

当前阶段结论：
- P3.2 已完成。
- 报告页现在具备“选择范围 → 校验范围 → 生成报告 → 生成 Markdown → 一键复制”的最小可用闭环。
- 下一小阶段建议进入 P3.3：`.md` 文件下载与报告快照记录；如果要转向内容增长主线，也可以进入 P4：GEO Research 选题 / 实体 / 问题图谱。


---

> 说明：自 2026-09-12 起，原 §17「P0–P4 计划与完成记录」与「UI 相关完成记录」
> 已拆分至 `FlowPilot_AI_P0-P4记录.md` 与 `FlowPilot_AI_UI完成记录.md` 两个独立文件。
> 本文档仅保留 §15 进度记录与 §16 GEO- 历史吸收计划。
