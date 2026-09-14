import { PageShell } from "../components/state-card";
import { GeoResearchWorkspace } from "./geo-research-workspace";

export default function GeoResearchPage() {
  return (
    <PageShell
      eyebrow="第四阶段 · 研究与选题"
      title="生成式优化研究"
      description="从品牌、产品、地域和研究目标出发，生成实体图谱、问题图谱和多平台选题建议。当前为研究建议，不承诺模型平台排名、搜索收录或稳定引用。"
    >
      <GeoResearchWorkspace />
    </PageShell>
  );
}
