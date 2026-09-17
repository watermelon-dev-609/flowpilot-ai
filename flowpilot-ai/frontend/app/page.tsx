"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  LayoutDashboard,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TimerReset
} from "lucide-react";
import Link from "next/link";
import { ProLayout } from "./components/state-card";
import { ProStatCard, StatTone } from "./components/pro-stat-card";
import {
  ContentCalendarPlan,
  GeoMonitorRecord,
  GeoReportSnapshot,
  PublishQueueItem,
  loadContentCalendarPlans,
  loadGeoMonitorSnapshot,
  loadPublishQueueItems,
  loadRuleUpdateReminders
} from "./lib/flowpilot-api";

const pipeline = ["产品图片 / 产品资料", "产品理解", "生成式优化研究", "事实核查", "质量审查", "引用准备度", "多平台适配"];

const mainWorkflowStages = [
  {
    step: "01",
    title: "产品资料",
    href: "/products",
    status: "资料沉淀",
    nextActions: {
      待处理: "录入产品资料",
      进行中: "补齐产品事实",
      已完成: "进入生成式优化研究"
    },
    description: "先沉淀产品名称、品牌、目标页面、客户对象、卖点和事实依据。"
  },
  {
    step: "02",
    title: "生成式优化研究",
    href: "/geo-research",
    status: "选题池",
    nextActions: {
      待处理: "梳理产品资料",
      进行中: "完善研究选题",
      已完成: "进入内容日历"
    },
    description: "先把产品、场景、问题和证据沉淀成可生产选题。"
  },
  {
    step: "03",
    title: "内容日历",
    href: "/content-calendar",
    status: "生产排期",
    nextActions: {
      待处理: "安排生产排期",
      进行中: "补齐排期信息",
      已完成: "查看排期"
    },
    description: "把选题转成计划，安排负责人、平台、状态和发布时间。"
  },
  {
    step: "04",
    title: "内容适配",
    href: "/content-adaptation",
    status: "草稿加工",
    nextActions: {
      待处理: "生成平台版本",
      进行中: "继续适配内容",
      已完成: "进入发布准备"
    },
    description: "按平台规则生成版本，检查事实、风格和引用准备度。"
  },
  {
    step: "05",
    title: "发布准备",
    href: "/publish-queue",
    status: "待发布",
    nextActions: {
      待处理: "确认发布记录",
      进行中: "推进发布准备",
      已完成: "进入监测复盘"
    },
    description: "汇总已适配内容，确认发布状态、负责人和导出清单。"
  },
  {
    step: "06",
    title: "监测复盘",
    href: "/geo-monitor",
    status: "效果回收",
    nextActions: {
      待处理: "录入监测证据",
      进行中: "复核监测证据",
      已完成: "生成运营报告"
    },
    description: "记录生成式搜索与平台反馈，把证据等级回流到下一轮选题。"
  }
];

const capabilityLinks = [
  ["软件工程", "前后端骨架、接口服务与页面状态管理"],
  ["智能应用", "模型接入层与模拟模式预留"],
  ["生成式优化", "实体库、问题库、引用准备度评分"],
  ["内容运营", "官网、公众号、知乎、百家号、小红书"],
  ["视觉扩展", "图片与视频工作流预留"],
  ["智能沙盘", "项目资料与图纸工作区预留"]
];

const defaultOperationMetrics = [
  ["待复核规则", "6", "来源、版本、置信度需要人工确认", 0.5, "warning"],
  ["监测任务", "3", "围绕品牌、产品、关键词持续记录", 0.35, "primary"],
  ["监测记录", "18", "保留原始响应与人工判断", 0.9, "success"],
  ["最高证据等级", "4", "页面作为来源被引用，需要继续复核", 1, "success"]
];

const quickActions = [
  ["发起来源复核", "/rules", ShieldCheck, "检查平台规则来源是否需要更新"],
  ["创建监测任务", "/geo-monitor/sessions", SearchCheck, "围绕品牌、产品或关键词建立监测"],
  ["录入监测记录", "/geo-monitor/records", FileText, "保存真实响应和证据等级"]
];

const foundationChecks = ["页面可打开", "接口可访问", "模拟模式", "项目骨架"];

const ruleFields = ["规则来源", "更新时间", "版本", "置信度", "人工确认", "变更记录"];

const evidenceLevels = [
  ["0", "未出现"],
  ["1", "相关概念"],
  ["2", "品牌提及"],
  ["3", "页面检索"],
  ["4", "来源引用"]
];

const stateGuards = ["骨架屏", "加载中", "空状态", "错误状态"];
const publishQueueStorageKey = "flowpilot.contentAdaptation.publishQueue";

type WorkflowProgressStatus = "待处理" | "进行中" | "已完成";

type BusinessFocus = {
  title: string;
  status: WorkflowProgressStatus;
  nextAction: string;
  href: string;
  detail: string;
  relatedObject: string;
  gap: string;
  actionState: string;
};

type HomePublishQueueItem = {
  status?: string;
  versionId?: string;
  topicTitle?: string;
  sourceTopicTitle?: string;
  publishedUrl?: string;
  actualPublishAt?: string;
  monitorSessionId?: string;
};

type ContentLifecycleStage = "待生产" | "生产中" | "待审核" | "待发布" | "已发布" | "待监测" | "已复盘";

type ContentLifecycleSummary = {
  total: number;
  priorityStage: ContentLifecycleStage | "暂无内容计划";
  stages: Array<{
    label: ContentLifecycleStage;
    count: number;
    href: string;
  }>;
};

type WorkflowLedgerItem = {
  planId: string;
  title: string;
  productName: string;
  owner: string;
  platform: string;
  stage: ContentLifecycleStage;
  publishState: string;
  monitorState: string;
  reportState: string;
  gap: string;
  actionLabel: string;
  href: string;
};

type WorkflowLedgerFilter = "all" | "todo" | "reviewed";
type WorkflowLedgerDimensionFilters = {
  productName: string;
  owner: string;
  platform: string;
};

const contentLifecycleStages: Array<{ label: ContentLifecycleStage; href: string }> = [
  { label: "待生产", href: "/content-calendar" },
  { label: "生产中", href: "/content-calendar" },
  { label: "待审核", href: "/content-calendar" },
  { label: "待发布", href: "/publish-queue" },
  { label: "已发布", href: "/geo-monitor/records" },
  { label: "待监测", href: "/geo-monitor/records" },
  { label: "已复盘", href: "/geo-monitor/report" }
];

const workflowLedgerFilters: Array<{ label: string; value: WorkflowLedgerFilter }> = [
  { label: "全部计划", value: "all" },
  { label: "只看待处理", value: "todo" },
  { label: "只看已复盘", value: "reviewed" }
];

const allWorkflowLedgerDimensions: WorkflowLedgerDimensionFilters = {
  productName: "all",
  owner: "all",
  platform: "all"
};

const defaultWorkflowProgress: Record<string, WorkflowProgressStatus> = {
  产品资料: "进行中",
  生成式优化研究: "待处理",
  内容日历: "待处理",
  内容适配: "待处理",
  发布准备: "待处理",
  监测复盘: "待处理"
};

const defaultWorkflowHrefs = Object.fromEntries(mainWorkflowStages.map((stage) => [stage.title, stage.href])) as Record<string, string>;

export default function Home() {
  const [operationMetrics, setOperationMetrics] = useState(defaultOperationMetrics);
  const [workflowProgress, setWorkflowProgress] = useState(defaultWorkflowProgress);
  const [workflowHrefs, setWorkflowHrefs] = useState(defaultWorkflowHrefs);
  const [contentLifecycleSummary, setContentLifecycleSummary] = useState<ContentLifecycleSummary>(() => buildContentLifecycleSummary([]));
  const [workflowLedger, setWorkflowLedger] = useState<WorkflowLedgerItem[]>(() => buildWorkflowLedger([], [], [], []));
  const [workflowLedgerFilter, setWorkflowLedgerFilter] = useState<WorkflowLedgerFilter>(() => readWorkflowLedgerFilterFromUrl());
  const [workflowLedgerDimensionFilters, setWorkflowLedgerDimensionFilters] =
    useState<WorkflowLedgerDimensionFilters>(allWorkflowLedgerDimensions);
  const [businessFocus, setBusinessFocus] = useState<BusinessFocus>(() =>
    buildBusinessFocus([], [], [], [])
  );
  const workflowLedgerDimensionOptions = buildWorkflowLedgerDimensionOptions(workflowLedger);
  const filteredWorkflowLedger = workflowLedger.filter((item) => {
    const lifecycleMatched =
      workflowLedgerFilter === "todo" ? item.stage !== "已复盘" : workflowLedgerFilter === "reviewed" ? item.stage === "已复盘" : true;
    const productMatched = workflowLedgerDimensionFilters.productName === "all" || item.productName === workflowLedgerDimensionFilters.productName;
    const ownerMatched = workflowLedgerDimensionFilters.owner === "all" || item.owner === workflowLedgerDimensionFilters.owner;
    const platformMatched = workflowLedgerDimensionFilters.platform === "all" || item.platform === workflowLedgerDimensionFilters.platform;
    return lifecycleMatched && productMatched && ownerMatched && platformMatched;
  });

  useEffect(() => {
    let active = true;

    async function loadOperationMetrics() {
      try {
        const [ruleReminders, geoSnapshot, calendarPlans, publishQueue] = await Promise.all([
          loadRuleUpdateReminders(),
          loadGeoMonitorSnapshot(),
          loadContentCalendarPlans({ page_size: 100 }),
          loadPublishQueueItems().catch(() => ({ items: readHomePublishQueue() }))
        ]);
        const accountableSessions = geoSnapshot.sessions.sessions.filter((session) => session.data_mode !== "mock");
        const accountableRecords = geoSnapshot.records.records.filter((record) => record.data_mode !== "mock");
        const highestEvidenceLevel = accountableRecords.reduce((highest, record) => Math.max(highest, record.evidence_level), 0);
        const accountablePlans = calendarPlans.plans.filter((plan) => plan.data_mode !== "mock");
        const reportSnapshots = geoSnapshot.reportSnapshots.snapshots.filter((snapshot) => snapshot.data_mode !== "mock");

        if (!active) return;

        setOperationMetrics([
          ["待复核规则", String(ruleReminders.reminders.length), "来自规则复核提醒接口", Math.min(ruleReminders.reminders.length / 12, 1), ruleReminders.reminders.length > 0 ? "warning" : "success"],
          ["监测任务", String(accountableSessions.length), "仅统计真实 / 人工任务，排除模拟数据", Math.min(accountableSessions.length / 8, 1), "primary"],
          ["监测记录", String(accountableRecords.length), "仅统计真实 / 人工记录，排除模拟数据", Math.min(accountableRecords.length / 20, 1), accountableRecords.length > 0 ? "success" : "warning"],
          ["最高证据等级", String(highestEvidenceLevel), "基于真实 / 人工监测记录计算", highestEvidenceLevel / 4, highestEvidenceLevel >= 3 ? "success" : "warning"]
        ]);
        const publishQueueItems = publishQueue.items.map(normalizeHomePublishQueueItem);
        setWorkflowProgress(buildWorkflowProgress(accountablePlans, accountableRecords, publishQueueItems));
        setWorkflowHrefs(buildWorkflowHrefs(accountablePlans, accountableRecords, publishQueueItems));
        setContentLifecycleSummary(buildContentLifecycleSummary(accountablePlans));
        setWorkflowLedger(buildWorkflowLedger(accountablePlans, accountableRecords, publishQueueItems, reportSnapshots));
        setBusinessFocus(buildBusinessFocus(accountablePlans, accountableRecords, publishQueueItems, reportSnapshots));
      } catch {
        if (!active) return;
        setOperationMetrics([
          ["待复核规则", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["监测任务", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["监测记录", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["最高证据等级", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"]
        ]);
        setWorkflowProgress(defaultWorkflowProgress);
        setWorkflowHrefs(defaultWorkflowHrefs);
        setContentLifecycleSummary(buildContentLifecycleSummary([]));
        setWorkflowLedger(buildWorkflowLedger([], [], [], []));
        setBusinessFocus(buildBusinessFocus([], [], [], []));
      }
    }

    loadOperationMetrics();

    return () => {
      active = false;
    };
  }, []);

  return (
    <ProLayout>
      <main className="flex flex-col gap-4 p-5">
        <section className="fp-card px-6 pt-5">
          <p className="text-xs leading-5 text-slate-400">工作台 / 今日运营</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-50">今日运营工作台</h1>
            <span className="rounded-md border border-amber-500 bg-amber-950 px-3 py-1 text-xs text-amber-300">模拟模式</span>
          </div>
          <h2 className="sr-only">智能运营台</h2>
          <p className="mt-1 text-sm font-semibold text-emerald-300">企业智能运营工作台</p>
          <p className="mt-2 max-w-4xl pb-5 text-sm leading-6 text-slate-400">
            这个系统用于把规则复核、真实监测、内容证据、研究选题和后续多平台适配组织成一个可运行闭环。
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {operationMetrics.map(([label, value, detail, ratio, tone]) => (
            <MetricCard key={label as string} label={label as string} value={value as string} detail={detail as string} ratio={ratio as number} tone={tone as StatTone} />
          ))}
        </section>

        <section aria-label="当前业务卡点" className="fp-card p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
              <p className="text-sm text-emerald-300">当前业务卡点</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">当前卡点：{businessFocus.title}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-200">下一步：{businessFocus.nextAction}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{businessFocus.detail}</p>
              </div>
              <Link
                className="inline-flex w-fit rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                href={businessFocus.href}
              >
                去处理当前卡点
              </Link>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
              <p className="text-sm font-semibold text-slate-50">任务面板</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <FocusTaskMetric label="关联对象" value={businessFocus.relatedObject} />
                <FocusTaskMetric label="待补缺口" value={businessFocus.gap} />
                <FocusTaskMetric label="处理状态" value={businessFocus.actionState} />
              </div>
            </div>
          </div>
        </section>

        <section aria-label="内容生命周期概览" className="fp-card p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">内容生命周期概览</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">阶段分布</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">按内容计划当前阶段统计，优先处理最靠前且仍有积压的环节。</p>
            </div>
            <p className="rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-100">
              优先处理：{contentLifecycleSummary.priorityStage}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {contentLifecycleSummary.stages.map((stage) => (
              <Link
                aria-label={`${stage.label}数量`}
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 transition-colors hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                href={stage.href}
                key={stage.label}
              >
                <span className="block text-xs text-slate-500">{stage.label}</span>
                <span className="mt-2 block text-lg font-semibold text-slate-50">{stage.count}</span>
                <span className="mt-1 block text-xs text-slate-500">条内容</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-label="主流程状态台账" className="fp-card p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-emerald-300">主流程状态台账</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">按内容计划追踪闭环</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">以内容计划为主线，串联发布、监测和报告，优先处理有缺口的计划。</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div aria-label="台账筛选" className="flex rounded-md border border-slate-800 bg-slate-950 p-1">
                {workflowLedgerFilters.map((filter) => (
                  <button
                    className={`cursor-pointer rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                      workflowLedgerFilter === filter.value ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                    }`}
                    key={filter.value}
                    onClick={() => updateWorkflowLedgerFilter(filter.value, setWorkflowLedgerFilter)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <Link
                className="inline-flex w-fit rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                href="/content-calendar"
              >
                查看全部计划
              </Link>
            </div>
          </div>
          {workflowLedger.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <LedgerFilterSelect
                label="台账产品"
                options={workflowLedgerDimensionOptions.products}
                value={workflowLedgerDimensionFilters.productName}
                onChange={(value) =>
                  setWorkflowLedgerDimensionFilters((current) => ({
                    ...current,
                    productName: value
                  }))
                }
              />
              <LedgerFilterSelect
                label="台账负责人"
                options={workflowLedgerDimensionOptions.owners}
                value={workflowLedgerDimensionFilters.owner}
                onChange={(value) =>
                  setWorkflowLedgerDimensionFilters((current) => ({
                    ...current,
                    owner: value
                  }))
                }
              />
              <LedgerFilterSelect
                label="台账平台"
                options={workflowLedgerDimensionOptions.platforms}
                value={workflowLedgerDimensionFilters.platform}
                onChange={(value) =>
                  setWorkflowLedgerDimensionFilters((current) => ({
                    ...current,
                    platform: value
                  }))
                }
              />
              <button
                className="min-h-10 cursor-pointer self-end rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                onClick={() => setWorkflowLedgerDimensionFilters(allWorkflowLedgerDimensions)}
                type="button"
              >
                清空台账筛选
              </button>
            </div>
          ) : null}
          {workflowLedger.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-slate-50">暂无可追踪的内容计划</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">先从生成式优化研究页生成内容计划，再进入台账追踪发布和复盘。</p>
            </div>
          ) : filteredWorkflowLedger.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-5">
              <p className="text-sm font-semibold text-slate-50">当前筛选下暂无计划</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">可以切回全部计划，或继续推进待处理计划形成新的状态。</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              {filteredWorkflowLedger.map((item) => (
                <article
                  aria-label={`计划 ${item.title}`}
                  className="rounded-lg border border-slate-800 bg-slate-950 p-4"
                  key={item.planId}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-100">
                          {item.stage}
                        </span>
                        <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
                          {item.productName || "未标注产品"}
                        </span>
                        <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
                          {item.platform}
                        </span>
                        <span className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-400">
                          负责人 {item.owner}
                        </span>
                      </div>
                      <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-50">{item.title}</h3>
                      <p className="mt-2 text-xs text-slate-500">待补缺口</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">{item.gap}</p>
                    </div>
                    <div className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3 lg:w-[420px]">
                      <LedgerState label="发布" value={item.publishState} />
                      <LedgerState label="监测" value={item.monitorState} />
                      <LedgerState label="报告" value={item.reportState} />
                    </div>
                    <Link
                      className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                      href={item.href}
                    >
                      {item.actionLabel}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-label="主业务流程" className="fp-card p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-300">主业务流程</p>
              <h2 className="mt-1 text-base font-semibold text-slate-50">从选题到发布复盘</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">
              按真实运营顺序推进，每个阶段都能直接进入对应工作台，先把主链路跑顺，再补细分自动化。
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-5">
            {mainWorkflowStages.map((stage) => (
              <Link
                key={stage.title}
                href={workflowHrefs[stage.title] || stage.href}
                aria-label={stage.title}
                className="group flex min-h-[204px] flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                <span>
                  <span className="text-xs font-semibold text-slate-500">{stage.step}</span>
                  <span className="mt-3 block text-sm font-semibold text-slate-50 group-hover:text-emerald-300">{stage.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-400">{stage.description}</span>
                </span>
                <span className="mt-4 block">
                  <span className="flex flex-wrap gap-2">
                    <span className="inline-flex w-fit rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{stage.status}</span>
                    <span
                      aria-label={`${stage.title}进度`}
                      className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs ${workflowProgressClassName(workflowProgress[stage.title])}`}
                    >
                      {workflowProgress[stage.title]}
                    </span>
                  </span>
                  <span aria-label={`${stage.title}下一步`} className="mt-3 block rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs leading-5 text-slate-300">
                    下一步：{stage.nextActions[workflowProgress[stage.title]]}
                  </span>
                  <span className="mt-3 inline-flex text-xs font-semibold text-emerald-300 group-hover:text-emerald-200">
                    进入处理
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <section className="fp-card p-6">
            <div className="mb-5 flex items-center gap-3">
              <Sparkles aria-hidden="true" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-50">核心流程</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {pipeline.map((item) => (
                <div key={item} className="rounded-md border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>

            <div className="mb-5 mt-8 flex items-center gap-3">
              <Bot aria-hidden="true" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-50">业务能力闭环</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {capabilityLinks.map(([skill, module]) => (
                <div key={skill} className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                  <p className="text-sm text-emerald-300">{skill}</p>
                  <p className="mt-2 text-sm text-slate-200">{module}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="fp-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <CalendarClock aria-hidden="true" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-50">快捷操作</h2>
            </div>
            <div className="space-y-3">
              {quickActions.map(([title, href, Icon, description]) => (
                <Link key={title as string} href={href as string} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-emerald-400">
                  <Icon aria-hidden="true" className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>
                    <span className="block font-semibold text-slate-50">{title as string}</span>
                    <span className="mt-1 block text-sm leading-6 text-slate-400">{description as string}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mb-4 mt-6 flex items-center gap-3">
              <TimerReset aria-hidden="true" className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-slate-50">状态保障</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {stateGuards.map((state) => (
                <div key={state} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <ListChecks aria-hidden="true" className="h-4 w-4 text-emerald-400" />
                  <p className="mt-2 font-semibold text-slate-50">{state}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">页面必须显式覆盖该状态，避免真实监测失败时用假成功数据填充界面。</p>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {foundationChecks.map((item) => (
            <div key={item} className="inline-flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-300">
              <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              {item}
            </div>
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="fp-card p-6">
            <SectionTitle icon={ShieldCheck} eyebrow="动态规则" title="规则中心" />
            <p className="text-sm leading-6 text-slate-300">
              模型平台规则和媒体平台规则分开管理，记录来源、版本、更新时间、置信度、人工确认状态和来源复核审计。
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold text-slate-50">模型平台规则</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">深度求索、豆包、文心一言、腾讯元宝、月之暗面等生成式平台规则独立维护。</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950 p-4">
                <h3 className="font-semibold text-slate-50">媒体平台规则</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">公众号、小红书、知乎、百家号、搜狐、官网等发布规则独立维护。</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {ruleFields.map((field) => (
                <span key={field} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                  {field}
                </span>
              ))}
            </div>
            <Link className="mt-5 inline-flex rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300" href="/rules">
              进入规则中心
            </Link>
          </div>

          <div className="fp-card p-6">
            <SectionTitle icon={SearchCheck} eyebrow="真实证据" title="监测中心" />
            <span className="mb-4 inline-flex rounded-md border border-amber-500 bg-amber-950 px-3 py-1 text-xs text-amber-300">模拟数据不计入真实效果</span>
            <p className="text-sm leading-6 text-slate-300">
              监测结果必须保存查询问题、目标模型平台、目标品牌、目标链接、原始响应和人工复核状态。系统只记录证据，不承诺排名。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {evidenceLevels.map(([level, label]) => (
                <div key={level} className="rounded-md border border-slate-800 bg-slate-950 p-4">
                  <p className="text-2xl font-semibold text-slate-50">{level}</p>
                  <p className="mt-2 text-sm text-slate-300">{label}</p>
                </div>
              ))}
            </div>
            <Link className="mt-5 inline-flex rounded-md bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300" href="/geo-monitor">
              进入监测中心
            </Link>
          </div>
        </div>

        <section className="fp-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <LayoutDashboard aria-hidden="true" className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-50">模拟模式说明</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <NoticeCard icon={Bot} title="当前处于模拟模式" description="页面优先服务真实运营动作，而不只是展示项目阶段。" />
            <NoticeCard icon={AlertTriangle} title="不用虚假数据冒充真实" description="规则来源与证据缺失时显示空状态或错误状态，不生成假成功数据。" />
            <NoticeCard icon={Database} title="真实数据隔离" description="真实、人工录入、模拟、演示数据必须分开统计，模拟数据不进入真实效果。" />
          </div>
        </section>
      </main>
    </ProLayout>
  );
}

function NoticeCard({ icon: Icon, title, description }: { icon: typeof Activity; title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
      <Icon aria-hidden="true" className="h-5 w-5 text-emerald-400" />
      <p className="mt-3 font-semibold text-slate-50">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: typeof Activity; eyebrow: string; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <Icon aria-hidden="true" className="h-5 w-5 text-emerald-400" />
      <div>
        <p className="text-sm text-emerald-300">{eyebrow}</p>
        <h2 className="text-base font-semibold text-slate-50">{title}</h2>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  ratio,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  ratio: number;
  tone: StatTone;
}) {
  return <ProStatCard label={label} value={value} detail={detail} ratio={ratio} tone={tone} />;
}

function FocusTaskMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/80 px-3 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-100">{value}</p>
    </div>
  );
}

function LedgerState({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/80 px-3 py-2">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function LedgerFilterSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <select
        aria-label={label}
        className="min-h-10 cursor-pointer rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition-colors hover:border-emerald-400 focus-visible:border-emerald-300"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">全部</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function buildContentLifecycleSummary(plans: ContentCalendarPlan[]): ContentLifecycleSummary {
  const counts = new Map<ContentLifecycleStage, number>(contentLifecycleStages.map((stage) => [stage.label, 0]));

  plans.forEach((plan) => {
    const stage = normalizeContentLifecycleStage(plan.content_stage);
    counts.set(stage, (counts.get(stage) || 0) + 1);
  });

  const stages = contentLifecycleStages.map((stage) => ({
    ...stage,
    count: counts.get(stage.label) || 0
  }));
  const priorityStage = stages.find((stage) => stage.count > 0)?.label || "暂无内容计划";

  return {
    total: plans.length,
    priorityStage,
    stages
  };
}

function readWorkflowLedgerFilterFromUrl(): WorkflowLedgerFilter {
  if (typeof window === "undefined") return "all";

  const value = new URLSearchParams(window.location.search).get("ledger");
  return isWorkflowLedgerFilter(value) ? value : "all";
}

function updateWorkflowLedgerFilter(
  value: WorkflowLedgerFilter,
  setWorkflowLedgerFilter: (value: WorkflowLedgerFilter) => void
) {
  setWorkflowLedgerFilter(value);

  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (value === "all") {
    url.searchParams.delete("ledger");
  } else {
    url.searchParams.set("ledger", value);
  }
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function isWorkflowLedgerFilter(value: string | null): value is WorkflowLedgerFilter {
  return value === "all" || value === "todo" || value === "reviewed";
}

function buildWorkflowLedger(
  plans: ContentCalendarPlan[],
  records: GeoMonitorRecord[],
  publishQueueItems: HomePublishQueueItem[] = [],
  reportSnapshots: GeoReportSnapshot[] = []
): WorkflowLedgerItem[] {
  return plans.slice(0, 6).map((plan) => {
    const publishItem = findPublishItemForPlan(plan, publishQueueItems);
    const record = findRecordForPlan(plan, publishItem, records);
    const snapshot = findReportSnapshotForPlan(plan, record, reportSnapshots);
    const published = Boolean(publishItem?.publishedUrl || publishItem?.actualPublishAt || publishItem?.status === "published");
    const normalizedStage = snapshot ? "已复盘" : record ? "待监测" : published ? "待监测" : normalizeContentLifecycleStage(plan.content_stage);
    const href = buildWorkflowLedgerHref(plan, publishItem, record, snapshot);

    return {
      planId: plan.id,
      title: plan.topic_title,
      productName: normalizeLedgerDimension(plan.product_name, "未标注产品"),
      owner: normalizeLedgerDimension(plan.owner, "未分配"),
      platform: normalizeLedgerDimension(plan.platform, "未标注平台"),
      stage: normalizedStage,
      publishState: published ? "已发布" : publishItem ? "待发布" : "未入队",
      monitorState: record ? "已有记录" : published ? "待录入" : "未开始",
      reportState: snapshot ? "已生成" : record ? "待生成" : "未开始",
      gap: buildWorkflowLedgerGap(published, record, snapshot, plan),
      actionLabel: buildWorkflowLedgerActionLabel(published, record, snapshot, plan),
      href
    };
  });
}

function buildWorkflowLedgerDimensionOptions(items: WorkflowLedgerItem[]) {
  return {
    products: uniqueLedgerOptions(items.map((item) => item.productName)),
    owners: uniqueLedgerOptions(items.map((item) => item.owner)),
    platforms: uniqueLedgerOptions(items.map((item) => item.platform))
  };
}

function uniqueLedgerOptions(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function normalizeLedgerDimension(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeContentLifecycleStage(stage?: ContentCalendarPlan["content_stage"]): ContentLifecycleStage {
  if (stage === "已完成") return "已复盘";
  if (stage && contentLifecycleStages.some((item) => item.label === stage)) return stage as ContentLifecycleStage;
  return "待生产";
}

function buildWorkflowProgress(
  plans: ContentCalendarPlan[],
  records: GeoMonitorRecord[],
  publishQueueItems: HomePublishQueueItem[] = []
): Record<string, WorkflowProgressStatus> {
  const hasPlans = plans.length > 0;
  const hasScheduledPlans = plans.some((plan) => Boolean(plan.scheduled_at || plan.owner));
  const hasGeneratedPlans = plans.some((plan) => plan.status === "已生成" || plan.content_stage === "已完成");
  const hasPublishedItems = publishQueueItems.some((item) => item.status === "published" && Boolean(item.publishedUrl || item.actualPublishAt));
  const hasMonitorRecords = records.length > 0;

  return {
    产品资料: hasPlans ? "已完成" : "进行中",
    生成式优化研究: hasPlans ? "已完成" : "进行中",
    内容日历: hasScheduledPlans ? "已完成" : hasPlans ? "进行中" : "待处理",
    内容适配: hasGeneratedPlans ? "已完成" : hasPlans ? "进行中" : "待处理",
    发布准备: hasPublishedItems ? "已完成" : hasGeneratedPlans ? "进行中" : "待处理",
    监测复盘: hasMonitorRecords ? "已完成" : "待处理"
  };
}

function buildWorkflowHrefs(
  plans: ContentCalendarPlan[],
  records: GeoMonitorRecord[],
  publishQueueItems: HomePublishQueueItem[] = []
): Record<string, string> {
  const generatedPlan = plans.find((plan) => plan.status === "已生成" || plan.content_stage === "已完成");
  const scheduledPlan = plans.find((plan) => Boolean(plan.scheduled_at || plan.owner)) || plans[0];
  const publishedItem = publishQueueItems.find((item) => item.status === "published" && Boolean(item.publishedUrl || item.actualPublishAt));
  const latestRecord = [...records].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0];

  return {
    产品资料: plans.length > 0 ? "/geo-research" : "/products",
    生成式优化研究: plans.length > 0 ? "/content-calendar" : "/geo-research",
    内容日历: generatedPlan ? buildHref("/content-adaptation", { plan: generatedPlan.id }) : scheduledPlan ? "/content-calendar" : "/content-calendar",
    内容适配: generatedPlan ? buildHref("/publish-queue", { plan: generatedPlan.id }) : "/content-adaptation",
    发布准备: publishedItem ? buildMonitorRecordsHref(publishedItem) : "/publish-queue",
    监测复盘: latestRecord ? buildMonitorReportHref(latestRecord) : "/geo-monitor"
  };
}

function findPublishItemForPlan(plan: ContentCalendarPlan, publishQueueItems: HomePublishQueueItem[]) {
  return publishQueueItems.find((item) => {
    const itemPlanId = getContentPlanIdFromVersion(item.versionId);
    return itemPlanId === plan.id || item.topicTitle === plan.topic_title || item.sourceTopicTitle === plan.topic_title;
  });
}

function findRecordForPlan(plan: ContentCalendarPlan, publishItem: HomePublishQueueItem | undefined, records: GeoMonitorRecord[]) {
  return records.find((record) => {
    const queryMatched = record.query === plan.topic_title;
    const urlMatched = Boolean(publishItem?.publishedUrl && record.target_url === publishItem.publishedUrl);
    const productMatched = Boolean(plan.product_name && record.product_name === plan.product_name && record.query.includes(plan.topic_title));
    return queryMatched || urlMatched || productMatched;
  });
}

function findReportSnapshotForPlan(plan: ContentCalendarPlan, record: GeoMonitorRecord | undefined, snapshots: GeoReportSnapshot[]) {
  return snapshots.find((snapshot) => {
    const planMatched = snapshot.scope_label?.includes(plan.id) || snapshot.report_text?.includes(`内容计划：${plan.id}`);
    const queryMatched = snapshot.query === plan.topic_title || (record?.query && snapshot.query === record.query);
    const productMatched = Boolean(plan.product_name && snapshot.product_name === plan.product_name && (snapshot.query === plan.topic_title || snapshot.scope_label?.includes(plan.topic_title)));
    return planMatched || queryMatched || productMatched;
  });
}

function buildWorkflowLedgerGap(
  published: boolean,
  record: GeoMonitorRecord | undefined,
  snapshot: GeoReportSnapshot | undefined,
  plan: ContentCalendarPlan
) {
  if (snapshot) return "已形成复盘报告";
  if (record) return "缺少运营报告快照";
  if (published) return "缺少真实或人工监测记录";
  if (plan.status !== "已生成") return "缺少平台适配版本";
  return "缺少发布记录或发布链接";
}

function buildWorkflowLedgerActionLabel(
  published: boolean,
  record: GeoMonitorRecord | undefined,
  snapshot: GeoReportSnapshot | undefined,
  plan: ContentCalendarPlan
) {
  if (snapshot) return "查看复盘报告";
  if (record) return "生成运营报告";
  if (published) return "录入监测记录";
  if (plan.status === "已生成") return "处理发布准备";
  return "进入内容适配";
}

function buildWorkflowLedgerHref(
  plan: ContentCalendarPlan,
  publishItem: HomePublishQueueItem | undefined,
  record: GeoMonitorRecord | undefined,
  snapshot: GeoReportSnapshot | undefined
) {
  if (snapshot || record) {
    return buildHref("/geo-monitor/report", {
      session: record?.session_id || snapshot?.session_id,
      query: record?.query || snapshot?.query || plan.topic_title,
      url: record?.target_url || publishItem?.publishedUrl,
      product: plan.product_name || snapshot?.product_name,
      plan: plan.id
    });
  }

  if (publishItem?.publishedUrl || publishItem?.actualPublishAt || publishItem?.status === "published") {
    return buildHref("/geo-monitor/records", {
      session: publishItem.monitorSessionId,
      query: publishItem.topicTitle || publishItem.sourceTopicTitle || plan.topic_title,
      url: publishItem.publishedUrl,
      product: plan.product_name,
      plan: plan.id
    });
  }

  if (plan.status === "已生成") {
    return buildHref("/publish-queue", { plan: plan.id });
  }

  return buildHref("/content-adaptation", { plan: plan.id });
}

function buildMonitorRecordsHref(item: HomePublishQueueItem) {
  return buildHref("/geo-monitor/records", {
    session: item.monitorSessionId,
    query: item.topicTitle || item.sourceTopicTitle,
    url: item.publishedUrl,
    plan: getContentPlanIdFromVersion(item.versionId)
  });
}

function buildMonitorReportHref(record: GeoMonitorRecord) {
  return buildHref("/geo-monitor/report", {
    session: record.session_id,
    query: record.query,
    url: record.target_url
  });
}

function buildHref(pathname: string, params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildBusinessFocus(
  plans: ContentCalendarPlan[],
  records: GeoMonitorRecord[],
  publishQueueItems: HomePublishQueueItem[] = [],
  reportSnapshots: GeoReportSnapshot[] = []
): BusinessFocus {
  const progress = buildWorkflowProgress(plans, records, publishQueueItems);
  const hrefs = buildWorkflowHrefs(plans, records, publishQueueItems);
  const publishedItem = publishQueueItems.find((item) => item.status === "published" && Boolean(item.publishedUrl || item.actualPublishAt));
  const latestRecord = [...records].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0];

  for (const stage of mainWorkflowStages) {
    const status = progress[stage.title];
    if (status !== "已完成") {
      const href = stage.title === "监测复盘" && publishedItem ? buildMonitorRecordsHref(publishedItem) : hrefs[stage.title] || stage.href;
      return {
        title: stage.title,
        status,
        nextAction: stage.nextActions[status],
        href,
        detail: buildBusinessFocusDetail(stage.title, status),
        ...buildBusinessFocusTask(stage.title, status, plans, records, publishedItem)
      };
    }
  }

  if (reportSnapshots.length === 0 && latestRecord) {
    return {
      title: "运营报告",
      status: "进行中",
      nextAction: "生成运营报告",
      href: buildMonitorReportHref(latestRecord),
      detail: "已有监测记录，但还没有保存报告快照，建议先生成一份可回看的运营周报。",
      relatedObject: latestRecord.query || latestRecord.session_id,
      gap: "缺少运营报告快照",
      actionState: "进行中"
    };
  }

  return {
    title: "下一轮选题",
    status: "进行中",
    nextAction: "复盘报告并启动下一轮选题",
    href: "/geo-research",
    detail: "当前主链路已经形成记录和报告，可以把复盘结论回流到下一轮研究选题。",
    relatedObject: reportSnapshots[0]?.scope_label || "已完成闭环",
    gap: "需要启动下一轮选题",
    actionState: "进行中"
  };
}

function buildBusinessFocusTask(
  title: string,
  status: WorkflowProgressStatus,
  plans: ContentCalendarPlan[],
  records: GeoMonitorRecord[],
  publishedItem?: HomePublishQueueItem
) {
  const latestPlan = plans[0];
  const latestRecord = [...records].sort((a, b) => b.checked_at.localeCompare(a.checked_at))[0];

  if (title === "生成式优化研究") {
    return {
      relatedObject: latestPlan?.topic_title || "暂无选题",
      gap: status === "进行中" ? "缺少可排期内容计划" : "缺少研究选题",
      actionState: status
    };
  }
  if (title === "产品资料") {
    return {
      relatedObject: latestPlan?.product_name || latestPlan?.brand_name || "暂无产品资产",
      gap: status === "进行中" ? "需要沉淀产品资料" : "缺少产品资产",
      actionState: status
    };
  }
  if (title === "内容日历") {
    return {
      relatedObject: latestPlan?.topic_title || "最新内容计划",
      gap: "缺少排期、负责人或计划状态",
      actionState: status
    };
  }
  if (title === "内容适配") {
    return {
      relatedObject: latestPlan?.topic_title || "最新内容计划",
      gap: "缺少可发布平台版本",
      actionState: status
    };
  }
  if (title === "发布准备") {
    return {
      relatedObject: latestPlan?.topic_title || publishedItem?.topicTitle || "最新发布项",
      gap: "缺少已发布状态或发布链接",
      actionState: status
    };
  }
  if (title === "监测复盘") {
    return {
      relatedObject: publishedItem?.topicTitle || publishedItem?.sourceTopicTitle || publishedItem?.publishedUrl || latestRecord?.query || "最新发布结果",
      gap: "缺少真实或人工监测记录",
      actionState: status
    };
  }
  return {
    relatedObject: latestRecord?.query || latestPlan?.topic_title || "主业务流程",
    gap: "按当前阶段继续补齐",
    actionState: status
  };
}

function buildBusinessFocusDetail(title: string, status: WorkflowProgressStatus) {
  if (title === "生成式优化研究") {
    return status === "进行中" ? "还没有形成可排期的内容计划，先把产品、场景、问题和证据沉淀为选题。" : "研究阶段尚未启动，需要先建立选题。";
  }
  if (title === "内容日历") return "已有选题，但还缺少排期、负责人或计划状态，需要先把生产节奏排出来。";
  if (title === "内容适配") return "已有内容计划，但还没有形成可发布版本，需要继续完成平台适配。";
  if (title === "发布准备") return "已有可发布内容，但发布状态或发布链接还没闭合，需要先确认发布结果。";
  if (title === "监测复盘") return "已有发布结果，但还没有真实或人工监测记录，需要录入查询证据。";
  return "按当前业务阶段继续推进。";
}

function readHomePublishQueue(): HomePublishQueueItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(publishQueueStorageKey);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeHomePublishQueueItem) : [];
  } catch {
    return [];
  }
}

function normalizeHomePublishQueueItem(item: PublishQueueItem | HomePublishQueueItem): HomePublishQueueItem {
  if (isApiPublishQueueItem(item)) {
    return {
      status: item.status,
      versionId: item.version_id,
      topicTitle: item.topic_title,
      sourceTopicTitle: item.source_topic_title,
      publishedUrl: item.published_url,
      actualPublishAt: item.actual_publish_at,
      monitorSessionId: item.monitor_session_id
    };
  }

  return {
    status: item.status,
    versionId: item.versionId,
    topicTitle: item.topicTitle,
    sourceTopicTitle: item.sourceTopicTitle,
    publishedUrl: item.publishedUrl,
    actualPublishAt: item.actualPublishAt,
    monitorSessionId: item.monitorSessionId
  };
}

function getContentPlanIdFromVersion(versionId?: string) {
  const prefix = "content-calendar-";
  if (!versionId?.startsWith(prefix)) return undefined;
  return versionId.slice(prefix.length);
}

function isApiPublishQueueItem(item: PublishQueueItem | HomePublishQueueItem): item is PublishQueueItem {
  return "topic_title" in item || "published_url" in item || "actual_publish_at" in item;
}

function workflowProgressClassName(status: WorkflowProgressStatus) {
  if (status === "已完成") return "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  if (status === "进行中") return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  return "border-slate-700 bg-slate-900 text-slate-400";
}
