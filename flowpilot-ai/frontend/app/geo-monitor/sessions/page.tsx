import { PageShell } from "../../components/state-card";
import { GeoMonitorWorkspace } from "../geo-monitor-workspace";

export default function GeoMonitorSessionsPage() {
  return (
    <PageShell
      eyebrow="监测任务"
      title="监测任务管理"
      description="管理品牌、产品和关键词维度的生成式监测任务。这里负责创建任务和查看任务基础状态。"
    >
      <GeoMonitorWorkspace view="sessions" />
    </PageShell>
  );
}
