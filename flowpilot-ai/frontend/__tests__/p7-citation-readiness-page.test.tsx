import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitationReadinessPage from "../app/citation-readiness/page";

function fillValidCitationForm() {
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
  fireEvent.change(screen.getByLabelText("目标页面链接"), {
    target: { value: "https://example.com/wuhan-smart-sandbox" }
  });
  fireEvent.change(screen.getByLabelText("检查主题"), { target: { value: "武汉智能沙盘引用准备度检查" } });
  fireEvent.change(screen.getByLabelText("待检查内容"), {
    target: {
      value:
        "武汉智能沙盘是一类将实体模型、灯光电控、触摸屏和数字展示内容结合起来的项目展示系统。\n\n## 常见问题\n问：智能沙盘适合哪些场景？\n答：适合企业展厅、智慧交通、智慧农业和智能制造展示。\n\n资料来源：企业公开资料和项目图片。"
    }
  });
}

describe("P7 AI 引用准备度页面", () => {
  it("在全局导航中提供中文入口", () => {
    render(<CitationReadinessPage />);

    expect(screen.getByRole("link", { name: "引用准备度" })).toHaveAttribute("href", "/citation-readiness");
    expect(screen.getByRole("heading", { name: "AI 引用准备度" })).toBeInTheDocument();
  });

  it("支持录入文章并生成评分、检查项和改进建议", async () => {
    localStorage.clear();
    render(<CitationReadinessPage />);

    fillValidCitationForm();
    fireEvent.click(screen.getByRole("button", { name: "生成引用准备度评分" }));

    expect(await screen.findByText("AI 引用准备度评分")).toBeInTheDocument();
    expect(screen.getByText("实体清晰度")).toBeInTheDocument();
    expect(screen.getByText("FAQ 覆盖")).toBeInTheDocument();
    expect(screen.getByText(/继续保留可核验资料和人工复核边界/)).toBeInTheDocument();
  });

  it("缺少必填项时显示错误状态", async () => {
    render(<CitationReadinessPage />);

    fireEvent.click(screen.getByRole("button", { name: "生成引用准备度评分" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("请填写品牌名称、目标地域、产品名称和待检查内容");
  });
});
