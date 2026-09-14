export type StatTone = "primary" | "success" | "warning" | "danger";

/*
 * Ant Design Pro 规范的统计卡：标签 → 数值 → 迷你趋势柱 → 分割线 → 说明。
 * ratio 取值 0~1，用于缩放迷你柱高度；不传时按满格处理。
 */
export function ProStatCard({
  label,
  value,
  detail,
  ratio = 1,
  tone = "primary",
  compact = false
}: {
  label: string;
  value: string | number;
  detail?: string;
  ratio?: number;
  tone?: StatTone;
  compact?: boolean;
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-500"
      : tone === "success"
        ? "text-emerald-500"
        : tone === "danger"
          ? "text-rose-500"
          : "text-slate-50";

  return (
    <div className="fp-card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-1 font-semibold tracking-tight ${compact ? "text-xl" : "text-3xl"} ${valueClass}`}>{value}</p>
      {compact ? null : <MiniTrend ratio={ratio} tone={tone} />}
      {detail ? (
        <>
          <div className="my-3.5 h-px bg-slate-800" />
          <p className="text-xs leading-5 text-slate-400">{detail}</p>
        </>
      ) : null}
    </div>
  );
}

export function MiniTrend({ ratio, tone }: { ratio: number; tone: StatTone }) {
  const bars = [0.42, 0.55, 0.46, 0.63, 0.58, 0.75, 0.7, 0.88, 0.83, 1];
  const activeBar =
    tone === "warning" ? "bg-amber-500" : tone === "success" ? "bg-emerald-500" : tone === "danger" ? "bg-rose-500" : "bg-emerald-500";

  return (
    <div className="mt-2.5 flex h-7 items-end gap-0.5" aria-hidden="true">
      {bars.map((bar, index) => (
        <span
          key={index}
          className={`flex-1 rounded-sm ${index === bars.length - 1 ? activeBar : "bg-emerald-950"}`}
          style={{ height: `${Math.max(10, Math.round(bar * Math.min(Math.max(ratio, 0), 1) * 100))}%` }}
        />
      ))}
    </div>
  );
}
