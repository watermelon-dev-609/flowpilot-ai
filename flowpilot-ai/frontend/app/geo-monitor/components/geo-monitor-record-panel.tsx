import { SearchCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { PublishMonitorLead } from "../geo-monitor-workspace";
import { GeoMonitorRecord, GeoMonitorSession, GeoMonitorSnapshot } from "../../lib/flowpilot-api";
import {
  aiChannelOptions,
  emptyEvidenceForm,
  emptyReviewForm,
  EvidenceFormState,
  RecordFormState,
  ReviewFormState,
  ReviewStatusCode
} from "./shared";

export function GeoMonitorRecordPanel({
  recordForm,
  sessions,
  data,
  publishMonitorLead,
  lastCreatedRecord,
  onRecordChange,
  onCreateRecord,
  onCreateSessionFromPublishLead
}: {
  recordForm: RecordFormState;
  sessions: GeoMonitorSession[];
  data?: GeoMonitorSnapshot;
  publishMonitorLead?: PublishMonitorLead | null;
  lastCreatedRecord?: GeoMonitorRecord | null;
  onRecordChange: (form: RecordFormState) => void;
  onCreateRecord: (event: FormEvent<HTMLFormElement>) => void;
  onCreateSessionFromPublishLead?: () => void;
}) {
  return (
    <>
      <GeoMonitorRecordEntryForm
        recordForm={recordForm}
        sessions={sessions}
        publishMonitorLead={publishMonitorLead}
        lastCreatedRecord={lastCreatedRecord}
        onRecordChange={onRecordChange}
        onCreateRecord={onCreateRecord}
        onCreateSessionFromPublishLead={onCreateSessionFromPublishLead}
      />
      {data && <GeoMonitorDataPanel data={data} showReviewCards={false} />}
    </>
  );
}

function GeoMonitorRecordEntryForm({
  recordForm,
  sessions,
  publishMonitorLead,
  lastCreatedRecord,
  onRecordChange,
  onCreateRecord,
  onCreateSessionFromPublishLead
}: {
  recordForm: RecordFormState;
  sessions: GeoMonitorSession[];
  publishMonitorLead?: PublishMonitorLead | null;
  lastCreatedRecord?: GeoMonitorRecord | null;
  onRecordChange: (form: RecordFormState) => void;
  onCreateRecord: (event: FormEvent<HTMLFormElement>) => void;
  onCreateSessionFromPublishLead?: () => void;
}) {
  return (
    <section aria-label="新建和录入操作区" className="fp-card">
      <div className="fp-panel-header">
        <div>
          <p className="text-sm text-emerald-300">证据操作</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">新建 / 录入操作区</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          这里负责录入真实证据，不自动生成模型响应。所有高等级证据都需要人工复核。
        </p>
      </div>
      <div className="p-4 sm:p-6">
        {publishMonitorLead && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-slate-200">
            <p className="font-semibold text-emerald-200">已从发布记录带入监测线索</p>
            {publishMonitorLead.query && <p className="mt-2 text-slate-300">查询问题：{publishMonitorLead.query}</p>}
            {publishMonitorLead.url && <p className="mt-1 break-all text-slate-300">{publishMonitorLead.url}</p>}
            {publishMonitorLead.url && onCreateSessionFromPublishLead && (
              <button
                type="button"
                onClick={onCreateSessionFromPublishLead}
                className="mt-3 cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                用发布链接创建监测任务
              </button>
            )}
          </div>
        )}
        {lastCreatedRecord && (
          <div className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            <p className="font-semibold">监测记录已录入</p>
            <p className="mt-1 text-slate-300">可以进入报告页查看这条查询的统计结果。</p>
            <a
              className="mt-3 inline-flex w-fit cursor-pointer rounded-md border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:border-emerald-300 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              href={`/geo-monitor/report?query=${encodeURIComponent(lastCreatedRecord.query)}`}
            >
              查看聚焦报告
            </a>
          </div>
        )}
        <form onSubmit={onCreateRecord} className="fp-card p-6">
          <p className="text-sm text-emerald-300">原始回答证据</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">录入真实查询记录</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-300">
              选择监测任务
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={recordForm.session_id}
                onChange={(event) => onRecordChange({ ...recordForm, session_id: event.target.value })}
                required
              >
                <option value="">请选择监测任务</option>
                {sessions.map((session) => (
                  <option key={session.session_id} value={session.session_id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              模型平台
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={recordForm.ai_channel}
                onChange={(event) => onRecordChange({ ...recordForm, ai_channel: event.target.value })}
              >
                {aiChannelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="md:col-span-2 text-sm text-slate-300">
              查询问题
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={recordForm.query}
                onChange={(event) => onRecordChange({ ...recordForm, query: event.target.value })}
                required
              />
            </label>
            <div className="md:col-span-2 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <EvidenceCheckbox label="相关概念出现" checked={recordForm.related_concept_found} onChange={(checked) => onRecordChange({ ...recordForm, related_concept_found: checked })} />
              <EvidenceCheckbox label="品牌被提及" checked={recordForm.brand_mentioned} onChange={(checked) => onRecordChange({ ...recordForm, brand_mentioned: checked })} />
              <EvidenceCheckbox label="页面被检索" checked={recordForm.page_retrieved} onChange={(checked) => onRecordChange({ ...recordForm, page_retrieved: checked })} />
              <EvidenceCheckbox label="来源被引用" checked={recordForm.source_cited} onChange={(checked) => onRecordChange({ ...recordForm, source_cited: checked })} />
            </div>
            <label className="md:col-span-2 text-sm text-slate-300">
              原始模型响应
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={recordForm.raw_response}
                onChange={(event) => onRecordChange({ ...recordForm, raw_response: event.target.value })}
                required
              />
            </label>
            <label className="md:col-span-2 text-sm text-slate-300">
              响应摘要
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={recordForm.response_summary}
                onChange={(event) => onRecordChange({ ...recordForm, response_summary: event.target.value })}
              />
            </label>
          </div>
          <button className="mt-5 cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200">
            录入监测记录
          </button>
        </form>
      </div>
    </section>
  );
}

export function GeoMonitorDataPanel({
  data,
  showReviewCards,
  evidenceForms = {},
  reviewForms = {},
  busyEvidenceRecordId = "",
  busyReviewRecordId = "",
  onEvidenceFormChange,
  onReviewFormChange,
  onAddEvidenceAttachment,
  onReviewRecord
}: {
  data: GeoMonitorSnapshot;
  showReviewCards: boolean;
  evidenceForms?: Record<string, EvidenceFormState>;
  reviewForms?: Record<string, ReviewFormState>;
  busyEvidenceRecordId?: string;
  busyReviewRecordId?: string;
  onEvidenceFormChange?: (recordId: string, form: EvidenceFormState) => void;
  onReviewFormChange?: (recordId: string, form: ReviewFormState) => void;
  onAddEvidenceAttachment?: (record: GeoMonitorRecord) => void;
  onReviewRecord?: (record: GeoMonitorRecord, reviewStatusCode: ReviewStatusCode) => void;
}) {
  const pageSize = 10;
  const [aiChannelFilter, setAiChannelFilter] = useState("all");
  const [evidenceLevelFilter, setEvidenceLevelFilter] = useState("all");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const records = data.records.records;

  const filterOptions = useMemo(() => {
    const aiChannels = Array.from(new Set(records.map((record) => record.ai_channel))).filter(Boolean);
    const reviewStatuses = Array.from(new Set(records.map((record) => record.manual_review_status))).filter(Boolean);
    return { aiChannels, reviewStatuses };
  }, [records]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const aiMatched = aiChannelFilter === "all" || record.ai_channel === aiChannelFilter;
        const evidenceMatched = evidenceLevelFilter === "all" || String(record.evidence_level) === evidenceLevelFilter;
        const reviewMatched = reviewStatusFilter === "all" || record.manual_review_status === reviewStatusFilter;
        return aiMatched && evidenceMatched && reviewMatched;
      }),
    [aiChannelFilter, evidenceLevelFilter, records, reviewStatusFilter]
  );
  const totalPages = Math.max(Math.ceil(filteredRecords.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRecords = filteredRecords.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  function updateFilter(updater: () => void) {
    updater();
    setCurrentPage(1);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
      <div className="fp-card p-6">
        <p className="text-sm text-emerald-300">监测任务</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50">监测任务</h2>
        <div className="mt-5 space-y-4">
          {data.sessions.sessions.map((session) => (
            <div key={session.session_id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
              <p className="font-semibold text-slate-50">{session.name}</p>
              <p className="mt-2 text-sm text-slate-400">{session.target_brand}</p>
              <p className="mt-2 text-xs text-amber-200">{session.mock_notice}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <section aria-label="监测记录筛选与分页" className="rounded-lg border border-slate-800 bg-slate-900 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm text-slate-300">
              模型平台筛选
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={aiChannelFilter}
                onChange={(event) => updateFilter(() => setAiChannelFilter(event.target.value))}
              >
                <option value="all">全部平台</option>
                {filterOptions.aiChannels.map((channel) => (
                  <option key={channel} value={channel}>
                    {formatAiChannelName(channel)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              证据等级筛选
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={evidenceLevelFilter}
                onChange={(event) => updateFilter(() => setEvidenceLevelFilter(event.target.value))}
              >
                <option value="all">全部等级</option>
                {[0, 1, 2, 3, 4].map((level) => (
                  <option key={level} value={String(level)}>
                    {level} 级
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-300">
              复核状态筛选
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={reviewStatusFilter}
                onChange={(event) => updateFilter(() => setReviewStatusFilter(event.target.value))}
              >
                <option value="all">全部状态</option>
                {filterOptions.reviewStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span>
              当前显示 {pagedRecords.length} 条 / 筛选后 {filteredRecords.length} 条 / 全部 {records.length} 条
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              >
                上一页
              </button>
              <span className="rounded-md border border-slate-800 bg-slate-950 px-4 py-2">第 {safeCurrentPage} / {totalPages} 页</span>
              <button
                type="button"
                className="cursor-pointer rounded-md border border-slate-700 px-4 py-2 text-slate-200 transition-colors hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              >
                下一页
              </button>
            </div>
          </div>
        </section>
        <MonitorRecordsTable
          records={pagedRecords}
          showReviewCards={showReviewCards}
          evidenceForms={evidenceForms}
          reviewForms={reviewForms}
          busyEvidenceRecordId={busyEvidenceRecordId}
          busyReviewRecordId={busyReviewRecordId}
          onEvidenceFormChange={onEvidenceFormChange}
          onReviewFormChange={onReviewFormChange}
          onAddEvidenceAttachment={onAddEvidenceAttachment}
          onReviewRecord={onReviewRecord}
        />
      </div>
    </section>
  );
}

function MonitorRecordsTable({
  records,
  showReviewCards,
  evidenceForms,
  reviewForms,
  busyEvidenceRecordId,
  busyReviewRecordId,
  onEvidenceFormChange,
  onReviewFormChange,
  onAddEvidenceAttachment,
  onReviewRecord
}: {
  records: GeoMonitorRecord[];
  showReviewCards: boolean;
  evidenceForms: Record<string, EvidenceFormState>;
  reviewForms: Record<string, ReviewFormState>;
  busyEvidenceRecordId: string;
  busyReviewRecordId: string;
  onEvidenceFormChange?: (recordId: string, form: EvidenceFormState) => void;
  onReviewFormChange?: (recordId: string, form: ReviewFormState) => void;
  onAddEvidenceAttachment?: (record: GeoMonitorRecord) => void;
  onReviewRecord?: (record: GeoMonitorRecord, reviewStatusCode: ReviewStatusCode) => void;
}) {
  return (
    <div aria-label="监测记录列表" role="region" className="fp-card">
      <div className="fp-panel-header flex items-center gap-3">
        <SearchCheck aria-hidden="true" className="h-5 w-5 text-emerald-300" />
        <h2 className="text-base font-semibold text-slate-50">监测记录</h2>
      </div>
      <div className="p-6">
        <div className="hidden overflow-hidden rounded-lg border border-slate-800 md:block">
          <div className="grid grid-cols-[1fr_1.8fr_1fr_1fr] bg-slate-950/80 px-4 py-3 text-xs text-slate-400">
            <span>模型平台</span>
            <span>查询问题</span>
            <span>证据等级</span>
            <span>人工复核</span>
          </div>
          {records.map((record) => (
            <div key={record.record_id} className="grid grid-cols-[1fr_1.8fr_1fr_1fr] border-t border-slate-800 px-4 py-4 text-sm text-slate-200">
              <span>{formatAiChannelName(record.ai_channel)}</span>
              <span>{record.query}</span>
              <span>{record.evidence_label}</span>
              <span>复核：{record.manual_review_status}</span>
            </div>
          ))}
        </div>
        <div className="space-y-4 md:hidden">
          {records.map((record) => (
            <article key={record.record_id} data-testid="mobile-monitor-record-card" className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-emerald-300">{formatAiChannelName(record.ai_channel)}</p>
                  <h3 className="mt-2 text-base font-semibold leading-6 text-slate-50">{record.query}</h3>
                </div>
                <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                  {record.evidence_level} 级
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-slate-300">
                <div>
                  <dt className="text-slate-500">证据等级</dt>
                  <dd>{record.evidence_label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">人工复核</dt>
                  <dd>状态：{record.manual_review_status}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">证据附件</dt>
                  <dd>{record.evidence_attachments?.length || 0}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        {showReviewCards && onEvidenceFormChange && onReviewFormChange && onAddEvidenceAttachment && onReviewRecord && (
          <div className="mt-6 space-y-4">
            {records.map((record) => (
              <GeoRecordEvidenceReviewCard
                key={record.record_id}
                record={record}
                evidenceForm={evidenceForms[record.record_id] || emptyEvidenceForm}
                reviewForm={reviewForms[record.record_id] || emptyReviewForm}
                isEvidenceBusy={busyEvidenceRecordId === record.record_id}
                isReviewBusy={busyReviewRecordId === record.record_id}
                onEvidenceFormChange={(form) => onEvidenceFormChange(record.record_id, form)}
                onReviewFormChange={(form) => onReviewFormChange(record.record_id, form)}
                onAddEvidenceAttachment={() => onAddEvidenceAttachment(record)}
                onReviewRecord={(reviewStatusCode) => onReviewRecord(record, reviewStatusCode)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GeoRecordEvidenceReviewCard({
  record,
  evidenceForm,
  reviewForm,
  isEvidenceBusy,
  isReviewBusy,
  onEvidenceFormChange,
  onReviewFormChange,
  onAddEvidenceAttachment,
  onReviewRecord
}: {
  record: GeoMonitorRecord;
  evidenceForm: EvidenceFormState;
  reviewForm: ReviewFormState;
  isEvidenceBusy: boolean;
  isReviewBusy: boolean;
  onEvidenceFormChange: (form: EvidenceFormState) => void;
  onReviewFormChange: (form: ReviewFormState) => void;
  onAddEvidenceAttachment: () => void;
  onReviewRecord: (reviewStatusCode: ReviewStatusCode) => void;
}) {
  const attachmentCount = record.evidence_attachments?.length || 0;

  return (
    <article className="rounded-lg border border-emerald-400/20 bg-slate-950/70 p-5">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm text-emerald-300">证据与复核</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-50">{record.query}</h3>
          <p className="mt-2 text-sm text-slate-400">
            复核状态：<span className="text-slate-100">{record.manual_review_status}</span>
          </p>
        </div>
        <span className="w-fit rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
          证据附件：{attachmentCount}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <p className="font-semibold text-slate-50">补充证据</p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-300">
              证据类型
              <select
                className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={evidenceForm.attachment_type}
                onChange={(event) =>
                  onEvidenceFormChange({
                    ...evidenceForm,
                    attachment_type: event.target.value as EvidenceFormState["attachment_type"]
                  })
                }
              >
                <option value="source_url">来源链接</option>
                <option value="screenshot_url">截图链接</option>
                <option value="raw_response_excerpt">原始回答摘录</option>
                <option value="manual_note">人工备注</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              证据标题
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={evidenceForm.title}
                onChange={(event) => onEvidenceFormChange({ ...evidenceForm, title: event.target.value })}
              />
            </label>
            <label className="text-sm text-slate-300">
              证据链接
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={evidenceForm.url}
                onChange={(event) => onEvidenceFormChange({ ...evidenceForm, url: event.target.value })}
                placeholder="https://example.com/source"
              />
            </label>
            <label className="text-sm text-slate-300">
              证据备注
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={evidenceForm.note}
                onChange={(event) => onEvidenceFormChange({ ...evidenceForm, note: event.target.value })}
              />
            </label>
          </div>
          <button
            type="button"
            aria-label={`添加证据 ${record.query}`}
            disabled={isEvidenceBusy}
            onClick={onAddEvidenceAttachment}
            className="mt-4 cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEvidenceBusy ? "提交中" : "添加证据"}
          </button>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
          <p className="font-semibold text-slate-50">人工复核</p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-300">
              复核人
              <input
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={reviewForm.reviewer}
                onChange={(event) => onReviewFormChange({ ...reviewForm, reviewer: event.target.value })}
              />
            </label>
            <label className="text-sm text-slate-300">
              复核备注
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                value={reviewForm.review_note}
                onChange={(event) => onReviewFormChange({ ...reviewForm, review_note: event.target.value })}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              aria-label={`确认有效 ${record.query}`}
              disabled={isReviewBusy}
              onClick={() => onReviewRecord("verified")}
              className="cursor-pointer rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              确认有效
            </button>
            <button
              type="button"
              aria-label={`驳回记录 ${record.query}`}
              disabled={isReviewBusy}
              onClick={() => onReviewRecord("rejected")}
              className="cursor-pointer rounded-md border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition-colors hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              驳回记录
            </button>
            <button
              type="button"
              aria-label={`要求补证 ${record.query}`}
              disabled={isReviewBusy}
              onClick={() => onReviewRecord("needs_evidence")}
              className="cursor-pointer rounded-md border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-100 transition-colors hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              要求补证
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function EvidenceCheckbox({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-400"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

function formatAiChannelName(channel: string) {
  const option = aiChannelOptions.find((item) => item.id === channel);
  return option?.name ?? channel;
}
