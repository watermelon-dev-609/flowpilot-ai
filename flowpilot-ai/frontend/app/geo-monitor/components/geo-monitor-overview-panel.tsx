import { ClipboardCheck, DatabaseZap, Eye, FileSearch, RefreshCw, SearchCheck } from "lucide-react";
import Link from "next/link";
import { StateCard } from "../../components/state-card";
import { ProStatCard, StatTone } from "../../components/pro-stat-card";
import { GeoMonitorRecord, GeoMonitorSession } from "../../lib/flowpilot-api";
import { levelDescriptions } from "./shared";

export function GeoMonitorEvidenceGuide({ evidenceLevels }: { evidenceLevels: Record<string, string> }) {
  return (
    <section className="fp-card">
      <div className="fp-panel-header flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-emerald-300">证据等级 0-4</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">品牌提及 → 页面检索 → 来源引用</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="w-fit rounded-md border border-emerald-800 bg-emerald-950 px-3 py-1 text-xs text-emerald-300">
            已连接后端接口
          </span>
          <span className="w-fit rounded-md border border-amber-500 bg-amber-950 px-3 py-1 text-xs text-amber-300">
            示例数据不计入真实监测效果
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(evidenceLevels)
            .sort(([left], [right]) => Number(left) - Number(right))
            .map(([level, label]) => (
              <div key={level} className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-3xl font-semibold text-slate-50">{level}</p>
                <p className="mt-2 font-semibold text-emerald-300">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{levelDescriptions[level]}</p>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export function GeoMonitorOverviewPanel({
  sessions,
  records
}: {
  sessions: GeoMonitorSession[];
  records: GeoMonitorRecord[];
}) {
  const realRecords = records.filter((record) => record.data_mode === "real" || record.data_mode === "manual");
  const highestEvidenceLevel = Math.max(...records.map((record) => record.evidence_level), 0);
  const pendingReview = records.filter((record) => record.review_status_code === "pending" || record.manual_review_status === "待复核").length;
  const citedRecords = records.filter((record) => record.source_cited).length;

  return (
    <section className="fp-card">
      <div className="fp-panel-header flex items-center gap-3">
        <SearchCheck aria-hidden="true" className="h-5 w-5 text-emerald-300" />
        <div>
          <p className="text-sm text-emerald-300">真实证据总览</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">生成式监测数据概览</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OverviewMetric label="监测任务" value={sessions.length} detail="品牌、产品或关键词维度" ratio={1} />
          <OverviewMetric
            label="真实/人工记录"
            value={realRecords.length}
            detail="排除纯示例证据"
            ratio={realRecords.length / Math.max(records.length, 1)}
            tone="success"
          />
          <OverviewMetric
            label="待复核记录"
            value={pendingReview}
            detail="需要人工判断证据可靠性"
            ratio={pendingReview / Math.max(records.length, 1)}
            tone="warning"
          />
          <OverviewMetric
            label="最高证据等级"
            value={highestEvidenceLevel}
            detail={`来源引用记录 ${citedRecords} 条`}
            ratio={highestEvidenceLevel / 4}
            tone={highestEvidenceLevel >= 3 ? "success" : "primary"}
          />
        </div>
      </div>
    </section>
  );
}

export function GeoMonitorModuleLinks() {
  const modules = [
    {
      href: "/geo-monitor/sessions",
      title: "监测任务管理",
      description: "创建品牌、产品或关键词维度的生成式监测任务。"
    },
    {
      href: "/geo-monitor/records",
      title: "监测记录库",
      description: "录入真实模型查询结果，查看证据等级和复核状态。"
    },
    {
      href: "/geo-monitor/review",
      title: "证据复核中心",
      description: "集中处理待复核、已确认、已驳回和需补证记录。"
    },
    {
      href: "/geo-monitor/report",
      title: "生成式监测数据报表",
      description: "查看品牌提及、页面检索、来源引用等运营指标。"
    }
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {modules.map((module) => (
        <Link
          key={module.href}
          href={module.href}
          className="group rounded-lg border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-300"
        >
          <p className="font-semibold text-slate-50 transition-colors group-hover:text-emerald-200">{module.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{module.description}</p>
          <p className="mt-4 text-sm text-emerald-300">进入模块 →</p>
        </Link>
      ))}
    </section>
  );
}

export function GeoMonitorSupportCards() {
  return (
    <section className="grid gap-4 lg:grid-cols-4">
      <StateCard icon={FileSearch} title="原始响应" description="保存模型原始回答，方便复核是否真的引用页面。" />
      <StateCard icon={ClipboardCheck} title="人工复核" description="高价值记录必须由人工确认，不让模型自证成功。" />
      <StateCard icon={DatabaseZap} title="真实数据隔离" description="真实、人工录入、示例、演示数据必须分开统计。" />
      <StateCard icon={Eye} title="错误状态" description="监测失败时记录失败原因，不生成虚假成功数据。" />
    </section>
  );
}

export function GeoMonitorLoadingPanel() {
  return (
    <section className="fp-card p-6" aria-busy="true">
      <div className="mb-5 flex items-center gap-3">
        <SearchCheck aria-hidden="true" className="h-5 w-5 text-emerald-300" />
        <h2 className="text-2xl font-semibold text-slate-50">生成式监测数据加载中</h2>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-md bg-slate-800/80" />
        ))}
      </div>
    </section>
  );
}

export function GeoMonitorEmptyPanel() {
  return (
    <section className="fp-card p-6">
      <p className="text-sm text-emerald-300">空状态</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">暂无生成式监测数据</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        请先创建真实查询任务，系统不会用示例结果冒充品牌提及、页面检索或来源引用。
      </p>
    </section>
  );
}

export function GeoMonitorErrorPanel({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-6">
      <div className="flex items-center gap-3">
        <RefreshCw aria-hidden="true" className="h-5 w-5 text-rose-200" />
        <h2 className="text-2xl font-semibold text-slate-50">接口请求失败</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-rose-100">
        后端不可用时不生成虚假监测成功数据，请检查服务后重试。
      </p>
      <p className="mt-3 text-xs text-rose-200">{message}</p>
    </section>
  );
}

export function OverviewMetric({
  label,
  value,
  detail,
  ratio,
  tone
}: {
  label: string;
  value: number;
  detail: string;
  ratio?: number;
  tone?: StatTone;
}) {
  return <ProStatCard label={label} value={value} detail={detail} ratio={ratio} tone={tone} />;
}
