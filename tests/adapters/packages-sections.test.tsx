// CT-35: the Packages page's project cards in the owner's groups, like the Projects page: one section per group in name
// order with its cards in watch order, an empty group left out, No group last, each card unchanged.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import type { PackagesRow } from "../../src/adapters/packages/load-packages.ts";
import { PackagesSections } from "../../src/adapters/packages/packages-sections.tsx";
import { createGroupCollator } from "../../src/projects/group-projects.ts";
import { groupedSections } from "../support/grouped-sections.ts";

const GROUPS = [
  { id: 2, name: "Pine desk" },
  { id: 1, name: "Oak desk" },
  { id: 3, name: "Empty desk" },
];

function row(fullName: string, groupId: number | null): PackagesRow {
  return { key: fullName, fullName, groupId, view: { kind: "unknown", reason: "manifest_unreadable" } };
}

function render(rows: readonly PackagesRow[]): string {
  const messages = getMessages("en");
  return renderToStaticMarkup(
    <PackagesSections
      rows={rows}
      groups={GROUPS}
      collator={createGroupCollator("en")}
      copy={messages.packages}
      sectionsCopy={messages.projectGroupSections}
      webUrl="https://forge.example.test"
      formatTime={() => "Nov 26, 2026, 1:00 PM"}
    />,
  );
}

const ROWS = [row("pine-labs/pine-app", 2), row("example-org/stray-app", null), row("oak-works/oak-docs", 1), row("oak-works/oak-app", 1)];

describe("the Packages page's project cards", () => {
  it("sit under their groups in name order, cards in watch order, an empty group left out, No group last", () => {
    expect(groupedSections(render(ROWS), "card")).toEqual([
      { label: "Group: Oak desk", heading: "Oak desk 2", list: undefined, rows: ["oak-works/oak-docs", "oak-works/oak-app"] },
      { label: "Group: Pine desk", heading: "Pine desk 1", list: undefined, rows: ["pine-labs/pine-app"] },
      { label: "Group: No group", heading: "No group 1", list: undefined, rows: ["example-org/stray-app"] },
    ]);
  });

  it("keeps each card's heading id from its place in watch order", () => {
    const html = render(ROWS);
    expect(html).toContain('<h2 id="packages-project-3" class="text-heading-3">oak-works/oak-app</h2>');
    expect(html).toContain('<h2 id="packages-project-0" class="text-heading-3">pine-labs/pine-app</h2>');
  });

  it("keeps each card's link to its project and its details", () => {
    const html = render([row("oak-works/oak-app", 1)]);
    expect(html).toContain('href="/projects/oak-works/oak-app"');
    expect(html).toContain('data-packages-details="unknown"');
  });
});
