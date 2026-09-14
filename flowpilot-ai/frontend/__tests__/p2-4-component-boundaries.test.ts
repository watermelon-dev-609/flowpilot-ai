import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const geoMonitorDir = path.join(process.cwd(), "app", "geo-monitor");

describe("P2.4-B geo monitor component boundaries", () => {
  it("keeps geo monitor workspace focused on orchestration and moves panels into dedicated files", () => {
    const expectedComponentFiles = [
      "geo-monitor-overview-panel.tsx",
      "geo-monitor-session-panel.tsx",
      "geo-monitor-record-panel.tsx",
      "geo-monitor-review-panel.tsx",
      "geo-monitor-report-panel.tsx"
    ];

    for (const file of expectedComponentFiles) {
      expect(fs.existsSync(path.join(geoMonitorDir, "components", file)), `${file} should exist`).toBe(true);
    }

    const workspace = fs.readFileSync(path.join(geoMonitorDir, "geo-monitor-workspace.tsx"), "utf8");

    expect(workspace).not.toContain("function GeoMonitorEntryForms");
    expect(workspace).not.toContain("function GeoMonitorDataPanel");
    expect(workspace).not.toContain("function GeoRecordEvidenceReviewCard");
    expect(workspace).not.toContain("function GeoMonitorReport");
    expect(workspace.split(/\r?\n/).length).toBeLessThan(420);
  });
});
