"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CitationReadinessInput,
  CitationReadinessResult,
  evaluateCitationReadiness
} from "./citation-readiness-engine";

const HISTORY_STORAGE_KEY = "flowpilot.citationReadiness.history";
const MONITOR_QUEUE_STORAGE_KEY = "flowpilot.citationReadiness.monitorQueue";

const defaultForm: CitationReadinessInput = {
  brandName: "",
  region: "",
  productName: "",
  topicTitle: "",
  targetUrl: "",
  content: ""
};

type CitationHistoryItem = {
  id: string;
  form: CitationReadinessInput;
  result: CitationReadinessResult;
  checkedAt: string;
};

type MonitorQueueItem = {
  id: string;
  topicTitle: string;
  targetBrand: string;
  targetProduct: string;
  targetRegion: string;
  targetUrl: string;
  readinessScore: number;
  readinessLevel: CitationReadinessResult["level"];
  queuedAt: string;
};

export function CitationReadinessWorkspace() {
  const [form, setForm] = useState<CitationReadinessInput>(defaultForm);
  const [result, setResult] = useState<CitationReadinessResult | null>(null);
  const [history, setHistory] = useState<CitationHistoryItem[]>([]);
  const [monitorQueue, setMonitorQueue] = useState<MonitorQueueItem[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setHistory(restoreHistory());
    setMonitorQueue(restoreMonitorQueue());
  }, []);

  function updateField(field: keyof CitationReadinessInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");

    try {
      const nextResult = evaluateCitationReadiness(form);
      const nextHistoryItem = createHistoryItem(form, nextResult);
      const nextHistory = [nextHistoryItem, ...history].slice(0, 10);

      setResult(nextResult);
      setHistory(nextHistory);
      persistHistory(nextHistory);
      setFeedback("已保存引用准备度记录");
    } catch (submitError) {
      setResult(null);
      setError(submitError instanceof Error ? submitError.message : "引用准备度评分失败，请稍后重试");
    }
  }

  function handleRestore(item: CitationHistoryItem) {
    setForm(item.form);
    setResult(item.result);
    setError("");
    setFeedback("已恢复所选引用准备度记录");
  }

  function handleExportHistory() {
    setError("");
    setFeedback("");

    if (history.length === 0) {
      setError("暂无可导出的引用准备度历史");
      return;
    }

    const blob = new Blob([serializeHistory(history)], { type: "text/markdown;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "引用准备度历史.md";
    link.click();
    URL.revokeObjectURL(downloadUrl);
    setFeedback("已导出引用准备度历史");
  }

  function handleQueueForMonitoring() {
    setError("");
    setFeedback("");

    if (!result) {
      setError("请先生成引用准备度评分");
      return;
    }

    const topicTitle = form.topicTitle?.trim() || `${form.region.trim()}${form.productName.trim()}引用准备度检查`;
    const targetBrand = form.brandName.trim();
    const targetProduct = form.productName.trim();
    const targetRegion = form.region.trim();
    const targetUrl = (form.targetUrl || "").trim();
    const nextQueueIdentity = {
      topicTitle,
      targetBrand,
      targetProduct,
      targetRegion,
      targetUrl
    };

    const isAlreadyQueued = monitorQueue.some(
      (item) => createMonitorQueueKey(item) === createMonitorQueueKey(nextQueueIdentity)
    );

    if (isAlreadyQueued) {
      setFeedback("该内容已在监测准备队列中");
      return;
    }

    const queuedItem: MonitorQueueItem = {
      id: `citation-monitor-${new Date().toISOString()}`,
      topicTitle,
      targetBrand,
      targetProduct,
      targetRegion,
      targetUrl,
      readinessScore: result.overall,
      readinessLevel: result.level,
      queuedAt: new Date().toISOString()
    };
    const nextQueue = [queuedItem, ...monitorQueue].slice(0, 10);
    setMonitorQueue(nextQueue);
    persistMonitorQueue(nextQueue);
    setFeedback("已加入监测准备队列");
  }

  return (
    <div className="grid gap-4">
      <section aria-label="评分边界提示" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-base font-semibold text-amber-200">评分只表示内容结构准备度</p>
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          本页不会承诺搜索排名、平台收录或模型引用，只帮助你检查内容是否更容易被机器理解、核验和复盘。
        </p>
      </section>

      <section className="fp-card">
        <div className="fp-panel-header">
          <p className="text-sm text-emerald-300">AI 引用准备度</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">检查内容结构和引用风险</h2>
        </div>

        <form className="grid gap-4 p-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <TextField label="品牌名称" value={form.brandName} onChange={(value) => updateField("brandName", value)} />
          <TextField label="目标地域" value={form.region} onChange={(value) => updateField("region", value)} />
          <TextField label="产品名称" value={form.productName} onChange={(value) => updateField("productName", value)} />
          <TextField label="目标页面链接" value={form.targetUrl ?? ""} onChange={(value) => updateField("targetUrl", value)} />
          <TextField label="检查主题" value={form.topicTitle ?? ""} onChange={(value) => updateField("topicTitle", value)} wide />
          <label className="text-sm text-slate-300 md:col-span-2">
            待检查内容
            <textarea
              className="mt-2 min-h-56 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => updateField("content", event.target.value)}
              value={form.content}
            />
          </label>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              className="cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
              type="submit"
            >
              生成引用准备度评分
            </button>
            <button
              className="cursor-pointer rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={history.length === 0}
              onClick={handleExportHistory}
              type="button"
            >
              导出历史 Markdown
            </button>
            <button
              className="cursor-pointer rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!result}
              onClick={handleQueueForMonitoring}
              type="button"
            >
              加入监测准备
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{feedback}</p> : null}

      {result ? <CitationResult result={result} /> : <EmptyResultState />}
      {monitorQueue.length > 0 ? <MonitorQueue items={monitorQueue} /> : null}
      {history.length > 0 ? <CitationHistory history={history} onExport={handleExportHistory} onRestore={handleRestore} /> : null}
    </div>
  );
}

function TextField({
  label,
  onChange,
  value,
  wide = false
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={`text-sm text-slate-300 ${wide ? "md:col-span-2" : ""}`}>
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function EmptyResultState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
      <p className="text-base font-semibold text-slate-50">暂无评分结果</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">录入文章后可以生成检查项、评分和改进建议。</p>
    </section>
  );
}

function CitationResult({ result }: { result: CitationReadinessResult }) {
  const checks = Object.values(result.checks);

  return (
    <section aria-label="AI 引用准备度评分" className="fp-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">AI 引用准备度评分</p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-50">{result.overall}</h2>
        </div>
        <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
          {result.level}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={check.label}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-50">{check.label}</p>
              <span className={check.passed ? "text-xs text-emerald-300" : "text-xs text-amber-300"}>{check.score}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{check.message}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <p className="text-sm font-semibold text-slate-50">改进建议</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          {result.recommendations.map((recommendation) => (
            <li key={recommendation}>· {recommendation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function CitationHistory({
  history,
  onExport,
  onRestore
}: {
  history: CitationHistoryItem[];
  onExport: () => void;
  onRestore: (item: CitationHistoryItem) => void;
}) {
  return (
    <section aria-label="引用准备度历史" className="fp-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">引用准备度历史</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">最近 10 次检查记录</h2>
        </div>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400"
          onClick={onExport}
          type="button"
        >
          导出历史 Markdown
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {history.map((item, index) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">历史记录 {index + 1}</p>
                <p className="mt-1 text-sm text-slate-300">{item.form.topicTitle || `${item.form.region}${item.form.productName}引用准备度检查`}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.form.brandName} · {item.result.overall} 分 · {item.result.level}
                </p>
              </div>
              <button
                className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400"
                onClick={() => onRestore(item)}
                type="button"
              >
                恢复此记录
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MonitorQueue({ items }: { items: MonitorQueueItem[] }) {
  return (
    <section aria-label="监测准备队列" className="fp-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">监测准备队列</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">等待进入真实监测录入的内容</h2>
        </div>
        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          仅本地准备，不代表已发起真实监测
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">{item.topicTitle}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.targetBrand} · {item.targetRegion} · {item.targetProduct}
                </p>
              </div>
              <span className="rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                准备度 {item.readinessScore} · {item.readinessLevel}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function createHistoryItem(form: CitationReadinessInput, result: CitationReadinessResult): CitationHistoryItem {
  const checkedAt = new Date().toISOString();

  return {
    id: `citation-readiness-${checkedAt}`,
    form,
    result,
    checkedAt
  };
}

function restoreHistory(): CitationHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CitationHistoryItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item.form && item.result && item.checkedAt);
  } catch {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    return [];
  }
}

function persistHistory(history: CitationHistoryItem[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function restoreMonitorQueue(): MonitorQueueItem[] {
  try {
    const raw = localStorage.getItem(MONITOR_QUEUE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as MonitorQueueItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => item.topicTitle && item.targetBrand && typeof item.readinessScore === "number");
  } catch {
    localStorage.removeItem(MONITOR_QUEUE_STORAGE_KEY);
    return [];
  }
}

function persistMonitorQueue(items: MonitorQueueItem[]) {
  localStorage.setItem(MONITOR_QUEUE_STORAGE_KEY, JSON.stringify(items));
}

function createMonitorQueueKey(
  item: Pick<MonitorQueueItem, "topicTitle" | "targetBrand" | "targetProduct" | "targetRegion" | "targetUrl">
) {
  return [item.topicTitle, item.targetBrand, item.targetProduct, item.targetRegion, item.targetUrl]
    .map((value) => value.trim())
    .join("::");
}

function serializeHistory(history: CitationHistoryItem[]) {
  return history
    .map((item, index) =>
      [
        `## 历史记录 ${index + 1}`,
        `检查主题：${item.form.topicTitle || `${item.form.region}${item.form.productName}引用准备度检查`}`,
        `品牌：${item.form.brandName}`,
        `产品：${item.form.productName}`,
        `目标地域：${item.form.region}`,
        `目标页面：${item.form.targetUrl || "未填写"}`,
        `评分：${item.result.overall}`,
        `等级：${item.result.level}`,
        "改进建议：",
        ...item.result.recommendations.map((recommendation) => `- ${recommendation}`)
      ].join("\n")
    )
    .join("\n\n---\n\n");
}
