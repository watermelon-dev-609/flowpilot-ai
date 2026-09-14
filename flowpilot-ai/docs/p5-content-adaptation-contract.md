# P5 内容适配数据结构与接口契约草案

本文件是 P5 阶段开发前的契约草案。  
当前 P5 先以前端本地规则实现，不直接调用后端接口；但数据结构需要提前稳定，方便后续迁移到后端服务、模型工作流或发布中心。

## 1. 核心对象

### ContentAdaptationInput

用于描述一次内容适配任务的输入。

```ts
type ContentAdaptationInput = {
  brandName: string;
  productName: string;
  region: string;
  topicTitle: string;
  targetAudience: string;
  facts: string;
  selectedPlatforms: PublishingPlatformId[];
};
```

字段说明：

| 字段 | 必填 | 说明 |
|---|---:|---|
| brandName | 是 | 品牌或公司名称 |
| productName | 是 | 产品、业务或解决方案名称 |
| region | 是 | 目标地域 |
| topicTitle | 是 | 本次内容主题或选题 |
| targetAudience | 否 | 目标读者 |
| facts | 否 | 已确认事实、参数、案例或素材说明 |
| selectedPlatforms | 是 | 需要生成的平台版本 |

## 2. 平台枚举

```ts
type PublishingPlatformId =
  | "wechat"
  | "zhihu"
  | "xiaohongshu"
  | "baijiahao"
  | "website";
```

平台名称映射：

| 平台标识 | 页面显示 |
|---|---|
| wechat | 微信公众号 |
| zhihu | 知乎 |
| xiaohongshu | 小红书 |
| baijiahao | 百家号 |
| website | 企业官网 |

## 3. 平台草稿

```ts
type PlatformDraft = {
  platformId: PublishingPlatformId;
  platformName: string;
  title: string;
  body: string;
  structureType: string;
  suggestedTags: string[];
  score: PlatformDraftScore;
  warnings: string[];
};
```

字段说明：

| 字段 | 说明 |
|---|---|
| platformId | 稳定平台标识 |
| platformName | 页面显示名称 |
| title | 平台标题 |
| body | 平台正文草稿 |
| structureType | 内容结构类型，例如长文解析型、问答型、场景型 |
| suggestedTags | 推荐标签 |
| score | 内容质量评分 |
| warnings | 发布前风险提示 |

## 4. 质量评分

```ts
type PlatformDraftScore = {
  factCompleteness: number;
  platformFit: number;
  advertisingRisk: number;
  readability: number;
  overall: number;
};
```

评分边界：

- `factCompleteness`：事实完整度，越高越好。
- `platformFit`：平台适配度，越高越好。
- `advertisingRisk`：广告感或绝对化表达风险，越低越好。
- `readability`：可读性，越高越好。
- `overall`：综合评分，仅用于内部决策，不代表收录、排名或引用结果。

## 5. 错误码草案

前端本地函数可以先抛出可读错误；后续后端接口统一返回错误码。

```ts
type ContentAdaptationErrorCode =
  | "CONTENT_ADAPTATION_REQUIRED_FIELD_MISSING"
  | "CONTENT_ADAPTATION_NO_PLATFORM_SELECTED"
  | "CONTENT_ADAPTATION_FACTS_TOO_SHORT"
  | "CONTENT_ADAPTATION_GENERATION_FAILED";
```

错误码说明：

| 错误码 | 页面提示 |
|---|---|
| CONTENT_ADAPTATION_REQUIRED_FIELD_MISSING | 请填写品牌名称、产品名称、目标地域和选题标题 |
| CONTENT_ADAPTATION_NO_PLATFORM_SELECTED | 请至少选择一个发布平台 |
| CONTENT_ADAPTATION_FACTS_TOO_SHORT | 可确认事实过少，建议补充产品参数、案例或素材说明 |
| CONTENT_ADAPTATION_GENERATION_FAILED | 平台草稿生成失败，请稍后重试 |

## 6. 未来后端接口草案

当前不实现，仅作为后续迁移参考。

### POST /api/content-adaptation/drafts

请求：

```json
{
  "brandName": "武汉微艺达智能科技有限公司",
  "productName": "智能沙盘",
  "region": "武汉",
  "topicTitle": "武汉智能沙盘厂家怎么选？",
  "targetAudience": "企业展厅负责人",
  "facts": "支持实体模型、灯光控制、触摸屏联动。",
  "selectedPlatforms": ["wechat", "zhihu", "xiaohongshu"]
}
```

响应：

```json
{
  "requestId": "adapt_20260911_001",
  "dataMode": "local_rule",
  "drafts": []
}
```

### GET /api/content-adaptation/drafts/:requestId

用途：

- 查询某次内容适配结果。
- 后续支持异步任务时使用。

## 7. 安全与边界

- 不接收密钥、账号、Cookie。
- 不保存外部平台登录态。
- 不自动发布内容。
- 不编造产品参数、客户案例或排名信息。
- 不把评分解释为平台效果承诺。
- 所有外部输入后续接入后端时必须做长度、类型和危险字符校验。

## 8. 后续迁移策略

第一阶段：

- 前端本地规则生成。
- 纯函数可测试。
- 页面展示平台草稿。

第二阶段：

- 后端提供同名接口。
- 前端保留本地规则作为兜底模式。
- 后端记录生成历史、评分和导出记录。

第三阶段：

- 接入企业知识库。
- 接入模型服务。
- 接入审核和发布中心。
