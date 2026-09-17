# FlowPilot AI · 数据模型设计（S1.1）

> 制定时间：2026-09-15
> 最近更新：2026-09-17
> 适用范围：S1 数据层正规化。本阶段**只迁移 `content_calendar`**（数据量最小、测试最全），跑通后再迁 `rules` 与 `geo_monitor`。
> 相关：`FlowPilot_AI_后续开发计划.md` §3

---

## 1. 设计目标与约束

### 1.1 目标

1. 把 `content_calendar` 从本地 JSON 迁移到关系型数据库。
2. 提供 Repository 抽象层，使存储实现可替换。
3. **为后续 `rules` / `geo_monitor` 迁移建立可复用的模式**。

### 1.2 硬约束

| 约束 | 说明 |
|---|---|
| **接口契约不变** | 现有 4 个 `content_calendar` 测试**不允许修改任何断言**即通过 |
| **PG 优先，SQLite 兜底** | 当前环境无 PG，用 SQLite 跑通测试与迁移逻辑；PG 连接串就绪后零代码切换 |
| **保留 JSON 双读过渡** | 数据库不可用时自动降级回本地 JSON，保证离线 Demo 不断 |
| **保留 `data_mode` 隔离** | `mock` / `demo` / `manual` / `real` 字段必须在数据库层保留 |
| **业务逻辑与 IO 分离** | 业务规则写成纯逻辑，数据库读写隔离在 Repository 层 |

### 1.3 非目标（本阶段不做）

- 不迁移 `rules` 与 `geo_monitor`。
- 不做数据库级鉴权（属 S2）。
- 不引入连接池调优、读写分离、分库分表等超前提案（YAGNI）。

---

## 2. 表结构设计

### 2.1 `content_calendar_plans`（内容计划主表）

| 字段 | 类型 | 约束 | 来源 | 说明 |
|---|---|---|---|---|
| `id` | VARCHAR(64) | PK | `plan["id"]` | 形如 `content-plan-{12位hex}` |
| `topic_title` | VARCHAR(500) | NOT NULL | `topic_title` | 选题标题 |
| `platform` | VARCHAR(50) | NOT NULL | `platform` | 平台名（知乎/公众号等） |
| `brand_name` | VARCHAR(200) | NOT NULL | `brand_name` | 品牌名 |
| `product_name` | VARCHAR(200) | NOT NULL | `product_name` | 产品名 |
| `region` | VARCHAR(100) | NOT NULL | `region` | 目标地域 |
| `target_audience` | VARCHAR(200) | NOT NULL | `target_audience` | 目标受众 |
| `facts` | TEXT | NOT NULL | `facts` | 可确认事实 |
| `overall_score` | INTEGER | NOT NULL, CHECK 0-100 | `overall_score` | 综合评分 |
| `status` | VARCHAR(20) | NOT NULL | `status` | 待适配/适配中/已生成/已作废 |
| `content_stage` | VARCHAR(20) | NOT NULL | `content_stage` | 待生产/生产中/待审核/已完成 |
| `priority` | VARCHAR(10) | NOT NULL | `priority` | 高/中/低 |
| `owner` | VARCHAR(100) | DEFAULT '' | `owner` | 负责人，空串代表未分配 |
| `scheduled_at` | VARCHAR(40) | NULLABLE | `scheduled_at` | 计划时间，**保留原字符串格式** |
| `data_mode` | VARCHAR(10) | NOT NULL | `data_mode` | mock/demo/manual/real |
| `created_at` | VARCHAR(40) | NOT NULL | `created_at` | 创建时间 |
| `updated_at` | VARCHAR(40) | NOT NULL | — | 新增，数据库维护 |

### 2.2 `content_plan_audit_logs`（审计日志表）

| 字段 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INTEGER | PK, AUTOINCREMENT | 自增主键 |
| `plan_id` | VARCHAR(64) | FK → plans.id, ON DELETE CASCADE | 关联计划 |
| `action` | VARCHAR(50) | NOT NULL | `created` / `plan_updated` |
| `actor` | VARCHAR(100) | NOT NULL | 操作人 |
| `summary` | VARCHAR(500) | NOT NULL | 操作摘要 |
| `at` | VARCHAR(40) | NOT NULL | 操作时间 |

> 审计表**只追加不更新不删除**，符合用户编码规范「变更可追踪」。

### 2.3 索引设计

```text
idx_plans_status          (status)
idx_plans_platform        (platform)
idx_plans_owner           (owner)
idx_plans_priority        (priority)
idx_plans_scheduled_at    (scheduled_at)
idx_audit_plan_id         (plan_id)
```

**理由**：`list_plans` 的筛选条件恰好命中 status / platform / owner / priority / 日期范围，
排序方式命中 `scheduled_at` 与 `overall_score`。索引与真实查询路径对齐。

---

## 3. 关键设计决策

### 3.1 为什么时间字段用 VARCHAR 而不是 TIMESTAMP？

现有 JSON 契约中 `scheduled_at` 形如 `"2026-09-20T10:00:00.000Z"`（带毫秒与 Z），
`created_at` 形如 `"2026-09-15T15:30:00"`（无毫秒无时区）。**两者格式不统一**。

若改用 `TIMESTAMP`，需要在读写两侧做格式转换，且现有测试断言的是**原始字符串**：

```python
assert persisted["scheduled_at"] == "2026-09-25T10:00:00.000Z"
```

**决策：本阶段保留 VARCHAR 存储原字符串。**

理由：
- 满足「现有测试不改即通过」的硬约束。
- 避免引入时区转换的隐性 bug（本地时区 vs UTC）。
- 迁移风险最小。**格式统一应作为独立技术债单独处理**，不混在迁移里做。

> ⚠️ 遗留风险：字符串比较在 ISO 8601 格式下恰好等于时间比较，但这是**依赖格式的巧合**。
> 已列入 §5 风险清单，后续统一格式时应改为真正的 `TIMESTAMP`。

### 3.2 为什么 `owner` 用空串而不是 NULL？

现有筛选逻辑：

```python
and (not owner or (plan.get("owner") or "未分配") == owner)
```

空串与 NULL 在此处语义等价（都会被 `or "未分配"` 兜住）。
选择 `DEFAULT ''` 而非 NULLABLE 是为了**与现有 JSON 行为完全一致**，避免 NULL 参与比较时出现三值逻辑差异。

### 3.3 为什么审计日志独立成表？

原 JSON 实现中 `audit_log` 是内嵌在 plan 对象里的数组：

```python
"audit_log": [self._audit_entry("created", payload.actor, "内容计划已创建", now)]
```

**这是 JSON 时代的妥协**——关系型数据库中内嵌数组违反第一范式，且无法按时间/操作人索引查询。

独立成表后：
- 可独立索引查询（如"查某人所有操作"）。
- 只追加不改，天然满足审计要求。
- Repository 层负责在读取时**组装回原 JSON 结构**，对外契约不变。

### 3.4 并发与竞态处理

用户编码规范要求「关键资源需考虑并发」。

`update_plan` 的读-改-写存在竞态窗口：

```python
plan = self._get_plan(plan_id)   # 读
plan[field] = value              # 改
self._save_persistent_plans()    # 写  ← 两个并发请求会互相覆盖
```

**Repository 层处理方式**：
- 单条更新使用 `UPDATE ... WHERE id = :id` + 受影响行数校验。
- 状态流转等敏感变更采用**条件更新**（`WHERE status = 期望值`），受影响行数为 0 则抛冲突错误。
- 整体操作包在事务中，失败自动回滚。

> 本阶段先实现事务与受影响行数校验；**乐观锁（version 字段）作为后续增强**，不在本次引入。

### 3.5 表名与命名规范

- 表名：`snake_case` 复数（`content_calendar_plans`）。
- 字段名：与现有 JSON 契约**完全同名**，降低迁移认知成本。
- 外键：`{单数表名}_id`。

---

## 4. Repository 接口契约

**设计原则：接口先行**（用户规范「接口契约先行」）。先定义契约，再写实现。

### 4.1 抽象接口

```python
class ContentPlanRepository(Protocol):
    def list_plans(
        self,
        keyword: str = "",
        status: str = "",
        platform: str = "",
        owner: str = "",
        priority: str = "",
        start: str = "",
        end: str = "",
        sort: str = "date_asc",
        page: int = 1,
        page_size: int = 50,
    ) -> dict[str, Any]: ...

    def create_plan(self, payload: ContentPlanCreateRequest) -> dict[str, Any]: ...
    def update_plan(self, plan_id: str, payload: ContentPlanUpdateRequest) -> dict[str, Any]: ...
    def get_plan(self, plan_id: str) -> dict[str, Any]: ...
```

**返回值契约**：与现有 `ContentCalendarStore` 完全一致，包含 `plans` / `total` / `page` / `page_size`。
**错误契约**：找不到时抛 `HTTPException(404)`，与现有一致。

### 4.2 三个实现

| 实现 | 用途 | 状态 |
|---|---|---|
| `JsonContentPlanRepository` | 本地 JSON，离线 Demo 兜底 | 由现有 store 逻辑提取 |
| `SqlAlchemyContentPlanRepository` | SQLite / PostgreSQL 通用 | 本次新增 |
| `RepositoryFactory` | 按配置选择实现，失败降级 | 本次新增 |

**降级策略**：
```text
尝试连接数据库
  ├── 成功 → SqlAlchemyContentPlanRepository
  └── 失败 → JsonContentPlanRepository（记录警告日志，不中断服务）
```

### 4.3 分层职责

```text
main.py（表现层）
    ↓ 只调用 store，不感知存储实现
ContentCalendarStore（业务逻辑层）
    ↓ 校验、组装审计日志、计算分页，不直接写 SQL
ContentPlanRepository（数据访问层）
    ↓ 唯一接触数据库的位置
SQLAlchemy / JSON
```

---

## 5. 风险与注意事项

| 编号 | 风险 | 影响 | 应对 |
|---|---|---|---|
| R1 | `scheduled_at` / `created_at` 格式不统一且依赖字符串比较 | 中 | 本阶段保留原格式；格式统一列为独立技术债 |
| R2 | 读-改-写竞态导致更新丢失 | 高 | 事务 + 受影响行数校验；后续加乐观锁 |
| R3 | JSON 与数据库双读期间数据不一致 | 高 | 明确单一写入源，不做双写；降级只在连接失败时触发 |
| R4 | 现有测试被改写以迁就新实现 | 高 | **硬约束：测试不得修改**；若必须改说明设计有问题 |
| R5 | SQLite 与 PG 行为差异（如大小写、类型宽松度） | 中 | 用 SQLAlchemy 抽象；避免方言特定语法；CI 后续补 PG 验证 |
| R6 | 测试污染开发数据 | 中 | 测试使用独立临时库，每例独立事务回滚 |
| R7 | 审计日志无限增长 | 低 | 本阶段不处理，列入后续运维项 |

---

## 6. 完成清单（S1.1–S1.5）

- [x] 表结构设计（本文档 §2）
- [x] 关键决策记录（本文档 §3）
- [x] Repository 接口契约（本文档 §4）
- [x] 风险清单（本文档 §5）
- [x] 引入 SQLAlchemy 基础设施（`backend/app/data/database.py`）
- [x] 实现 ORM 模型（`backend/app/data/models.py`）
- [x] 实现 JSON / SQLAlchemy Repository 双实现与降级工厂
- [x] 改造 `ContentCalendarStore`，保持既有 API 契约
- [x] 新增数据层测试，后端全量 75 passed
- [x] S1.6：编写本地 JSON → 数据库迁移脚本，真实导入验证 104 条
- [x] S1.7：确认前端 API 优先路径在 SQLite Repository 模式下完整可用
- [ ] S1.8：迁移 `rules` 与 `geo_monitor`

---

## 7. 后续阶段衔接

本设计中的模式将复用于 `rules` 与 `geo_monitor` 迁移：

```text
content_calendar（本次）     ← 最小验证
      ↓ 模式复用
rules（含 rule_audit_logs）   ← 结构类似：主表 + 审计表
      ↓ 模式复用
geo_monitor（4 张表）         ← 更复杂：会话/记录/附件/复核
```

`rules` 与 `geo_monitor` 的表结构设计将在各自阶段单独产出文档，本阶段只做 `content_calendar`。
