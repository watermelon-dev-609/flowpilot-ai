"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ContentAdaptationInput,
  PlatformDraft,
  PublishingPlatformId,
  generatePlatformDrafts
} from "./content-adaptation-engine";
import {
  GeoResearchContentAdaptationIntake,
  GeoResearchTopicPoolItem,
  GeoResearchTopicStatus,
  buildContentCalendarGroups
} from "../../lib/geo-research-topic-contract";
import { createBrowserTopicPoolRepository } from "../../lib/topic-pool-repository";

const STORAGE_KEY = "flowpilot.contentAdaptation.latestDrafts";
const VERSION_STORAGE_KEY = "flowpilot.contentAdaptation.versions";
const PUBLISH_QUEUE_STORAGE_KEY = "flowpilot.contentAdaptation.publishQueue";
const GEO_RESEARCH_INTAKE_STORAGE_KEY = "flowpilot.geoResearch.contentAdaptationIntake";

const platformOptions: Array<{ id: PublishingPlatformId; name: string }> = [
  { id: "wechat", name: "微信公众号" },
  { id: "zhihu", name: "知乎" },
  { id: "xiaohongshu", name: "小红书" },
  { id: "baijiahao", name: "百家号" },
  { id: "website", name: "企业官网" }
];

const defaultForm: ContentAdaptationInput = {
  brandName: "",
  productName: "",
  region: "",
  topicTitle: "",
  targetAudience: "",
  facts: "",
  selectedPlatforms: ["wechat", "zhihu", "xiaohongshu", "baijiahao"]
};

type PersistedDraftState = {
  form: ContentAdaptationInput;
  drafts: PlatformDraft[];
  savedAt: string;
};

type ReviewStatus = "pending" | "approved" | "needs_revision";

type ContentDraftVersion = PersistedDraftState & {
  id: string;
  versionNumber: number;
  reviewStatus: ReviewStatus;
};

type PublishQueueItem = {
  id: string;
  versionId: string;
  sourceTopicTitle: string;
  topicTitle: string;
  platformCount: number;
  platformDrafts: PublishQueueDraftSummary[];
  status: "ready";
  queuedAt: string;
};

type PublishQueueDraftSummary = {
  platformId: PublishingPlatformId;
  platformName: string;
  title: string;
  reviewStatus: string;
};

const reviewStatusLabel: Record<ReviewStatus, string> = {
  pending: "待审核",
  approved: "审核通过",
  needs_revision: "需修改"
};

export function ContentAdaptationWorkspace() {
  const [form, setForm] = useState<ContentAdaptationInput>(defaultForm);
  const [drafts, setDrafts] = useState<PlatformDraft[]>([]);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [versions, setVersions] = useState<ContentDraftVersion[]>([]);
  const [publishQueue, setPublishQueue] = useState<PublishQueueItem[]>([]);
  const [topicPool, setTopicPool] = useState<GeoResearchTopicPoolItem[]>([]);
  const [activeTopicPoolItemId, setActiveTopicPoolItemId] = useState("");

  const serializedDrafts = useMemo(() => serializeDrafts(drafts), [drafts]);

  useEffect(() => {
    const nextTopicPool = restoreGeoResearchTopicPool();
    setVersions(restoreDraftVersions());
    setPublishQueue(restorePublishQueue());
    setTopicPool(nextTopicPool);

    const linkedPlan = getLinkedContentCalendarPlan(nextTopicPool);
    if (linkedPlan) {
      setForm(buildFormFromTopicPoolItem(linkedPlan));
      setDrafts([]);
      setActiveTopicPoolItemId(linkedPlan.id);
      updateTopicPoolItemStatus(linkedPlan.id, "适配中", setTopicPool);
      setFeedback("已从内容日历带入选题");
      return;
    }

    const persisted = restoreDraftState();

    if (persisted) {
      setForm(persisted.form);
      setDrafts(persisted.drafts);
      setFeedback("已恢复上次保存的平台草稿");
      return;
    }

    const intake = restoreGeoResearchIntake();
    if (intake) {
      setForm({
        ...defaultForm,
        ...intake
      });
      setFeedback("已带入生成式优化研究选题");
    }
  }, []);

  function handleUseTopicPoolItem(item: GeoResearchTopicPoolItem) {
    setError("");
    setDrafts([]);
    setActiveTopicPoolItemId(item.id);
    setForm(buildFormFromTopicPoolItem(item));
    updateTopicPoolItemStatus(item.id, "适配中", setTopicPool);
    setFeedback("已从研究选题池带入选题");
  }

  function handleArchiveTopicPoolItem(itemId: string) {
    setError("");
    updateTopicPoolItemStatus(itemId, "已作废", setTopicPool);
    setFeedback("已作废该选题");
  }

  function handleClearGeneratedTopics() {
    setError("");
    const topicPoolRepository = createBrowserTopicPoolRepository();
    const nextTopicPool = topicPoolRepository.list().filter((item) => item.status !== "已生成");
    topicPoolRepository.save(nextTopicPool);
    setTopicPool(nextTopicPool);
    setFeedback("已清理已生成选题");
  }

  function updateField(field: keyof ContentAdaptationInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function togglePlatform(platformId: PublishingPlatformId, checked: boolean) {
    setForm((current) => ({
      ...current,
      selectedPlatforms: checked
        ? Array.from(new Set([...current.selectedPlatforms, platformId]))
        : current.selectedPlatforms.filter((item) => item !== platformId)
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFeedback("");
    setIsGenerating(true);

    try {
      const generatedDrafts = generatePlatformDrafts(form);
      const nextVersion = createDraftVersion(form, generatedDrafts);
      const nextVersions = [nextVersion, ...versions].slice(0, 10);

      setDrafts(generatedDrafts);
      persistDraftState({ form, drafts: generatedDrafts, savedAt: new Date().toISOString() });
      setVersions(nextVersions);
      persistDraftVersions(nextVersions);
      if (activeTopicPoolItemId) {
        updateTopicPoolItemStatus(activeTopicPoolItemId, "已生成", setTopicPool);
      }
      setFeedback("已保存本次平台草稿");
    } catch (submitError) {
      setDrafts([]);
      setError(submitError instanceof Error ? submitError.message : "平台草稿生成失败，请稍后重试");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    setError("");
    setFeedback("");

    if (!serializedDrafts) {
      setError("暂无可复制的平台草稿");
      return;
    }

    try {
      await navigator.clipboard.writeText(serializedDrafts);
      setFeedback("已复制平台草稿");
    } catch {
      setError("复制失败，请手动选择草稿内容");
    }
  }

  function handleDownload() {
    setError("");
    setFeedback("");

    if (!serializedDrafts) {
      setError("暂无可下载的平台草稿");
      return;
    }

    const blob = new Blob([serializedDrafts], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "平台草稿.txt";
    link.click();
    URL.revokeObjectURL(downloadUrl);
    setFeedback("已下载平台草稿文本");
  }

  function handleRestoreVersion(version: ContentDraftVersion) {
    setError("");
    setForm(version.form);
    setDrafts(version.drafts);
    persistDraftState({ form: version.form, drafts: version.drafts, savedAt: version.savedAt });
    setFeedback("已恢复所选内容版本");
  }

  function handleReviewStatus(versionId: string, reviewStatus: ReviewStatus) {
    const nextVersions = versions.map((version) => (version.id === versionId ? { ...version, reviewStatus } : version));
    setVersions(nextVersions);
    persistDraftVersions(nextVersions);
    setFeedback(reviewStatus === "approved" ? "已标记为审核通过" : "已标记为需要修改");
  }

  function handleQueueVersion(version: ContentDraftVersion) {
    setError("");
    setFeedback("");

    if (version.reviewStatus !== "approved") {
      setError("只有审核通过的内容版本才能加入发布准备队列");
      return;
    }

    if (publishQueue.some((item) => item.versionId === version.id)) {
      setFeedback("该内容版本已在发布准备队列中");
      return;
    }

    const queuedItem: PublishQueueItem = {
      id: `publish-queue-${new Date().toISOString()}-${version.versionNumber}`,
      versionId: version.id,
      sourceTopicTitle: version.form.topicTitle,
      topicTitle: version.form.topicTitle,
      platformCount: version.drafts.length,
      platformDrafts: version.drafts.map((draft) => ({
        platformId: draft.platformId,
        platformName: draft.platformName,
        title: draft.title,
        reviewStatus: reviewStatusLabel[version.reviewStatus]
      })),
      status: "ready",
      queuedAt: new Date().toISOString()
    };
    const nextQueue = [queuedItem, ...publishQueue].slice(0, 10);
    setPublishQueue(nextQueue);
    persistPublishQueue(nextQueue);
    setFeedback("已加入发布准备队列");
  }

  return (
    <div className="grid gap-4">
      <section aria-label="新建和录入操作区" className="fp-card">
        <div className="fp-panel-header">
          <p className="text-sm text-emerald-300">新建 / 录入操作区</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">生成平台草稿</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            先录入可确认的业务事实，再生成平台草稿。草稿用于提升适配效率，不能直接等同于最终发布内容。
          </p>
        </div>

        <form className="grid gap-4 p-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <TextField label="品牌名称" value={form.brandName} onChange={(value) => updateField("brandName", value)} />
          <TextField label="产品名称" value={form.productName} onChange={(value) => updateField("productName", value)} />
          <TextField label="目标地域" value={form.region} onChange={(value) => updateField("region", value)} />
          <TextField label="选题标题" value={form.topicTitle} onChange={(value) => updateField("topicTitle", value)} />
          <TextField label="目标受众" value={form.targetAudience} onChange={(value) => updateField("targetAudience", value)} wide />
          <TextArea label="可确认事实" value={form.facts} onChange={(value) => updateField("facts", value)} />

          <fieldset className="md:col-span-2">
            <legend className="text-sm text-slate-300">发布平台</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {platformOptions.map((platform) => (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-emerald-400"
                  key={platform.id}
                >
                  <input
                    checked={form.selectedPlatforms.includes(platform.id)}
                    className="h-4 w-4"
                    onChange={(event) => togglePlatform(platform.id, event.target.checked)}
                    type="checkbox"
                  />
                  {platform.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              className="cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}
              type="submit"
            >
              {isGenerating ? "生成中" : "生成平台草稿"}
            </button>
            <button
              className="cursor-pointer rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={drafts.length === 0}
              onClick={handleCopy}
              type="button"
            >
              复制全部草稿
            </button>
            <button
              className="cursor-pointer rounded-md border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={drafts.length === 0}
              onClick={handleDownload}
              type="button"
            >
              下载草稿文本
            </button>
          </div>
        </form>
      </section>

      <section aria-label="内容边界提示" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-base font-semibold text-amber-200">发布前仍需人工复核</p>
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          本功能不承诺搜索排名、平台收录或模型引用。平台草稿只用于提高内容适配效率，事实、参数、案例和表达边界必须由人工确认。
        </p>
      </section>

      {error ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}
      {feedback ? <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{feedback}</p> : null}

      {topicPool.length > 0 ? (
        <ResearchTopicPool
          items={topicPool}
          onArchiveTopic={handleArchiveTopicPoolItem}
          onClearGenerated={handleClearGeneratedTopics}
          onUseTopic={handleUseTopicPoolItem}
        />
      ) : null}
      {topicPool.length > 0 ? <ContentCalendar items={topicPool} /> : null}
      {versions.length > 0 ? (
        <VersionList
          onQueue={handleQueueVersion}
          onRestore={handleRestoreVersion}
          onReviewStatus={handleReviewStatus}
          versions={versions}
        />
      ) : null}
      {publishQueue.length > 0 ? <PublishQueue items={publishQueue} /> : null}
      {drafts.length > 0 ? <DraftGrid drafts={drafts} /> : <EmptyDraftState />}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  wide = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-slate-300 md:col-span-2">
      {label}
      <textarea
        className="mt-2 min-h-28 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function EmptyDraftState() {
  return (
    <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
      <p className="text-base font-semibold text-slate-50">暂无平台草稿</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        填写业务资料并点击生成后，这里会展示不同平台的标题、正文草稿、平台策略、评分和风险提示。
      </p>
    </section>
  );
}

function ResearchTopicPool({
  items,
  onArchiveTopic,
  onClearGenerated,
  onUseTopic
}: {
  items: GeoResearchTopicPoolItem[];
  onArchiveTopic: (itemId: string) => void;
  onClearGenerated: () => void;
  onUseTopic: (item: GeoResearchTopicPoolItem) => void;
}) {
  const hasGeneratedTopics = items.some((item) => item.status === "已生成");

  return (
    <section aria-label="研究选题池" className="fp-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">研究选题池</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">从研究页带入待适配选题</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">选择一条选题后会填入上方表单，原有平台草稿会被清空，避免新旧选题混在一起。</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">待适配选题 {items.length} 条</span>
          {hasGeneratedTopics ? (
            <button
              className="cursor-pointer rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-amber-400 hover:text-amber-200"
              onClick={onClearGenerated}
              type="button"
            >
              清理已生成选题
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={item.id}>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200">{item.status}</span>
              <span className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">{item.platform}</span>
              <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-violet-100">评分 {item.overallScore}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold leading-6 text-slate-50">{item.topicTitle}</h3>
            <p className="mt-2 text-xs text-slate-500">
              {item.region} · {item.productName}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="cursor-pointer rounded-md border border-emerald-400/50 px-3 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-400 hover:text-slate-950"
                onClick={() => onUseTopic(item)}
                type="button"
              >
                带入此选题
              </button>
              {item.status !== "已生成" && item.status !== "已作废" ? (
                <button
                  className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:border-amber-400 hover:text-amber-200"
                  onClick={() => onArchiveTopic(item.id)}
                  type="button"
                >
                  作废选题
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentCalendar({ items }: { items: GeoResearchTopicPoolItem[] }) {
  const calendarItems = items.filter((item) => item.status !== "已作废");
  if (calendarItems.length === 0) {
    return null;
  }

  const calendarGroups = buildContentCalendarGroups(calendarItems);

  return (
    <section aria-label="内容日历" className="fp-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">内容日历</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">选题生产计划雏形</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">优先按计划发布时间归档；未设置计划时间时，暂时回退到选题创建日期。</p>
        </div>
        <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">计划选题 {calendarItems.length} 条</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {calendarGroups.map((group) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={group.dateLabel}>
            <p className="text-sm font-semibold text-slate-50">{group.dateLabel}</p>
            <div className="mt-3 space-y-3">
              {group.items.map((item) => (
                <div className="rounded-md border border-slate-800 bg-slate-900 p-3" key={item.id}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200">{item.status}</span>
                    <span className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">{item.platform}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate-50">{item.topicTitle}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.region} · {item.productName} · 评分 {item.overallScore}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">负责人 {item.owner || "未分配"}</span>
                    <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">优先级 {item.priority || "中"}</span>
                    <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">阶段 {item.contentStage || "待生产"}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VersionList({
  versions,
  onQueue,
  onRestore,
  onReviewStatus
}: {
  versions: ContentDraftVersion[];
  onQueue: (version: ContentDraftVersion) => void;
  onRestore: (version: ContentDraftVersion) => void;
  onReviewStatus: (versionId: string, status: ReviewStatus) => void;
}) {
  return (
    <section aria-label="内容版本记录" className="fp-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">内容版本记录</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">最近生成的内容版本</h2>
        </div>
        <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
          最多保留 10 条
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {versions.map((version) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={version.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">版本 {version.versionNumber}</p>
                <p className="mt-1 text-sm text-slate-400">{version.form.topicTitle}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {version.form.brandName} · {version.drafts.length} 个平台草稿
                </p>
                <span className="mt-3 inline-flex rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
                  {reviewStatusLabel[version.reviewStatus]}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400"
                  onClick={() => onReviewStatus(version.id, "approved")}
                  type="button"
                >
                  标记通过
                </button>
                <button
                  className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-400"
                  onClick={() => onReviewStatus(version.id, "needs_revision")}
                  type="button"
                >
                  标记需修改
                </button>
                <button
                  className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400"
                  onClick={() => onQueue(version)}
                  type="button"
                >
                  加入发布准备
                </button>
                <button
                  className="cursor-pointer rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-emerald-400"
                  onClick={() => onRestore(version)}
                  type="button"
                >
                  恢复此版本
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublishQueue({ items }: { items: PublishQueueItem[] }) {
  return (
    <section aria-label="发布准备队列" className="fp-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">发布准备队列</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">仅保存待人工发布的内容</h2>
        </div>
        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
          不会自动发布到外部平台
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-50">{item.topicTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{item.platformCount} 个平台草稿</p>
                {item.platformDrafts?.length ? (
                  <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    {item.platformDrafts.map((draft) => (
                      <li key={`${item.id}-${draft.platformId}`}>
                        {draft.platformName}：{draft.title}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                准备发布
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DraftGrid({ drafts }: { drafts: PlatformDraft[] }) {
  return (
    <section aria-label="平台草稿列表" className="grid gap-4 lg:grid-cols-2">
      {drafts.map((draft) => (
        <article className="fp-card p-5" key={draft.platformId}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-emerald-300">{draft.platformName}</p>
              <h3 className="mt-2 text-base font-semibold leading-6 text-slate-50">{draft.title}</h3>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                综合评分 {draft.score.overall}
              </span>
              <span className="rounded-md border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs text-sky-200">
                适配评分 {draft.adaptationScore}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold text-slate-400">平台策略</p>
            <p className="mt-1 text-sm text-slate-200">{draft.platformStrategy}</p>
            <p className="mt-3 text-xs font-semibold text-slate-400">引用准备提示</p>
            <p className="mt-1 text-sm text-slate-300">{draft.citationReadinessHint}</p>
          </div>

          <p className="mt-3 text-sm text-slate-400">结构：{draft.structureType}</p>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-300">{draft.body}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            {draft.suggestedTags.map((tag) => (
              <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold text-slate-400">发布建议</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {draft.distributionAdvice.map((advice) => (
                  <li key={advice}>· {advice}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">风险提示</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-300">
                {draft.warnings.map((warning) => (
                  <li key={warning}>· {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function serializeDrafts(drafts: PlatformDraft[]) {
  return drafts
    .map((draft) =>
      [
        `## ${draft.platformName}`,
        draft.title,
        `平台策略：${draft.platformStrategy}`,
        `适配评分：${draft.adaptationScore}`,
        `引用准备提示：${draft.citationReadinessHint}`,
        draft.body,
        `综合评分：${draft.score.overall}`,
        `发布建议：${draft.distributionAdvice.join("；")}`,
        `风险提示：${draft.warnings.join("；")}`
      ].join("\n\n")
    )
    .join("\n\n---\n\n");
}

function restoreDraftState(): PersistedDraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedDraftState;
    if (!parsed.form || !Array.isArray(parsed.drafts)) {
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function restoreGeoResearchIntake(): GeoResearchContentAdaptationIntake | null {
  try {
    const raw = localStorage.getItem(GEO_RESEARCH_INTAKE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as GeoResearchContentAdaptationIntake;
    if (!parsed.brandName || !parsed.productName || !parsed.region || !parsed.topicTitle) {
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(GEO_RESEARCH_INTAKE_STORAGE_KEY);
    return null;
  }
}

function restoreGeoResearchTopicPool(): GeoResearchTopicPoolItem[] {
  return createBrowserTopicPoolRepository().list();
}

function getLinkedContentCalendarPlan(items: GeoResearchTopicPoolItem[]) {
  if (typeof window === "undefined") {
    return null;
  }

  const planId = new URLSearchParams(window.location.search).get("plan");
  if (!planId) {
    return null;
  }

  return items.find((item) => item.id === planId && item.status !== "已作废") ?? null;
}

function buildFormFromTopicPoolItem(item: GeoResearchTopicPoolItem): ContentAdaptationInput {
  return {
    ...defaultForm,
    brandName: item.brandName,
    productName: item.productName,
    region: item.region,
    topicTitle: item.topicTitle,
    targetAudience: item.targetAudience,
    facts: item.facts
  };
}

function updateTopicPoolItemStatus(
  itemId: string,
  status: GeoResearchTopicStatus,
  setTopicPool: (items: GeoResearchTopicPoolItem[]) => void
) {
  setTopicPool(createBrowserTopicPoolRepository().updateStatus(itemId, status));
}

function persistDraftState(state: PersistedDraftState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreDraftVersions(): ContentDraftVersion[] {
  try {
    const raw = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ContentDraftVersion[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item.form && Array.isArray(item.drafts))
      .map((item) => ({
        ...item,
        reviewStatus: item.reviewStatus ?? "pending"
      }));
  } catch {
    localStorage.removeItem(VERSION_STORAGE_KEY);
    return [];
  }
}

function persistDraftVersions(versions: ContentDraftVersion[]) {
  localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
}

function createDraftVersion(form: ContentAdaptationInput, drafts: PlatformDraft[]): ContentDraftVersion {
  const existingVersions = restoreDraftVersions();
  const nextVersionNumber = existingVersions.reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1;
  const savedAt = new Date().toISOString();

  return {
    id: `content-version-${savedAt}-${nextVersionNumber}`,
    versionNumber: nextVersionNumber,
    reviewStatus: "pending",
    form,
    drafts,
    savedAt
  };
}

function restorePublishQueue(): PublishQueueItem[] {
  try {
    const raw = localStorage.getItem(PUBLISH_QUEUE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as PublishQueueItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item.versionId && item.topicTitle && item.status === "ready")
      .map((item) => ({
        ...item,
        sourceTopicTitle: item.sourceTopicTitle ?? item.topicTitle,
        platformDrafts: Array.isArray(item.platformDrafts) ? item.platformDrafts : []
      }));
  } catch {
    localStorage.removeItem(PUBLISH_QUEUE_STORAGE_KEY);
    return [];
  }
}

function persistPublishQueue(items: PublishQueueItem[]) {
  localStorage.setItem(PUBLISH_QUEUE_STORAGE_KEY, JSON.stringify(items));
}
