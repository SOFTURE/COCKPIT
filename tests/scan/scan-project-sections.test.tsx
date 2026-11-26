// CT-35: Scan status lists its projects in the owner's groups, like the Projects page: one section per group in name
// order with its list of unchanged rows in watch order, an empty group left out, No group last.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { createGroupCollator } from "../../src/projects/group-projects.ts";
import { ScanProjectSections } from "../../src/scan/scan-project-sections.tsx";
import type { ProjectScanRow } from "../../src/scan/scan-status.ts";
import { groupedSections } from "../support/grouped-sections.ts";

const GROUPS = [
  { id: 2, name: "Pine desk" },
  { id: 1, name: "Oak desk" },
  { id: 3, name: "Empty desk" },
];

function project(fullName: string, groupId: number | null): ProjectScanRow {
  return { key: fullName, fullName, groupId, status: "ok", hasIssuesProblem: false, readAt: null, lastGoodAt: null };
}

function render(projects: readonly ProjectScanRow[], locale: "en" | "pl" = "en"): string {
  const messages = getMessages(locale);
  return renderToStaticMarkup(
    <ScanProjectSections
      projects={projects}
      groups={GROUPS}
      collator={createGroupCollator(locale)}
      copy={messages.scan}
      sectionsCopy={messages.projectGroupSections}
      formatTime={() => "Nov 26, 2026, 1:00 PM"}
    />,
  );
}

describe("the projects on Scan status", () => {
  it("sit under their groups in name order, rows in watch order, an empty group left out, No group last", () => {
    const html = render([project("pine-labs/pine-app", 2), project("example-org/stray-app", null), project("oak-works/oak-docs", 1), project("oak-works/oak-app", 1)]);
    expect(groupedSections(html, "title")).toEqual([
      { label: "Group: Oak desk", heading: "Oak desk 2", list: "Projects by last read: Oak desk", rows: ["oak-works/oak-docs", "oak-works/oak-app"] },
      { label: "Group: Pine desk", heading: "Pine desk 1", list: "Projects by last read: Pine desk", rows: ["pine-labs/pine-app"] },
      { label: "Group: No group", heading: "No group 1", list: "Projects by last read: No group", rows: ["example-org/stray-app"] },
    ]);
  });

  it("keeps each row's read status", () => {
    expect(render([project("oak-works/oak-app", 1)])).toContain('data-slot="list-entry-status"');
  });

  it("names its lists in the app's language", () => {
    const copy = getMessages("pl");
    expect(groupedSections(render([project("example-org/stray-app", null)], "pl"), "title")[0]?.list).toBe(
      copy.scan.listLabel.replace("{group}", copy.projectGroupSections.noGroup),
    );
  });
});
