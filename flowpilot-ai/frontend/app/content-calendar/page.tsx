import { PageShell } from "../components/state-card";
import { ContentCalendarWorkspace } from "./content-calendar-workspace";

export default function ContentCalendarPage() {
  return (
    <PageShell eyebrow="内容 / 计划" title="内容日历" description="集中查看研究选题池中的待生产内容，先用于观察内容生产压力；正式排期字段将在后续阶段接入。">
      <ContentCalendarWorkspace />
    </PageShell>
  );
}
