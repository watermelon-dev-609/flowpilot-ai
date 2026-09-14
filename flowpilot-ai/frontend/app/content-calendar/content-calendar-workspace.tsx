"use client";

import { useEffect, useMemo, useState } from "react";
import { DataStateView } from "../components/data-state-view";
import { AsyncDataState, createLoadingState } from "../../lib/async-data-state";
import {
  GeoResearchTopicPoolItem,
  GeoResearchTopicStatus,
  buildContentCalendarGroups
} from "../../lib/geo-research-topic-contract";
import { createBrowserTopicPoolRepository } from "../../lib/topic-pool-repository";

type ContentCalendarEditDraft = {
  scheduledDate: string;
  owner: string;
  priority: NonNullable<GeoResearchTopicPoolItem["priority"]>;
  contentStage: NonNullable<GeoResearchTopicPoolItem["contentStage"]>;
  status: GeoResearchTopicStatus;
};

const topicStatuses: GeoResearchTopicStatus[] = ["待适配", "适配中", "已生成"];
const topicPriorities: Array<NonNullable<GeoResearchTopicPoolItem["priority"]>> = ["高", "中", "低"];
const contentStages: Array<NonNullable<GeoResearchTopicPoolItem["contentStage"]>> = ["待生产", "生产中", "待审核", "已完成"];

export function ContentCalendarWorkspace() {
  const [state, setState] = useState<AsyncDataState<GeoResearchTopicPoolItem[]>>(createLoadingState());

  function loadTopicPool() {
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
      {(items) => <ContentCalendarList items={items} />}
    </DataStateView>
  );
}

function ContentCalendarList({ items }: { items: GeoResearchTopicPoolItem[] }) {
  const [calendarItems, setCalendarItems] = useState(items);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [owner, setOwner] = useState("");
  const [priority, setPriority] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [editDraft, setEditDraft] = useState<ContentCalendarEditDraft | null>(null);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    setCalendarItems(items);
  }, [items]);

  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
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
  }

  const filteredItems = useMemo(
    () =>
      calendarItems.filter((item) => {
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
      }),
    [calendarItems, endDate, keyword, owner, platform, priority, startDate, status]
  );

  const calendarGroups = buildContentCalendarGroups(filteredItems);

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

  function savePlan() {
    if (!editingItemId || !editDraft) return;

    const scheduledAt = editDraft.scheduledDate ? `${editDraft.scheduledDate}T10:00:00.000Z` : undefined;
    const repository = createBrowserTopicPoolRepository();
    const nextItems = repository.updatePlan(editingItemId, {
      scheduledAt,
      owner: editDraft.owner.trim() || undefined,
      priority: editDraft.priority,
      contentStage: editDraft.contentStage,
      status: editDraft.status
    });

    setCalendarItems(nextItems.filter((item) => item.status !== "已作废"));
    setEditingItemId("");
    setEditDraft(null);
    setSaveStatus("计划已保存");
  }

  return (
    <section aria-label="内容日历列表" className="fp-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">内容日历</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">选题生产计划</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">优先按计划发布时间归档；未设置计划时间时，暂时回退到选题创建日期。</p>
        </div>
        <span className="rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">计划选题 {calendarItems.length} 条</span>
      </div>
      {saveStatus ? <p className="mt-3 text-sm text-emerald-300">{saveStatus}</p> : null}

      <section aria-label="内容日历筛选" className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <label className="text-sm text-slate-300">
            关键词搜索
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
              onChange={(event) => setKeyword(event.target.value)}
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
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-400">筛选结果 {filteredItems.length} 条</p>
          <button
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200"
            onClick={resetFilters}
            type="button"
          >
            清空筛选
          </button>
        </div>
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
                      <button
                        className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-200"
                        onClick={() => startEditing(item)}
                        type="button"
                      >
                        编辑计划
                      </button>
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

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-slate-300">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition-colors focus:border-emerald-400"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">全部</option>
        {options.map((option) => (
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
