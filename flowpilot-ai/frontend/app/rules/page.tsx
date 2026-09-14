import { PageShell } from "../components/state-card";
import { RulesWorkspace } from "./rules-workspace";

export default function RulesPage() {
  return (
    <PageShell
      eyebrow="第二阶段 · 规则资产管理"
      title="规则中心"
      description="把模型平台规则和媒体平台规则分开管理，记录来源、版本、更新时间、置信度、人工确认状态和来源检查审计。示例数据只用于结构验证，不进入真实策略统计。"
    >
      <RulesWorkspace />
    </PageShell>
  );
}
