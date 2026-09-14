"use client";

import { AlertTriangle, CheckCircle2, FileClock, RefreshCw, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { StateCard } from "../components/state-card";
import { ProStatCard } from "../components/pro-stat-card";
import {
  ChannelRule,
  RuleSourceReviewTask,
  RuleUpdateReminder,
  RulesSnapshot,
  acceptRuleSourceReviewProposal,
  checkRuleSourceReviewUrl,
  confirmRule,
  createRule,
  createRuleSourceReviewProposal,
  deprecateRule,
  expireRule,
  ignoreRuleSourceReviewProposal,
  loadRuleUpdateReminders,
  loadRuleSourceReviews,
  loadRulesSnapshot,
  requestRuleSourceCheck,
  updateRule
} from "../lib/flowpilot-api";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "success"; data: RulesSnapshot };

type RuleFormState = {
  channel_type: "ai" | "publishing";
  channel_id: string;
  channel_name: string;
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url: string;
  confidence: string;
  data_mode: "manual" | "mock" | "demo" | "real";
};

type EditState = {
  rule_id: string;
  rule_title: string;
  rule_summary: string;
  source_type: string;
  source_url: string;
  confidence: string;
};

type SourceReviewFormState = {
  rule_id: string;
  proposed_rule_summary: string;
  proposed_source_url: string;
  proposed_confidence: string;
  change_note: string;
};

const emptyForm: RuleFormState = {
  channel_type: "ai",
  channel_id: "deepseek",
  channel_name: "深度求索",
  rule_title: "",
  rule_summary: "",
  source_type: "manual_verified",
  source_url: "",
  confidence: "0.75",
  data_mode: "manual"
};

const emptySourceReviewForm: SourceReviewFormState = {
  rule_id: "",
  proposed_rule_summary: "",
  proposed_source_url: "",
  proposed_confidence: "0.8",
  change_note: ""
};

const aiChannelOptions = [
  { id: "deepseek", name: "深度求索" },
  { id: "doubao", name: "豆包" },
  { id: "wenxin", name: "文心一言" },
  { id: "yuanbao", name: "腾讯元宝" },
  { id: "kimi", name: "月之暗面" }
];

const publishingChannelOptions = [
  { id: "wechat_mp", name: "微信公众号" },
  { id: "xiaohongshu", name: "小红书" },
  { id: "zhihu", name: "知乎" },
  { id: "sohu", name: "搜狐号" },
  { id: "baijiahao", name: "百家号" },
  { id: "toutiao", name: "今日头条" },
  { id: "website", name: "企业官网" }
];

const statusCards = [
  ["草稿", "新规则先进入草稿，不直接影响生产策略。"],
  ["待确认规则", "缺少官方来源或真实测试时，必须保持待确认。"],
  ["已确认", "通过人工复核后才能成为高置信度规则。"],
  ["已过期", "平台规则变化后，旧规则需要标记失效。"]
];

export function RulesWorkspace() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [sourceReviewForm, setSourceReviewForm] = useState<SourceReviewFormState>(emptySourceReviewForm);
  const [sourceReviews, setSourceReviews] = useState<RuleSourceReviewTask[]>([]);
  const [sourceReviewFilter, setSourceReviewFilter] = useState("全部");
  const [sourceReviewsLoading, setSourceReviewsLoading] = useState(true);
  const [updateReminders, setUpdateReminders] = useState<RuleUpdateReminder[]>([]);
  const [updateRemindersLoading, setUpdateRemindersLoading] = useState(true);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [operationError, setOperationError] = useState("");
  const [busyReviewId, setBusyReviewId] = useState("");
  const [busyUrlCheckId, setBusyUrlCheckId] = useState("");

  useEffect(() => {
    let active = true;

    loadRulesSnapshot()
      .then((data) => {
        if (!active) return;

        if (data.ai.rules.length === 0 && data.publishing.rules.length === 0) {
          setState({ status: "empty" });
          return;
        }

        setState({ status: "success", data });
      })
      .catch((error: Error) => {
        if (!active) return;
        setState({ status: "error", message: error.message });
      });

    loadRuleSourceReviews()
      .then((data) => {
        if (!active) return;
        setSourceReviews(data.reviews);
        setSourceReviewsLoading(false);
      })
      .catch((error: Error) => {
        if (!active) return;
        setOperationError(error.message);
        setSourceReviewsLoading(false);
      });

    loadRuleUpdateReminders()
      .then((data) => {
        if (!active) return;
        setUpdateReminders(data.reminders);
        setUpdateRemindersLoading(false);
      })
      .catch((error: Error) => {
        if (!active) return;
        setOperationError(error.message);
        setUpdateRemindersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const rules = useMemo(() => {
    if (state.status !== "success") return [];
    return [...state.data.ai.rules, ...state.data.publishing.rules];
  }, [state]);

  useEffect(() => {
    if (sourceReviewForm.rule_id || rules.length === 0) return;
    setSourceReviewForm((current) => ({ ...current, rule_id: rules[0].rule_id }));
  }, [rules, sourceReviewForm.rule_id]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError("");

    try {
      const created = await createRule({
        ...form,
        confidence: Number(form.confidence),
        actor: "frontend-user"
      });
      applyRuleUpdate(created);
      setForm(emptyForm);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则创建失败");
    }
  }

  async function handleSaveEdit() {
    if (!editState) return;
    setOperationError("");

    try {
      const updated = await updateRule(editState.rule_id, {
        rule_title: editState.rule_title,
        rule_summary: editState.rule_summary,
        source_type: editState.source_type,
        source_url: editState.source_url,
        confidence: Number(editState.confidence),
        actor: "frontend-user"
      });
      applyRuleUpdate(updated);
      setEditState(null);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则编辑失败");
    }
  }

  async function runAction(rule: ChannelRule, action: "confirm" | "expire" | "deprecate" | "source-check") {
    setOperationError("");

    try {
      const updated =
        action === "confirm"
          ? await confirmRule(rule.rule_id)
          : action === "expire"
            ? await expireRule(rule.rule_id)
            : action === "deprecate"
              ? await deprecateRule(rule.rule_id)
              : await requestRuleSourceCheck(rule.rule_id);
      applyRuleUpdate(updated);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则操作失败");
    }
  }

  async function handleCreateSourceReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOperationError("");

    try {
      const review = await createRuleSourceReviewProposal(sourceReviewForm.rule_id, {
        proposed_rule_summary: sourceReviewForm.proposed_rule_summary,
        proposed_source_url: sourceReviewForm.proposed_source_url,
        proposed_confidence: Number(sourceReviewForm.proposed_confidence),
        change_note: sourceReviewForm.change_note,
        actor: "frontend-user"
      });
      setSourceReviews((current) => [review, ...current.filter((item) => item.review_id !== review.review_id)]);
      refreshUpdateReminders();
      setSourceReviewForm((current) => ({
        ...emptySourceReviewForm,
        rule_id: current.rule_id
      }));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则来源复核候选创建失败");
    }
  }

  async function handleSourceReviewDecision(review: RuleSourceReviewTask, action: "accept" | "ignore") {
    setOperationError("");
    setBusyReviewId(review.review_id);

    try {
      const updated =
        action === "accept"
          ? await acceptRuleSourceReviewProposal(review.rule_id, review.review_id)
          : await ignoreRuleSourceReviewProposal(review.rule_id, review.review_id);
      applyRuleUpdate(updated);
      const latest = await loadRuleSourceReviews(sourceReviewFilter);
      setSourceReviews(latest.reviews);
      refreshUpdateReminders();
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则来源复核操作失败");
    } finally {
      setBusyReviewId("");
    }
  }

  async function handleSourceReviewFilterChange(status: string) {
    setSourceReviewFilter(status);
    setSourceReviewsLoading(true);
    setOperationError("");

    try {
      const latest = await loadRuleSourceReviews(status);
      setSourceReviews(latest.reviews);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "来源复核队列筛选失败");
    } finally {
      setSourceReviewsLoading(false);
    }
  }

  async function handleSourceUrlCheck(review: RuleSourceReviewTask) {
    setBusyUrlCheckId(review.review_id);
    setOperationError("");

    try {
      const checked = await checkRuleSourceReviewUrl(review.review_id);
      setSourceReviews((current) => current.map((item) => (item.review_id === checked.review_id ? checked : item)));
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "候选来源链接检查失败");
    } finally {
      setBusyUrlCheckId("");
    }
  }

  async function refreshUpdateReminders() {
    try {
      const latest = await loadRuleUpdateReminders();
      setUpdateReminders(latest.reminders);
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "规则更新提醒刷新失败");
    }
  }

  function applyRuleUpdate(rule: ChannelRule) {
    setState((current) => {
      if (current.status !== "success") {
        const emptySnapshot: RulesSnapshot = {
          ai: { channel_type: "ai", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] },
          publishing: { channel_type: "publishing", data_mode: "mock", source_policy: "official_first_manual_confirmed", rules: [] }
        };
        return updateSnapshot(emptySnapshot, rule);
      }

      return updateSnapshot(current.data, rule);
    });
  }

  return (
    <>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-emerald-300">来源策略</p>
            <h2 className="text-2xl font-semibold text-slate-50">官方来源优先 + 人工确认</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-fit rounded-md border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              已连接后端接口
            </span>
            <span className="w-fit rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
              示例数据不会进入真实策略统计
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusCards.map(([title, description]) => (
            <StateCard key={title} icon={title === "待确认规则" ? AlertTriangle : CheckCircle2} title={title} description={description} />
          ))}
        </div>
      </section>

      {operationError && (
        <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-5 text-sm text-rose-100">
          {operationError}
        </section>
      )}

      {state.status === "loading" && <RulesLoadingPanel />}
      {state.status === "empty" && <RulesEmptyPanel />}
      {state.status === "error" && <RulesErrorPanel message={state.message} />}
      {state.status === "success" && (
        <>
          <RuleStats rules={rules} />
          <RuleCreateForm form={form} onChange={setForm} onSubmit={handleCreate} />
          <RuleUpdateRemindersPanel reminders={updateReminders} loading={updateRemindersLoading} />
          <SourceReviewPanel
            rules={rules}
            reviews={sourceReviews}
            form={sourceReviewForm}
            loading={sourceReviewsLoading}
            busyReviewId={busyReviewId}
            busyUrlCheckId={busyUrlCheckId}
            filter={sourceReviewFilter}
            onFormChange={setSourceReviewForm}
            onSubmit={handleCreateSourceReview}
            onDecision={handleSourceReviewDecision}
            onFilterChange={handleSourceReviewFilterChange}
            onUrlCheck={handleSourceUrlCheck}
          />
          {editState && <RuleEditPanel editState={editState} onChange={setEditState} onSave={handleSaveEdit} />}
          <RulesDataPanel data={state.data} onEdit={setEditStateFromRule} onAction={runAction} />
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <StateCard icon={FileClock} title="空状态" description="没有规则时显示创建引导，不用虚假示例冒充真实规则。" />
        <StateCard icon={ShieldCheck} title="错误状态" description="规则来源不可用时记录失败原因，本地系统仍可启动。" />
        <StateCard icon={AlertTriangle} title="人工确认" description="来自搜索摘要或经验判断的规则，必须经过人工确认后生效。" />
      </section>
    </>
  );

  function setEditStateFromRule(rule: ChannelRule) {
    setEditState({
      rule_id: rule.rule_id,
      rule_title: rule.rule_title,
      rule_summary: rule.rule_summary,
      source_type: rule.source_type,
      source_url: rule.source_url || "",
      confidence: String(rule.confidence)
    });
  }
}

function updateSnapshot(data: RulesSnapshot, rule: ChannelRule): LoadState {
  const channelType = rule.channel_type || "ai";
  const target = channelType === "ai" ? data.ai.rules : data.publishing.rules;
  const existingIndex = target.findIndex((item) => item.rule_id === rule.rule_id);
  const nextTarget = existingIndex === -1 ? [...target, rule] : target.map((item) => (item.rule_id === rule.rule_id ? rule : item));

  return {
    status: "success",
    data: {
      ai: channelType === "ai" ? { ...data.ai, rules: nextTarget } : data.ai,
      publishing: channelType === "publishing" ? { ...data.publishing, rules: nextTarget } : data.publishing
    }
  };
}

function RuleStats({ rules }: { rules: ChannelRule[] }) {
  const confirmed = rules.filter((rule) => rule.review_status === "已确认").length;
  const pending = rules.filter((rule) => rule.review_status === "待确认").length;
  const inactive = rules.filter((rule) => ["已过期", "已废弃"].includes(rule.effective_status)).length;
  const total = Math.max(rules.length, 1);

  return (
    <section className="grid gap-4 md:grid-cols-4">
      <ProStatCard label="规则总数" value={rules.length} detail="模型与媒体平台规则合计" ratio={1} tone="primary" />
      <ProStatCard label="待确认数" value={pending} detail="需要人工复核后才能生效" ratio={pending / total} tone="warning" />
      <ProStatCard label="已确认数" value={confirmed} detail="已通过人工确认" ratio={confirmed / total} tone="success" />
      <ProStatCard label="过期/废弃数" value={inactive} detail="需要重新验证规则来源" ratio={inactive / total} tone="danger" />
    </section>
  );
}

function RuleCreateForm({
  form,
  onChange,
  onSubmit
}: {
  form: RuleFormState;
  onChange: (form: RuleFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const channelOptions = form.channel_type === "ai" ? aiChannelOptions : publishingChannelOptions;
  const platformLabel = form.channel_type === "ai" ? "选择模型平台" : "选择媒体平台";

  function handleChannelTypeChange(channelType: RuleFormState["channel_type"]) {
    const firstOption = channelType === "ai" ? aiChannelOptions[0] : publishingChannelOptions[0];
    onChange({
      ...form,
      channel_type: channelType,
      channel_id: firstOption.id,
      channel_name: firstOption.name
    });
  }

  function handlePlatformChange(channelId: string) {
    const option = channelOptions.find((item) => item.id === channelId) || channelOptions[0];
    onChange({
      ...form,
      channel_id: option.id,
      channel_name: option.name
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-emerald-300">规则生命周期</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">新增规则</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm text-slate-300">
          规则类型
          <select
            className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.channel_type}
            onChange={(event) => handleChannelTypeChange(event.target.value as RuleFormState["channel_type"])}
          >
            <option value="ai">模型平台规则</option>
            <option value="publishing">媒体平台规则</option>
          </select>
        </label>
        <label className="text-sm text-slate-300">
          {platformLabel}
          <select
            className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.channel_id}
            onChange={(event) => handlePlatformChange(event.target.value)}
          >
            {channelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-300">
          规则标题
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.rule_title}
            onChange={(event) => onChange({ ...form, rule_title: event.target.value })}
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          平台名称
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.channel_name}
            onChange={(event) => onChange({ ...form, channel_name: event.target.value })}
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          来源类型
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.source_type}
            onChange={(event) => onChange({ ...form, source_type: event.target.value })}
          />
        </label>
        <label className="text-sm text-slate-300">
          置信度
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.confidence}
            onChange={(event) => onChange({ ...form, confidence: event.target.value })}
          />
        </label>
        <label className="md:col-span-2 xl:col-span-4 text-sm text-slate-300">
          规则摘要
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
            value={form.rule_summary}
            onChange={(event) => onChange({ ...form, rule_summary: event.target.value })}
            required
          />
        </label>
      </div>
      <button className="mt-5 cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200">
        新增规则
      </button>
    </form>
  );
}

function RuleUpdateRemindersPanel({
  reminders,
  loading
}: {
  reminders: RuleUpdateReminder[];
  loading: boolean;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-amber-300">更新提醒</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">规则更新提醒</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            这里只提示需要人工关注的规则，不自动承诺“最新规则”，也不把 URL 可达性等同于规则可信。
          </p>
        </div>
        <span className="w-fit rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
          {loading ? "加载中" : `${reminders.length} 条提醒`}
        </span>
      </div>

      {loading && (
        <div className="mt-5 grid gap-3 md:grid-cols-2" aria-busy="true">
          <div className="h-20 animate-pulse rounded-lg bg-slate-800/80" />
          <div className="h-20 animate-pulse rounded-lg bg-slate-800/60" />
        </div>
      )}

      {!loading && reminders.length === 0 && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
          暂无规则更新提醒。后续发现平台规则变化时，先进入来源复核队列，再由人工确认是否采用。
        </div>
      )}

      {!loading && reminders.length > 0 && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reminders.map((reminder) => (
            <article key={reminder.rule_id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{reminder.channel_name}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-50">{reminder.rule_title}</h3>
                </div>
                <span className="w-fit rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
                  {reminder.severity === "high" ? "高优先级" : "普通提醒"}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {reminder.reasons.map((reason) => (
                  <li key={reason}>• {reason}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SourceReviewPanel({
  rules,
  reviews,
  form,
  loading,
  busyReviewId,
  busyUrlCheckId,
  filter,
  onFormChange,
  onSubmit,
  onDecision,
  onFilterChange,
  onUrlCheck
}: {
  rules: ChannelRule[];
  reviews: RuleSourceReviewTask[];
  form: SourceReviewFormState;
  loading: boolean;
  busyReviewId: string;
  busyUrlCheckId: string;
  filter: string;
  onFormChange: (form: SourceReviewFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDecision: (review: RuleSourceReviewTask, action: "accept" | "ignore") => void;
  onFilterChange: (status: string) => void;
  onUrlCheck: (review: RuleSourceReviewTask) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-emerald-300">来源复核队列</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50">规则来源复核队列</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            这里不自动声称平台规则已更新，只把人工发现的新规则候选沉淀为可对比、可采用、可忽略的版本记录。
          </p>
        </div>
        <span className="w-fit rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
          待复核 {reviews.filter((review) => review.status === "待复核").length}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="来源复核队列状态筛选">
        {["全部", "待复核", "已采用", "已忽略"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onFilterChange(status)}
            className={`rounded-md border px-4 py-2 text-xs transition-colors ${
              filter === status
                ? "border-emerald-300 bg-emerald-400/10 text-emerald-100"
                : "border-slate-700 text-slate-300 hover:border-emerald-400 hover:text-emerald-100"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 rounded-lg border border-slate-800 bg-slate-950/70 p-5">
        <p className="text-sm font-medium text-slate-50">新建规则候选</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm text-slate-300">
            选择待复核规则
            <select
              className="mt-2 w-full cursor-pointer rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
              value={form.rule_id}
              onChange={(event) => onFormChange({ ...form, rule_id: event.target.value })}
              required
            >
              {rules.map((rule) => (
                <option key={rule.rule_id} value={rule.rule_id}>
                  {rule.channel_name} / {rule.rule_title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            新来源链接
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
              value={form.proposed_source_url}
              onChange={(event) => onFormChange({ ...form, proposed_source_url: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-slate-300">
            候选置信度
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
              value={form.proposed_confidence}
              onChange={(event) => onFormChange({ ...form, proposed_confidence: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-slate-300">
            变更说明
            <input
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
              value={form.change_note}
              onChange={(event) => onFormChange({ ...form, change_note: event.target.value })}
            />
          </label>
          <label className="text-sm text-slate-300 md:col-span-2 xl:col-span-4">
            新规则候选摘要
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
              value={form.proposed_rule_summary}
              onChange={(event) => onFormChange({ ...form, proposed_rule_summary: event.target.value })}
              required
            />
          </label>
        </div>
        <button className="mt-5 cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200">
          保存新规则候选
        </button>
      </form>

      {loading && (
        <div className="mt-5 space-y-3" aria-busy="true">
          <div className="h-16 animate-pulse rounded-lg bg-slate-800/80" />
          <div className="h-16 animate-pulse rounded-lg bg-slate-800/60" />
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
          暂无来源复核任务。发现平台规则变化后，先提交候选，再由人工决定是否采用。
        </div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="mt-5 space-y-4">
          {reviews.map((review) => (
            <article key={review.review_id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{review.channel_name}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-50">{review.rule_title}</h3>
                </div>
                <span className="w-fit rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300">{review.status}</span>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <RuleVersionCard
                  title="旧规则"
                  summary={review.old_rule_summary}
                  sourceUrl={review.old_source_url}
                  confidence={review.old_confidence}
                  version={review.old_version}
                />
                <RuleVersionCard
                  title="新规则候选"
                  summary={review.proposed_rule_summary}
                  sourceUrl={review.proposed_source_url}
                  confidence={review.proposed_confidence}
                  version="候选"
                />
              </div>
              {review.change_note && <p className="mt-4 text-sm text-slate-400">变更说明：{review.change_note}</p>}
              {review.decision_note && <p className="mt-2 text-sm text-emerald-200">处理意见：{review.decision_note}</p>}
              <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-slate-50">
                      来源检查：{getSourceUrlCheckLabel(review.source_url_check_status)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {review.source_url_checked_at ? `检查时间：${review.source_url_checked_at}` : "尚未发起候选来源链接可达性检查"}
                      {typeof review.source_url_status_code === "number" && review.source_url_status_code > 0
                        ? ` · 状态码 ${review.source_url_status_code}`
                        : ""}
                    </p>
                    {review.source_url_check_error && <p className="mt-1 text-xs text-rose-200">{review.source_url_check_error}</p>}
                  </div>
                  <RuleButton
                    label={`检查候选来源链接 ${review.rule_title}`}
                    disabled={busyUrlCheckId === review.review_id}
                    onClick={() => onUrlCheck(review)}
                  >
                    {busyUrlCheckId === review.review_id ? "检查中" : "检查候选来源链接"}
                  </RuleButton>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {review.status === "待复核" ? (
                  <>
                    <RuleButton
                      label={`采用新规则 ${review.rule_title}`}
                      variant="primary-ghost"
                      disabled={busyReviewId === review.review_id}
                      onClick={() => onDecision(review, "accept")}
                    >
                      {busyReviewId === review.review_id ? "处理中" : "采用新规则"}
                    </RuleButton>
                    <RuleButton
                      label={`忽略候选 ${review.rule_title}`}
                      disabled={busyReviewId === review.review_id}
                      onClick={() => onDecision(review, "ignore")}
                    >
                      {busyReviewId === review.review_id ? "处理中" : "忽略候选"}
                    </RuleButton>
                  </>
                ) : (
                  <span className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-400">
                    已处理，不再显示高优先级决策按钮
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RuleVersionCard({
  title,
  summary,
  sourceUrl,
  confidence,
  version
}: {
  title: string;
  summary: string;
  sourceUrl: string;
  confidence: number;
  version: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-sm font-medium text-emerald-200">{title}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">{summary}</p>
      <dl className="mt-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">版本</dt>
          <dd>{version}</dd>
        </div>
        <div>
          <dt className="text-slate-500">置信度</dt>
          <dd>{confidence.toFixed(2)}</dd>
        </div>
        <div className="sm:col-span-3">
          <dt className="text-slate-500">来源链接</dt>
          <dd className="break-all">{sourceUrl || "未记录"}</dd>
        </div>
      </dl>
    </div>
  );
}

function getSourceUrlCheckLabel(status?: RuleSourceReviewTask["source_url_check_status"]) {
  if (status === "reachable") return "可达";
  if (status === "unreachable") return "不可达";
  if (status === "invalid") return "无效";
  return "未检查";
}

function RuleEditPanel({
  editState,
  onChange,
  onSave
}: {
  editState: EditState;
  onChange: (state: EditState) => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-lg border border-emerald-400/30 bg-emerald-950/20 p-6">
      <p className="text-sm text-emerald-300">规则编辑</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">编辑规则</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          编辑规则标题
          <input
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50"
            value={editState.rule_title}
            onChange={(event) => onChange({ ...editState, rule_title: event.target.value })}
          />
        </label>
        <label className="text-sm text-slate-300">
          编辑置信度
          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50"
            value={editState.confidence}
            onChange={(event) => onChange({ ...editState, confidence: event.target.value })}
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="mt-5 rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
      >
        保存编辑
      </button>
    </section>
  );
}

type RuleFilters = {
  keyword: string;
  channelType: "all" | "ai" | "publishing";
  status: "all" | "已确认" | "待确认" | "已过期" | "已废弃";
};

const emptyRuleFilters: RuleFilters = { keyword: "", channelType: "all", status: "all" };

function RulesDataPanel({
  data,
  onEdit,
  onAction
}: {
  data: RulesSnapshot;
  onEdit: (rule: ChannelRule) => void;
  onAction: (rule: ChannelRule, action: "confirm" | "expire" | "deprecate" | "source-check") => void;
}) {
  const [draftFilters, setDraftFilters] = useState<RuleFilters>(emptyRuleFilters);
  const [appliedFilters, setAppliedFilters] = useState<RuleFilters>(emptyRuleFilters);

  function matchRule(rule: ChannelRule) {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    const keywordMatched =
      keyword === "" ||
      rule.rule_title.toLowerCase().includes(keyword) ||
      rule.channel_name.toLowerCase().includes(keyword);
    const typeMatched = appliedFilters.channelType === "all" || (rule.channel_type || "ai") === appliedFilters.channelType;
    const statusMatched =
      appliedFilters.status === "all" || rule.review_status === appliedFilters.status || rule.effective_status === appliedFilters.status;

    return keywordMatched && typeMatched && statusMatched;
  }

  const aiRules = data.ai.rules.filter(matchRule);
  const publishingRules = data.publishing.rules.filter(matchRule);
  const visibleCount = aiRules.length + publishingRules.length;

  return (
    <>
      <RuleQueryFilter
        filters={draftFilters}
        onChange={setDraftFilters}
        onSearch={() => setAppliedFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(emptyRuleFilters);
          setAppliedFilters(emptyRuleFilters);
        }}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <RuleTable
          title="模型平台规则"
          description="生成式模型与问答搜索平台规则"
          rows={aiRules}
          onEdit={onEdit}
          onAction={onAction}
        />
        <RuleTable
          title="媒体平台规则"
          description="公众号、小红书、知乎等发布渠道规则"
          rows={publishingRules}
          onEdit={onEdit}
          onAction={onAction}
        />
      </section>

      {visibleCount === 0 ? (
        <div className="fp-card p-10 text-center">
          <p className="text-sm font-semibold text-slate-50">没有符合当前筛选条件的规则</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">请放宽关键词或筛选条件后重新查询。</p>
        </div>
      ) : null}
    </>
  );
}

function RuleQueryFilter({
  filters,
  onChange,
  onSearch,
  onReset
}: {
  filters: RuleFilters;
  onChange: (filters: RuleFilters) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  const fieldClass =
    "w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-50 outline-none transition-colors focus:border-emerald-400";
  const labelClass = "w-20 shrink-0 text-right text-sm text-slate-300";

  return (
    <form
      className="fp-card grid gap-4 p-6 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <label className="flex items-center gap-3">
        <span className={labelClass}>关键词</span>
        <input
          aria-label="搜索规则标题或平台"
          className={fieldClass}
          onChange={(event) => onChange({ ...filters, keyword: event.target.value })}
          placeholder="按规则标题或平台搜索"
          value={filters.keyword}
        />
      </label>

      <label className="flex items-center gap-3">
        <span className={labelClass}>平台类型</span>
        <select
          aria-label="按平台类型筛选"
          className={fieldClass}
          onChange={(event) => onChange({ ...filters, channelType: event.target.value as RuleFilters["channelType"] })}
          value={filters.channelType}
        >
          <option value="all">全部</option>
          <option value="ai">模型平台</option>
          <option value="publishing">媒体平台</option>
        </select>
      </label>

      <label className="flex items-center gap-3">
        <span className={labelClass}>状态</span>
        <select
          aria-label="按规则状态筛选"
          className={fieldClass}
          onChange={(event) => onChange({ ...filters, status: event.target.value as RuleFilters["status"] })}
          value={filters.status}
        >
          <option value="all">全部</option>
          <option value="已确认">已确认</option>
          <option value="待确认">待确认</option>
          <option value="已过期">已过期</option>
          <option value="已废弃">已废弃</option>
        </select>
      </label>

      <div className="flex justify-end gap-2 md:col-span-3">
        <button
          className="rounded-md bg-emerald-400 px-6 py-1.5 text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-300"
          type="submit"
        >
          查询
        </button>
        <button
          className="rounded-md border border-slate-700 bg-white px-6 py-1.5 text-sm text-slate-300 transition-colors hover:border-emerald-400 hover:text-emerald-300"
          onClick={onReset}
          type="button"
        >
          重置
        </button>
      </div>
    </form>
  );
}

function RulesLoadingPanel() {
  return (
    <section className="grid gap-6 xl:grid-cols-2" aria-busy="true">
      <RulePlaceholder title="模型平台规则" label="规则中心加载中" />
      <RulePlaceholder title="媒体平台规则" label="规则中心加载中" />
    </section>
  );
}

function RulesEmptyPanel() {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-emerald-300">空状态</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">暂无规则数据</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        不要用示例规则冒充真实规则，等待规则来源确认后再启用。
      </p>
    </section>
  );
}

function RulesErrorPanel({ message }: { message: string }) {
  return (
    <section className="rounded-lg border border-rose-400/30 bg-rose-950/30 p-6">
      <div className="flex items-center gap-3">
        <RefreshCw aria-hidden="true" className="h-5 w-5 text-rose-200" />
        <h2 className="text-2xl font-semibold text-slate-50">接口请求失败</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-rose-100">
        后端不可用时不生成虚假规则数据，请检查服务后重试。
      </p>
      <p className="mt-3 text-xs text-rose-200">{message}</p>
    </section>
  );
}

function RulePlaceholder({ title, label }: { title: string; label: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <p className="text-sm text-emerald-300">{label}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">{title}</h2>
      <div className="mt-5 space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-12 animate-pulse rounded-md bg-slate-800/80" />
        ))}
      </div>
    </div>
  );
}

function RuleTable({
  title,
  description,
  rows,
  onEdit,
  onAction
}: {
  title: string;
  description: string;
  rows: ChannelRule[];
  onEdit: (rule: ChannelRule) => void;
  onAction: (rule: ChannelRule, action: "confirm" | "expire" | "deprecate" | "source-check") => void;
}) {
  return (
    <div className="fp-card">
      <div className="fp-panel-header flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">{description}</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">{title}</h2>
        </div>
        <span className="shrink-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
          {rows.length} 条
        </span>
      </div>
      <div className="p-6">
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-700 bg-slate-950 px-4 py-10 text-center text-sm text-slate-400">
            当前筛选条件下没有匹配的规则。
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((rule) => {
          const lastAudit = rule.audit_log?.at(-1);

          return (
            <article key={rule.rule_id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{rule.channel_name}</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-50">{rule.rule_title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{rule.rule_summary}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-md border border-slate-700 px-3 py-1 text-slate-300">{rule.data_mode || "mock"}</span>
                  <span className="rounded-md border border-slate-700 px-3 py-1 text-slate-300">{rule.review_status}</span>
                  <span className="rounded-md border border-slate-700 px-3 py-1 text-slate-300">{rule.effective_status}</span>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-4">
                <div>
                  <dt className="text-slate-500">来源</dt>
                  <dd>{rule.source_type}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">版本</dt>
                  <dd>{rule.version}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">置信度</dt>
                  <dd>{rule.confidence.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">最近审计</dt>
                  <dd>{lastAudit?.action || "未记录"}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                <RuleButton label={`编辑 ${rule.rule_title}`} onClick={() => onEdit(rule)}>
                  编辑
                </RuleButton>
                <RuleButton label={`人工确认 ${rule.rule_title}`} onClick={() => onAction(rule, "confirm")}>
                  人工确认
                </RuleButton>
                <RuleButton label={`标记过期 ${rule.rule_title}`} variant="danger-ghost" onClick={() => onAction(rule, "expire")}>
                  标记过期
                </RuleButton>
                <RuleButton label={`标记废弃 ${rule.rule_title}`} variant="danger-ghost" onClick={() => onAction(rule, "deprecate")}>
                  标记废弃
                </RuleButton>
                <RuleButton label={`发起来源复核 ${rule.rule_title}`} variant="primary-ghost" onClick={() => onAction(rule, "source-check")}>
                  发起来源复核
                </RuleButton>
              </div>
            </article>
          );
        })}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleButton({
  label,
  variant = "neutral",
  disabled = false,
  onClick,
  children
}: {
  label: string;
  variant?: "neutral" | "primary-ghost" | "danger-ghost";
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  const variantClass =
    variant === "danger-ghost"
      ? "border-rose-500/30 text-rose-200 hover:border-rose-400 hover:bg-rose-950/30 hover:text-rose-100"
      : variant === "primary-ghost"
        ? "border-emerald-500/40 text-emerald-200 hover:border-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-100"
        : "border-slate-700 text-slate-200 hover:border-emerald-400 hover:text-emerald-200";

  return (
    <button
      type="button"
      aria-label={label}
      data-variant={variant}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-md border px-3 py-2 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass}`}
    >
      {children}
    </button>
  );
}
