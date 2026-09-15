"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadPublishQueueItems, PublishQueueItem as ApiPublishQueueItem, updatePublishQueueItem } from "../lib/flowpilot-api";

const PUBLISH_QUEUE_STORAGE_KEY = "flowpilot.contentAdaptation.publishQueue";

type PublishQueueItem = {
  id: string;
  versionId: string;
  sourceTopicTitle?: string;
  topicTitle: string;
  platformCount: number;
  platformDrafts?: PublishQueueDraftSummary[];
  status: PublishTaskStatus;
  queuedAt: string;
  publishingChannel?: string;
  operatorName?: string;
  plannedPublishAt?: string;
  actualPublishAt?: string;
  publishedUrl?: string;
  failureReason?: string;
  operatorNote?: string;
  lastAction?: string;
  lastUpdatedAt?: string;
};

type PublishQueueDraftSummary = {
  platformId: string;
  platformName: string;
  title: string;
  reviewStatus: string;
};

type PublishTaskStatus = "ready" | "publishing" | "published" | "failed" | "cancelled";
type PublishStatusFilter = PublishTaskStatus | "all";
type PublishRecordField =
  | "publishingChannel"
  | "operatorName"
  | "plannedPublishAt"
  | "actualPublishAt"
  | "publishedUrl"
  | "failureReason"
  | "operatorNote";

const statusLabels: Record<PublishTaskStatus, string> = {
  ready: "待发布",
  publishing: "发布中",
  published: "已发布",
  failed: "发布失败",
  cancelled: "已取消"
};

const statusFilterOptions: Array<{ label: string; value: PublishStatusFilter }> = [
  { label: "全部状态", value: "all" },
  { label: "待发布", value: "ready" },
  { label: "发布中", value: "publishing" },
  { label: "已发布", value: "published" },
  { label: "发布失败", value: "failed" },
  { label: "已取消", value: "cancelled" }
];

export function PublishQueueWorkspace() {
  const [items, setItems] = useState<PublishQueueItem[]>(() => restorePublishQueue());
  const [linkedItemId, setLinkedItemId] = useState("");
  const [statusFilter, setStatusFilter] = useState<PublishStatusFilter>("all");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<PublishTaskStatus>("publishing");
  const [lastSavedPublishedItemId, setLastSavedPublishedItemId] = useState("");

  useEffect(() => {
    let active = true;

    async function restoreItems() {
      try {
        const response = await loadPublishQueueItems();
        const apiItems = response.items.map(mapApiPublishQueueItem);
        if (!active) return;
        setItems(apiItems);
        persistPublishQueue(apiItems);
        setLinkedItemId(getLinkedPublishQueueItemId(apiItems));
      } catch {
        if (!active) return;
        setLinkedItemId(getLinkedPublishQueueItemId(restorePublishQueue()));
      }
    }

    restoreItems();

    return () => {
      active = false;
    };
  }, []);

  const filteredItems = useMemo(
    () => {
      const statusMatchedItems = statusFilter === "all" ? items : items.filter((item) => item.status === statusFilter);
      return linkedItemId ? statusMatchedItems.filter((item) => item.id === linkedItemId) : statusMatchedItems;
    },
    [items, linkedItemId, statusFilter]
  );
  const filteredItemIds = filteredItems.map((item) => item.id);
  const linkedItem = items.find((item) => item.id === linkedItemId);
  const lastSavedPublishedItem = items.find((item) => item.id === lastSavedPublishedItemId);

  function toggleItemSelection(itemId: string) {
    setSelectedItemIds((current) => (current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]));
    clearMessages();
  }

  function selectFilteredItems() {
    setSelectedItemIds((current) => Array.from(new Set([...current, ...filteredItemIds])));
    clearMessages();
  }

  function clearSelection() {
    setSelectedItemIds([]);
    clearMessages();
  }

  function removeSelectedItems() {
    const selectedIds = new Set(selectedItemIds);
    const selectedCount = items.filter((item) => selectedIds.has(item.id)).length;

    if (selectedCount === 0) {
      setError("请先选择发布准备记录");
      setFeedback("");
      return;
    }

    const nextItems = items.filter((item) => !selectedIds.has(item.id));
    setItems(nextItems);
    setSelectedItemIds([]);
    persistPublishQueue(nextItems);
    setFeedback(`已移除 ${selectedCount} 条发布准备记录`);
    setError("");
  }

  function updateSelectedStatus() {
    const selectedIds = new Set(selectedItemIds);
    const selectedCount = items.filter((item) => selectedIds.has(item.id)).length;

    if (selectedCount === 0) {
      setError("请先选择发布准备记录");
      setFeedback("");
      return;
    }

    const nextItems = items.map((item) => (selectedIds.has(item.id) ? { ...item, status: bulkStatus } : item));
    setItems(nextItems);
    persistPublishQueue(nextItems);
    setFeedback(`已批量更新 ${selectedCount} 条发布准备记录`);
    setError("");
  }

  function updateStatus(itemId: string, status: PublishTaskStatus) {
    const targetItem = items.find((item) => item.id === itemId);
    const validationError = targetItem ? validatePublishStatusChange(targetItem, status) : "";
    if (validationError) {
      setError(validationError);
      setFeedback("");
      return;
    }

    const nextItems = items.map((item) => (item.id === itemId ? { ...item, status } : item));
    setItems(nextItems);
    persistPublishQueue(nextItems);
    clearMessages();
  }

  function updateRecordField(itemId: string, field: PublishRecordField, value: string) {
    setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
    clearMessages();
  }

  async function savePublishRecord(itemId: string) {
    const targetItem = items.find((item) => item.id === itemId);
    if (!targetItem) {
      setError("未找到需要保存的发布记录");
      setFeedback("");
      return;
    }

    if (targetItem.publishedUrl && !isHttpUrl(targetItem.publishedUrl)) {
      setError("发布链接需要以 http:// 或 https:// 开头");
      setFeedback("");
      return;
    }

    const validationError = validatePublishStatusChange(targetItem, targetItem.status);
    if (validationError) {
      setError(validationError);
      setFeedback("");
      return;
    }

    const localSavedItem = {
      ...targetItem,
      lastAction: "保存发布记录",
      lastUpdatedAt: new Date().toISOString()
    };

    let savedItem: PublishQueueItem = localSavedItem;
    try {
      savedItem = mapApiPublishQueueItem(
        await updatePublishQueueItem(itemId, {
          status: targetItem.status,
          publishing_channel: targetItem.publishingChannel,
          operator_name: targetItem.operatorName,
          planned_publish_at: targetItem.plannedPublishAt,
          actual_publish_at: targetItem.actualPublishAt,
          published_url: targetItem.publishedUrl,
          failure_reason: targetItem.failureReason,
          operator_note: targetItem.operatorNote,
          actor: "frontend-user"
        })
      );
    } catch {
      savedItem = localSavedItem;
    }

    const nextItems = items.map((item) => (item.id === itemId ? savedItem : item));
    setItems(nextItems);
    persistPublishQueue(nextItems);
    setLastSavedPublishedItemId(targetItem.status === "published" && targetItem.publishedUrl ? itemId : "");
    setFeedback("已保存发布记录");
    setError("");
  }

  function exportRecords(format: "markdown" | "csv", scope: "all" | "selected" = "all") {
    const selectedIds = new Set(selectedItemIds);
    const exportItems = scope === "selected" ? items.filter((item) => selectedIds.has(item.id)) : items;

    if (exportItems.length === 0) {
      setError("请先选择发布准备记录");
      setFeedback("");
      return;
    }

    const content = format === "markdown" ? buildMarkdownExport(exportItems) : buildCsvExport(exportItems);
    const filename = format === "markdown" ? "发布记录.md" : "发布记录.csv";
    downloadTextFile(content, filename, format === "markdown" ? "text/markdown;charset=utf-8" : "text/csv;charset=utf-8");
    if (scope === "selected") {
      setFeedback(format === "markdown" ? "已生成选中 Markdown 发布记录" : "已生成选中 CSV 发布记录");
    } else {
      setFeedback(format === "markdown" ? "已生成 Markdown 发布记录" : "已生成 CSV 发布记录");
    }
    setError("");
  }

  function clearMessages() {
    setFeedback("");
    setError("");
  }

  return (
    <div className="grid gap-4">
      <section aria-label="发布边界提示" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
        <p className="text-base font-semibold text-amber-200">不会自动发布到外部平台</p>
        <p className="mt-2 text-sm leading-6 text-amber-100/80">
          这里展示的是内部发布准备队列。实际发布前仍需要人工复核标题、正文、图片、平台规则和账号状态。
        </p>
      </section>

      <PublishQueueToolbar
        bulkStatus={bulkStatus}
        itemCount={items.length}
        onExport={exportRecords}
        onExportSelected={(format) => exportRecords(format, "selected")}
        onClearSelection={clearSelection}
        onRemoveSelected={removeSelectedItems}
        onSelectFiltered={selectFilteredItems}
        onSelectedStatusChange={setBulkStatus}
        onStatusFilterChange={setStatusFilter}
        onUpdateSelectedStatus={updateSelectedStatus}
        selectedCount={selectedItemIds.length}
        statusFilter={statusFilter}
        visibleCount={filteredItems.length}
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {feedback ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <p>{feedback}</p>
          {lastSavedPublishedItem?.publishedUrl ? (
            <Link
              className="cursor-pointer rounded-md border border-emerald-400/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-400 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
              href={buildMonitorRecordHref(lastSavedPublishedItem)}
            >
              进入监测复盘
            </Link>
          ) : null}
        </div>
      ) : null}

      {linkedItem ? (
        <p role="status" className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
          已定位发布准备记录：{linkedItem.topicTitle}
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyQueue />
      ) : filteredItems.length > 0 ? (
        <QueueList
          items={filteredItems}
          onRecordChange={updateRecordField}
          onRecordSave={savePublishRecord}
          onStatusChange={updateStatus}
          onToggleSelection={toggleItemSelection}
          selectedItemIds={selectedItemIds}
        />
      ) : (
        <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
          <p className="text-base font-semibold text-slate-50">当前筛选条件下暂无发布记录</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">可以切换状态筛选，或回到内容适配页加入新的发布准备内容。</p>
        </section>
      )}
    </div>
  );
}

function PublishQueueToolbar({
  bulkStatus,
  itemCount,
  onExport,
  onExportSelected,
  onClearSelection,
  onRemoveSelected,
  onSelectFiltered,
  onSelectedStatusChange,
  onStatusFilterChange,
  onUpdateSelectedStatus,
  selectedCount,
  visibleCount,
  statusFilter
}: {
  bulkStatus: PublishTaskStatus;
  itemCount: number;
  onExport: (format: "markdown" | "csv") => void;
  onExportSelected: (format: "markdown" | "csv") => void;
  onClearSelection: () => void;
  onRemoveSelected: () => void;
  onSelectFiltered: () => void;
  onSelectedStatusChange: (status: PublishTaskStatus) => void;
  onStatusFilterChange: (status: PublishStatusFilter) => void;
  onUpdateSelectedStatus: () => void;
  selectedCount: number;
  statusFilter: PublishStatusFilter;
  visibleCount: number;
}) {
  return (
    <section aria-label="发布队列操作区" className="fp-card grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="grid gap-3 sm:grid-cols-[minmax(180px,260px)_1fr] sm:items-end">
        <label className="grid gap-2 text-xs font-medium text-slate-300">
          状态筛选
          <select
            className="cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onStatusFilterChange(event.target.value as PublishStatusFilter)}
            value={statusFilter}
          >
            {statusFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm leading-6 text-slate-400">当前共有 {itemCount} 条发布准备记录，导出只用于人工复盘和周报整理。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300">
          已选择 {selectedCount} 条
        </span>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={visibleCount === 0}
          onClick={onSelectFiltered}
          type="button"
        >
          选择当前结果
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={onRemoveSelected}
          type="button"
        >
          移除选中记录
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={onClearSelection}
          type="button"
        >
          清空选择
        </button>
        <label className="grid gap-1 text-xs font-medium text-slate-300">
          批量状态
          <select
            className="cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-400"
            onChange={(event) => onSelectedStatusChange(event.target.value as PublishTaskStatus)}
            value={bulkStatus}
          >
            {statusFilterOptions
              .filter((option): option is { label: string; value: PublishTaskStatus } => option.value !== "all")
              .map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        </label>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={onUpdateSelectedStatus}
          type="button"
        >
          批量改状态
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={() => onExportSelected("markdown")}
          type="button"
        >
          导出选中 Markdown
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={selectedCount === 0}
          onClick={() => onExportSelected("csv")}
          type="button"
        >
          导出选中 CSV
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400"
          disabled={itemCount === 0}
          onClick={() => onExport("markdown")}
          type="button"
        >
          导出 Markdown
        </button>
        <button
          className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition-colors hover:border-emerald-400"
          disabled={itemCount === 0}
          onClick={() => onExport("csv")}
          type="button"
        >
          导出 CSV
        </button>
      </div>
    </section>
  );
}

function EmptyQueue() {
  return (
    <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
      <p className="text-base font-semibold text-slate-50">暂无发布准备内容</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        在内容适配页将审核通过的内容版本加入发布准备后，这里会显示待人工处理的内容。
      </p>
    </section>
  );
}

function QueueList({
  items,
  onRecordChange,
  onRecordSave,
  onStatusChange,
  onToggleSelection,
  selectedItemIds
}: {
  items: PublishQueueItem[];
  onRecordChange: (itemId: string, field: PublishRecordField, value: string) => void;
  onRecordSave: (itemId: string) => void;
  onStatusChange: (itemId: string, status: PublishTaskStatus) => void;
  onToggleSelection: (itemId: string) => void;
  selectedItemIds: string[];
}) {
  return (
    <section aria-label="发布准备内容列表" className="grid gap-3">
      {items.map((item) => (
        <article className="fp-card p-5" key={item.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <input
                aria-label={`选择发布记录 ${item.topicTitle}`}
                checked={selectedItemIds.includes(item.id)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-700 bg-slate-950 text-emerald-400"
                onChange={() => onToggleSelection(item.id)}
                type="checkbox"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-50">{item.topicTitle}</p>
                <p className="mt-2 text-xs text-slate-500">{item.platformCount} 个平台草稿</p>
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
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                {statusLabels[item.status]}
              </span>
              <StatusButton label="标记发布中" onClick={() => onStatusChange(item.id, "publishing")} />
              <StatusButton label="标记已发布" onClick={() => onStatusChange(item.id, "published")} />
              <StatusButton label="标记失败" onClick={() => onStatusChange(item.id, "failed")} danger />
              <StatusButton label="取消发布" onClick={() => onStatusChange(item.id, "cancelled")} warning />
            </div>
          </div>

          <div className="mt-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField
              label="发布平台"
              onChange={(value) => onRecordChange(item.id, "publishingChannel", value)}
              placeholder="如搜狐号、知乎、公众号"
              value={item.publishingChannel ?? ""}
            />
            <TextField
              label="发布人"
              onChange={(value) => onRecordChange(item.id, "operatorName", value)}
              placeholder="记录人工发布负责人"
              value={item.operatorName ?? ""}
            />
            <TextField
              label="计划发布时间"
              onChange={(value) => onRecordChange(item.id, "plannedPublishAt", value)}
              type="datetime-local"
              value={item.plannedPublishAt ?? ""}
            />
            <TextField
              label="实际发布时间"
              onChange={(value) => onRecordChange(item.id, "actualPublishAt", value)}
              type="datetime-local"
              value={item.actualPublishAt ?? ""}
            />
            <TextField
              label="发布链接"
              onChange={(value) => onRecordChange(item.id, "publishedUrl", value)}
              placeholder="粘贴人工发布后的文章链接"
              type="url"
              value={item.publishedUrl ?? ""}
            />
            <TextareaField
              label="失败原因"
              onChange={(value) => onRecordChange(item.id, "failureReason", value)}
              placeholder="如登录失效、平台审核拒绝、素材缺失"
              value={item.failureReason ?? ""}
            />
            <TextareaField
              label="操作备注"
              onChange={(value) => onRecordChange(item.id, "operatorNote", value)}
              placeholder="记录发布人、后续复核安排或平台注意事项"
              value={item.operatorNote ?? ""}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span>最后操作：{item.lastAction || "暂无记录"}</span>
            <span>最后更新：{formatDisplayDateTime(item.lastUpdatedAt)}</span>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              className="cursor-pointer rounded-md bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
              onClick={() => onRecordSave(item.id)}
              type="button"
            >
              保存发布记录
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function StatusButton({
  danger = false,
  label,
  onClick,
  warning = false
}: {
  danger?: boolean;
  label: string;
  onClick: () => void;
  warning?: boolean;
}) {
  const hoverClass = danger ? "hover:border-rose-400" : warning ? "hover:border-amber-400" : "hover:border-emerald-400";

  return (
    <button
      className={`cursor-pointer rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-200 transition-colors ${hoverClass}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-slate-300">
      {label}
      <input
        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextareaField({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-medium text-slate-300">
      {label}
      <textarea
        className="min-h-20 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function restorePublishQueue(): PublishQueueItem[] {
  if (typeof window === "undefined") {
    return [];
  }

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
      .filter((item) => item.versionId && item.topicTitle)
      .map((item) => ({
        ...item,
        sourceTopicTitle: item.sourceTopicTitle ?? item.topicTitle,
        platformDrafts: Array.isArray(item.platformDrafts) ? item.platformDrafts : [],
        status: isPublishTaskStatus(item.status) ? item.status : "ready"
      }));
  } catch {
    localStorage.removeItem(PUBLISH_QUEUE_STORAGE_KEY);
    return [];
  }
}

function mapApiPublishQueueItem(item: ApiPublishQueueItem): PublishQueueItem {
  return {
    id: item.id,
    versionId: item.version_id,
    sourceTopicTitle: item.source_topic_title || item.topic_title,
    topicTitle: item.topic_title,
    platformCount: item.platform_count,
    platformDrafts: (item.platform_drafts || []).map((draft) => ({
      platformId: draft.platform_id,
      platformName: draft.platform_name,
      title: draft.title,
      reviewStatus: draft.review_status
    })),
    status: item.status,
    queuedAt: item.queued_at,
    publishingChannel: item.publishing_channel,
    operatorName: item.operator_name,
    plannedPublishAt: item.planned_publish_at,
    actualPublishAt: item.actual_publish_at,
    publishedUrl: item.published_url,
    failureReason: item.failure_reason,
    operatorNote: item.operator_note,
    lastAction: item.last_action,
    lastUpdatedAt: item.last_updated_at
  };
}

function getLinkedPublishQueueItemId(items: PublishQueueItem[]) {
  if (typeof window === "undefined") {
    return "";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const versionId = searchParams.get("version");
  const planId = searchParams.get("plan");

  const matchedItem = items.find((item) => {
    if (versionId && item.versionId === versionId) {
      return true;
    }

    if (planId && (item.versionId === `content-calendar-${planId}` || item.id === `content-calendar-publish-${planId}`)) {
      return true;
    }

    return false;
  });

  return matchedItem?.id ?? "";
}

function buildMonitorRecordHref(item: PublishQueueItem) {
  const searchParams = new URLSearchParams();
  searchParams.set("query", item.topicTitle);
  searchParams.set("url", item.publishedUrl || "");

  return `/geo-monitor/records?${searchParams.toString()}`;
}

function persistPublishQueue(items: PublishQueueItem[]) {
  localStorage.setItem(PUBLISH_QUEUE_STORAGE_KEY, JSON.stringify(items));
}

function isPublishTaskStatus(status: unknown): status is PublishTaskStatus {
  return status === "ready" || status === "publishing" || status === "published" || status === "failed" || status === "cancelled";
}

function isHttpUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function validatePublishStatusChange(item: PublishQueueItem, status: PublishTaskStatus) {
  if (status === "published" && (!item.publishedUrl?.trim() || !item.actualPublishAt?.trim())) {
    return "已发布记录需要填写发布链接和实际发布时间";
  }

  if (status === "failed" && !item.failureReason?.trim()) {
    return "发布失败记录需要填写失败原因";
  }

  return "";
}

function buildMarkdownExport(items: PublishQueueItem[]) {
  const rows = items.map((item, index) => {
    return [
      `## ${index + 1}. ${item.topicTitle}`,
      "",
      `- 发布平台：${item.publishingChannel || "未填写"}`,
      `- 发布状态：${statusLabels[item.status]}`,
      `- 发布人：${item.operatorName || "未填写"}`,
      `- 计划发布时间：${item.plannedPublishAt || "未填写"}`,
      `- 实际发布时间：${item.actualPublishAt || "未填写"}`,
      `- 发布链接：${item.publishedUrl || "未填写"}`,
      `- 失败原因：${item.failureReason || "无"}`,
      `- 操作备注：${item.operatorNote || "无"}`,
      `- 最后操作：${item.lastAction || "暂无记录"}`,
      `- 最后更新时间：${formatDisplayDateTime(item.lastUpdatedAt)}`
    ].join("\n");
  });

  return ["# 发布记录", "", ...rows].join("\n\n");
}

function buildCsvExport(items: PublishQueueItem[]) {
  const header = [
    "选题",
    "发布平台",
    "发布状态",
    "发布人",
    "计划发布时间",
    "实际发布时间",
    "发布链接",
    "失败原因",
    "操作备注",
    "最后操作",
    "最后更新时间"
  ];
  const rows = items.map((item) => [
    item.topicTitle,
    item.publishingChannel ?? "",
    statusLabels[item.status],
    item.operatorName ?? "",
    item.plannedPublishAt ?? "",
    item.actualPublishAt ?? "",
    item.publishedUrl ?? "",
    item.failureReason ?? "",
    item.operatorNote ?? "",
    item.lastAction ?? "",
    formatDisplayDateTime(item.lastUpdatedAt)
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function formatDisplayDateTime(value?: string) {
  if (!value) {
    return "暂无记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "暂无记录";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
