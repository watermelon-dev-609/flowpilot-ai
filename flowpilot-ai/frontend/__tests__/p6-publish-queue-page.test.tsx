import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublishQueuePage from "../app/publish-queue/page";

const queueStorageKey = "flowpilot.contentAdaptation.publishQueue";

function seedQueue(items: Array<Record<string, unknown>> = [{}]) {
  localStorage.setItem(
    queueStorageKey,
    JSON.stringify(
      items.map((overrides, index) => ({
        id: `queue-${index + 1}`,
        versionId: `version-${index + 1}`,
        topicTitle: index === 0 ? "武汉智能沙盘厂家怎么选？" : "智慧农业沙盘如何做 GEO 内容？",
        platformCount: index === 0 ? 4 : 2,
        status: "ready",
        queuedAt: "2026-09-12T00:00:00.000Z",
        sourceTopicTitle: index === 0 ? "武汉智能沙盘厂家怎么选？" : "智慧农业沙盘如何做 GEO 内容？",
        platformDrafts: [
          {
            platformId: "wechat",
            platformName: "微信公众号",
            title: index === 0 ? "武汉智能沙盘厂家怎么选？先看交付能力" : "智慧农业沙盘内容怎么写？",
            reviewStatus: "审核通过"
          }
        ],
        ...overrides
      }))
    )
  );
}

function readStoredQueue() {
  return JSON.parse(localStorage.getItem(queueStorageKey) || "[]") as Array<Record<string, string>>;
}

describe("P6 发布准备队列页面", () => {
  beforeEach(() => {
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => "blob:flowpilot-export");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("没有队列内容时显示空状态和发布边界", () => {
    render(<PublishQueuePage />);

    expect(screen.getByRole("heading", { name: "发布准备队列" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "发布准备" })).toHaveAttribute("href", "/publish-queue");
    expect(screen.getByText("暂无发布准备内容")).toBeInTheDocument();
    expect(screen.getByText("不会自动发布到外部平台")).toBeInTheDocument();
  });

  it("读取内容适配页加入的发布准备队列", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    expect(await screen.findByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("4 个平台草稿")).toBeInTheDocument();
    expect(screen.getByText("微信公众号：武汉智能沙盘厂家怎么选？先看交付能力")).toBeInTheDocument();
    expect(screen.getAllByText("待发布").length).toBeGreaterThan(0);
  });

  it("支持发布任务状态流转并持久化", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    expect((await screen.findAllByText("待发布")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "标记发布中" }));
    expect((await screen.findAllByText("发布中")).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));
    expect((await screen.findAllByText("已发布")).length).toBeGreaterThan(0);

    expect(readStoredQueue()[0].status).toBe("published");
  });

  it("支持标记发布失败和取消发布", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.change(screen.getByLabelText("失败原因"), {
      target: { value: "平台后台要求重新登录，暂未完成发布。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));
    expect((await screen.findAllByText("发布失败")).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "取消发布" }));
    expect((await screen.findAllByText("已取消")).length).toBeGreaterThan(0);
  });

  it("支持保存发布链接和操作备注", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.change(screen.getByLabelText("操作备注"), {
      target: { value: "已由运营人工发布到搜狐号，待下周复核收录情况。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      publishedUrl: "https://example.com/articles/wuhan-sandbox",
      operatorNote: "已由运营人工发布到搜狐号，待下周复核收录情况。"
    });
  });

  it("支持保存发布失败原因", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.change(screen.getByLabelText("失败原因"), {
      target: { value: "平台后台要求重新登录，暂未完成发布。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      status: "failed",
      failureReason: "平台后台要求重新登录，暂未完成发布。"
    });
  });

  it("已发布状态缺少发布链接或实际发布时间时禁止保存", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.click(screen.getByRole("button", { name: "标记已发布" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("已发布记录需要填写发布链接和实际发布时间");
    expect(readStoredQueue()[0]).not.toMatchObject({
      status: "published"
    });
  });

  it("发布失败状态缺少失败原因时禁止保存", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    fireEvent.click(screen.getByRole("button", { name: "标记失败" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("发布失败记录需要填写失败原因");
    expect(readStoredQueue()[0]).not.toMatchObject({
      status: "failed"
    });
  });

  it("支持补充发布平台、发布人和发布时间，并校验发布链接格式", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布平台"), { target: { value: "搜狐号" } });
    fireEvent.change(screen.getByLabelText("发布人"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("计划发布时间"), { target: { value: "2026-09-13T09:00" } });
    fireEvent.change(screen.getByLabelText("实际发布时间"), { target: { value: "2026-09-13T09:30" } });
    fireEvent.change(screen.getByLabelText("发布链接"), { target: { value: "wuhan-sandbox" } });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("发布链接需要以 http:// 或 https:// 开头");
    fireEvent.change(screen.getByLabelText("发布链接"), {
      target: { value: "https://example.com/articles/wuhan-sandbox" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      publishingChannel: "搜狐号",
      operatorName: "王轩",
      plannedPublishAt: "2026-09-13T09:00",
      actualPublishAt: "2026-09-13T09:30",
      publishedUrl: "https://example.com/articles/wuhan-sandbox"
    });
  });

  it("支持按照发布状态筛选队列", async () => {
    seedQueue([{ status: "published" }, { status: "failed" }]);

    render(<PublishQueuePage />);

    expect(await screen.findByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText("智慧农业沙盘如何做 GEO 内容？")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("状态筛选"), { target: { value: "failed" } });

    expect(screen.queryByText("武汉智能沙盘厂家怎么选？")).not.toBeInTheDocument();
    expect(screen.getByText("智慧农业沙盘如何做 GEO 内容？")).toBeInTheDocument();
  });

  it("保存单条发布记录时不被其他历史异常记录阻断", async () => {
    seedQueue([
      { status: "published", publishedUrl: "", actualPublishAt: "" },
      { status: "ready" }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("智慧农业沙盘如何做 GEO 内容？");
    const noteInputs = screen.getAllByLabelText("操作备注");
    fireEvent.change(noteInputs[1], {
      target: { value: "先保存第二条正常记录，第一条历史异常记录后续单独补齐。" }
    });
    fireEvent.click(screen.getAllByRole("button", { name: "保存发布记录" })[1]);

    expect(await screen.findByText("已保存发布记录")).toBeInTheDocument();
    expect(readStoredQueue()[1]).toMatchObject({
      operatorNote: "先保存第二条正常记录，第一条历史异常记录后续单独补齐。"
    });
  });

  it("保存发布记录时写入本地审计字段并展示最后操作信息", async () => {
    seedQueue();

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.change(screen.getByLabelText("发布人"), { target: { value: "王轩" } });
    fireEvent.change(screen.getByLabelText("操作备注"), {
      target: { value: "补充发布前复核记录。" }
    });
    fireEvent.click(screen.getByRole("button", { name: "保存发布记录" }));

    expect(await screen.findByText("最后操作：保存发布记录")).toBeInTheDocument();
    expect(screen.getByText(/^最后更新：/)).toBeInTheDocument();
    expect(readStoredQueue()[0]).toMatchObject({
      lastAction: "保存发布记录"
    });
    expect(readStoredQueue()[0].lastUpdatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("导出发布记录时包含本地审计字段", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const blobParts: string[] = [];
    const OriginalBlob = globalThis.Blob;
    class TestBlob extends OriginalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        blobParts.push(String(parts[0]));
        super(parts, options);
      }
    }
    vi.stubGlobal("Blob", TestBlob);
    seedQueue([
      {
        status: "published",
        publishedUrl: "https://example.com/articles/wuhan-sandbox",
        actualPublishAt: "2026-09-12T16:00",
        lastAction: "保存发布记录",
        lastUpdatedAt: "2026-09-12T08:30:00.000Z"
      }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByRole("button", { name: "导出 Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" }));

    expect(blobParts[0]).toContain("最后操作：保存发布记录");
    expect(blobParts[0]).toContain("最后更新时间：2026-09-12");
    expect(blobParts[1]).toContain("最后操作");
    expect(blobParts[1]).toContain("最后更新时间");
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("支持导出 Markdown 和 CSV 发布记录", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    seedQueue([
      {
        publishingChannel: "搜狐号",
        operatorName: "王轩",
        publishedUrl: "https://example.com/articles/wuhan-sandbox",
        status: "published"
      }
    ]);

    render(<PublishQueuePage />);

    await screen.findByText("武汉智能沙盘厂家怎么选？");
    fireEvent.click(screen.getByRole("button", { name: "导出 Markdown" }));
    expect(await screen.findByText("已生成 Markdown 发布记录")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" }));
    expect(await screen.findByText("已生成 CSV 发布记录")).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
