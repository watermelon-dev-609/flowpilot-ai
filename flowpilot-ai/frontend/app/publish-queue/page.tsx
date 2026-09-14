import { PageShell } from "../components/state-card";
import { PublishQueueWorkspace } from "./publish-queue-workspace";

export default function PublishQueuePage() {
  return (
    <PageShell
      eyebrow="第六阶段 · 发布准备"
      title="发布准备队列"
      description="集中查看已审核通过、等待人工发布的平台草稿。当前页面只做内部准备和记录，不会自动发布到外部平台。"
    >
      <PublishQueueWorkspace />
    </PageShell>
  );
}
