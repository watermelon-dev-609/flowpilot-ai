import { PageShell } from "../components/state-card";
import { CitationReadinessWorkspace } from "./citation-readiness-workspace";

export default function CitationReadinessPage() {
  return (
    <PageShell
      eyebrow="第七阶段 · 引用准备度"
      title="AI 引用准备度"
      description="检查文章是否具备清晰实体、直接答案、FAQ、来源支撑和可复盘边界，用于提升内容被机器理解和人工复核的可行性。"
    >
      <CitationReadinessWorkspace />
    </PageShell>
  );
}
