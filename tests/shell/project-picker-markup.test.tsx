// The shared grouped project picker (CT-38, the CT-34 behaviour moved out of the Broadcast form): the controlled picked
// set drives each group's checkbox (all, some, none), its count and the total; every project posts as `project`; the
// dialog layout keeps the groups in a bordered box that scrolls and at most two columns; an invalid field says so.
import { TooltipProvider } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { createGroupCollator, groupProjects } from "../../src/projects/group-projects.ts";
import { ProjectPicker, type PickerProject, type ProjectPickerLayout } from "../../src/shell/project-picker.tsx";

const GROUPS = [
  { id: 2, name: "Cedar desk" },
  { id: 1, name: "Birch desk" },
];
const PROJECTS = [
  { key: "cedar-lane/cedar-app", fullName: "cedar-lane/cedar-app", groupId: 2 },
  { key: "example-org/loose-app", fullName: "example-org/loose-app", groupId: null },
  { key: "birch-hall/birch-app", fullName: "birch-hall/birch-app", groupId: 1 },
  { key: "cedar-lane/cedar-docs", fullName: "cedar-lane/cedar-docs", groupId: 2 },
];

interface RenderOptions {
  readonly picked?: readonly string[];
  readonly layout?: ProjectPickerLayout;
  readonly isInvalid?: boolean;
}

function render({ picked = [], layout, isInvalid }: RenderOptions = {}): string {
  const sections = groupProjects<PickerProject & { groupId: number | null }>(PROJECTS, GROUPS, { collator: createGroupCollator("en") });
  return renderToStaticMarkup(
    <TooltipProvider>
      <ProjectPicker
        copy={getMessages("en").scheduledDialog}
        sections={sections}
        picked={new Set(picked)}
        onPickedChange={() => undefined}
        layout={layout}
        isInvalid={isInvalid}
        describedBy={isInvalid === true ? "projects-error" : undefined}
      />
    </TooltipProvider>,
  );
}

function groupStates(html: string): string[] {
  return [...html.matchAll(/<button[^>]*id="[^"]+-group-[^"]+"[^>]*>/g)].map((match) => {
    const tag = match[0];
    return `${/id="[^"]+-group-([^"]+)"/.exec(tag)?.[1] ?? ""}:${/aria-checked="([^"]+)"/.exec(tag)?.[1] ?? ""}`;
  });
}

describe("ProjectPicker", () => {
  it("reads each group's checkbox and counts from the picked set", () => {
    const html = render({ picked: ["cedar-lane/cedar-app", "birch-hall/birch-app"] });
    expect(groupStates(html)).toEqual(["1:true", "2:mixed", "none:false"]);
    const counts = [...html.matchAll(/data-slot="group-picked-count">([^<]+)</g)].map((match) => match[1]);
    expect(counts).toEqual(["1 of 1", "1 of 2", "0 of 1"]);
    expect(html).toContain("Selected: 2 of 4");
  });

  it("starts with nothing picked when the set is empty, Clear all disabled", () => {
    const html = render();
    expect(groupStates(html)).toEqual(["1:false", "2:false", "none:false"]);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Clear all<\/button>/);
    expect(html).toContain("Selected: 0 of 4");
  });

  it("posts every project as `project` with its key", () => {
    const values = [...render().matchAll(/<button[^>]*role="checkbox"[^>]*value="([^"]+)"/g)].map((match) => match[1]).filter((value) => value?.includes("/"));
    expect(values).toEqual(["birch-hall/birch-app", "cedar-lane/cedar-app", "cedar-lane/cedar-docs", "example-org/loose-app"]);
  });

  it("lays the page out in widening columns and the dialog in a scrolling box of two columns at most", () => {
    const page = render();
    expect(page).toContain('data-project-picker="page"');
    expect(page).toContain("xl:grid-cols-4");
    const dialog = render({ layout: "dialog" });
    expect(dialog).toContain('data-project-picker="dialog"');
    expect(dialog).toContain("max-h-80");
    expect(dialog).toContain("overflow-y-auto");
    expect(dialog).not.toContain("lg:grid-cols-3");
  });

  it("marks an invalid field and points to its error", () => {
    const html = render({ isInvalid: true });
    expect(html).toMatch(/<fieldset[^>]*aria-describedby="[^"]+-hint projects-error"[^>]*aria-invalid="true"/);
  });
});
