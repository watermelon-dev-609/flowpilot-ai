import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitationReadinessPage from "../app/citation-readiness/page";

function fillCitationForm(topicTitle = "武汉智能沙盘引用准备度检查") {
  fireEvent.change(screen.getByLabelText("品牌名称"), { target: { value: "武汉微艺达智能科技有限公司" } });
  fireEvent.change(screen.getByLabelText("目标地域"), { target: { value: "武汉" } });
  fireEvent.change(screen.getByLabelText("产品名称"), { target: { value: "智能沙盘" } });
  fireEvent.change(screen.getByLabelText("目标页面链接"), {
    target: { value: "https://example.com/wuhan-smart-sandbox" }
  });
  fireEvent.change(screen.getByLabelText("检查主题"), { target: { value: topicTitle } });
  fireEvent.change(screen.getByLabelText("待检查内容"), {
    target: {
      value:
        "武汉智能沙盘是一类将实体模型、灯光电控、触摸屏和数字展示内容结合起来的项目展示系统。\n\n## 常见问题\n问：智能沙盘适合哪些场景？\n答：适合企业展厅、智慧交通、智慧农业和智能制造展示。\n\n资料来源：企业公开资料和项目图片。"
    }
  });
}

describe("P11 监测准备队列去重", () => {
  it("同一品牌、产品、地域、目标链接和检查主题重复加入时不新增第二条", async () => {
    localStorage.clear();
    render(<CitationReadinessPage />);

    fillCitationForm();
    fireEvent.click(screen.getByRole("button", { name: "生成引用准备度评分" }));
    fireEvent.click(await screen.findByRole("button", { name: "加入监测准备" }));
    fireEvent.click(screen.getByRole("button", { name: "加入监测准备" }));

    expect(await screen.findByText("该内容已在监测准备队列中")).toBeInTheDocument();

    const rawQueue = localStorage.getItem("flowpilot.citationReadiness.monitorQueue");
    const queue = JSON.parse(rawQueue || "[]") as Array<{ topicTitle: string }>;
    expect(queue).toHaveLength(1);
    expect(queue[0].topicTitle).toBe("武汉智能沙盘引用准备度检查");
  });
});
