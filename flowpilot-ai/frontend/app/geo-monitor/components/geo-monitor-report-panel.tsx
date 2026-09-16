import { useMemo, useState } from "react";
import { ProStatCard, StatTone } from "../../components/pro-stat-card";
import {
  GeoMonitorRecord,
  GeoMonitorSession,
  GeoReportSnapshot,
  GeoReportSnapshotCreatePayload,
  createGeoReportSnapshot
} from "../../lib/flowpilot-api";

type ReportFilters = {
  aiChannel: string;
  reviewStatus: string;
  minimumEvidenceLevel: string;
  sessionId: string;
  startDate: string;
  endDate: string;
  query: string;
  sourceUrl: string;
  productName: string;
};

type ReportSnapshot = {
  id: string;
  createdAt: string;
  createdDate: string;
  scopeLabel: string;
  reportPeriod: string;
  totalRecords: number;
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
  reportText: string;
  sessionId: string;
  query: string;
  productName: string;
};

type ProductComparisonRow = {
  productName: string;
  totalRecords: number;
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
};

type SaveReportSnapshot = (payload: GeoReportSnapshotCreatePayload) => Promise<GeoReportSnapshot>;

type SnapshotFilters = {
  query: string;
  sessionId: string;
  startDate: string;
  endDate: string;
};

const defaultSnapshotFilters: SnapshotFilters = {
  query: "",
  sessionId: "all",
  startDate: "",
  endDate: ""
};

const defaultReportFilters: ReportFilters = {
  aiChannel: "all",
  reviewStatus: "all",
  minimumEvidenceLevel: "0",
  sessionId: "all",
  startDate: "",
  endDate: "",
  query: "",
  sourceUrl: "",
  productName: ""
};

const reviewStatusOptions = [
  { value: "all", label: "全部状态" },
  { value: "verified", label: "已确认" },
  { value: "pending", label: "待复核" },
  { value: "needs_evidence", label: "需补证" },
  { value: "rejected", label: "已驳回" }
];

export function GeoMonitorReportPanel({
  records,
  sessions = [],
  initialReportSnapshots = [],
  onSaveReportSnapshot = createGeoReportSnapshot
}: {
  records: GeoMonitorRecord[];
  sessions?: GeoMonitorSession[];
  initialReportSnapshots?: GeoReportSnapshot[];
  onSaveReportSnapshot?: SaveReportSnapshot;
}) {
  const realRecords = records.filter((record) => record.data_mode === "real" || record.data_mode === "manual");
  const aiChannelOptions = useMemo(() => Array.from(new Set(realRecords.map((record) => record.ai_channel).filter(Boolean))).sort(), [realRecords]);
  const productOptions = useMemo(() => Array.from(new Set(realRecords.map((record) => record.product_name || "").filter(Boolean))).sort(), [realRecords]);
  const initialFilters = useMemo(() => ({ ...defaultReportFilters, ...readReportFocus() }), []);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(initialFilters);
  const [weeklyReportText, setWeeklyReportText] = useState("");
  const [reportScopeError, setReportScopeError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
  const [snapshotSaveStatus, setSnapshotSaveStatus] = useState("");
  const [snapshotReuseStatus, setSnapshotReuseStatus] = useState("");
  const [expandedSnapshotId, setExpandedSnapshotId] = useState("");
  const [snapshotFilters, setSnapshotFilters] = useState<SnapshotFilters>(defaultSnapshotFilters);
  const [reportSnapshots, setReportSnapshots] = useState<ReportSnapshot[]>(() =>
    initialReportSnapshots.map(mapApiSnapshotToReportSnapshot)
  );
  const filteredReportSnapshots = useMemo(
    () => filterReportSnapshots(reportSnapshots, snapshotFilters),
    [reportSnapshots, snapshotFilters]
  );
  const filteredRecords = useMemo(() => filterReportRecords(realRecords, appliedFilters), [realRecords, appliedFilters]);
  const brandMentions = filteredRecords.filter((record) => record.brand_mentioned).length;
  const pageRetrievals = filteredRecords.filter((record) => record.page_retrieved).length;
  const sourceCitations = filteredRecords.filter((record) => record.source_cited).length;
  const productCount = Array.from(new Set(filteredRecords.map((record) => record.product_name || "").filter(Boolean))).length;
  const productComparisonRows = useMemo(() => buildProductComparisonRows(filteredRecords), [filteredRecords]);
  const verifiedRecords = filteredRecords.filter((record) => normalizeReviewStatus(record) === "verified").length;
  const pendingRecords = filteredRecords.filter((record) => normalizeReviewStatus(record) === "pending").length;
  const needsEvidenceRecords = filteredRecords.filter((record) => normalizeReviewStatus(record) === "needs_evidence").length;
  const rejectedRecords = filteredRecords.filter((record) => normalizeReviewStatus(record) === "rejected").length;
  const base = Math.max(filteredRecords.length, 1);
  const brandMentionRate = Math.round((brandMentions / base) * 100);
  const pageRetrievalRate = Math.round((pageRetrievals / base) * 100);
  const sourceCitationRate = Math.round((sourceCitations / base) * 100);
  const reportPeriod = buildReportPeriod(filteredRecords);
  const scopeLabel = buildScopeLabel(appliedFilters, sessions);
  const focusedSessionName = getSessionName(appliedFilters.sessionId, sessions);
  const hasFocusBanner = Boolean(appliedFilters.query || focusedSessionName || appliedFilters.sourceUrl || appliedFilters.productName);
  const hasAppliedFilters = !areDefaultFilters(appliedFilters);
  const findings = buildReportFindings({
    totalRecords: filteredRecords.length,
    brandMentionRate,
    pageRetrievalRate,
    sourceCitationRate,
    pendingRecords,
    needsEvidenceRecords,
    rejectedRecords
  });
  const reportSummary = {
    reportPeriod,
    scopeLabel,
    totalRecords: filteredRecords.length,
    verifiedRecords,
    pendingRecords,
    needsEvidenceRecords,
    rejectedRecords,
    brandMentionRate,
    pageRetrievalRate,
    sourceCitationRate,
    findings,
    sourceUrl: appliedFilters.sourceUrl,
    productName: appliedFilters.productName,
    sessionName: focusedSessionName,
    productComparisonRows
  };

  const handleApplyReportScope = () => {
    if (draftFilters.startDate && draftFilters.endDate && draftFilters.startDate > draftFilters.endDate) {
      setReportScopeError("开始日期不能晚于结束日期");
      return;
    }

    setReportScopeError("");
    setAppliedFilters(draftFilters);
    setWeeklyReportText("");
    setCopyStatus("");
    setDownloadStatus("");
  };

  const handleGenerateWeeklyReport = async () => {
    const report = buildWeeklyReportText(reportSummary);
    setWeeklyReportText(report);
    setCopyStatus("");
    setDownloadStatus("");
    setSnapshotReuseStatus("");
    setSnapshotSaveStatus("正在保存报告快照");

    try {
      const snapshot = await onSaveReportSnapshot({
        scope_label: scopeLabel,
        report_period: reportPeriod,
        total_records: filteredRecords.length,
        brand_mention_rate: brandMentionRate,
        page_retrieval_rate: pageRetrievalRate,
        source_citation_rate: sourceCitationRate,
        report_text: report,
        session_id: appliedFilters.sessionId === "all" ? "" : appliedFilters.sessionId,
        session_name: focusedSessionName,
        query: appliedFilters.query,
        source_url: appliedFilters.sourceUrl,
        product_name: appliedFilters.productName,
        data_mode: "manual",
        actor: "frontend-user"
      });
      setSnapshotSaveStatus("报告快照已保存");
      setReportSnapshots((currentSnapshots) => [mapApiSnapshotToReportSnapshot(snapshot), ...currentSnapshots]);
    } catch (error) {
      setSnapshotSaveStatus(error instanceof Error ? error.message : "报告快照保存失败");
    }
  };

  const handleCopyWeeklyReport = async () => {
    if (!weeklyReportText) {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      setCopyStatus("复制失败，请手动复制周报内容");
      return;
    }

    try {
      await navigator.clipboard.writeText(weeklyReportText);
      setCopyStatus("已复制周报文本");
    } catch {
      setCopyStatus("复制失败，请手动复制周报内容");
    }
  };

  const handleDownloadWeeklyReport = () => {
    if (!weeklyReportText) {
      return;
    }

    downloadReportText(weeklyReportText, buildWeeklyReportFilename(reportPeriod));
    setDownloadStatus("已下载周报文本文件");
  };

  const handleCopySnapshotReport = async (snapshot: ReportSnapshot) => {
    if (!navigator.clipboard?.writeText) {
      setSnapshotReuseStatus("复制失败，请手动复制历史周报");
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot.reportText);
      setSnapshotReuseStatus("已复制历史周报");
    } catch {
      setSnapshotReuseStatus("复制失败，请手动复制历史周报");
    }
  };

  const handleDownloadSnapshotReport = (snapshot: ReportSnapshot) => {
    downloadReportText(snapshot.reportText, buildWeeklyReportFilename(snapshot.reportPeriod));
    setSnapshotReuseStatus("已下载历史周报");
  };

  if (realRecords.length === 0) {
    return (
      <section aria-label="生成式运营报告预览" className="fp-card p-6" role="region">
        <p className="text-sm text-emerald-300">运营报告</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">生成式运营报告预览</h2>
        <ReportScopeControls
          aiChannelOptions={aiChannelOptions}
          productOptions={productOptions}
          draftFilters={draftFilters}
          sessions={sessions}
          onApply={handleApplyReportScope}
          onDraftChange={setDraftFilters}
        />
        {reportScopeError ? (
          <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            {reportScopeError}
          </p>
        ) : null}
        <div className="mt-5 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-6">
          <p className="text-base font-semibold text-slate-50">暂无可生成报告的真实监测记录</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            请先在监测记录页录入人工或真实查询结果。示例数据只用于演示页面结构，不会进入正式运营报告。
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="生成式运营报告预览" className="fp-card p-6" role="region">
      <p className="text-sm text-emerald-300">运营报告</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">生成式运营报告预览</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
        将真实/人工录入的生成式监测记录整理成可汇报的运营摘要。这里不会把示例数据包装成真实监测成果。
      </p>

      <ReportScopeControls
        aiChannelOptions={aiChannelOptions}
        productOptions={productOptions}
        draftFilters={draftFilters}
        sessions={sessions}
        onApply={handleApplyReportScope}
        onDraftChange={setDraftFilters}
      />
      {reportScopeError ? (
        <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {reportScopeError}
        </p>
      ) : null}

      {hasFocusBanner ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">已聚焦监测结果</p>
          {appliedFilters.query ? <p className="mt-1">查询词：{appliedFilters.query}</p> : null}
          {appliedFilters.productName ? <p className="mt-1">产品：{appliedFilters.productName}</p> : null}
          {focusedSessionName ? <p className="mt-1">报告监测任务：{focusedSessionName}</p> : null}
          {appliedFilters.sourceUrl ? (
            <div className="mt-3 space-y-2">
              <p>来源链路：发布准备 -&gt; 监测记录 -&gt; 运营报告</p>
              <a className="inline-flex text-emerald-50 underline underline-offset-4 hover:text-white" href={appliedFilters.sourceUrl}>
                查看发布来源
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasAppliedFilters ? (
        <div className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">已按当前筛选条件生成报告</p>
          <p className="mt-1">范围：{scopeLabel}</p>
        </div>
      ) : null}

      {filteredRecords.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-6">
          <p className="text-base font-semibold text-slate-50">当前筛选范围内暂无可生成报告的记录</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">请放宽筛选条件，或先补充真实 / 人工监测记录。</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <ReportMetric label="报告周期" value={reportPeriod} detail="按当前已录入记录自动计算" compact />
        <ReportMetric label="查询记录数" value={`${filteredRecords.length} 条`} detail={`已确认 ${verifiedRecords} 条，待复核 ${pendingRecords} 条`} ratio={1} />
        <ReportMetric label="覆盖产品数" value={`${productCount} 个`} detail={appliedFilters.productName ? `当前产品：${appliedFilters.productName}` : "按当前范围内产品去重"} compact />
        <ReportMetric
          label="异常复核数"
          value={`${needsEvidenceRecords + rejectedRecords} 条`}
          detail={`需补证 ${needsEvidenceRecords} 条，已驳回 ${rejectedRecords} 条`}
          ratio={(needsEvidenceRecords + rejectedRecords) / Math.max(filteredRecords.length, 1)}
          tone={needsEvidenceRecords + rejectedRecords > 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <ReportMetric label="品牌提及率" value={`${brandMentionRate}%`} detail={`${brandMentions}/${filteredRecords.length} 条真实或人工记录`} ratio={brandMentionRate / 100} tone={rateTone(brandMentionRate)} />
        <ReportMetric label="页面检索率" value={`${pageRetrievalRate}%`} detail={`${pageRetrievals}/${filteredRecords.length} 条真实或人工记录`} ratio={pageRetrievalRate / 100} tone={rateTone(pageRetrievalRate)} />
        <ReportMetric label="来源引用率" value={`${sourceCitationRate}%`} detail={`${sourceCitations}/${filteredRecords.length} 条真实或人工记录`} ratio={sourceCitationRate / 100} tone={rateTone(sourceCitationRate)} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
          <h3 className="text-base font-semibold text-slate-50">关键发现</h3>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            {findings.map((finding) => (
              <li className="rounded-md border border-slate-800 bg-slate-900/80 px-4 py-3" key={finding}>
                {finding}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
          <h3 className="text-base font-semibold text-amber-100">报告边界</h3>
          <p className="mt-3 text-sm leading-6 text-amber-100/80">
            当前数据来自人工录入或真实复核记录，不代表模型平台排名承诺，也不能直接等同于稳定收录或持续引用。
          </p>
        </div>
      </div>

      <ProductComparisonPanel rows={productComparisonRows} />

      <section aria-label="周报文本导出" className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-5" role="region">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-emerald-300">周报导出</p>
            <h3 className="mt-1 text-base font-semibold text-slate-50">周报文本导出</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">生成可复制的周报文本，用于工作汇报、复盘记录或项目展示材料。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md border border-emerald-400/40 px-5 py-3 text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-300 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={filteredRecords.length === 0}
              onClick={handleGenerateWeeklyReport}
              type="button"
            >
              生成周报文本
            </button>
            {weeklyReportText ? (
              <>
                <button
                  className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  onClick={handleCopyWeeklyReport}
                  type="button"
                >
                  复制周报
                </button>
                <button
                  className="rounded-md border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  onClick={handleDownloadWeeklyReport}
                  type="button"
                >
                  下载文本文件
                </button>
              </>
            ) : null}
          </div>
        </div>

        {copyStatus ? <p className="mt-3 text-sm text-emerald-200">{copyStatus}</p> : null}
        {downloadStatus ? <p className="mt-3 text-sm text-emerald-200">{downloadStatus}</p> : null}
        {snapshotSaveStatus ? <p className="mt-3 text-sm text-emerald-200">{snapshotSaveStatus}</p> : null}

        {weeklyReportText ? (
          <label className="mt-4 block space-y-2 text-sm text-slate-300">
            <span>周报文本内容</span>
            <textarea
              className="min-h-80 w-full rounded-md border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-emerald-400"
              readOnly
              value={weeklyReportText}
            />
          </label>
        ) : (
          <p className="mt-4 rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
            当前还没有生成周报文本。请先确认报告范围，再点击“生成周报文本”。
          </p>
        )}
      </section>

      <ReportSnapshotList
        expandedSnapshotId={expandedSnapshotId}
        filters={snapshotFilters}
        reuseStatus={snapshotReuseStatus}
        sessions={sessions}
        snapshots={filteredReportSnapshots}
        totalSnapshots={reportSnapshots.length}
        onCopySnapshot={handleCopySnapshotReport}
        onDownloadSnapshot={handleDownloadSnapshotReport}
        onFilterChange={setSnapshotFilters}
        onResetFilters={() => setSnapshotFilters(defaultSnapshotFilters)}
        onToggleSnapshot={(snapshotId) => setExpandedSnapshotId((current) => (current === snapshotId ? "" : snapshotId))}
      />
    </section>
  );
}

function ProductComparisonPanel({
  rows
}: {
  rows: ProductComparisonRow[];
}) {
  return (
    <section aria-label="产品表现对比" className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-5" role="region">
      <div>
        <p className="text-sm text-emerald-300">产品维度</p>
        <h3 className="mt-1 text-base font-semibold text-slate-50">产品表现对比</h3>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
          当前范围内暂无可对比的产品记录。
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr] bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
              <span>产品</span>
              <span>记录数</span>
              <span>品牌提及率</span>
              <span>页面检索率</span>
              <span>来源引用率</span>
            </div>
            {rows.map((row) => (
              <div key={row.productName} className="grid grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr_0.8fr] border-t border-slate-800 px-4 py-4 text-sm text-slate-200">
                <span className="font-semibold text-slate-50">{row.productName}</span>
                <span>{row.totalRecords} 条</span>
                <span>{row.brandMentionRate}%</span>
                <span>{row.pageRetrievalRate}%</span>
                <span>{row.sourceCitationRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ReportSnapshotList({
  snapshots,
  expandedSnapshotId,
  filters,
  reuseStatus,
  sessions,
  totalSnapshots,
  onCopySnapshot,
  onDownloadSnapshot,
  onFilterChange,
  onResetFilters,
  onToggleSnapshot
}: {
  snapshots: ReportSnapshot[];
  expandedSnapshotId: string;
  filters: SnapshotFilters;
  reuseStatus: string;
  sessions: GeoMonitorSession[];
  totalSnapshots: number;
  onCopySnapshot: (snapshot: ReportSnapshot) => void;
  onDownloadSnapshot: (snapshot: ReportSnapshot) => void;
  onFilterChange: (filters: SnapshotFilters) => void;
  onResetFilters: () => void;
  onToggleSnapshot: (snapshotId: string) => void;
}) {
  return (
    <section aria-label="报告快照记录" className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-5" role="region">
      <div>
        <p className="text-sm text-emerald-300">报告快照</p>
        <h3 className="mt-1 text-base font-semibold text-slate-50">最近生成的报告快照</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">保留最近生成的运营报告范围、核心指标和完整正文，便于复盘、复制和再次下载。</p>
      </div>

      {reuseStatus ? <p className="mt-3 text-sm text-emerald-200">{reuseStatus}</p> : null}

      {totalSnapshots > 0 ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_auto]">
          <label className="space-y-2 text-sm text-slate-300">
            <span>快照查询词</span>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => onFilterChange({ ...filters, query: event.target.value })}
              placeholder="搜索查询词或范围"
              value={filters.query}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>快照监测任务</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => onFilterChange({ ...filters, sessionId: event.target.value })}
              value={filters.sessionId}
            >
              <option value="all">全部任务</option>
              {sessions.map((session) => (
                <option key={session.session_id} value={session.session_id}>
                  {session.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>快照开始日期</span>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => onFilterChange({ ...filters, startDate: event.target.value })}
              type="date"
              value={filters.startDate}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>快照结束日期</span>
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => onFilterChange({ ...filters, endDate: event.target.value })}
              type="date"
              value={filters.endDate}
            />
          </label>
          <div className="flex items-end">
            <button
              className="w-full rounded-md border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              onClick={onResetFilters}
              type="button"
            >
              重置快照筛选
            </button>
          </div>
        </div>
      ) : null}

      {snapshots.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
          {totalSnapshots === 0 ? "暂无报告快照。生成周报文本后会自动记录本次报告范围和核心指标。" : "当前筛选条件下暂无报告快照。"}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {snapshots.map((snapshot) => (
            <li className="rounded-md border border-slate-800 bg-slate-900/80 p-4" key={snapshot.id}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-50">{snapshot.scopeLabel}</p>
                  <p className="mt-1 text-sm text-slate-400">报告周期：{snapshot.reportPeriod}</p>
                </div>
                <p className="text-xs text-slate-500">{snapshot.createdAt}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="rounded-md border border-slate-700 px-3 py-1">{snapshot.totalRecords} 条记录</span>
                {snapshot.productName ? <span className="rounded-md border border-slate-700 px-3 py-1">产品：{snapshot.productName}</span> : null}
                <span className="rounded-md border border-slate-700 px-3 py-1">品牌提及率 {snapshot.brandMentionRate}%</span>
                <span className="rounded-md border border-slate-700 px-3 py-1">页面检索率 {snapshot.pageRetrievalRate}%</span>
                <span className="rounded-md border border-slate-700 px-3 py-1">来源引用率 {snapshot.sourceCitationRate}%</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  onClick={() => onToggleSnapshot(snapshot.id)}
                  type="button"
                >
                  查看完整周报
                </button>
                <button
                  className="rounded-md border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-300 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  onClick={() => onCopySnapshot(snapshot)}
                  type="button"
                >
                  复制历史周报
                </button>
                <button
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-slate-400 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  onClick={() => onDownloadSnapshot(snapshot)}
                  type="button"
                >
                  下载历史周报
                </button>
              </div>
              {expandedSnapshotId === snapshot.id ? (
                <label className="mt-4 block space-y-2 text-sm text-slate-300">
                  <span>历史周报正文</span>
                  <textarea
                    className="min-h-64 w-full rounded-md border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-emerald-400"
                    readOnly
                    value={snapshot.reportText}
                  />
                </label>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function mapApiSnapshotToReportSnapshot(snapshot: GeoReportSnapshot): ReportSnapshot {
  return {
    id: snapshot.snapshot_id,
    createdAt: new Date(snapshot.created_at).toLocaleString("zh-CN", { hour12: false }),
    createdDate: snapshot.created_at.slice(0, 10),
    scopeLabel: snapshot.scope_label,
    reportPeriod: snapshot.report_period,
    totalRecords: snapshot.total_records,
    brandMentionRate: snapshot.brand_mention_rate,
    pageRetrievalRate: snapshot.page_retrieval_rate,
    sourceCitationRate: snapshot.source_citation_rate,
    reportText: snapshot.report_text,
    sessionId: snapshot.session_id,
    query: snapshot.query,
    productName: snapshot.product_name || ""
  };
}

function filterReportSnapshots(snapshots: ReportSnapshot[], filters: SnapshotFilters) {
  return snapshots.filter((snapshot) => {
    const keyword = filters.query.trim();
    const queryMatched = !keyword || snapshot.query.includes(keyword) || snapshot.scopeLabel.includes(keyword) || snapshot.productName.includes(keyword);
    const sessionMatched = filters.sessionId === "all" || snapshot.sessionId === filters.sessionId;
    const startDateMatched = !filters.startDate || snapshot.createdDate >= filters.startDate;
    const endDateMatched = !filters.endDate || snapshot.createdDate <= filters.endDate;
    return queryMatched && sessionMatched && startDateMatched && endDateMatched;
  });
}

function ReportScopeControls({
  aiChannelOptions,
  productOptions,
  draftFilters,
  sessions,
  onApply,
  onDraftChange
}: {
  aiChannelOptions: string[];
  productOptions: string[];
  draftFilters: ReportFilters;
  sessions: GeoMonitorSession[];
  onApply: () => void;
  onDraftChange: (filters: ReportFilters) => void;
}) {
  return (
    <section aria-label="报告生成范围" className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-5" role="region">
      <div>
        <p className="text-sm text-emerald-300">报告范围</p>
        <h3 className="mt-1 text-base font-semibold text-slate-50">报告生成范围</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">选择本次报告要统计的记录范围，点击生成后再刷新下方报告预览。</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="space-y-2 text-sm text-slate-300">
          <span>报告监测任务</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, sessionId: event.target.value })}
            value={draftFilters.sessionId}
          >
            <option value="all">全部任务</option>
            {sessions.map((session) => (
              <option key={session.session_id} value={session.session_id}>
                {session.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>报告模型平台</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, aiChannel: event.target.value })}
            value={draftFilters.aiChannel}
          >
            <option value="all">全部平台</option>
            {aiChannelOptions.map((channel) => (
              <option key={channel} value={channel}>
                {formatAiChannelName(channel)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>报告复核状态</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, reviewStatus: event.target.value })}
            value={draftFilters.reviewStatus}
          >
            {reviewStatusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>最低证据等级</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, minimumEvidenceLevel: event.target.value })}
            value={draftFilters.minimumEvidenceLevel}
          >
            {[0, 1, 2, 3, 4].map((level) => (
              <option key={level} value={String(level)}>
                证据等级 ≥ {level}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>报告产品</span>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, productName: event.target.value })}
            value={draftFilters.productName}
          >
            <option value="">全部产品</option>
            {productOptions.map((productName) => (
              <option key={productName} value={productName}>
                {productName}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>开始日期</span>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, startDate: event.target.value })}
            type="date"
            value={draftFilters.startDate}
          />
        </label>

        <label className="space-y-2 text-sm text-slate-300">
          <span>结束日期</span>
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onDraftChange({ ...draftFilters, endDate: event.target.value })}
            type="date"
            value={draftFilters.endDate}
          />
        </label>
      </div>

      <button
        className="mt-4 rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        onClick={onApply}
        type="button"
      >
        生成当前范围报告
      </button>
    </section>
  );
}

function rateTone(rate: number): StatTone {
  if (rate >= 60) return "success";
  if (rate >= 30) return "warning";
  return "danger";
}

function ReportMetric({
  label,
  value,
  detail,
  ratio,
  tone,
  compact
}: {
  label: string;
  value: string;
  detail: string;
  ratio?: number;
  tone?: StatTone;
  compact?: boolean;
}) {
  return <ProStatCard label={label} value={value} detail={detail} ratio={ratio} tone={tone} compact={compact} />;
}

function buildReportPeriod(records: GeoMonitorRecord[]) {
  const dates = records.map((record) => record.checked_at).filter(Boolean).sort();

  if (dates.length === 0) {
    return "未记录";
  }

  const start = dates[0].slice(0, 10);
  const end = dates[dates.length - 1].slice(0, 10);
  return start === end ? start : `${start} 至 ${end}`;
}

function filterReportRecords(records: GeoMonitorRecord[], filters: ReportFilters) {
  const minimumEvidenceLevel = Number(filters.minimumEvidenceLevel);

  return records.filter((record) => {
    const checkedDate = record.checked_at.slice(0, 10);
    const queryMatched = !filters.query || record.query.includes(filters.query);
    const sessionMatched = filters.sessionId === "all" || record.session_id === filters.sessionId;
    const sourceUrlMatched = !filters.sourceUrl || record.target_url === filters.sourceUrl;
    const productMatched = !filters.productName || record.product_name === filters.productName;
    const channelMatched = filters.aiChannel === "all" || record.ai_channel === filters.aiChannel;
    const reviewMatched = filters.reviewStatus === "all" || normalizeReviewStatus(record) === filters.reviewStatus;
    const evidenceMatched = record.evidence_level >= minimumEvidenceLevel;
    const startDateMatched = !filters.startDate || checkedDate >= filters.startDate;
    const endDateMatched = !filters.endDate || checkedDate <= filters.endDate;
    return queryMatched && sessionMatched && sourceUrlMatched && productMatched && channelMatched && reviewMatched && evidenceMatched && startDateMatched && endDateMatched;
  });
}

function buildProductComparisonRows(records: GeoMonitorRecord[]) {
  const grouped = new Map<string, GeoMonitorRecord[]>();

  records.forEach((record) => {
    const productName = record.product_name || "未标注产品";
    grouped.set(productName, [...(grouped.get(productName) || []), record]);
  });

  return Array.from(grouped.entries())
    .map(([productName, productRecords]) => {
      const base = Math.max(productRecords.length, 1);
      return {
        productName,
        totalRecords: productRecords.length,
        brandMentionRate: Math.round((productRecords.filter((record) => record.brand_mentioned).length / base) * 100),
        pageRetrievalRate: Math.round((productRecords.filter((record) => record.page_retrieved).length / base) * 100),
        sourceCitationRate: Math.round((productRecords.filter((record) => record.source_cited).length / base) * 100)
      };
    })
    .sort((a, b) => b.totalRecords - a.totalRecords || a.productName.localeCompare(b.productName, "zh-CN"));
}

function normalizeReviewStatus(record: GeoMonitorRecord) {
  if (record.review_status_code) {
    return record.review_status_code;
  }

  if (record.manual_review_status === "已确认") {
    return "verified";
  }

  if (record.manual_review_status === "需补证") {
    return "needs_evidence";
  }

  if (record.manual_review_status === "已驳回") {
    return "rejected";
  }

  return "pending";
}

function buildScopeLabel(filters: ReportFilters, sessions: GeoMonitorSession[]) {
  const channel = filters.aiChannel === "all" ? "全部平台" : formatAiChannelName(filters.aiChannel);
  const reviewStatus = reviewStatusOptions.find((status) => status.value === filters.reviewStatus)?.label ?? "全部状态";
  const scopeParts = [`${channel} / ${reviewStatus} / 证据等级 ≥ ${filters.minimumEvidenceLevel}`];

  if (filters.sessionId !== "all") {
    scopeParts.push(sessions.find((session) => session.session_id === filters.sessionId)?.name ?? filters.sessionId);
  }

  if (filters.startDate || filters.endDate) {
    scopeParts.push(`${filters.startDate || "不限"} 至 ${filters.endDate || "不限"}`);
  }

  if (filters.query) {
    scopeParts.push(`查询词包含：${filters.query}`);
  }

  if (filters.sourceUrl) {
    scopeParts.push(`发布来源：${filters.sourceUrl}`);
  }

  if (filters.productName) {
    scopeParts.push(`产品：${filters.productName}`);
  }

  return scopeParts.join(" / ");
}

function getSessionName(sessionId: string, sessions: GeoMonitorSession[]) {
  if (sessionId === "all") return "";
  return sessions.find((session) => session.session_id === sessionId)?.name ?? sessionId;
}

function areDefaultFilters(filters: ReportFilters) {
  return (
    filters.aiChannel === defaultReportFilters.aiChannel &&
    filters.reviewStatus === defaultReportFilters.reviewStatus &&
    filters.minimumEvidenceLevel === defaultReportFilters.minimumEvidenceLevel &&
    filters.sessionId === defaultReportFilters.sessionId &&
    filters.startDate === defaultReportFilters.startDate &&
    filters.endDate === defaultReportFilters.endDate &&
    filters.query === defaultReportFilters.query &&
    filters.sourceUrl === defaultReportFilters.sourceUrl &&
    filters.productName === defaultReportFilters.productName
  );
}

function readReportFocus(): Pick<ReportFilters, "query" | "sessionId" | "sourceUrl" | "productName"> {
  if (typeof window === "undefined") {
    return { query: "", sessionId: "all", sourceUrl: "", productName: "" };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("query")?.trim() || "",
    sessionId: params.get("session")?.trim() || "all",
    sourceUrl: params.get("url")?.trim() || "",
    productName: params.get("product")?.trim() || ""
  };
}

function buildReportFindings({
  totalRecords,
  brandMentionRate,
  pageRetrievalRate,
  sourceCitationRate,
  pendingRecords,
  needsEvidenceRecords,
  rejectedRecords
}: {
  totalRecords: number;
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
  pendingRecords: number;
  needsEvidenceRecords: number;
  rejectedRecords: number;
}) {
  const findings: string[] = [];

  if (brandMentionRate >= 60) {
    findings.push(`品牌提及率较高，本期 ${totalRecords} 条真实记录中已有 ${brandMentionRate}% 出现目标品牌。`);
  } else {
    findings.push(`品牌提及率仍需提升，本期 ${totalRecords} 条真实记录中品牌提及率为 ${brandMentionRate}%。`);
  }

  if (sourceCitationRate < 50) {
    findings.push(`来源引用仍然偏少，当前来源引用率为 ${sourceCitationRate}%，后续应补充更容易被引用的结构化页面和可信来源。`);
  } else {
    findings.push(`来源引用表现较好，当前来源引用率为 ${sourceCitationRate}%，可继续复盘被引用页面的内容结构。`);
  }

  if (pageRetrievalRate < brandMentionRate) {
    findings.push("页面检索率低于品牌提及率，说明模型可能知道品牌，但未稳定检索到目标页面。");
  }

  if (pendingRecords + needsEvidenceRecords + rejectedRecords > 0) {
    findings.push(`仍有 ${pendingRecords + needsEvidenceRecords + rejectedRecords} 条记录需要复核、补证或剔除，正式汇报前应先处理证据状态。`);
  }

  return findings;
}

function buildWeeklyReportText({
  reportPeriod,
  scopeLabel,
  totalRecords,
  verifiedRecords,
  pendingRecords,
  needsEvidenceRecords,
  rejectedRecords,
  brandMentionRate,
  pageRetrievalRate,
  sourceCitationRate,
  findings,
  sourceUrl,
  productName,
  sessionName,
  productComparisonRows
}: {
  reportPeriod: string;
  scopeLabel: string;
  totalRecords: number;
  verifiedRecords: number;
  pendingRecords: number;
  needsEvidenceRecords: number;
  rejectedRecords: number;
  brandMentionRate: number;
  pageRetrievalRate: number;
  sourceCitationRate: number;
  findings: string[];
  sourceUrl: string;
  productName: string;
  sessionName: string;
  productComparisonRows: ProductComparisonRow[];
}) {
  const findingLines = findings.map((finding) => `- ${finding}`).join("\n");
  const productComparisonLines = productComparisonRows
    .map(
      (row) =>
        `- ${row.productName}：${row.totalRecords} 条，品牌提及率 ${row.brandMentionRate}%，页面检索率 ${row.pageRetrievalRate}%，来源引用率 ${row.sourceCitationRate}%`
    )
    .join("\n");
  const focusLines = [
    sessionName ? `- 监测任务：${sessionName}` : "",
    productName ? `- 产品：${productName}` : "",
    sourceUrl ? `- 发布来源：${sourceUrl}` : ""
  ].filter(Boolean);

  return [
    "# 生成式运营周报",
    "",
    "## 报告范围",
    "",
    `- 报告周期：${reportPeriod}`,
    `- 统计范围：${scopeLabel}`,
    ...focusLines,
    "",
    "## 核心指标",
    "",
    `- 查询记录数：${totalRecords} 条`,
    `- 已确认：${verifiedRecords} 条`,
    `- 待复核：${pendingRecords} 条`,
    `- 需补证：${needsEvidenceRecords} 条`,
    `- 已驳回：${rejectedRecords} 条`,
    `- 品牌提及率：${brandMentionRate}%`,
    `- 页面检索率：${pageRetrievalRate}%`,
    `- 来源引用率：${sourceCitationRate}%`,
    "",
    "## 产品表现对比",
    "",
    productComparisonLines || "- 当前范围内暂无可对比的产品记录。",
    "",
    "## 关键发现",
    "",
    findingLines || "- 当前范围内暂无可用发现。",
    "",
    "## 报告边界",
    "",
    "- 当前数据来自人工录入或真实复核记录，不代表模型平台排名承诺。",
    "- 品牌提及、页面检索、来源引用需要分开记录，不能相互替代。",
    "- 本报告用于内部复盘和阶段性汇报，不等同于稳定收录或持续引用证明。"
  ].join("\n");
}

function buildWeeklyReportFilename(reportPeriod: string) {
  const safePeriod = reportPeriod.replace(/[^\dA-Za-z\u4e00-\u9fa5-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `weekly-report-${safePeriod || "latest"}.txt`;
}

function downloadReportText(reportText: string, filename: string) {
  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatAiChannelName(channel: string) {
  const names: Record<string, string> = {
    deepseek: "深度求索",
    doubao: "豆包",
    wenxin: "文心一言",
    yuanbao: "腾讯元宝",
    kimi: "月之暗面"
  };
  return names[channel.toLowerCase()] ?? channel;
}
