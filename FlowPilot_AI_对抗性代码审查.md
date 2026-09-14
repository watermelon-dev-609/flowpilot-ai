# FlowPilot AI 对抗性代码审查报告

> 审查视角：假设审查者持「破坏者」立场，专门寻找真实会触发问题的逻辑缺陷、信任边界绕过、安全漏洞与一致性错误，**不是**确认功能可跑。
> 审查范围：`backend/app/`（FastAPI，5 个文件）+ `frontend/app/`（Next.js App Router）。
> 结论：当前代码**能跑**，但在「信任边界」「安全」「数据真实性」三方面存在可被利用的真实缺陷，且多个缺陷与主项目反复强调的「不用虚假数据冒充真实」原则直接自相矛盾。

---

## 严重程度总览

| 级别 | 数量 | 代表问题 |
|---|---|---|
| 🔴 阻断/严重 | 4 | SSRF、无鉴权、evidence_level 客户端可控、data_mode 信任边界绕过 |
| 🟠 高 | 2 | mock 数据污染真实统计、首页硬编码假指标 |
| 🟡 中 | 4 | 记录可挂到 mock 会话、多 worker 状态不共享、无请求超时、revokeObjectURL 竞态 |
| 🟢 低 | 5 | actor 可伪造、无 body 大小限制、陈旧构建日志等 |

---

## 🔴 严重

### S1. SSRF：服务端对任意客户端 URL 发起出站请求（无内网/元数据防护）
- **位置**：`backend/app/rule_store.py:269-305`（`check_source_review_url`），经 `POST /api/rule-source-reviews/{review_id}/source-url-check`（无请求体）
- **触发**：攻击者提交 `proposed_source_url` 为任意 http/https 地址，后端用 `http.client` 直接发 HEAD 请求。
- **问题**：
  - 仅校验 `scheme ∈ {http,https}` 且 `netloc` 非空，**不校验目标是否为内网/回环/链路本地地址** → 可打 `http://169.254.169.254/`（云元数据）、`http://localhost:8000/admin`、`http://10.x/`、`http://127.0.0.1:6379` 等。
  - 不做 DNS rebinding 防护。
  - 响应体不回传，但 `status_code`/是否可达会回传 → **盲 SSRF**，可探测内网端口与可达性。
  - 该接口**无鉴权**（见 S2），任何能访问服务的人都能触发。
- **影响**：内网横向探测、云凭据窃取、把本服务当攻击跳板。
- **建议**：解析域名取 IP，拒绝 `loopback / private / link-local / reserved` 段（或维护出站域名白名单）；默认关闭该检查；加超时已在（3s），但需异步化（见 M3）。

### S2. 后端全部接口无鉴权 / 无授权
- **位置**：`backend/app/main.py`（全部路由），store 层无任何 auth 依赖。
- **问题**：所有读/写/状态变更（创建规则、确认、过期、来源复核、创建监测记录、复核、以及上面的 SSRF 触发点）都对任意调用方开放。rule_id/review_id 虽是 UUID 难猜，但**没有身份与权限模型**，且 `actor` 字段由客户端随意填（见 L1）。
- **影响**：未授权篡改规则与监测数据，结合 S1 形成「无认证 SSRF 触发」。
- **建议**：至少给变更类接口加认证；或明确这是仅限本机 `127.0.0.1` 的 P0 骨架并在部署前强制加 auth。当前 `CORS allow_credentials=True` 也表明曾考虑凭证，但后端没有消费方。

### S3. 核心信任指标 `evidence_level` 完全由客户端控制
- **位置**：`backend/app/geo_store.py:256-265`（`_calculate_evidence_level`）+ `create_record` 的校验 `:118-119`
- **问题**：`evidence_level` 由 4 个布尔（`source_cited/page_retrieved/brand_mentioned/related_concept_found`）直接算出，这些布尔全部来自客户端请求体。要把等级刷到最高（4 = 来源被引用），只需 `source_cited=true` 并附带任意 `target_url` 和一行 `raw_response` 即可（校验仅要求非空字符串）。
- **影响**：这是产品最核心的「证据等级」指标，可在**零真实证据**下被任意伪造为最高级；概览、报表、会话最高等级都据此展示。
- **建议**：`evidence_level` 不应直接等于客户端声明；应作为「待核验声明」，仅在人工 `verified` 复核后由服务端按证据（真实 URL 可达性 + 原始响应匹配）推导，或至少与 `review_status` 强绑定展示。

### S4. `data_mode`（mock/real 信任边界）由客户端直接下发，可绕过「mock 不计入真实」
- **位置**：`RuleCreateRequest.data_mode`（`rule_store.py:31`）、`GeoMonitorSessionCreateRequest`/`GeoMonitorRecordCreateRequest.data_mode`（`geo_store.py:22,40`）；前端 `flowpilot-api.ts` 的 create payload 同样直接带 `data_mode`。
- **问题**：`confirm_rule` 只拦 `data_mode=="mock"`（`:143`），但客户端创建规则时可**直接传 `data_mode="real"`**，既绕过了 mock 守卫，也不需要任何来源/置信度证明。监测记录同理：`create_record` 接受 `data_mode="real"` 且 `evidence_level` 自定。
- **影响**：攻击者可将伪造数据标为「真实」，直接污染「真实效果」统计与首页/概览指标，违背产品规则「示例数据不计入真实监测效果」。
- **建议**：`data_mode` 由服务端按数据来源/确认流程赋值，客户端不可直接指定为 `real`；真实数据必须经过来源复核 + 人工确认链路。

---

## 🟠 高

### H1. mock 数据污染「真实」统计
- **位置（后端）**：`geo_store.py:80-83` `list_sessions` 对 `self._records.values()` 全量算 `highest_evidence_level`/`total_records`，**包含 mock 记录**。`_load_persistent_data` 只过滤会话/记录自身的 `data_mode`，但内存态会话统计仍混合 mock 记录。
- **位置（前端）**：`geo-monitor-overview-panel.tsx:50-52`：
  - `highestEvidenceLevel = Math.max(...records.map(r => r.evidence_level), 0)` 用**全量 records（含 mock）**，而隔壁 `realRecords`（`:49`）只用于「真实/人工记录」那一张卡——**同一面板里有的卡过滤、有的不过滤**。
  - `pendingReview`（`:51`）用 `records`（全量，含 mock 的 `待复核`）。
  - `citedRecords`（`:52`）用 `records`（全量）。
- **矛盾**：该面板标题是「真实证据总览」，且同文件 `:21` 明晃晃挂了「示例数据不计入真实监测效果」的徽标，但最高证据等级/待复核数/被引用数都用 mock 算出来。mock 种子里 `geo-rec-p1-mock-003` 的 `evidence_level=4`，会令概览「最高证据等级」恒为 4。
- **影响**：向用户展示被示例数据抬高/污染的「真实」指标，与产品核心原则自相矛盾（也违反 S4 的信任边界）。
- **建议**：所有聚合在 `data_mode !== "mock"` 过滤后再算；前端与后端口径统一。

### H2. 首页运营指标是写死的假数字
- **位置**：`frontend/app/page.tsx:31-36` `operationMetrics`：`待复核规则=6`、`监测任务=3`、`监测记录=18`、`最高证据等级=4`，比例 `0.5/0.35/0.9/1` 全是字面量，不来自任何接口。
- **矛盾**：同页 `:206` 写着「不用虚假数据冒充真实」、`:207` 写着「真实数据隔离」，首页却直接展示硬编码的伪造指标。
- **影响**：首页作为「今日运营工作台」，向用户呈现不存在的运营数据，且这些数字会与真实接口数据严重不一致。
- **建议**：接 `loadRulesSnapshot` / `loadGeoMonitorSnapshot` 实时计算，或明确标注为「演示占位」并移除 `ratio` 等伪装成真实占比的数字。
- **备注**：该问题在上一轮审查已记录为 bug #3，至今未修。

---

## 🟡 中

### M1. 监测记录可挂到 mock 会话，污染示例会话并持久化
- **位置**：`geo_store.py:115-116` `create_record` 只校验 `session_id in self._sessions`，而 mock 种子会话（如 `geo-mon-p1-mock-001`）也存在于内存，因此可用 `data_mode="manual"` 的记录挂到 mock 会话上。
- **影响**：该 mock 会话的 `total_records`/`highest_evidence_level`（`list_sessions` 实时算）被真实记录抬高；重启后该 manual 记录被持久化、重新挂到重新播种的 mock 会话，污染长期存在。
- **建议**：拒绝 `data_mode != session.data_mode` 的记录，或禁止向 `data_mode=="mock"` 的会话写入非 mock 记录。

### M2. JSON 文件持久化不是并发安全的，且多 worker 状态不共享
- **位置**：`rule_store.py:387-402`、`geo_store.py:240-254`；两者都是模块级单例 `rule_store = RuleStore()` / `geo_monitor_store = GeoMonitorStore()`。
- **问题**：
  - 每个 uvicorn worker 有**独立内存态**；多 worker 部署时，A worker 写入的数据 B worker 看不到，且都向**同一文件** `replace()`，后写覆盖先写 → 丢数据。
  - 写文件无文件锁，并发 `_save_persistent_rules` 可能互相覆盖临时文件。
- **影响**：生产多进程部署下数据丢失/不一致；当前 `next-p2-3` 本地多为单进程故未暴露。
- **建议**：改用真正的数据库或外部 KV；若坚持文件，需单写者 + 文件锁，且进程间通过共享存储同步。

### M3. 前端 fetch 无超时 / 无 AbortController
- **位置**：`flowpilot-api.ts:211-229` `fetchJson`。
- **问题**：`fetch` 无 `signal`，后端若卡住（尤其 S1 的 3s 出站请求、或后端 8000 挂掉）UI 会无限等待；无统一的网络错误类型区分。
- **建议**：封装 `AbortController` + 超时（如 10s），超时给出明确可重试错误。

### M4. `URL.revokeObjectURL` 在 `link.click()` 后立即调用，下载会失败
- **位置**：`geo-monitor-report-panel.tsx:147-152`、`content-adaptation-workspace.tsx:149-154`。
- **问题**：`createObjectURL` 后同步 `revokeObjectURL`，部分浏览器（尤其 Firefox）在下载尚未开始时 URL 已失效，导致文件下载失败。
- **建议**：`link.addEventListener('click', () => URL.revokeObjectURL(url), { once: true })` 或在 `setTimeout` 后回收。

---

## 🟢 低

- **L1. `actor` 字段可伪造、审计日志不可信**：`rule_store.py`/`geo_store.py` 的 `actor` 来自请求体，无认证前提下审计记录无归因意义（S2 的连带后果）。
- **L2. 请求体无大小限制**：FastAPI 默认不限 body 大小，可提交超大 `rule_summary`/`raw_response` 耗内存（轻量 DoS）。
- **L3. SSRF 检查同步阻塞且无速率限制**：`check_source_review_url` 在请求链路内同步阻塞 3s，无限流；无认证下可被刷成大量出站请求（SSRF 放大 / DoS）。
- **L4. 真实规则置信度下限无强制**：`create_rule` 允许 `data_mode="real"` 且 `confidence` 低至 0、无 `source_url`，仍按「真实」展示（S4 连带）。
- **L5. 陈旧构建日志 `next-p2-3.err.log` 含 `module not found`**：日志显示 `./geo-monitor-workspace` 等解析失败，但**当前源码导入语句与文件完全匹配**（`app/geo-monitor/page.tsx:2` → 文件存在）。判定为陈旧 `.next` 缓存/旧构建产物，非当前源码缺陷；建议 `rm -rf .next && npm run build` 确认，不要据此误判构建已坏。

---

## 横向结论

1. **信任边界整体外泄**：产品反复声明「mock 不计入真实」「不造假数据」，但 `data_mode` 客户端可控（S4）、`evidence_level` 客户端可控（S3）、mock 参与真实聚合（H1）、首页直接硬编码假数（H2）——**原则在代码层没有强制，只是 UI 文案**。这是最高优先级要修的一族问题。
2. **安全层面最该先堵的是 S1（SSRF）+ S2（无鉴权）**：一个无认证的端点能让外部对任意内网地址发请求，危害最大且修复成本不高。
3. **工程健壮性**：M2（多 worker 状态）、M3（超时）、M4（下载）属于「现在能跑、规模化会炸」的隐患，建议在进入 P3/P4 前处理。

## 已确认非问题（避免误报）
- `content-adaptation-workspace.tsx` 的 3 处 `JSON.parse`（`:502/525/568`）**均已包 `try/catch`**，脏 localStorage 会被清空并返回默认值，不会崩。
- `geo-monitor-workspace.tsx` 的「加载期提交覆盖用户输入」竞态在当前版本已用独立表单 state + 全量快照覆盖修复，不再复现。
- 未发现 `dangerouslySetInnerHTML` / `eval` / `innerHTML` / `new Function`，React 默认转义可挡住数据字段型 XSS。
