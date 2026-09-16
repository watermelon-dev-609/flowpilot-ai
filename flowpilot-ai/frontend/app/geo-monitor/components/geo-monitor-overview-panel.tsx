import { AlertTriangle, ClipboardCheck, DatabaseZap, Eye, FileSearch, RefreshCw, SearchCheck } from "lucide-react";
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
  const accountableSessions = sessions.filter((session) => session.data_mode === "real" || session.data_mode === "manual");
  const realRecords = records.filter((record) => record.data_mode === "real" || record.data_mode === "manual");
  const highestEvidenceLevel = Math.max(...realRecords.map((record) => record.evidence_level), 0);
  const pendingReview = realRecords.filter((record) => record.review_status_code === "pending" || record.manual_review_status === "待复核").length;
  const citedRecords = realRecords.filter((record) => record.source_cited).length;
  const productRiskRows = buildProductRiskRows(realRecords);

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
          <OverviewMetric label="监测任务" value={accountableSessions.length} detail="仅统计真实 / 人工任务" ratio={1} />
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
            ratio={pendingReview / Math.max(realRecords.length, 1)}
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
        <ProductRiskBoard rows={productRiskRows} />
      </div>
    </section>
  );
}

type ProductRiskRow = {
  productName: string;
  totalRecords: number;
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
  riskLabel: string;
  nextAction: string;
};

function ProductRiskBoard({ rows }: { rows: ProductRiskRow[] }) {
  return (
    <section aria-label="产品级风险与机会看板" className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-5" role="region">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-emerald-300">产品优先级</p>
          <h3 className="mt-1 text-base font-semibold text-slate-50">产品级风险与机会看板</h3>
        </div>
        <Link
          className="inline-flex w-fit rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 hover:text-emerald-200"
          href="/geo-monitor/report"
        >
          查看完整报表
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
          暂无带产品名称的真实监测记录。录入产品后，这里会自动排序风险和机会。
        </p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {rows.map((row) => (
            <div key={row.productName} className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-50">{row.productName}</p>
                  <p className="mt-1 text-xs text-slate-400">{row.totalRecords} 条记录</p>
                </div>
                <span className={getProductRiskBadgeClass(row.riskLabel)}>
                  {row.riskLabel === "高风险" ? <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" /> : null}
                  {row.riskLabel}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <ProductRate label="品牌" value={row.brandMentionRate} />
                <ProductRate label="检索" value={row.pageRetrievalRate} />
                <ProductRate label="引用" value={row.sourceCitationRate} />
              </div>
              <p className="mt-4 rounded-md bg-slate-950/70 px-3 py-2 text-sm text-slate-300">{row.nextAction}</p>
              <Link
                className="mt-4 inline-flex rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                href={`/geo-monitor/report?product=${encodeURIComponent(row.productName)}`}
              >
                查看{row.productName}报告
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductRate({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-100">{value}%</p>
    </div>
  );
}

function buildProductRiskRows(records: GeoMonitorRecord[]): ProductRiskRow[] {
  const grouped = new Map<string, GeoMonitorRecord[]>();

  records.forEach((record) => {
    const productName = record.product_name?.trim();
    if (!productName) return;
    grouped.set(productName, [...(grouped.get(productName) || []), record]);
  });

  return Array.from(grouped.entries())
    .map(([productName, productRecords]) => {
      const base = Math.max(productRecords.length, 1);
      const brandMentionRate = Math.round((productRecords.filter((record) => record.brand_mentioned).length / base) * 100);
      const pageRetrievalRate = Math.round((productRecords.filter((record) => record.page_retrieved).length / base) * 100);
      const sourceCitationRate = Math.round((productRecords.filter((record) => record.source_cited).length / base) * 100);
      const lowestRate = Math.min(brandMentionRate, pageRetrievalRate, sourceCitationRate);

      return {
        productName,
        totalRecords: productRecords.length,
        brandMentionRate,
        pageRetrievalRate,
        sourceCitationRate,
        riskLabel: lowestRate < 40 ? "高风险" : lowestRate < 70 ? "需优化" : "表现稳定",
        nextAction: buildProductNextAction({ brandMentionRate, pageRetrievalRate, sourceCitationRate })
      };
    })
    .sort((a, b) => getProductRiskScore(b) - getProductRiskScore(a) || b.totalRecords - a.totalRecords || a.productName.localeCompare(b.productName, "zh-CN"))
    .slice(0, 6);
}

function buildProductNextAction({
  brandMentionRate,
  pageRetrievalRate,
  sourceCitationRate
}: {
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
}) {
  if (sourceCitationRate < 40) return "优先补来源引用";
  if (pageRetrievalRate < 50) return "优先补可检索页面";
  if (brandMentionRate < 60) return "优先补品牌实体信号";
  return "保持复盘频率";
}

function getProductRiskScore(row: ProductRiskRow) {
  return 300 - row.brandMentionRate - row.pageRetrievalRate - row.sourceCitationRate;
}

function getProductRiskBadgeClass(riskLabel: string) {
  if (riskLabel === "高风险") {
    return "inline-flex items-center gap-1 rounded-md border border-rose-500/50 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-200";
  }

  if (riskLabel === "需优化") {
    return "inline-flex items-center gap-1 rounded-md border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-200";
  }

  return "inline-flex items-center gap-1 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-200";
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
