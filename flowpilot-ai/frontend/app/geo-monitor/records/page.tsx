import { PageShell } from "../../components/state-card";
import { GeoMonitorWorkspace } from "../geo-monitor-workspace";

export default function GeoMonitorRecordsPage() {
  return (
    <PageShell
      eyebrow="监测记录"
      title="监测记录库"
      description="录入真实模型查询结果，查看查询问题、模型平台、证据等级、品牌提及、页面检索、来源引用和复核状态。"
    >
      <GeoMonitorWorkspace view="records" />
    </PageShell>
  );
}
