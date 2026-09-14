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

const pipeline = ["产品图片 / 产品资料", "产品理解", "生成式优化研究", "事实核查", "质量审查", "引用准备度", "多平台适配"];

const capabilityLinks = [
  ["软件工程", "前后端骨架、接口服务与页面状态管理"],
  ["智能应用", "模型接入层与模拟模式预留"],
  ["生成式优化", "实体库、问题库、引用准备度评分"],
  ["内容运营", "官网、公众号、知乎、百家号、小红书"],
  ["视觉扩展", "图片与视频工作流预留"],
  ["智能沙盘", "项目资料与图纸工作区预留"]
];

const operationMetrics = [
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
