# -*- coding: utf-8 -*-
import io

SRC = r"C:/Users/EDY/Documents/简历/FlowPilot_AI_项目计划.备份.md"
OUT_PLAN = r"C:/Users/EDY/Documents/简历/FlowPilot_AI_项目计划.md"
OUT_LOG = r"C:/Users/EDY/Documents/简历/FlowPilot_AI_开发日志.md"
OUT_UI = r"C:/Users/EDY/Documents/简历/FlowPilot_AI_UI参考.md"

with io.open(SRC, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 1-indexed ranges -> 0-indexed slices
# Plan: §1-14 (1-461) + §17 discipline (1822-1946 heading+17.1-17.5) + 长期工程纪律 (3412-3472)
plan = []
plan.append(lines[0])  # title line 1
plan.append("\n")
plan.append("> 本文档是 FlowPilot AI 的**稳定规格与规划大纲（源真相）**，只收录不随日常开发频繁变动的内容；所有带日期的开发记录已拆分到 `FlowPilot_AI_开发日志.md`。\n")
plan.append("> 相关文档：\n")
plan.append("> - 开发日志：`FlowPilot_AI_开发日志.md`（进度记录、GEO- 历史吸收计划、P0–P4 计划与完成记录）\n")
plan.append("> - UI 参考：`FlowPilot_AI_UI参考.md`（设计系统方向、GitHub 参考、落地原则、验收标准）\n")
plan.append("\n")
plan += lines[1:461]            # §1-§14 正文（含 §7 进度记录规则模板）
plan.append("\n---\n\n")
plan.append("## 15–16 已拆分至开发日志\n\n")
plan.append("原 §15 进度记录、§16 GEO- 历史项目吸收计划已整体移至 `FlowPilot_AI_开发日志.md`，便于日志独立增长。\n\n")
plan += lines[1821:1946]        # §17 开发避坑与工程纪律（标题 + 17.1-17.5）
plan += lines[3411:3472]        # 长期工程纪律

# Log: §15 (462-623) + §16 (624-1821) + §17 dated (1947-3411) + §17 dated (3473-4074) + UI dated (4385-4876)
log = []
log.append("# FlowPilot AI 开发日志\n\n")
log.append("本文档汇总所有**带日期的开发记录**：进度记录、GEO- 历史项目吸收计划、P0–P4 计划与完成记录、UI 相关完成记录。\n")
log.append("配套文档：项目计划 `FlowPilot_AI_项目计划.md`、UI 参考 `FlowPilot_AI_UI参考.md`。\n\n")
log += lines[461:623]           # §15 进度记录
log += lines[623:1821]          # §16 GEO- 历史项目吸收计划
log += lines[1946:3411]         # §17 带日期记录（前半，至长期工程纪律前）
log += lines[3472:4074]         # §17 带日期记录（后半，至 UI 段前）
log += lines[4384:4876]         # UI 段末尾带日期的完成记录

# UI: UI 参考清单整段 (4075-4384)
ui = []
ui.append("# FlowPilot AI UI 参考\n\n")
ui.append("本文档为界面设计参考依据：设计系统方向、GitHub 参考项目、落地原则、迭代优先级、统一验收标准。\n")
ui.append("带日期的 UI 相关完成记录见 `FlowPilot_AI_开发日志.md`。\n\n")
ui += lines[4074:4384]          # UI 参考清单（§1-5）

with io.open(OUT_PLAN, "w", encoding="utf-8") as f:
    f.writelines(plan)
with io.open(OUT_LOG, "w", encoding="utf-8") as f:
    f.writelines(log)
with io.open(OUT_UI, "w", encoding="utf-8") as f:
    f.writelines(ui)

print("plan lines:", len(plan))
print("log lines:", len(log))
print("ui lines:", len(ui))
print("done")
