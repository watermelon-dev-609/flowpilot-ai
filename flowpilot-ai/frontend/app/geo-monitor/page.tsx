import { PageShell } from "../components/state-card";
import { GeoMonitorWorkspace } from "./geo-monitor-workspace";

export default function GeoMonitorPage() {
  return (
    <PageShell
      eyebrow="第二阶段 · 真实证据工作台"
      title="生成式监测总览工作台"
      description="总览品牌提及、页面检索、来源引用和待复核任务。具体录入、记录、复核和报表已经拆到独立页面，避免把所有操作堆在一个页面里。"
    >
      <GeoMonitorWorkspace view="overview" />
    </PageShell>
  );
}
