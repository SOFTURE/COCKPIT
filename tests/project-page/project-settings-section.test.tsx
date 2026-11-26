// A project's Settings tab (CT-31): the group select's options in the order every grouped surface uses, No group
// last, the project's group selected (No group when it has none or its group is gone), and the link to the groups.
import { TooltipProvider } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { buildProjectGroupOptions, NO_GROUP_VALUE, toGroupIdField } from "../../src/project-page/project-group-options.ts";
import { ProjectSettingsSection } from "../../src/project-page/project-settings-section.tsx";
import { createGroupCollator } from "../../src/projects/group-projects.ts";

const COLLATOR = createGroupCollator("pl");
const GROUPS = [
  { id: 3, name: "Zeta" },
  { id: 1, name: "Émile clients" },
  { id: 2, name: "atlas" },
];
const SAVE = () => Promise.resolve({ ok: true, message: "" });

function render(groupId: number | null, groups = GROUPS): string {
  return renderToStaticMarkup(
    <TooltipProvider>
      <ProjectSettingsSection
        repositoryKey="example-org/grouping-app"
        groupId={groupId}
        groups={groups}
        collator={COLLATOR}
        copy={getMessages("en").projectSettings}
        action={SAVE}
      />
    </TooltipProvider>,
  );
}

describe("buildProjectGroupOptions", () => {
  it("lists the groups in the locale's name order and selects the project's group", () => {
    expect(buildProjectGroupOptions(GROUPS, 1, COLLATOR)).toEqual({
      groups: [
        { value: "2", label: "atlas" },
        { value: "1", label: "Émile clients" },
        { value: "3", label: "Zeta" },
      ],
      selected: "1",
    });
  });

  it("selects No group for a project without a group or with a group that is gone", () => {
    expect(buildProjectGroupOptions(GROUPS, null, COLLATOR).selected).toBe(NO_GROUP_VALUE);
    expect(buildProjectGroupOptions(GROUPS, 99, COLLATOR).selected).toBe(NO_GROUP_VALUE);
  });

  it("holds only No group when no group is defined", () => {
    expect(buildProjectGroupOptions([], null, COLLATOR)).toEqual({ groups: [], selected: NO_GROUP_VALUE });
  });

  it("sends an empty group id for No group and the id otherwise", () => {
    expect(toGroupIdField(NO_GROUP_VALUE)).toBe("");
    expect(toGroupIdField("12")).toBe("12");
  });
});

describe("ProjectSettingsSection", () => {
  it("shows one Group card with the select named Group and a link to manage the groups", () => {
    const markup = render(1);
    expect(markup).toContain(">Group</h2>");
    expect(markup.match(/data-project-group-select/g)).toHaveLength(1);
    expect(markup).toContain('aria-label="Group"');
    expect(markup).toMatch(/href="\/settings#project-groups-heading"[^>]*>Manage groups</);
  });

  it("asks to add groups in Settings when none is defined", () => {
    expect(render(null, [])).toMatch(/href="\/settings#project-groups-heading"[^>]*>Add groups in Settings</);
  });
});
