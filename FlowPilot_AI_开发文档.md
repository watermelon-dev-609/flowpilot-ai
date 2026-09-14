# FlowPilot AI 开发文档

## 1. 项目定位

FlowPilot AI 是一个面向企业运营场景的 AI 智能工作台。项目从真实工作流程出发，把产品资料、项目资料、企业知识库、GEO 内容优化、多平台运营、AIGC 视觉生产和自动化工作流放进一个系统里。

这个项目的第一目标是优化简历。它需要证明一件事：我不是只会使用 AI 工具的运营，而是能够理解业务问题，并用软件工程、LLM、RAG、Agent 和自动化流程把问题做成可运行工具的人。

项目最终服务三类结果。

- 工作中能用，用来辅助产品文章、GEO 内容、多平台改写和项目资料整理。
- 简历中能写，作为 AI 应用运营、AI 产品运营或初级 AI 应用开发方向的核心项目。
- 面试时能讲，能够完整解释业务背景、产品设计、技术架构、开发过程和实际效果。

## 2. 项目要串联的简历能力

| 简历能力 | 项目中的对应模块 | 能证明什么 |
|---|---|---|
| 软件工程本科 | 完整 Web 应用 | 具备系统开发基础 |
| Python | AI 后端、文档解析、工作流调度 | 能写业务脚本和后端逻辑 |
| FastAPI | 后端接口服务 | 具备接口开发能力 |
| 数据库 | 企业、项目、产品、内容数据建模 | 理解业务数据结构 |
| GitHub | 仓库、README、版本记录 | 具备工程展示意识 |
| ChatGPT、DeepSeek、Claude 等 | LLM Provider Adapter | 具备多模型使用经验 |
| Prompt Engineering | Prompt Library | 能沉淀可复用提示词 |
| Agent | 多步骤 AI 工作流 | 能设计任务拆解和自动化流程 |
| Coze、Dify | 工作流原型经验 | 理解低代码 AI 工作流 |
| GEO | GEO Research、GEO Review、GEO Monitor | 具备生成式引擎优化实践 |
| 官网、公众号、知乎、百家号、小红书 | 多平台内容矩阵 | 具备内容运营经验 |
| 电商运营 | Product Center | 能从商品资料生成产品内容 |
| ComfyUI、AIGC 视频 | AIGC Studio | 能把视觉生成接入内容流程 |
| CAD、智能沙盘 | Project Intelligence | 理解实体项目和交付资料 |
| 方案、报价、客户需求 | AI Proposal | 能把运营工作延伸到业务支持 |
| 第一性原理、对抗性审查 | Planner Agent、Critic Agent | 能控制 AI 输出质量 |

## 3. 核心业务流程

FlowPilot AI 的主线围绕企业项目和产品展开。

```text
企业或客户资料
      ↓
产品图片、CAD、PDF、Word、Excel、历史文章
      ↓
AI Document Agent
      ↓
产品理解 / 项目理解
      ↓
企业知识库 / 项目知识库
      ↓
GEO Research
      ↓
内容策略
      ↓
文章生成
      ↓
Fact Checker + Critic Agent
      ↓
人工审核
      ↓
官网、公众号、知乎、百家号、小红书
      ↓
GEO Monitor
      ↓
数据沉淀
```

这个流程把现实工作中的“资料整理、产品介绍、GEO 文章优化、多平台发布、后续监测”连成一条线。

## 4. 核心模块

### 4.1 Project Workspace

项目空间用于承接智能沙盘、企业展厅、智慧农业、智慧交通、ROS 智能小车等真实业务项目。

每个项目包含以下内容。

- 项目名称
- 客户或企业信息
- 产品图片
- CAD 或设计图纸
- PDF、Word、Excel 等资料
- 历史文章
- AI 分析结果
- 内容任务
- 发布记录
- 待确认事项

系统需要从资料中提取项目摘要。

```text
项目名称
项目类型
客户需求
展示区域
产品组成
技术要点
尺寸信息
交付物
待确认问题
```

### 4.2 Product Intelligence

产品理解模块是第一阶段最先开发的功能。

用户上传产品图片并输入基础资料后，系统调用 Vision LLM 和文本模型生成 Product Card。

Product Card 包含以下字段。

```json
{
  "product_name": "",
  "category": "",
  "description": "",
  "features": [],
  "functions": [],
  "components": [],
  "technologies": [],
  "applications": [],
  "target_users": [],
  "entities": [],
  "verified_facts": [],
  "visual_inferences": [],
  "unknown_information": []
}
```

系统必须区分资料明确提供的信息和 AI 从图片中推断的信息。AI 可以说图片中疑似存在某个部件，但不能凭图片编造参数、价格、交付日期和客户案例。

### 4.3 GEO Research

GEO Research 用来分析一个产品或项目在生成式搜索环境中应该覆盖哪些实体和问题。

输入一个产品后，系统输出三类结果。

第一类是 Entity Map。

```text
ROS 智能小车
├── ROS
├── ROS2
├── SLAM
├── 激光雷达
├── 自主导航
├── 路径规划
├── 机器视觉
└── 机器人教学
```

第二类是 Question Map。

```text
是什么类问题
有什么作用类问题
怎么实现类问题
适合谁类问题
应用在哪里类问题
对比选型类问题
```

第三类是 Content Strategy。

系统根据实体和问题生成内容选题，帮助用户规划官网文章、公众号文章、知乎回答、百家号科普和小红书笔记。

### 4.4 Content Engine

内容生成模块根据 Product Card、GEO Research 和企业资料生成文章。

系统不能只输出一篇通用文章，而要按平台生成不同版本。

| 平台 | 内容重点 |
|---|---|
| 企业官网 | 产品信息、技术参数、应用场景、企业实体 |
| 微信公众号 | 完整知识结构、案例、品牌沉淀 |
| 知乎 | 围绕具体问题给出专业回答 |
| 百家号 | 产品科普、行业知识、搜索型内容 |
| 小红书 | 场景化表达、图片匹配、简洁口语 |

每篇内容都应该保留来源信息、使用到的产品事实和待人工确认的问题。

### 4.5 AI Review

AI Review 承担事实检查和质量审查。

Fact Checker 检查以下内容。

- 企业名称是否准确
- 产品名称是否统一
- 参数是否有来源
- 功能描述是否夸大
- 案例是否来自真实资料
- 技术术语是否使用正确
- 数据是否缺少依据

Critic Agent 检查以下内容。

- 是否有 AI 套话
- 是否只是企业广告
- 是否堆关键词
- 是否缺少信息增量
- 是否没有回答用户问题
- 是否和产品图片不匹配
- 是否前后重复
- 是否为了 GEO 牺牲阅读体验

审查后生成 GEO Content Score。

```text
实体完整度
问题覆盖度
事实可信度
结构清晰度
原创信息增量
广告化程度
AI 模板化风险
```

评分只作为内部质量控制指标，不能宣称分数越高就一定会被某个 AI 引用。

### 4.6 AIGC Studio

AIGC Studio 用来承接 ComfyUI、图片生成、视频脚本和视觉 Prompt。

内容完成后，系统根据文章自动生成视觉需求。

```text
封面图
产品结构图
应用场景图
功能示意图
短视频脚本
分镜说明
图片 Prompt
视频 Prompt
```

后续可以接入 ComfyUI API，让系统从文章继续生成视觉素材需求或视频生成提示词。

### 4.7 GEO Monitor

GEO Monitor 用来记录内容发布后的效果。

系统需要区分三种状态。

- Brand Mention，AI 回答中提到了品牌或公司。
- Page Retrieval，AI 或搜索工具检索到了页面。
- Source Citation，AI 明确把页面作为来源引用。

监测表结构示例。

| Query | Platform | Mention | Retrieval | Citation | Date | Notes |
|---|---|---:|---:|---:|---|---|
| ROS 智能小车是什么 | ChatGPT | 待测 | 待测 | 待测 |  |  |
| ROS 教学小车有什么作用 | DeepSeek | 待测 | 待测 | 待测 |  |  |

这部分数据以后可以转化成简历中的真实成果。

## 5. 技术架构

### 5.1 前端

- Next.js
- TypeScript
- Tailwind CSS

### 5.2 后端

- Python
- FastAPI
- SQLAlchemy
- Pydantic

### 5.3 数据库

- PostgreSQL
- pgvector

### 5.4 AI 能力

- LLM Provider Adapter
- Vision Model
- Embedding
- RAG
- Agent Workflow
- Prompt Library

Provider 需要做成可替换结构。

```text
LLMProvider
├── OpenAIAdapter
├── DeepSeekAdapter
├── GeminiAdapter
└── LocalMockAdapter
```

本地开发初期可以先用 Mock Adapter 跑通流程，避免一开始就被 API Key 和模型费用卡住。

## 6. 数据库核心表

第一版建议保留这些表。

```text
users
companies
projects
products
documents
document_chunks
images
entities
questions
prompts
contents
content_versions
agents
workflow_runs
reviews
publications
geo_tests
```

核心关系。

```text
Company
├── Products
│   ├── Images
│   ├── Documents
│   └── Entities
└── Projects
    ├── Documents
    ├── Questions
    ├── Contents
    ├── Reviews
    └── Publications
```

## 7. 页面规划

左侧导航。

```text
FlowPilot AI

工作台
项目
产品中心
企业知识库
GEO Research
内容中心
AI 工作流
GEO Monitor
Prompt Library
设置
```

核心操作页采用三栏结构。

```text
┌─────────────┬──────────────────┬─────────────┐
│ Product     │ AI Workspace     │ Context     │
│ 产品图片     │ GEO 分析          │ 企业知识     │
│ 产品资料     │ 内容生成          │ 产品知识     │
│ 技术参数     │ 审查结果          │ 引用来源     │
└─────────────┴──────────────────┴─────────────┘
```

右侧 Context 面板要展示 AI 使用了哪些资料。这个设计能体现系统和普通聊天工具的区别。

## 8. MVP 开发路线

### V0.1 产品理解

目标是跑通第一条真实链路。

```text
创建产品
上传产品图片
输入产品资料
AI 理解产品
生成 Product Card
人工确认与修改
```

完成后，简历可以写 AI Vision、产品结构化理解和业务资料处理。

### V0.2 GEO Research

在 Product Card 基础上生成 Entity Map、Question Map 和内容选题。

完成后，简历可以写 GEO 内容策略、搜索意图分析和生成式引擎优化实践。

### V0.3 内容生成与审查

生成一篇官网或公众号文章，并接入 Fact Checker 和 Critic Agent。

完成后，简历可以写 Agent 工作流、AI 内容生成、事实检查和质量控制。

### V0.4 多平台适配

支持官网、公众号、知乎、百家号、小红书五类内容版本。

完成后，简历可以写多平台内容矩阵和内容适配能力。

### V0.5 企业知识库与 RAG

支持上传 PDF、DOCX、Markdown、TXT、Excel，构建企业知识库。

完成后，简历可以写 RAG、Embedding、pgvector 和企业知识管理。

### V0.6 Project Intelligence

支持项目资料整理、智能沙盘需求摘要、方案结构建议。

完成后，简历可以把 CAD、智能沙盘、项目方案和 AI 应用串起来。

### V0.7 AIGC Studio

生成图片 Prompt、视频 Prompt、分镜和 ComfyUI 工作流说明。

完成后，简历可以把 ComfyUI、AIGC 视频和企业内容生产串起来。

### V0.8 GEO Monitor

记录不同 AI 和搜索环境中的 Mention、Retrieval、Citation。

完成后，简历可以写数据监测和运营效果追踪。

## 9. 第一阶段暂不开发

为了避免项目失控，第一阶段不做以下内容。

- 自动发布公众号或小红书
- 多人协作权限
- 付费系统
- 手机 App
- 自研大模型
- 微服务架构
- Kubernetes
- 复杂 BI
- 完整 CRM
- 自动生成报价金额
- 承诺 GEO 排名
- 承诺一定被 AI 引用

第一阶段只需要证明一条真实业务链能跑通。

## 10. 项目验收标准

V0.4 完成时，项目至少要能处理一个真实产品案例。

验收链路如下。

```text
真实产品图片
      ↓
产品资料
      ↓
Product Card
      ↓
GEO Entity Map
      ↓
Question Map
      ↓
文章大纲
      ↓
正文生成
      ↓
Fact Check
      ↓
GEO Critic
      ↓
人工修改
      ↓
官网 / 公众号 / 知乎 / 百家号 / 小红书版本
```

项目完成后，需要整理一份 Case Study。

```text
业务问题
原始工作流程
系统设计
技术架构
功能截图
真实案例
效率对比
问题与改进
```

## 11. 需要记录的数据

这些数据会直接影响简历含金量。开发时就要记录。

- 开发周期
- Git Commit 数
- 支持文件格式数量
- 支持模型数量
- Prompt 版本数量
- 产品项目数量
- 生成文章数量
- 支持平台数量
- Agent 数量
- 单个产品内容生产耗时
- 人工修改次数
- Fact Check 发现问题数量
- GEO 测试次数
- Mention 次数
- Retrieval 次数
- Citation 次数

未来简历可以根据真实结果写成。

```text
将单个产品从资料整理、GEO 策划、文章生成到多平台适配的平均处理时间由 XX 分钟降低至 XX 分钟。
累计处理 XX 个产品，生成 XX 篇多平台内容，完成 XX 次 GEO 可见性测试。
```

## 12. GitHub README 要求

README 不能只写安装命令。它要让 HR 和面试官看懂项目价值。

建议结构。

```text
FlowPilot AI
企业 AI 智能运营工作台

项目背景
解决的问题
核心功能
产品截图
AI Workflow
GEO Pipeline
系统架构
技术栈
真实案例
效果数据
Quick Start
Roadmap
```

README 中至少放三张图。

- 产品操作截图
- Agent Workflow 架构图
- GEO 内容生产流程图

## 13. 简历项目写法

项目做到 V0.4 后，可以写成下面这版。

### FlowPilot AI｜企业 AI 智能运营工作台

独立开发｜Python / FastAPI / Next.js / PostgreSQL / pgvector / LLM / RAG / Agent / GEO

基于实际企业运营中的产品资料整理、GEO 内容优化和多平台内容生产需求，独立设计并开发 AI 智能运营工作台，用于解决企业资料分散、重复 Prompt、AI 输出事实不稳定和内容多平台适配成本高等问题。

- 实现基于产品图片与产品资料的 AI 产品理解流程，将产品功能、技术特点、应用场景和相关实体结构化为 Product Card。
- 构建 GEO Research 模块，围绕产品实体、技术概念、用户问题和搜索意图生成内容策略。
- 设计 Product、Research、Writer、Fact Checker、Critic 等 Agent 工作流，覆盖资料分析、文章生成、事实检查和内容质量审查。
- 支持官网、公众号、知乎、百家号、小红书等平台内容适配，避免简单一稿多发。
- 基于 PostgreSQL 和 pgvector 规划企业知识库与 RAG 检索机制，提高产品参数、企业信息和项目案例引用准确性。
- 规划 AIGC Studio，将图片 Prompt、视频 Prompt、分镜和 ComfyUI 工作流纳入企业内容生产流程。
- 建立 GEO Monitor 指标，区分品牌提及、页面检索和来源引用，为后续内容优化提供记录依据。
- 将真实产品内容生产平均耗时由 XX 分钟降低至 XX 分钟，累计完成 XX 个产品、XX 篇内容和 XX 次 GEO 测试。

最后一条必须等真实数据跑出来后再填写。

## 14. 面试讲述版本

面试时可以这样讲这个项目。

```text
我本科是软件工程，毕业后进入一家智能科技公司做运营。工作内容不只包括公众号、知乎、百家号、小红书和官网，也会接触产品资料、CAD、智能沙盘项目、客户需求和电商商品维护。

做了一段时间后，我发现很多工作反复发生。比如一个产品制作完成后，我要根据产品图片和资料写产品介绍，再改成不同平台的内容，还要考虑 GEO，让内容能被搜索引擎和生成式 AI 更好理解。单独使用 ChatGPT 可以完成某一步，但每次都要重复输入背景，事实也容易出错。

所以我设计了 FlowPilot AI。它从产品图片和企业资料开始，先生成结构化 Product Card，再做 GEO 实体和问题分析，然后通过 Agent 工作流生成文章、检查事实、做内容审查，最后适配官网、公众号、知乎、百家号和小红书。

这个项目把我的软件工程背景、AI 工具实践、内容运营经验、GEO 工作、ComfyUI 视觉生产和智能沙盘业务经验放到了一条真实工作流里。它也是我从传统运营转向 AI 应用运营和 AI 产品方向的核心项目。
```

## 15. 开发优先级

先开发能证明能力的最短链路。

```text
第一阶段
产品图片 + 产品资料 → Product Card → GEO Research → 文章生成 → Fact Check → Critic

第二阶段
企业知识库 → RAG → 来源引用

第三阶段
多平台内容适配

第四阶段
项目资料理解 → 智能沙盘方案辅助

第五阶段
AIGC Studio → ComfyUI / 视频 Prompt

第六阶段
GEO Monitor → 数据统计 → 简历量化结果
```

开发时始终围绕一个判断。

```text
这个功能能否证明我会用 AI 和软件工程解决真实业务问题。
```

如果不能，就先不开发。
