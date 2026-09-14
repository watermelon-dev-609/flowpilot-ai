import { PageShell } from "../components/state-card";
import { ContentAdaptationWorkspace } from "./content-adaptation-workspace";

export default function ContentAdaptationPage() {
  return (
    <PageShell
      eyebrow="第五阶段 · 内容生产"
      title="内容适配工作台"
      description="把同一份企业业务资料转成微信公众号、知乎、小红书、百家号和企业官网等平台草稿。系统只提供内容适配建议，发布前仍需人工复核。"
    >
      <ContentAdaptationWorkspace />
    </PageShell>
  );
}
