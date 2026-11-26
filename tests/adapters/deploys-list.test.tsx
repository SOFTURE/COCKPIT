// CT-35: the Deploys page's apps in the owner's groups, like the Projects page: one section per group in name order
// with its rows by name, No group last, and no section for a group none of whose projects has a deploy workflow.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import type { StoredAdapterRead } from "../../modules/adapters/reads.ts";
import { DeploysList } from "../../src/adapters/deploy/deploys-list.tsx";
import { getDeployRows } from "../../src/adapters/deploy/deploys-view.ts";
import { createGroupCollator } from "../../src/projects/group-projects.ts";
import { groupedSections } from "../support/grouped-sections.ts";

const GROUPS = [
  { id: 2, name: "Pine desk" },
  { id: 1, name: "Oak desk" },
];

function read(key: string): StoredAdapterRead {
  return { key, adapter: "deploy", readAt: new Date("2026-11-22T10:00:00Z"), status: "unknown", reason: "runs_unreadable" };
}

function render(): string {
  const messages = getMessages("en");
  // Pine's only project has no deploy workflow (no deploy read): its group gets no section.
  const repositories = [
    { key: "pine-labs/pine-app", fullName: "pine-labs/pine-app", groupId: 2 },
    { key: "oak-works/oak-web", fullName: "oak-works/oak-web", groupId: 1 },
    { key: "example-org/stray-app", fullName: "example-org/stray-app", groupId: null },
    { key: "oak-works/oak-app", fullName: "oak-works/oak-app", groupId: 1 },
  ];
  const rows = getDeployRows(repositories, [read("oak-works/oak-web"), read("example-org/stray-app"), read("oak-works/oak-app")]);
  return renderToStaticMarkup(
    <DeploysList
      rows={rows}
      groups={GROUPS}
      collator={createGroupCollator("en")}
      copy={{ deploys: messages.deploys, deploy: messages.deploy, sections: messages.projectGroupSections }}
      formatTime={() => "Nov 26, 2026, 1:00 PM"}
    />,
  );
}

describe("the Deploys page's apps", () => {
  it("sit under their groups by name, No group last, a group without an app with a deploy workflow left out", () => {
    expect(groupedSections(render(), "data-project")).toEqual([
      { label: "Group: Oak desk", heading: "Oak desk 2", list: "Apps with a deploy workflow: Oak desk", rows: ["oak-works/oak-app", "oak-works/oak-web"] },
      { label: "Group: No group", heading: "No group 1", list: "Apps with a deploy workflow: No group", rows: ["example-org/stray-app"] },
    ]);
  });

  it("keeps each row's state and its link to the project", () => {
    const html = render();
    expect(html).toContain('href="/projects/oak-works/oak-app"');
    expect(html).toContain("Deploy state unknown");
  });
});
