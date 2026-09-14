# FlowPilot AI

FlowPilot AI 是一个面向企业 GEO 内容运营的智能工作台，用来把企业资料、产品信息、AI 引用准备度、真实 GEO 监测、内容适配、发布队列和内容日历串成一条可运行的工作流。

项目当前重点不是承诺“排名”或“必然被 AI 引用”，而是帮助运营人员把内容做得更容易被搜索引擎和生成式 AI 理解、复核、引用和持续迭代。

## v1.1.0 版本说明

v1.1.0 是 FlowPilot AI 的第一个可验收版本，重点完成从“GEO 研究”到“内容计划与发布准备”的前端工作台闭环。

### 核心能力

- 首页从项目说明页升级为运营工作台。
- 全局导航覆盖规则中心、GEO 研究、内容适配、发布队列、GEO 监测、引用准备度、内容日历等页面。
- 规则中心支持本地持久化、平台选择、动态规则更新计划和来源复核入口。
- GEO 监测支持真实监测记录、数据概览、来源复核、周报导出和会话/记录拆分。
- GEO Research 支持选题研究、规则中心联动、监测数据联动、选题优先级、难度和平台适配评分。
- 内容适配支持母稿生成、多平台内容版本、平台策略、引用准备提示和发布建议。
- 发布队列支持内容进入发布准备流程，展示发布状态、失败原因和处理建议。
- 引用准备度页面用于评估内容是否具备被 AI 检索、理解和引用的基础条件。
- 内容日历支持从选题池生成内容计划，并按关键词、状态、平台、负责人、优先级和日期范围筛选。

### 工程特性

- 前端采用 Next.js、React、TypeScript。
- 使用本地仓储层隔离页面与浏览器存储，便于后续替换为后端 API。
- 增加统一 API 响应契约、异步数据状态模型和数据状态展示组件。
- 前端页面覆盖 loading、empty、error、success 等基础状态。
- 核心功能采用测试先行方式推进，当前前端测试覆盖主要页面、数据契约和仓储逻辑。

### 不承诺内容

FlowPilot AI 不承诺 GEO 排名，不承诺一定被 ChatGPT、DeepSeek、豆包、文心一言、腾讯元宝等平台引用。

项目承诺的是：

- 提升内容的 AI Citation Readiness。
- 记录品牌提及、页面检索、来源引用等监测状态。
- 通过规则、研究、适配、发布和监测数据，持续改进内容质量。

## 页面入口

本地开发环境启动后可访问：

```text
http://127.0.0.1:3000
```

常用页面：

- `/`：运营工作台
- `/rules`：规则中心
- `/geo-research`：GEO Research
- `/content-adaptation`：内容适配
- `/publish-queue`：发布队列
- `/geo-monitor`：GEO 监测
- `/geo-monitor/report`：监测周报
- `/citation-readiness`：引用准备度
- `/content-calendar`：内容日历

## 运行前端

```powershell
cd frontend
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:3000
```

## 运行后端

```powershell
cd backend
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

健康检查：

```text
http://127.0.0.1:8000/api/health
```

## 验证命令

前端测试：

```powershell
cd frontend
npm run test
```

前端构建：

```powershell
cd frontend
npm run build
```

后端测试：

```powershell
cd backend
.venv\Scripts\python.exe -m pytest
```

前端依赖审计：

```powershell
cd frontend
npm audit --json --package-lock-only --registry=https://registry.npmjs.org
```

## 项目定位

FlowPilot AI 不是简单的 AI 写文章工具，也不是无人值守自动发帖工具。

它的定位是企业 GEO 内容运营基础设施：

```text
企业资料
  ↓
GEO 研究
  ↓
内容适配
  ↓
发布准备
  ↓
真实监测
  ↓
复盘迭代
```

## 许可证与公开说明

当前项目主要用于个人作品集、简历项目和本地演示。若接入真实企业数据、平台账号或客户资料，必须先完成脱敏、权限和合规审查。
