import { PageShell } from "../components/state-card";
import { ProductCenterWorkspace } from "./product-center-workspace";

export default function ProductCenterPage() {
  return (
    <PageShell
      eyebrow="产品资料 / GEO 主线起点"
      title="产品中心"
      description="沉淀产品名称、品牌、目标页面、客户对象、核心卖点和事实依据，为后续产品理解、生成式优化研究、内容适配和监测复盘提供统一来源。"
    >
      <ProductCenterWorkspace />
    </PageShell>
  );
}
