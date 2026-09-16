import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublishQueuePage from "../app/publish-queue/page";

const queueStorageKey = "flowpilot.contentAdaptation.publishQueue";

describe("Publish queue product context", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows product context carried from content adaptation", async () => {
    localStorage.setItem(
      queueStorageKey,
      JSON.stringify([
        {
          id: "queue-product-context",
          versionId: "content-version-product-context",
          sourceTopicTitle: "智能沙盘展厅负责人选型指南",
          topicTitle: "智能沙盘展厅负责人选型指南",
          brandName: "武汉微艺达",
          productName: "智能沙盘",
          targetAudience: "展厅负责人",
          targetUrl: "https://example.com/sandbox",
          facts: "产品中心事实依据：已有展厅案例\n产品目标页面：https://example.com/sandbox",
          platformCount: 2,
          platformDrafts: [
            {
              platformId: "zhihu",
              platformName: "知乎",
              title: "武汉智能沙盘厂家怎么选？",
              reviewStatus: "审核通过"
            }
          ],
          status: "ready",
          queuedAt: "2026-09-16T10:00:00.000Z"
        }
      ])
    );

    render(<PublishQueuePage />);

    expect(await screen.findByText("智能沙盘展厅负责人选型指南")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "发布产品资料 智能沙盘" })).toBeInTheDocument();
    expect(screen.getByText("品牌：武汉微艺达")).toBeInTheDocument();
    expect(screen.getByText("目标客户：展厅负责人")).toBeInTheDocument();
    expect(screen.getByText("目标页面：https://example.com/sandbox")).toBeInTheDocument();
  });
});
