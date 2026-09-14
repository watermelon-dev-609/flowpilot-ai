import { AsyncDataState } from "../../lib/async-data-state";

export function DataStateView<T>({
  state,
  emptyTitle,
  emptyDescription = "当前没有可展示的数据。",
  loadingText = "正在加载数据",
  onRetry,
  children
}: {
  state: AsyncDataState<T>;
  emptyTitle: string;
  emptyDescription?: string;
  loadingText?: string;
  onRetry?: () => void;
  children: (data: T) => React.ReactNode;
}) {
  if (state.status === "loading") {
    return (
      <section className="fp-card p-6" role="status">
        <div className="h-3 w-28 rounded bg-slate-800" />
        <div className="mt-4 h-4 w-2/3 rounded bg-slate-800" />
        <div className="mt-3 h-4 w-1/2 rounded bg-slate-800" />
        <p className="mt-4 text-sm text-slate-400">{loadingText}</p>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-6" role="alert">
        <p className="text-base font-semibold text-rose-200">数据读取失败</p>
        <p className="mt-2 text-sm leading-6 text-rose-100">{state.message}</p>
        {onRetry ? (
          <button
            className="mt-4 cursor-pointer rounded-md border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500 hover:text-white"
            onClick={onRetry}
            type="button"
          >
            重试
          </button>
        ) : null}
      </section>
    );
  }

  if (state.status === "empty") {
    return (
      <section className="rounded-lg border border-dashed border-slate-700 bg-slate-900/70 p-6">
        <p className="text-base font-semibold text-slate-50">{emptyTitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">{emptyDescription}</p>
      </section>
    );
  }

  return <>{children(state.data)}</>;
}
