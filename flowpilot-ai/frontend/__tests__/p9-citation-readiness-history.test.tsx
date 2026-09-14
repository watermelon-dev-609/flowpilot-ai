import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CitationReadinessPage from "../app/citation-readiness/page";

function fillStrongCitationContent(topic = "武汉智能沙盘厂家怎么选？") {
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
  fireEvent.change(screen.getByLabelText("目标页面链接"), {
    target: { value: "https://example.com/wuhan-smart-sandbox" }
  });
  fireEvent.change(screen.getByLabelText("检查主题"), { target: { value: topic } });
  fireEvent.change(screen.getByLabelText("待检查内容"), {
    target: {
      value: [
        "武汉智能沙盘是一类将实体模型、灯光电控、触摸屏和数字展示内容结合起来的项目展示系统，常用于企业展厅、智慧交通、智慧农业和智能制造场景。",
        "",
        "## 常见问题",
        "问：智能沙盘适合哪些场景？",
        "答：适合企业展厅、智慧园区、智慧交通和智慧农业等需要可视化展示的场景。",
        "",
        "资料来源：企业公开资料、项目图片和产品说明，发布前需要人工复核。"
      ].join("\n")
    }
  });
}

describe("P9 引用准备度历史记录", () => {
  it("评分后保存历史记录，并支持恢复历史内容", async () => {
    localStorage.clear();
    render(<CitationReadinessPage />);

    fillStrongCitationContent();
    fireEvent.click(screen.getByRole("button", { name: "生成引用准备度评分" }));

    expect(await screen.findByText("引用准备度历史")).toBeInTheDocument();
    expect(screen.getByText("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    expect(screen.getByText(/历史记录 1/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("检查主题"), { target: { value: "临时修改的主题" } });
    fireEvent.click(screen.getByRole("button", { name: "恢复此记录" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("武汉智能沙盘厂家怎么选？")).toBeInTheDocument();
    });
    expect(screen.getByText("已恢复所选引用准备度记录")).toBeInTheDocument();
  });

  it("支持导出引用准备度历史 Markdown", async () => {
    const createObjectURL = vi.fn(() => "blob:history");
    const revokeObjectURL = vi.fn();
    const click = vi.fn();

    localStorage.clear();
    render(<CitationReadinessPage />);

    fillStrongCitationContent("武汉智能沙盘 GEO 内容检查");
    fireEvent.click(screen.getByRole("button", { name: "生成引用准备度评分" }));

    Object.assign(URL, { createObjectURL, revokeObjectURL });
    vi.spyOn(document, "createElement").mockReturnValue({ click, href: "", download: "" } as unknown as HTMLAnchorElement);

    fireEvent.click((await screen.findAllByRole("button", { name: "导出历史 Markdown" }))[0]);

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(screen.getByText("已导出引用准备度历史")).toBeInTheDocument();
  });
});
