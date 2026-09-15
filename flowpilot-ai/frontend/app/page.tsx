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
import { loadGeoMonitorSnapshot, loadRuleUpdateReminders } from "./lib/flowpilot-api";

const pipeline = ["产品图片 / 产品资料", "产品理解", "生成式优化研究", "事实核查", "质量审查", "引用准备度", "多平台适配"];

const mainWorkflowStages = [
  {
    step: "01",
    title: "生成式优化研究",
    href: "/geo-research",
    status: "选题池",
    description: "先把产品、场景、问题和证据沉淀成可生产选题。"
  },
  {
    step: "02",
    title: "内容日历",
    href: "/content-calendar",
    status: "生产排期",
    description: "把选题转成计划，安排负责人、平台、状态和发布时间。"
  },
  {
    step: "03",
    title: "内容适配",
    href: "/content-adaptation",
    status: "草稿加工",
    description: "按平台规则生成版本，检查事实、风格和引用准备度。"
  },
  {
    step: "04",
    title: "发布准备",
    href: "/publish-queue",
    status: "待发布",
    description: "汇总已适配内容，确认发布状态、负责人和导出清单。"
  },
  {
    step: "05",
    title: "监测复盘",
    href: "/geo-monitor",
    status: "效果回收",
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

export default function Home() {
  const [operationMetrics, setOperationMetrics] = useState(defaultOperationMetrics);

  useEffect(() => {
    let active = true;

    async function loadOperationMetrics() {
      try {
        const [ruleReminders, geoSnapshot] = await Promise.all([loadRuleUpdateReminders(), loadGeoMonitorSnapshot()]);
        const accountableSessions = geoSnapshot.sessions.sessions.filter((session) => session.data_mode !== "mock");
        const accountableRecords = geoSnapshot.records.records.filter((record) => record.data_mode !== "mock");
        const highestEvidenceLevel = accountableRecords.reduce((highest, record) => Math.max(highest, record.evidence_level), 0);

        if (!active) return;

        setOperationMetrics([
          ["待复核规则", String(ruleReminders.reminders.length), "来自规则复核提醒接口", Math.min(ruleReminders.reminders.length / 12, 1), ruleReminders.reminders.length > 0 ? "warning" : "success"],
          ["监测任务", String(accountableSessions.length), "仅统计真实 / 人工任务，排除模拟数据", Math.min(accountableSessions.length / 8, 1), "primary"],
          ["监测记录", String(accountableRecords.length), "仅统计真实 / 人工记录，排除模拟数据", Math.min(accountableRecords.length / 20, 1), accountableRecords.length > 0 ? "success" : "warning"],
          ["最高证据等级", String(highestEvidenceLevel), "基于真实 / 人工监测记录计算", highestEvidenceLevel / 4, highestEvidenceLevel >= 3 ? "success" : "warning"]
        ]);
      } catch {
        if (!active) return;
        setOperationMetrics([
          ["待复核规则", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["监测任务", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["监测记录", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"],
          ["最高证据等级", "0", "接口暂不可用，未使用硬编码业务数据", 0, "warning"]
        ]);
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
                key={stage.href}
                href={stage.href}
                aria-label={stage.title}
                className="group flex min-h-[164px] flex-col justify-between rounded-lg border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              >
                <span>
                  <span className="text-xs font-semibold text-slate-500">{stage.step}</span>
                  <span className="mt-3 block text-sm font-semibold text-slate-50 group-hover:text-emerald-300">{stage.title}</span>
                  <span className="mt-2 block text-xs leading-5 text-slate-400">{stage.description}</span>
                </span>
                <span className="mt-4 inline-flex w-fit rounded-md border border-slate-700 px-2.5 py-1 text-xs text-slate-300">{stage.status}</span>
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
