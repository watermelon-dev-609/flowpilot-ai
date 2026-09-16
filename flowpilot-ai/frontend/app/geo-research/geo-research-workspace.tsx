"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChannelRule,
  GeoMonitorRecord,
  GeoMonitorSnapshot,
  RulesSnapshot,
  createContentCalendarPlan,
  loadGeoMonitorSnapshot,
  loadRulesSnapshot
} from "../lib/flowpilot-api";
import { GeoResearchTopicPoolItem } from "../../lib/geo-research-topic-contract";
import { createBrowserTopicPoolRepository } from "../../lib/topic-pool-repository";

const CONTENT_ADAPTATION_INTAKE_STORAGE_KEY = "flowpilot.geoResearch.contentAdaptationIntake";

type ResearchForm = {
  brandName: string;
  productName: string;
  region: string;
  targetPlatforms: string;
  researchGoal: string;
};

type ProductCenterHandoff = {
  productName: string;
  brandName: string;
  targetUrl: string;
  targetAudience: string;
  facts: string;
  source: string;
  riskLabel: string;
  nextAction: string;
};

type ResearchResult = {
  entities: Array<{ group: string; items: string[] }>;
  questions: Array<{ group: string; items: string[] }>;
  topics: TopicPlan[];
  writingRecommendations: WritingRecommendation[];
  monitoredQuestions: string[];
  platformHints: string[];
  monitoredChannelSummaries: string[];
};

type TopicPriority = "high" | "medium" | "low";
type TopicDifficulty = "low" | "medium" | "high";

type TopicScore = {
  title: string;
  priority: TopicPriority;
  difficulty: TopicDifficulty;
  platformFit: number;
  overallScore: number;
  reason: string;
};

type TopicPlan = {
  platform: string;
  items: TopicScore[];
};

type WritingRecommendation = {
  rank: "first" | "second" | "third";
  platform: string;
  title: string;
  overallScore: number;
  reason: string;
};

type ResearchContextState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; rules: RulesSnapshot; geo: GeoMonitorSnapshot };

const defaultResearchForm: ResearchForm = {
  brandName: "武汉微艺达智能科技有限公司",
  productName: "智能沙盘",
  region: "武汉",
  targetPlatforms: "深度求索、豆包、文心一言、腾讯元宝、月之暗面",
  researchGoal: "厂家推荐"
};

export function GeoResearchWorkspace() {
  const [productHandoff] = useState<ProductCenterHandoff | null>(() => readProductCenterHandoff());
  const [form, setForm] = useState<ResearchForm>(() => buildInitialResearchForm(productHandoff));
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [topicPool, setTopicPool] = useState<GeoResearchTopicPoolItem[]>([]);
  const [researchContext, setResearchContext] = useState<ResearchContextState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    Promise.all([loadRulesSnapshot(), loadGeoMonitorSnapshot()])
      .then(([rules, geo]) => {
        if (!active) return;
        setResearchContext({ status: "success", rules, geo });
      })
      .catch((loadError: Error) => {
        if (!active) return;
        setResearchContext({ status: "error", message: loadError.message });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setTopicPool(restoreTopicPool());
  }, []);

  const sessions = researchContext.status === "success" ? researchContext.geo.sessions.sessions : [];
  const records = researchContext.status === "success" ? researchContext.geo.records.records : [];
  const aiRules = researchContext.status === "success" ? researchContext.rules.ai.rules : [];
  const publishingRules = researchContext.status === "success" ? researchContext.rules.publishing.rules : [];
  const selectedSession = sessions.find((session) => session.session_id === selectedSessionId);
  const selectedSessionRecords = useMemo(() => {
    if (!selectedSessionId) return records;
    return records.filter((record) => record.session_id === selectedSessionId);
  }, [records, selectedSessionId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");

    if (!form.brandName.trim() || !form.productName.trim() || !form.region.trim()) {
      setResult(null);
      setError("请填写品牌名称、产品 / 业务和目标地域");
      return;
    }

    setResult(
      buildGeoResearchResult(form, {
        aiRules,
        publishingRules,
        records: selectedSessionRecords
      })
    );
  }

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    const session = sessions.find((item) => item.session_id === sessionId);
    if (!session) return;

    setForm((current) => ({
      ...current,
      brandName: session.target_brand
    }));
  }

  async function handleQueueContentAdaptation(recommendation: WritingRecommendation) {
    setError("");
    const createdAt = new Date().toISOString();
    const productFactLines = buildProductFactLines(productHandoff);
    const intake = {
      brandName: form.brandName.trim(),
      productName: form.productName.trim(),
      region: form.region.trim(),
      topicTitle: recommendation.title,
      targetAudience: "生成式优化内容受众",
      facts: [
        `来自生成式优化研究：${recommendation.reason}`,
        `推荐平台：${recommendation.platform}`,
        `综合评分：${recommendation.overallScore}`,
        "发布前仍需补充可确认事实、案例图片和来源说明。"
      ].join("\n")
    };

    if (productHandoff?.targetAudience) {
      intake.targetAudience = productHandoff.targetAudience;
    }
    if (productFactLines.length > 0) {
      intake.facts = [intake.facts, ...productFactLines].join("\n");
    }

    localStorage.setItem(CONTENT_ADAPTATION_INTAKE_STORAGE_KEY, JSON.stringify(intake));
    const topicPoolItem: GeoResearchTopicPoolItem = {
      id: `topic-pool-${createdAt}-${recommendation.rank}`,
      topicTitle: recommendation.title,
      platform: recommendation.platform,
      brandName: intake.brandName,
      productName: intake.productName,
      region: intake.region,
      targetAudience: intake.targetAudience,
      facts: intake.facts,
      overallScore: recommendation.overallScore,
      status: "待适配",
      createdAt
    };
    const currentTopicPool = restoreTopicPool();
    const nextTopicPool = [
      topicPoolItem,
      ...currentTopicPool.filter((item) => item.topicTitle !== topicPoolItem.topicTitle || item.platform !== topicPoolItem.platform)
    ].slice(0, 20);

    setTopicPool(createBrowserTopicPoolRepository().save(nextTopicPool));
    if (typeof fetch !== "function") {
      setFeedback("已加入内容适配准备");
      return;
    }

    try {
      await createContentCalendarPlan({
        topic_title: topicPoolItem.topicTitle,
        platform: topicPoolItem.platform,
        brand_name: topicPoolItem.brandName,
        product_name: topicPoolItem.productName,
        region: topicPoolItem.region,
        target_audience: topicPoolItem.targetAudience,
        facts: topicPoolItem.facts,
        overall_score: topicPoolItem.overallScore,
        status: topicPoolItem.status,
        owner: topicPoolItem.owner || "",
        priority: topicPoolItem.priority || "高",
        content_stage: topicPoolItem.contentStage || "待生产",
        data_mode: "manual",
        actor: "frontend-user"
      });
      setFeedback("已加入内容适配准备，并同步到内容日历 API");
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : "同步内容日历 API 失败";
      setFeedback(`已加入内容适配准备；内容日历 API 同步失败：${message}`);
    }
  }

  function handleUseTopicPoolItem(item: GeoResearchTopicPoolItem) {
    setError("");
    const intake = {
      brandName: item.brandName,
      productName: item.productName,
      region: item.region,
      topicTitle: item.topicTitle,
      targetAudience: item.targetAudience,
      facts: item.facts
    };

    localStorage.setItem(CONTENT_ADAPTATION_INTAKE_STORAGE_KEY, JSON.stringify(intake));
    setFeedback("已选择选题进入内容适配准备");
  }

  return (
    <div className="grid gap-6">
      <ResearchContextPanel state={researchContext} />

      <section aria-label="生成式优化研究输入" className="fp-card p-6" role="region">
        <div>
          <p className="text-sm text-emerald-300">研究简报</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">生成式优化研究输入</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            先把品牌、产品和地域拆成可复用的研究结构，再结合规则中心与真实监测记录生成选题建议。
          </p>
        </div>

        {productHandoff ? <ProductHandoffPanel handoff={productHandoff} /> : null}

        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
            <span>从监测任务带入</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              disabled={sessions.length === 0}
              onChange={(event) => handleSelectSession(event.target.value)}
              value={selectedSessionId}
            >
              <option value="">不使用监测任务，手动填写</option>
              {sessions.map((session) => (
                <option key={session.session_id} value={session.session_id}>
                  {session.name}
                </option>
              ))}
            </select>
            {sessions.length === 0 ? <span className="block text-xs text-slate-500">暂无可带入的监测任务。</span> : null}
            {selectedSession ? <span className="block text-xs text-emerald-200">已从监测任务带入品牌：{selectedSession.target_brand}</span> : null}
          </label>

          <TextInput label="品牌名称" value={form.brandName} onChange={(value) => setForm((current) => ({ ...current, brandName: value }))} />
          <TextInput label="产品 / 业务" value={form.productName} onChange={(value) => setForm((current) => ({ ...current, productName: value }))} />
          <TextInput label="目标地域" value={form.region} onChange={(value) => setForm((current) => ({ ...current, region: value }))} />
          <TextInput label="目标模型平台" value={form.targetPlatforms} onChange={(value) => setForm((current) => ({ ...current, targetPlatforms: value }))} />
          <TextInput label="研究目标" value={form.researchGoal} onChange={(value) => setForm((current) => ({ ...current, researchGoal: value }))} wide />

          <div className="md:col-span-2">
            <button
              className="rounded-md bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              type="submit"
            >
              生成研究结果
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-4 rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            {error}
          </p>
        ) : null}
        {feedback ? (
          <p className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">
            {feedback}
          </p>
        ) : null}
      </section>

      <section aria-label="研究结果边界" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-6" role="region">
        <p className="text-sm text-amber-200">边界说明</p>
        <h2 className="mt-2 text-xl font-semibold text-amber-100">研究结果边界</h2>
        <p className="mt-3 text-sm leading-6 text-amber-100/80">
          研究建议不等同于模型平台排名、搜索收录或来源引用承诺。后续必须通过真实监测记录复核效果。
        </p>
      </section>

      {result ? (
        <div className="grid gap-6">
          <ResearchEvidencePanel result={result} />
          <WritingRecommendationSection onQueueContentAdaptation={handleQueueContentAdaptation} recommendations={result.writingRecommendations} />
          <TopicPoolSection onUseTopic={handleUseTopicPoolItem} topicPool={topicPool} />
          <ResearchGroupSection title="实体图谱" groups={result.entities} />
          <ResearchGroupSection title="问题图谱" groups={result.questions} />
          <TopicPlanSection topics={result.topics} />
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
          <p className="text-base font-semibold text-slate-50">暂无研究结果</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">填写研究输入并点击生成后，将在这里展示实体图谱、问题图谱和多平台选题计划。</p>
        </section>
      )}
    </div>
  );
}

function buildInitialResearchForm(handoff: ProductCenterHandoff | null): ResearchForm {
  if (!handoff) return defaultResearchForm;

  const isMonitorRiskHandoff = handoff.source === "geo-monitor" && (handoff.riskLabel || handoff.nextAction);
  const researchGoalParts = isMonitorRiskHandoff
    ? [`${handoff.riskLabel}产品，${handoff.nextAction}`]
    : [handoff.targetAudience ? `面向${handoff.targetAudience}` : "", handoff.facts ? `验证${handoff.facts}` : ""].filter(Boolean);

  return {
    ...defaultResearchForm,
    brandName: handoff.brandName || defaultResearchForm.brandName,
    productName: handoff.productName || defaultResearchForm.productName,
    researchGoal: researchGoalParts.join("") || defaultResearchForm.researchGoal
  };
}

function readProductCenterHandoff(): ProductCenterHandoff | null {
  if (typeof window === "undefined") return null;

  const searchParams = new URLSearchParams(window.location.search);
  const productName = (searchParams.get("product") || "").trim();
  const brandName = (searchParams.get("brand") || "").trim();
  const targetUrl = (searchParams.get("url") || "").trim();
  const targetAudience = (searchParams.get("audience") || "").trim();
  const facts = (searchParams.get("facts") || "").trim();
  const source = (searchParams.get("source") || "").trim();
  const riskLabel = (searchParams.get("risk") || "").trim();
  const nextAction = (searchParams.get("action") || "").trim();

  if (!productName && !brandName && !targetUrl && !targetAudience && !facts && !source && !riskLabel && !nextAction) return null;

  return {
    productName,
    brandName,
    targetUrl,
    targetAudience,
    facts,
    source,
    riskLabel,
    nextAction
  };
}

function buildProductFactLines(handoff: ProductCenterHandoff | null): string[] {
  if (!handoff) return [];

  return [
    handoff.facts ? `产品中心事实依据：${handoff.facts}` : "",
    handoff.targetUrl ? `产品目标页面：${handoff.targetUrl}` : "",
    handoff.targetAudience ? `目标客户：${handoff.targetAudience}` : "",
    handoff.riskLabel ? `监测风险：${handoff.riskLabel}` : "",
    handoff.nextAction ? `建议动作：${handoff.nextAction}` : ""
  ].filter(Boolean);
}

function restoreTopicPool(): GeoResearchTopicPoolItem[] {
  return createBrowserTopicPoolRepository().list();
}

function ProductHandoffPanel({ handoff }: { handoff: ProductCenterHandoff }) {
  const factLines = buildProductFactLines(handoff);

  return (
    <section aria-label="AI 产品卡" className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4" role="region">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-100">
          {handoff.source === "geo-monitor" ? "已从 GEO 监测风险带入产品资料" : "已从产品中心带入产品资料"}
        </p>
        <span className="rounded-md border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">待核查</span>
      </div>
      <div className="mt-3 grid gap-3 text-sm text-emerald-50 md:grid-cols-2">
        <InfoLine label="产品" value={handoff.productName} />
        <InfoLine label="品牌" value={handoff.brandName} />
        <InfoLine label="目标客户" value={handoff.targetAudience} />
        <InfoLine label="目标页面" value={handoff.targetUrl} wide />
        <InfoLine label="监测风险" value={handoff.riskLabel} />
        <InfoLine label="建议动作" value={handoff.nextAction} />
        <InfoLine label="事实依据" value={handoff.facts} wide />
      </div>
      <div className="mt-4 grid gap-2 text-xs text-emerald-100 md:grid-cols-3">
        {factLines.map((line) => (
          <span className="rounded-md border border-emerald-300/20 bg-slate-950/30 px-3 py-2" key={line}>
            {line}
          </span>
        ))}
      </div>
    </section>
  );
}

function InfoLine({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  if (!value) return null;

  return (
    <p className={wide ? "md:col-span-2" : ""}>
      <span className="text-emerald-200/70">{label}：</span>
      <span>{value}</span>
    </p>
  );
}

function TextInput({ label, value, onChange, wide = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean }) {
  return (
    <label className={`space-y-2 text-sm text-slate-300 ${wide ? "md:col-span-2" : ""}`}>
      <span>{label}</span>
      <input
        className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function ResearchGroupSection({ title, groups }: { title: string; groups: Array<{ group: string; items: string[] }> }) {
  return (
    <section aria-label={title} className="fp-card" role="region">
      <div className="fp-panel-header">
        <p className="text-sm text-emerald-300">研究图谱</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">{title}</h2>
      </div>
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((group) => (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5" key={group.group}>
              <h3 className="text-base font-semibold text-slate-50">{group.group}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ResearchContextPanel({ state }: { state: ResearchContextState }) {
  if (state.status === "loading") {
    return (
      <section aria-label="研究数据来源概览" className="fp-card p-6" role="region">
        <p className="text-sm text-emerald-300">研究上下文</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">研究数据来源概览</h2>
        <p className="mt-3 text-sm text-slate-400">正在加载规则中心和监测数据...</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section aria-label="研究数据来源概览" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-6" role="region">
        <p className="text-sm text-rose-200">研究上下文</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">研究数据来源概览</h2>
        <p className="mt-3 rounded-md border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-100" role="alert">
          研究上下文加载失败，请稍后重试或手动填写。
        </p>
        <p className="mt-3 text-sm text-rose-100/80">仍可手动填写研究输入并生成本地研究结果。</p>
      </section>
    );
  }

  const realOrManualRecords = state.geo.records.records.filter((record) => record.data_mode === "real" || record.data_mode === "manual");
  const metrics = [
    { label: "模型平台规则", value: `${state.rules.ai.rules.length} 条`, detail: `数据模式：${formatDataMode(state.rules.ai.data_mode)}` },
    { label: "媒体平台规则", value: `${state.rules.publishing.rules.length} 条`, detail: `数据模式：${formatDataMode(state.rules.publishing.data_mode)}` },
    { label: "监测任务", value: `${state.geo.sessions.sessions.length} 个`, detail: `数据模式：${formatDataMode(state.geo.sessions.data_mode)}` },
    { label: "监测记录", value: `${realOrManualRecords.length} 条`, detail: "仅统计真实 / 人工记录" }
  ];

  return (
    <section aria-label="研究数据来源概览" className="fp-card p-6" role="region">
      <p className="text-sm text-emerald-300">研究上下文</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">研究数据来源概览</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">只读引用规则中心和监测数据，用于辅助研究，不会修改原始规则或监测记录。</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5" key={metric.label}>
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-50">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-400">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResearchEvidencePanel({ result }: { result: ResearchResult }) {
  return (
    <section aria-label="研究依据提示" className="fp-card" role="region">
      <div className="fp-panel-header">
        <p className="text-sm text-emerald-300">研究依据</p>
        <h2 className="mt-1 text-base font-semibold text-slate-50">研究依据提示</h2>
      </div>
      <div className="p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <EvidenceCard title="已有监测基础" items={result.monitoredChannelSummaries.length > 0 ? result.monitoredChannelSummaries : ["暂无可复用的监测记录。"]} />
          <EvidenceCard title="已监测问题" items={result.monitoredQuestions.length > 0 ? result.monitoredQuestions : ["暂无已监测问题。"]} />
          <EvidenceCard title="平台适配提示" items={result.platformHints} />
        </div>
      </div>
    </section>
  );
}

function EvidenceCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="text-base font-semibold text-slate-50">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TopicPoolSection({ onUseTopic, topicPool }: { onUseTopic: (item: GeoResearchTopicPoolItem) => void; topicPool: GeoResearchTopicPoolItem[] }) {
  if (topicPool.length === 0) {
    return null;
  }

  return (
    <section aria-label="本地选题池" className="fp-card" role="region">
      <div className="fp-panel-header flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">选题沉淀</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">本地选题池</h2>
          <p className="mt-2 text-sm text-slate-400">把优先选题先收集起来，再选择具体选题进入内容适配。</p>
        </div>
        <span className="shrink-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">待适配选题 {topicPool.length} 条</span>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {topicPool.map((item) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-5" key={item.id}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">{item.status}</span>
              <span className="rounded-md border border-slate-700 px-3 py-1 text-slate-300">{item.platform}</span>
              <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-violet-100">评分 {item.overallScore}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-slate-50">{item.topicTitle}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {item.region}｜{item.productName}
            </p>
            <button
              className="mt-4 rounded-md border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400 hover:text-slate-950"
              onClick={() => onUseTopic(item)}
              type="button"
            >
              用于内容适配
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function WritingRecommendationSection({
  onQueueContentAdaptation,
  recommendations
}: {
  onQueueContentAdaptation: (recommendation: WritingRecommendation) => void;
  recommendations: WritingRecommendation[];
}) {
  return (
    <section aria-label="优先写作建议" className="fp-card" role="region">
      <div className="fp-panel-header flex items-start justify-between gap-3 bg-emerald-950">
        <div>
          <p className="text-sm text-emerald-300">写作优先级</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">优先写作建议</h2>
        </div>
        <span className="shrink-0 rounded-md border border-emerald-800 bg-white px-3 py-1 text-xs text-emerald-700">
          {recommendations.length} 条
        </span>
      </div>
      <div className="p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {recommendations.map((recommendation) => (
            <article className="rounded-lg border border-slate-800 bg-slate-950 p-5" key={`${recommendation.rank}-${recommendation.title}`}>
              <p className="text-sm font-semibold text-emerald-300">{formatRecommendationRank(recommendation.rank)}</p>
              <h3 className="mt-3 text-base font-semibold leading-6 text-slate-50">{recommendation.title}</h3>
              <p className="mt-3 text-sm text-slate-300">综合评分 {recommendation.overallScore}</p>
              <p className="mt-2 text-sm text-slate-400">平台：{recommendation.platform}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation.reason}</p>
              <button
                className="mt-4 rounded-md border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400 hover:text-slate-950"
                onClick={() => onQueueContentAdaptation(recommendation)}
                type="button"
              >
                加入内容适配准备
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopicPlanSection({ topics }: { topics: TopicPlan[] }) {
  return (
    <section aria-label="选题计划" className="fp-card" role="region">
      <div className="fp-panel-header flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">选题评分</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">选题计划</h2>
        </div>
        <span className="shrink-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
          {topics.length} 个平台
        </span>
      </div>
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5" key={topic.platform}>
              <h3 className="text-base font-semibold text-slate-50">{topic.platform}</h3>
              <div className="mt-4 grid gap-3">
                {topic.items.map((item) => (
                  <article aria-label={item.title} className="rounded-md border border-slate-800 bg-slate-900 p-4" key={item.title}>
                    <h4 className="text-sm font-semibold leading-6 text-slate-50">{item.title}</h4>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-100">优先级：{formatPriority(item.priority)}</span>
                      <span className="rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-sky-100">难度：{formatDifficulty(item.difficulty)}</span>
                      <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-violet-100">平台适配：{item.platformFit}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function buildGeoResearchResult(
  form: ResearchForm,
  context: { aiRules: ChannelRule[]; publishingRules: ChannelRule[]; records: GeoMonitorRecord[] }
): ResearchResult {
  const brand = form.brandName.trim();
  const brandShortName = buildBrandShortName(brand);
  const product = form.productName.trim();
  const region = form.region.trim();
  const goal = form.researchGoal.trim() || "品牌曝光";
  const monitoredQuestions = Array.from(new Set(context.records.map((record) => record.query).filter(Boolean))).slice(0, 6);
  const channelCounts = context.records.reduce<Record<string, number>>((counts, record) => {
    counts[record.ai_channel] = (counts[record.ai_channel] || 0) + 1;
    return counts;
  }, {});
  const monitoredChannelSummaries = Object.entries(channelCounts).map(([channel, count]) => `${formatChannelName(channel)} 已有 ${count} 条监测记录`);
  const platformHints = [
    `已读取 ${context.aiRules.length} 条模型平台规则，用于判断研究需要强化哪些可验证信息。`,
    `已读取 ${context.publishingRules.length} 条媒体平台规则，用于后续多平台内容适配。`,
    monitoredQuestions.length > 0 ? "已有监测问题会进入可信复核类问题，后续可继续追踪品牌提及、页面检索和来源引用。" : "当前缺少已监测问题，建议先在监测中心录入真实查询。"
  ];

  const rawTopics = [
    { platform: "官网", items: [`${region}${product}厂家推荐：${brandShortName}${product}能力介绍`, `${product}解决方案：从模型制作到数字孪生联动`] },
    { platform: "公众号", items: [`做${product}不能只看模型外观，还要看哪些系统能力？`, `${goal}视角下，${region}${product}内容怎么规划？`] },
    { platform: "知乎", items: [`${region}有哪些靠谱的${product}制作公司？`, `${product}项目应该怎么选择厂家？`] },
    { platform: "百家号 / 搜狐", items: [`${region}${product}厂家怎么选？智能沙盘与普通沙盘区别详解`, `${product}是什么？组成、功能和应用场景介绍`] },
    { platform: "小红书", items: [`${region}做${product}，厂家到底怎么选？`, `第一次了解${product}，这几个问题先问清楚`] }
  ];
  const topics = scoreTopicPlans(rawTopics, { brand, brandShortName, product, region, monitoredQuestions });

  return {
    entities: [
      { group: "品牌实体", items: [brand] },
      { group: "地域实体", items: [region, "湖北", "华中"] },
      { group: "产品实体", items: [product, "数字沙盘", "智能沙盘模型"] },
      { group: "技术实体", items: ["数字孪生", "中控系统", "触摸屏联动", "灯光控制"] },
      { group: "场景实体", items: ["智慧交通沙盘", "智慧农业沙盘", "智能制造沙盘", "企业展厅"] },
      { group: "对比实体", items: ["传统沙盘", "建筑模型", "数字沙盘公司"] }
    ],
    questions: [
      { group: "是什么类", items: [`${product}是什么？`, `${product}和传统沙盘有什么区别？`] },
      { group: "怎么选类", items: [`${region}${product}厂家怎么选？`, `做${product}需要看厂家哪些能力？`] },
      { group: "厂家推荐类", items: [`${region}有哪些${product}厂家值得了解？`, `${region}${product}制作公司哪家好？`] },
      { group: "价格预算类", items: [`${product}多少钱？`, `${product}报价受哪些因素影响？`] },
      { group: "应用场景类", items: [`${product}适合哪些展厅项目？`, `${product}在智慧交通中怎么展示？`] },
      { group: "可信复核类", items: [`模型提到${brand}时是否引用了官网？`, `${brand}是否被作为${region}${product}来源引用？`, ...monitoredQuestions] }
    ],
    topics,
    writingRecommendations: buildWritingRecommendations(topics),
    monitoredQuestions,
    platformHints,
    monitoredChannelSummaries
  };
}

function scoreTopicPlans(
  rawTopics: Array<{ platform: string; items: string[] }>,
  context: { brand: string; brandShortName: string; product: string; region: string; monitoredQuestions: string[] }
): TopicPlan[] {
  return rawTopics.map((topic) => ({
    platform: topic.platform,
    items: topic.items.map((title) => scoreTopic(title, topic.platform, context))
  }));
}

function scoreTopic(title: string, platform: string, context: { brand: string; brandShortName: string; product: string; region: string; monitoredQuestions: string[] }): TopicScore {
  const priority = calculatePriority(title, context);
  const difficulty = calculateDifficulty(title);
  const platformFit = calculatePlatformFit(title, platform, context);
  const priorityScore = priority === "high" ? 30 : priority === "medium" ? 20 : 10;
  const difficultyPenalty = difficulty === "high" ? 12 : difficulty === "medium" ? 5 : 0;
  const overallScore = clampScore(Math.round(platformFit * 0.7 + priorityScore - difficultyPenalty));

  return {
    title,
    priority,
    difficulty,
    platformFit,
    overallScore,
    reason: buildTopicReason(title, platform, priority, difficulty, context)
  };
}

function calculatePriority(title: string, context: { product: string; region: string; monitoredQuestions: string[] }): TopicPriority {
  const hasRegionProduct = title.includes(context.region) && title.includes(context.product);
  const hasCommercialIntent = /厂家|推荐|怎么选|哪家好|有哪些/.test(title);
  const matchedMonitor = context.monitoredQuestions.some((question) => question.includes(context.product) && title.includes(context.region));

  if ((hasRegionProduct && hasCommercialIntent) || matchedMonitor) return "high";
  if (title.includes(context.product) || /是什么|区别|能力|规划/.test(title)) return "medium";
  return "low";
}

function calculateDifficulty(title: string): TopicDifficulty {
  if (/多少钱|报价|数字孪生|解决方案|区别详解/.test(title)) return "high";
  if (/厂家推荐|怎么选|哪些能力|制作公司|规划/.test(title)) return "medium";
  return "low";
}

function calculatePlatformFit(title: string, platform: string, context: { brand: string; brandShortName: string; product: string; region: string }): number {
  let score = 70;

  if (title.includes(context.product)) score += 8;
  if (title.includes(context.region)) score += 6;
  if (title.includes(context.brand) || title.includes(context.brandShortName)) score += 6;

  if (platform === "官网" && /厂家推荐|能力介绍|解决方案/.test(title)) score += 10;
  if (platform === "公众号" && /能力|规划|视角/.test(title)) score += 9;
  if (platform === "知乎" && /？|怎么|哪些|选择/.test(title)) score += 12;
  if (platform.includes("百家号") && /是什么|详解|区别|应用场景/.test(title)) score += 12;
  if (platform === "小红书" && /怎么选|第一次|先问清楚|到底/.test(title)) score += 14;

  return clampScore(score);
}

function buildTopicReason(
  title: string,
  platform: string,
  priority: TopicPriority,
  difficulty: TopicDifficulty,
  context: { brandShortName: string; product: string; region: string }
): string {
  const priorityText = priority === "high" ? "优先级高" : priority === "medium" ? "优先级中" : "优先级低";
  const difficultyText = difficulty === "high" ? "需要更多事实材料支撑" : difficulty === "medium" ? "需要补充案例或参数" : "可快速产出";

  if (platform === "官网" && title.includes(context.region) && title.includes(context.product) && title.includes("厂家推荐")) {
    return `地域 + 产品 + 厂家推荐意图明确，适合作为官网核心入口；${priorityText}，${difficultyText}。`;
  }

  if (platform === "小红书") {
    return `适合小红书的场景化表达，可把专业产品转成用户能理解的选型问题；${priorityText}，${difficultyText}。`;
  }

  if (platform === "知乎") {
    return `问题导向明显，适合用解释、判断和案例建立可信度；${priorityText}，${difficultyText}。`;
  }

  if (platform.includes("百家号")) {
    return `搜索型标题清晰，适合覆盖知识解释和长尾搜索；${priorityText}，${difficultyText}。`;
  }

  return `围绕${context.brandShortName || context.product}的业务能力展开，适合沉淀品牌专业内容；${priorityText}，${difficultyText}。`;
}

function buildWritingRecommendations(topics: TopicPlan[]): WritingRecommendation[] {
  const ranks: WritingRecommendation["rank"][] = ["first", "second", "third"];
  return topics
    .flatMap((topic) => topic.items.map((item) => ({ ...item, platform: topic.platform })))
    .sort((left, right) => right.overallScore - left.overallScore)
    .slice(0, 3)
    .map((item, index) => ({
      rank: ranks[index],
      platform: item.platform,
      title: item.title,
      overallScore: item.overallScore,
      reason: item.reason
    }));
}

function formatPriority(priority: TopicPriority) {
  return priority === "high" ? "高" : priority === "medium" ? "中" : "低";
}

function formatDifficulty(difficulty: TopicDifficulty) {
  return difficulty === "high" ? "高" : difficulty === "medium" ? "中" : "低";
}

function formatRecommendationRank(rank: WritingRecommendation["rank"]) {
  if (rank === "first") return "第一优先";
  if (rank === "second") return "第二优先";
  return "第三优先";
}

function formatDataMode(dataMode: string) {
  const dictionary: Record<string, string> = {
    manual: "人工录入",
    real: "真实采集",
    mock: "模拟数据",
    fallback: "兜底数据"
  };

  return dictionary[dataMode] || "未知模式";
}

function formatChannelName(channelName: string) {
  const dictionary: Record<string, string> = {
    DeepSeek: "深度求索",
    Kimi: "月之暗面",
    Doubao: "豆包",
    Wenxin: "文心一言",
    Yuanbao: "腾讯元宝"
  };

  return dictionary[channelName] || channelName;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function buildBrandShortName(brandName: string) {
  return brandName
    .replace(/智能科技有限公司/g, "")
    .replace(/科技有限公司/g, "")
    .replace(/有限公司/g, "")
    .trim();
}
