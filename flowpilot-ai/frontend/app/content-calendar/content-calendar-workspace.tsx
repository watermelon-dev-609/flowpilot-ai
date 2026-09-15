"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DataStateView } from "../components/data-state-view";
import { AsyncDataState, createLoadingState } from "../../lib/async-data-state";
import {
  GeoResearchTopicPoolItem,
  GeoResearchTopicStatus,
  buildContentCalendarGroups
} from "../../lib/geo-research-topic-contract";
import { createBrowserTopicPoolRepository } from "../../lib/topic-pool-repository";
import { ContentCalendarPlan, createPublishQueueItem, loadContentCalendarPlans, updateContentCalendarPlan } from "../lib/flowpilot-api";

const PUBLISH_QUEUE_STORAGE_KEY = "flowpilot.contentAdaptation.publishQueue";

type ContentCalendarEditDraft = {
  scheduledDate: string;
  owner: string;
  priority: NonNullable<GeoResearchTopicPoolItem["priority"]>;
  contentStage: NonNullable<GeoResearchTopicPoolItem["contentStage"]>;
  status: GeoResearchTopicStatus;
};

type ContentCalendarSortMode = "date_asc" | "score_desc" | "priority_desc";
type ContentCalendarPagination = {
  total: number;
  page: number;
  pageSize: number;
};
type ContentCalendarPublishQueueItem = {
  id: string;
  versionId: string;
  sourceTopicTitle: string;
  topicTitle: string;
  platformCount: number;
  platformDrafts: Array<{
    platformId: string;
    platformName: string;
    title: string;
    reviewStatus: string;
  }>;
  status: "ready";
  queuedAt: string;
  publishingChannel?: string;
  operatorName?: string;
  plannedPublishAt?: string;
  lastAction: string;
  lastUpdatedAt: string;
};

type OwnerWorkload = {
  owner: string;
  readyCount: number;
  adaptingCount: number;
  generatedCount: number;
  totalCount: number;
};

type DeliveryCadenceSummary = {
  overdueCount: number;
  todayCount: number;
  nextSevenDaysCount: number;
};

const topicStatuses: GeoResearchTopicStatus[] = ["待适配", "适配中", "已生成"];
const topicPriorities: Array<NonNullable<GeoResearchTopicPoolItem["priority"]>> = ["高", "中", "低"];
const contentStages: Array<NonNullable<GeoResearchTopicPoolItem["contentStage"]>> = ["待生产", "生产中", "待审核", "已完成"];
const calendarSortOptions: Array<{ label: string; value: ContentCalendarSortMode }> = [
  { label: "日期最近优先", value: "date_asc" },
  { label: "评分最高优先", value: "score_desc" },
  { label: "优先级最高优先", value: "priority_desc" }
];

export function ContentCalendarWorkspace() {
  const [state, setState] = useState<AsyncDataState<GeoResearchTopicPoolItem[]>>(createLoadingState());
  const [sourceMode, setSourceMode] = useState<"api" | "local">("local");
  const [pagination, setPagination] = useState<ContentCalendarPagination>(() => {
    const initialFilters = getInitialCalendarFilters();
    return { total: 0, page: initialFilters.page, pageSize: initialFilters.pageSize };
  });

  async function loadTopicPool(query: ContentCalendarApiQuery = {}) {
    if (typeof fetch === "function") {
      try {
        const response = await loadContentCalendarPlans(query);
        const apiTopics = response.plans.map(mapContentPlanToTopicPoolItem).filter((item) => item.status !== "已作废");
        setPagination({
          total: response.total ?? apiTopics.length,
          page: response.page ?? query.page ?? 1,
          pageSize: response.page_size ?? query.page_size ?? 50
        });
        setSourceMode("api");
        setState(apiTopics.length > 0 ? { status: "success", data: apiTopics } : { status: "empty", data: [] });
        return;
      } catch {
        setSourceMode("local");
      }
    }

    const repository = createBrowserTopicPoolRepository();
    const availableTopics = repository.list().filter((item) => item.status !== "已作废");
    setState(availableTopics.length > 0 ? { status: "success", data: availableTopics } : { status: "empty", data: [] });
  }

  useEffect(() => {
    loadTopicPool();
  }, []);

  return (
    <DataStateView
      emptyDescription="在生成式优化研究页加入选题后，内容计划会出现在这里。"
      emptyTitle="暂无内容计划"
      onRetry={loadTopicPool}
      state={state}
    >
      {(items) => (
        <ContentCalendarList
          items={items}
          onApiFilterChange={loadTopicPool}
          pagination={pagination}
          sourceMode={sourceMode}
        />
      )}
    </DataStateView>
  );
}

type ContentCalendarApiQuery = {
  keyword?: string;
  status?: string;
  platform?: string;
  owner?: string;
  priority?: string;
  start?: string;
  end?: string;
  sort?: string;
  page?: number;
  page_size?: number;
};

function ContentCalendarList({
  items,
  onApiFilterChange,
  pagination,
  sourceMode
}: {
  items: GeoResearchTopicPoolItem[];
  onApiFilterChange: (query: ContentCalendarApiQuery) => void;
  pagination: ContentCalendarPagination;
  sourceMode: "api" | "local";
}) {
  const [calendarItems, setCalendarItems] = useState(items);
  const initialFilters = getInitialCalendarFilters();
  const [keyword, setKeyword] = useState(initialFilters.keyword);
  const [status, setStatus] = useState(initialFilters.status);
  const [platform, setPlatform] = useState(initialFilters.platform);
  const [owner, setOwner] = useState(initialFilters.owner);
  const [priority, setPriority] = useState(initialFilters.priority);
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);
  const [sortMode, setSortMode] = useState<ContentCalendarSortMode>(initialFilters.sortMode);
  const [page, setPage] = useState(initialFilters.page);
  const [pageSize, setPageSize] = useState(initialFilters.pageSize);
  const [editingItemId, setEditingItemId] = useState("");
  const [editDraft, setEditDraft] = useState<ContentCalendarEditDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [publishQueueStatus, setPublishQueueStatus] = useState("");
  const [bulkStatus, setBulkStatus] = useState<GeoResearchTopicStatus>("适配中");
  const [bulkOwner, setBulkOwner] = useState("");

  useEffect(() => {
    setCalendarItems(items);
  }, [items]);

  useEffect(() => {
    syncCalendarFiltersToUrl({ endDate, keyword, owner, page, pageSize, platform, priority, sortMode, startDate, status });
    if (sourceMode === "api") {
      onApiFilterChange(buildContentCalendarApiQuery({ endDate, keyword, owner, page, pageSize, platform, priority, sortMode, startDate, status }));
    }
  }, [endDate, keyword, owner, page, pageSize, platform, priority, sortMode, startDate, status]);

  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const enabledFilterCount = [keyword.trim(), status, platform, owner, priority, startDate, endDate].filter(Boolean).length;
  const platformOptions = useMemo(() => uniqueValues(calendarItems.map((item) => item.platform)), [calendarItems]);
  const ownerOptions = useMemo(() => uniqueValues(calendarItems.map((item) => item.owner || "未分配")), [calendarItems]);
  const priorityOptions = useMemo(() => uniqueValues(calendarItems.map((item) => item.priority || "中")), [calendarItems]);

  function resetFilters() {
    setKeyword("");
    setStatus("");
    setPlatform("");
    setOwner("");
    setPriority("");
    setStartDate("");
    setEndDate("");
    setSortMode("date_asc");
    setPage(1);
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  function applyDatePreset(preset: "next_7_days" | "this_month") {
    const today = new Date();
    const currentDate = formatDateInputValue(today);

    if (preset === "next_7_days") {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setStartDate(currentDate);
      setEndDate(formatDateInputValue(nextWeek));
      setPage(1);
      return;
    }

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(`${today.getFullYear()}-${padDatePart(today.getMonth() + 1)}-01`);
    setEndDate(formatDateInputValue(monthEnd));
    setPage(1);
  }

  const filteredItems = useMemo(
    () => {
      const matchedItems = calendarItems.filter((item) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const keywordMatched =
          !normalizedKeyword ||
          [item.topicTitle, item.brandName, item.productName, item.region, item.platform, item.owner || ""]
            .join(" ")
            .toLowerCase()
            .includes(normalizedKeyword);

        return (
          keywordMatched &&
          isInsideDateRange(item, startDate, endDate) &&
          (!status || item.status === status) &&
          (!platform || item.platform === platform) &&
          (!owner || (item.owner || "未分配") === owner) &&
          (!priority || (item.priority || "中") === priority)
        );
      });

      return sortCalendarItems(matchedItems, sortMode);
    },
    [calendarItems, endDate, keyword, owner, platform, priority, sortMode, startDate, status]
  );

  const calendarGroups = buildContentCalendarGroups(filteredItems);
  const ownerWorkloads = useMemo(() => buildOwnerWorkloads(filteredItems), [filteredItems]);
  const deliveryCadence = useMemo(() => buildDeliveryCadenceSummary(filteredItems), [filteredItems]);
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const showApiPagination = sourceMode === "api";
  const visiblePlanIds = filteredItems.map((item) => item.id);

  function togglePlanSelection(planId: string) {
    setSelectedPlanIds((current) => (current.includes(planId) ? current.filter((id) => id !== planId) : [...current, planId]));
  }

  function selectVisiblePlans() {
    setSelectedPlanIds((current) => Array.from(new Set([...current, ...visiblePlanIds])));
  }

  function addSelectedPlansToPublishQueue() {
    const selectedPlans = calendarItems.filter((item) => selectedPlanIds.includes(item.id));

    if (selectedPlans.length === 0) {
      setPublishQueueStatus("请先选择内容计划");
      return;
    }

    const existingQueue = restoreContentCalendarPublishQueue();
    const existingVersionIds = new Set(existingQueue.map((item) => item.versionId));
    const queuedAt = new Date().toISOString();
    const nextItems = selectedPlans
      .filter((item) => !existingVersionIds.has(buildContentCalendarVersionId(item.id)))
      .map((item) => mapCalendarItemToPublishQueueItem(item, queuedAt));

    if (nextItems.length === 0) {
      setPublishQueueStatus("选中计划已在发布准备中");
      return;
    }

    persistContentCalendarPublishQueue([...nextItems, ...existingQueue]);
    void Promise.allSettled(nextItems.map((item) => createPublishQueueItem(mapContentCalendarQueueItemToApiPayload(item))));
    setPublishQueueStatus(`已加入发布准备 ${nextItems.length} 条`);
  }

  async function updateSelectedPlanStatus() {
    const selectedPlans = calendarItems.filter((item) => selectedPlanIds.includes(item.id));

    if (selectedPlans.length === 0) {
      setPublishQueueStatus("请先选择内容计划");
      return;
    }

    if (sourceMode === "api") {
      const updatedItems = await Promise.all(
        selectedPlans.map((item) =>
          updateContentCalendarPlan(item.id, {
            scheduled_at: item.scheduledAt,
            owner: item.owner,
            priority: item.priority || "中",
            content_stage: item.contentStage || "待生产",
            status: bulkStatus,
            actor: "frontend-user"
          })
        )
      );
      const updatedById = new Map(updatedItems.map((plan) => [plan.id, mapContentPlanToTopicPoolItem(plan)]));
      setCalendarItems((currentItems) =>
        currentItems
          .map((item) => updatedById.get(item.id) || item)
          .filter((item) => item.status !== "已作废")
      );
    } else {
      const repository = createBrowserTopicPoolRepository();
      const nextItems = repository.save(calendarItems.map((item) => (selectedPlanIds.includes(item.id) ? { ...item, status: bulkStatus } : item)));
      setCalendarItems(nextItems.filter((item) => item.status !== "已作废"));
    }

    setPublishQueueStatus(`已批量更新 ${selectedPlans.length} 条计划`);
  }

  async function updateSelectedPlanOwner() {
    const normalizedOwner = bulkOwner.trim();
    const selectedPlans = calendarItems.filter((item) => selectedPlanIds.includes(item.id));

    if (selectedPlans.length === 0) {
      setPublishQueueStatus("请先选择内容计划");
      return;
    }

    if (!normalizedOwner) {
      setPublishQueueStatus("请填写批量负责人");
      return;
    }

    if (sourceMode === "api") {
      const updatedItems = await Promise.all(
        selectedPlans.map((item) =>
          updateContentCalendarPlan(item.id, {
            scheduled_at: item.scheduledAt,
            owner: normalizedOwner,
            priority: item.priority || "中",
            content_stage: item.contentStage || "待生产",
            status: item.status,
            actor: "frontend-user"
          })
        )
      );
      const updatedById = new Map(updatedItems.map((plan) => [plan.id, mapContentPlanToTopicPoolItem(plan)]));
      setCalendarItems((currentItems) =>
        currentItems
          .map((item) => updatedById.get(item.id) || item)
          .filter((item) => item.status !== "已作废")
      );
    } else {
      const repository = createBrowserTopicPoolRepository();
      const nextItems = repository.save(
        calendarItems.map((item) => (selectedPlanIds.includes(item.id) ? { ...item, owner: normalizedOwner } : item))
      );
      setCalendarItems(nextItems.filter((item) => item.status !== "已作废"));
    }

    setPublishQueueStatus(`已批量更新负责人 ${selectedPlans.length} 条`);
  }

  function startEditing(item: GeoResearchTopicPoolItem) {
    setEditingItemId(item.id);
    setSaveStatus("");
    setEditDraft({
      scheduledDate: getCalendarDate(item),
      owner: item.owner || "",
      priority: item.priority || "中",
      contentStage: item.contentStage || "待生产",
      status: item.status
    });
  }

  async function savePlan() {
    if (!editingItemId || !editDraft) return;

    const scheduledAt = editDraft.scheduledDate ? `${editDraft.scheduledDate}T10:00:00.000Z` : undefined;
    let nextItems: GeoResearchTopicPoolItem[];

    if (sourceMode === "api") {
      const updatedPlan = await updateContentCalendarPlan(editingItemId, {
        scheduled_at: scheduledAt,
        owner: editDraft.owner.trim() || undefined,
        priority: editDraft.priority,
        content_stage: editDraft.contentStage,
        status: editDraft.status,
        actor: "frontend-user"
      });
      const updatedItem = mapContentPlanToTopicPoolItem(updatedPlan);
      nextItems = calendarItems.map((item) => (item.id === editingItemId ? updatedItem : item));
    } else {
      const repository = createBrowserTopicPoolRepository();
      nextItems = repository.updatePlan(editingItemId, {
        scheduledAt,
        owner: editDraft.owner.trim() || undefined,
        priority: editDraft.priority,
        contentStage: editDraft.contentStage,
        status: editDraft.status
      });
    }

    setCalendarItems(nextItems.filter((item) => item.status !== "已作废"));
    setEditingItemId("");
    setEditDraft(null);
    setSaveStatus("计划已保存");
  }

  return (
    <section aria-label="内容日历列表" className="fp-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
        <span className="text-xs text-slate-400">已选择 {selectedPlanIds.length} 条</span>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-400">
            批量状态
            <select
              className="ml-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => setBulkStatus(event.target.value as GeoResearchTopicStatus)}
              value={bulkStatus}
            >
              {topicStatuses.map((topicStatus) => (
                <option key={topicStatus} value={topicStatus}>
                  {topicStatus}
                </option>
              ))}
            </select>
          </label>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedPlanIds.length === 0}
            onClick={updateSelectedPlanStatus}
            type="button"
          >
            批量改状态
          </button>
          <label className="text-xs text-slate-400">
            批量负责人
            <input
              className="ml-2 w-32 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-50 outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-400"
              onChange={(event) => setBulkOwner(event.target.value)}
              placeholder="负责人"
              value={bulkOwner}
            />
          </label>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedPlanIds.length === 0 || bulkOwner.trim().length === 0}
            onClick={updateSelectedPlanOwner}
            type="button"
          >
            批量改负责人
          </button>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={visiblePlanIds.length === 0}
            onClick={selectVisiblePlans}
            type="button"
          >
            选择当前结果
          </button>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedPlanIds.length === 0}
            onClick={addSelectedPlansToPublishQueue}
            type="button"
          >
            加入发布准备
          </button>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={selectedPlanIds.length === 0}
            onClick={() => setSelectedPlanIds([])}
            type="button"
          >
            清空选择
          </button>
        </div>
      </div>
      {publishQueueStatus ? (
        <p role="status" className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          {publishQueueStatus}
        </p>
      ) : null}
      <section aria-label="交付节奏" className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 sm:grid-cols-3">
        <div className="rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2">
          <p className="text-xs text-rose-200/80">已逾期</p>
          <p className="mt-1 text-sm font-semibold text-rose-100">已逾期 {deliveryCadence.overdueCount}</p>
        </div>
        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2">
          <p className="text-xs text-amber-100/80">今日到期</p>
          <p className="mt-1 text-sm font-semibold text-amber-100">今日到期 {deliveryCadence.todayCount}</p>
        </div>
        <div className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
          <p className="text-xs text-emerald-100/80">未来 7 天</p>
          <p className="mt-1 text-sm font-semibold text-emerald-100">未来 7 天 {deliveryCadence.nextSevenDaysCount}</p>
        </div>
      </section>
      <section aria-label="排期工作量" className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-4 md:grid-cols-2 xl:grid-cols-3">
        {ownerWorkloads.map((workload) => (
          <article aria-label={`负责人 ${workload.owner} 排期工作量`} className="rounded-md border border-slate-800 bg-slate-900/70 p-3" key={workload.owner}>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-slate-50">{workload.owner}</p>
              <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">合计 {workload.totalCount}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
              <span className="rounded-md border border-slate-800 px-2 py-1">待适配 {workload.readyCount}</span>
              <span className="rounded-md border border-slate-800 px-2 py-1">适配中 {workload.adaptingCount}</span>
              <span className="rounded-md border border-slate-800 px-2 py-1">已生成 {workload.generatedCount}</span>
            </div>
          </article>
        ))}
      </section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">内容日历</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">选题生产计划</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">优先按计划发布时间归档；未设置计划时间时，暂时回退到选题创建日期。</p>
          <p className="mt-2 text-xs text-emerald-300">{sourceMode === "api" ? "已连接后端内容计划 API" : "本地内容计划模式"}</p>
        </div>
        <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">计划选题 {calendarItems.length} 条</span>
      </div>
      {saveStatus ? <p className="mt-3 text-sm text-emerald-300">{saveStatus}</p> : null}

      <section aria-label="内容日历筛选" className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
          <label className="text-sm text-slate-300">
            关键词搜索
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="搜索标题、品牌、产品"
              value={keyword}
            />
          </label>
          <FilterSelect label="状态筛选" onChange={setStatus} options={["待适配", "适配中", "已生成"]} value={status} />
          <FilterSelect label="平台筛选" onChange={setPlatform} options={platformOptions} value={platform} />
          <FilterSelect label="负责人筛选" onChange={setOwner} options={ownerOptions} value={owner} />
          <FilterSelect label="优先级筛选" onChange={setPriority} options={priorityOptions} value={priority} />
          <DateFilterInput label="开始日期" onChange={setStartDate} value={startDate} />
          <DateFilterInput label="结束日期" onChange={setEndDate} value={endDate} />
          <FilterSelect
            label="排序方式"
            onChange={(value) => setSortMode((value || "date_asc") as ContentCalendarSortMode)}
            options={calendarSortOptions.map((option) => option.label)}
            optionValues={calendarSortOptions}
            value={sortMode}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200"
            onClick={() => applyDatePreset("next_7_days")}
            type="button"
          >
            未来 7 天
          </button>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200"
            onClick={() => applyDatePreset("this_month")}
            type="button"
          >
            本月
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span>筛选结果 {filteredItems.length} 条</span>
            <span>已启用筛选 {enabledFilterCount} 项</span>
          </div>
          <button
            className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={enabledFilterCount === 0 && sortMode === "date_asc"}
            onClick={resetFilters}
            type="button"
          >
            清空筛选
          </button>
        </div>
        {showApiPagination ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>共 {pagination.total} 条</span>
              <span>第 {pagination.page} / {totalPages} 页</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-400">
                每页数量
                <select
                  className="ml-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-50 outline-none transition-colors focus:border-emerald-400"
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  value={pageSize}
                >
                  {[1, 2, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                type="button"
              >
                上一页
              </button>
              <button
                className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={pagination.page >= totalPages}
                onClick={() => setPage(Math.min(totalPages, pagination.page + 1))}
                type="button"
              >
                下一页
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {dateRangeInvalid ? (
        <div className="mt-4 rounded-lg border border-amber-400/40 bg-amber-400/10 p-6" role="alert">
          <p className="text-base font-semibold text-amber-100">开始日期不能晚于结束日期</p>
          <p className="mt-2 text-sm leading-6 text-amber-100/80">请调整日期范围后再查看内容计划。</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
          <p className="text-base font-semibold text-slate-50">没有匹配的内容计划</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">可以放宽关键词、状态、平台、负责人、优先级或日期范围后再查看。</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {calendarGroups.map((group) => (
            <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-4" key={group.dateLabel}>
              <p className="text-sm font-semibold text-slate-50">{group.dateLabel}</p>
              <div className="mt-3 space-y-3">
                {group.items.map((item) => (
                  <div className="rounded-md border border-slate-800 bg-slate-900 p-3" key={item.id}>
                    <label className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                      <input
                        aria-label={`选择计划 ${item.topicTitle}`}
                        checked={selectedPlanIds.includes(item.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-950 accent-emerald-400"
                        onChange={() => togglePlanSelection(item.id)}
                        type="checkbox"
                      />
                      选择计划
                    </label>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-emerald-200">{item.status}</span>
                      <span className="rounded-md border border-slate-700 px-2 py-1 text-slate-300">{item.platform}</span>
                      <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-1 text-violet-100">评分 {item.overallScore}</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-50">{item.topicTitle}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {item.region} · {item.productName} · {item.brandName}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">负责人 {item.owner || "未分配"}</span>
                      <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">优先级 {item.priority || "中"}</span>
                      <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-400">阶段 {item.contentStage || "待生产"}</span>
                    </div>
                    {editingItemId === item.id && editDraft ? (
                      <div className="mt-3 rounded-md border border-slate-700 bg-slate-950 p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DateFilterInput
                            label="计划发布日期"
                            onChange={(value) => setEditDraft({ ...editDraft, scheduledDate: value })}
                            value={editDraft.scheduledDate}
                          />
                          <label className="text-sm text-slate-300">
                            负责人
                            <input
                              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
                              onChange={(event) => setEditDraft({ ...editDraft, owner: event.target.value })}
                              value={editDraft.owner}
                            />
                          </label>
                          <FilterSelect
                            label="优先级"
                            onChange={(value) => setEditDraft({ ...editDraft, priority: value as ContentCalendarEditDraft["priority"] })}
                            options={topicPriorities}
                            value={editDraft.priority}
                          />
                          <FilterSelect
                            label="内容阶段"
                            onChange={(value) => setEditDraft({ ...editDraft, contentStage: value as ContentCalendarEditDraft["contentStage"] })}
                            options={contentStages}
                            value={editDraft.contentStage}
                          />
                          <FilterSelect
                            label="计划状态"
                            onChange={(value) => setEditDraft({ ...editDraft, status: value as GeoResearchTopicStatus })}
                            options={topicStatuses}
                            value={editDraft.status}
                          />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-300"
                            onClick={savePlan}
                            type="button"
                          >
                            保存计划
                          </button>
                          <button
                            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-slate-500"
                            onClick={() => {
                              setEditingItemId("");
                              setEditDraft(null);
                            }}
                            type="button"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                          onClick={() => startEditing(item)}
                          type="button"
                        >
                          编辑计划
                        </button>
                        <Link
                          className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                          href={`/content-adaptation?plan=${encodeURIComponent(item.id)}`}
                        >
                          进入内容适配
                        </Link>
                        <Link
                          className="cursor-pointer rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                          href={`/publish-queue?source=content-calendar&plan=${encodeURIComponent(item.id)}`}
                        >
                          查看发布准备
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  label,
  options,
  optionValues,
  value,
  onChange
}: {
  label: string;
  options: string[];
  optionValues?: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {optionValues ? null : <option value="">全部</option>}
        {optionValues
          ? optionValues.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
      </select>
    </label>
  );
}

function DateFilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function isInsideDateRange(item: GeoResearchTopicPoolItem, startDate: string, endDate: string) {
  const calendarDate = getCalendarDate(item);

  if (startDate && calendarDate < startDate) {
    return false;
  }

  if (endDate && calendarDate > endDate) {
    return false;
  }

  return true;
}

function getCalendarDate(item: GeoResearchTopicPoolItem) {
  return (item.scheduledAt || item.createdAt).slice(0, 10);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getInitialCalendarFilters() {
  if (typeof window === "undefined") {
    return {
      keyword: "",
      status: "",
      platform: "",
      owner: "",
      priority: "",
      startDate: "",
      endDate: "",
      sortMode: "date_asc" as ContentCalendarSortMode,
      page: 1,
      pageSize: 50
    };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    keyword: searchParams.get("keyword") || "",
    status: searchParams.get("status") || "",
    platform: searchParams.get("platform") || "",
    owner: searchParams.get("owner") || "",
    priority: searchParams.get("priority") || "",
    startDate: searchParams.get("start") || "",
    endDate: searchParams.get("end") || "",
    sortMode: normalizeSortMode(searchParams.get("sort")),
    page: normalizePositiveInteger(searchParams.get("page"), 1),
    pageSize: normalizePositiveInteger(searchParams.get("page_size"), 50)
  };
}

function syncCalendarFiltersToUrl(filters: {
  keyword: string;
  status: string;
  platform: string;
  owner: string;
  priority: string;
  page: number;
  pageSize: number;
  sortMode: ContentCalendarSortMode;
  startDate: string;
  endDate: string;
}) {
  if (typeof window === "undefined") return;

  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "keyword", filters.keyword.trim());
  appendSearchParam(searchParams, "status", filters.status);
  appendSearchParam(searchParams, "platform", filters.platform);
  appendSearchParam(searchParams, "owner", filters.owner);
  appendSearchParam(searchParams, "priority", filters.priority);
  if (filters.sortMode !== "date_asc") {
    searchParams.set("sort", filters.sortMode);
  }
  appendSearchParam(searchParams, "start", filters.startDate);
  appendSearchParam(searchParams, "end", filters.endDate);
  if (filters.page > 1) {
    searchParams.set("page", String(filters.page));
  }
  if (filters.pageSize !== 50) {
    searchParams.set("page_size", String(filters.pageSize));
  }

  const nextSearch = searchParams.toString();
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;

  if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
    window.history.replaceState({}, "", nextUrl);
  }
}

function buildOwnerWorkloads(items: GeoResearchTopicPoolItem[]): OwnerWorkload[] {
  const workloadByOwner = new Map<string, OwnerWorkload>();

  items.forEach((item) => {
    const owner = item.owner?.trim() || "未分配";
    const current =
      workloadByOwner.get(owner) ??
      ({
        owner,
        readyCount: 0,
        adaptingCount: 0,
        generatedCount: 0,
        totalCount: 0
      } satisfies OwnerWorkload);

    if (item.status === "待适配") {
      current.readyCount += 1;
    } else if (item.status === "适配中") {
      current.adaptingCount += 1;
    } else if (item.status === "已生成") {
      current.generatedCount += 1;
    }
    current.totalCount += 1;
    workloadByOwner.set(owner, current);
  });

  return Array.from(workloadByOwner.values()).sort((left, right) => right.totalCount - left.totalCount || left.owner.localeCompare(right.owner));
}

function buildDeliveryCadenceSummary(items: GeoResearchTopicPoolItem[]): DeliveryCadenceSummary {
  const today = startOfLocalDay(new Date());
  const tomorrow = addDays(today, 1);
  const nextSevenDaysEnd = addDays(today, 8);

  return items.reduce(
    (summary, item) => {
      const scheduledDate = startOfLocalDay(new Date(item.scheduledAt || item.createdAt));
      if (Number.isNaN(scheduledDate.getTime())) {
        return summary;
      }

      if (scheduledDate < today) {
        summary.overdueCount += 1;
      } else if (scheduledDate >= today && scheduledDate < tomorrow) {
        summary.todayCount += 1;
      } else if (scheduledDate >= tomorrow && scheduledDate < nextSevenDaysEnd) {
        summary.nextSevenDaysCount += 1;
      }

      return summary;
    },
    { overdueCount: 0, todayCount: 0, nextSevenDaysCount: 0 }
  );
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function buildContentCalendarApiQuery(filters: {
  keyword: string;
  status: string;
  platform: string;
  owner: string;
  priority: string;
  page: number;
  pageSize: number;
  sortMode: ContentCalendarSortMode;
  startDate: string;
  endDate: string;
}): ContentCalendarApiQuery {
  return {
    keyword: filters.keyword.trim(),
    status: filters.status,
    platform: filters.platform,
    owner: filters.owner,
    priority: filters.priority,
    start: filters.startDate,
    end: filters.endDate,
    sort: filters.sortMode,
    page: filters.page,
    page_size: filters.pageSize
  };
}

function appendSearchParam(searchParams: URLSearchParams, key: string, value: string) {
  if (value) {
    searchParams.set(key, value);
  }
}

function normalizeSortMode(value: string | null): ContentCalendarSortMode {
  return value === "score_desc" || value === "priority_desc" ? value : "date_asc";
}

function normalizePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function sortCalendarItems(items: GeoResearchTopicPoolItem[], sortMode: ContentCalendarSortMode) {
  const sortedItems = [...items];

  if (sortMode === "score_desc") {
    return sortedItems.sort((current, next) => next.overallScore - current.overallScore);
  }

  if (sortMode === "priority_desc") {
    return sortedItems.sort((current, next) => getPriorityWeight(next) - getPriorityWeight(current));
  }

  return sortedItems.sort((current, next) => getCalendarDate(current).localeCompare(getCalendarDate(next)));
}

function getPriorityWeight(item: GeoResearchTopicPoolItem) {
  return { 高: 3, 中: 2, 低: 1 }[item.priority || "中"];
}

function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function restoreContentCalendarPublishQueue(): ContentCalendarPublishQueueItem[] {
  try {
    const raw = localStorage.getItem(PUBLISH_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => item && typeof item.versionId === "string" && typeof item.topicTitle === "string");
  } catch {
    localStorage.removeItem(PUBLISH_QUEUE_STORAGE_KEY);
    return [];
  }
}

function persistContentCalendarPublishQueue(items: ContentCalendarPublishQueueItem[]) {
  localStorage.setItem(PUBLISH_QUEUE_STORAGE_KEY, JSON.stringify(items));
}

function mapCalendarItemToPublishQueueItem(item: GeoResearchTopicPoolItem, queuedAt: string): ContentCalendarPublishQueueItem {
  return {
    id: `content-calendar-publish-${item.id}`,
    versionId: buildContentCalendarVersionId(item.id),
    sourceTopicTitle: item.topicTitle,
    topicTitle: item.topicTitle,
    platformCount: 1,
    platformDrafts: [
      {
        platformId: normalizePlatformId(item.platform),
        platformName: item.platform,
        title: item.topicTitle,
        reviewStatus: "待人工复核"
      }
    ],
    status: "ready",
    queuedAt,
    publishingChannel: item.platform,
    operatorName: item.owner,
    plannedPublishAt: item.scheduledAt?.slice(0, 16),
    lastAction: "内容日历加入发布准备",
    lastUpdatedAt: queuedAt
  };
}

function mapContentCalendarQueueItemToApiPayload(item: ContentCalendarPublishQueueItem) {
  return {
    id: item.id,
    version_id: item.versionId,
    topic_title: item.topicTitle,
    source_topic_title: item.sourceTopicTitle || item.topicTitle,
    platform_count: item.platformCount,
    platform_drafts: (item.platformDrafts || []).map((draft) => ({
      platform_id: draft.platformId,
      platform_name: draft.platformName,
      title: draft.title,
      review_status: draft.reviewStatus
    })),
    status: item.status,
    queued_at: item.queuedAt,
    publishing_channel: item.publishingChannel,
    operator_name: item.operatorName,
    planned_publish_at: item.plannedPublishAt,
    data_mode: "manual" as const,
    actor: "frontend-user"
  };
}

function buildContentCalendarVersionId(planId: string) {
  return `content-calendar-${planId}`;
}

function normalizePlatformId(platform: string) {
  return platform.trim().toLowerCase().replace(/\s+/g, "-") || "manual";
}

function mapContentPlanToTopicPoolItem(plan: ContentCalendarPlan): GeoResearchTopicPoolItem {
  return {
    id: plan.id,
    topicTitle: plan.topic_title,
    platform: plan.platform,
    brandName: plan.brand_name,
    productName: plan.product_name,
    region: plan.region,
    targetAudience: plan.target_audience,
    facts: plan.facts,
    overallScore: plan.overall_score,
    status: plan.status,
    createdAt: plan.created_at,
    scheduledAt: plan.scheduled_at || undefined,
    owner: plan.owner || undefined,
    priority: plan.priority,
    contentStage: plan.content_stage
  };
}
