import { FormEvent } from "react";
import { GeoMonitorSession } from "../../lib/flowpilot-api";
import { SessionFormState } from "./shared";

export function GeoMonitorSessionPanel({
  sessionForm,
  sessions,
  onSessionChange,
  onCreateSession
}: {
  sessionForm: SessionFormState;
  sessions: GeoMonitorSession[];
  onSessionChange: (form: SessionFormState) => void;
  onCreateSession: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
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
          <form onSubmit={onCreateSession} className="fp-card p-6">
            <p className="text-sm text-emerald-300">人工证据任务</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">创建真实监测任务</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-slate-300">
                监测任务名称
                <input
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                  value={sessionForm.name}
                  onChange={(event) => onSessionChange({ ...sessionForm, name: event.target.value })}
                  required
                />
              </label>
              <label className="text-sm text-slate-300">
                目标品牌
                <input
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                  value={sessionForm.target_brand}
                  onChange={(event) => onSessionChange({ ...sessionForm, target_brand: event.target.value })}
                  required
                />
              </label>
              <label className="md:col-span-2 text-sm text-slate-300">
                目标页面链接
                <input
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-slate-50 transition-colors focus:border-emerald-400 focus:outline-none"
                  value={sessionForm.target_url}
                  onChange={(event) => onSessionChange({ ...sessionForm, target_url: event.target.value })}
                />
              </label>
            </div>
            <button className="mt-5 cursor-pointer rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200">
              创建监测任务
            </button>
          </form>
        </div>
      </section>
      <GeoMonitorSessionList sessions={sessions} />
    </>
  );
}

function GeoMonitorSessionList({ sessions }: { sessions: GeoMonitorSession[] }) {
  return (
    <section className="fp-card">
      <div className="fp-panel-header flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-emerald-300">任务列表</p>
          <h2 className="mt-1 text-base font-semibold text-slate-50">监测任务列表</h2>
        </div>
        <span className="shrink-0 rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-xs text-slate-400">
          {sessions.length} 个任务
        </span>
      </div>
      <div className="p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.length === 0 && (
            <p className="rounded-lg border border-slate-800 bg-slate-950/60 p-5 text-sm text-slate-400">
              暂无监测任务，请先创建品牌、产品或关键词维度的生成式监测任务。
            </p>
          )}
          {sessions.map((session) => (
            <article key={session.session_id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
              <p className="font-semibold text-slate-50">{session.name}</p>
              <p className="mt-2 text-sm text-slate-400">{session.target_brand}</p>
              <dl className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">记录数量</dt>
                  <dd>{session.total_records}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">最高证据等级</dt>
                  <dd>L{session.highest_evidence_level}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
