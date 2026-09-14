import { PageShell } from "../../components/state-card";
import { GeoMonitorWorkspace } from "../geo-monitor-workspace";

export default function GeoMonitorReviewPage() {
  return (
    <PageShell
      eyebrow="证据复核"
      title="证据复核中心"
      description="集中处理待复核、已确认、已驳回和需补证的监测记录，保留人工复核作为最终判断。"
    >
      <GeoMonitorWorkspace view="review" />
    </PageShell>
  );
}
