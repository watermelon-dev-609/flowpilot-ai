import { PageShell } from "../../components/state-card";
import { GeoMonitorWorkspace } from "../geo-monitor-workspace";

export default function GeoMonitorReportPage() {
  return (
    <PageShell
      eyebrow="数据报表"
      title="生成式监测数据报表"
      description="把品牌提及、页面检索、来源引用和证据等级转化为可汇报、可复盘、可沉淀为业务案例的数据。"
    >
      <GeoMonitorWorkspace view="report" />
    </PageShell>
  );
}
