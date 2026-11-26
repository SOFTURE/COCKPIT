// The Broadcast form's project picker in the owner's groups (CT-34): one fieldset per section in the order
// `groupProjects` gives, No group last, each named by its group with a group checkbox and a per-group count, every
// project keeping its own labelled checkbox; everything picked at first.
import { TooltipProvider } from "@softure-ai/theme-notion";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { BroadcastForm, type BroadcastFormProject } from "../../src/broadcast/broadcast-form.tsx";
import { INITIAL_BROADCAST_FORM_STATE } from "../../src/broadcast/broadcast-form-state.ts";
import { createGroupCollator, groupProjects } from "../../src/projects/group-projects.ts";

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

function render(locale: "en" | "pl" = "en"): string {
  const sections = groupProjects<BroadcastFormProject & { groupId: number | null }>(PROJECTS, GROUPS, { collator: createGroupCollator(locale) });
  return renderToStaticMarkup(
    // The field's "?" hint is a theme tooltip, which needs the provider the app shell gives.
    <TooltipProvider>
      <BroadcastForm copy={getMessages(locale).broadcast} broadcastId="b-1" sections={sections} action={() => Promise.resolve(INITIAL_BROADCAST_FORM_STATE)} />
    </TooltipProvider>,
  );
}

/** Each inner fieldset's group id and the full names of its projects, in document order. */
function readGroups(html: string): { group: string; projects: string[] }[] {
  return [...html.matchAll(/<fieldset[^>]*data-group="([^"]+)"[^>]*>([\s\S]*?)<\/fieldset>/g)].map((match) => ({
    group: match[1] ?? "",
    projects: [...(match[2] ?? "").matchAll(/<button[^>]*role="checkbox"[^>]*value="([^"]+)"/g)].map((value) => value[1] ?? "").filter((value) => value.includes("/")), // the group box carries the default "on"
  }));
}

describe("BroadcastForm's grouped picker", () => {
  it("shows one fieldset per group in name order with No group last", () => {
    expect(readGroups(render())).toEqual([
      { group: "1", projects: ["birch-hall/birch-app"] },
      { group: "2", projects: ["cedar-lane/cedar-app", "cedar-lane/cedar-docs"] },
      { group: "none", projects: ["example-org/loose-app"] },
    ]);
  });

  it("names each fieldset by its group and labels its checkbox with the group's name", () => {
    const html = render();
    for (const [id, name] of [["2", "Cedar desk"], ["none", "No group"]] as const) {
      const nameId = new RegExp(`data-group="${id}"`).exec(html) === null ? null : new RegExp(`aria-labelledby="([^"]+-group-${id}-name)"`).exec(html)?.[1];
      expect(nameId).toBeTruthy();
      expect(html).toContain(`<label id="${nameId ?? ""}" for="${(nameId ?? "").replace(/-name$/, "")}" title="${name}"`);
      expect(html).toContain(`>${name}</label>`);
    }
  });

  it("starts with every group checked, its count full, and the total across groups", () => {
    const html = render();
    const groupBoxes = [...html.matchAll(/<button[^>]*id="[^"]+-group-[^"]+"[^>]*>/g)].map((match) => match[0]);
    expect(groupBoxes).toHaveLength(3);
    expect(groupBoxes.every((box) => box.includes('aria-checked="true"'))).toBe(true);
    const counts = [...html.matchAll(/data-slot="group-picked-count">([^<]+)</g)].map((match) => match[1]);
    expect(counts).toEqual(["1 of 1", "2 of 2", "1 of 1"]);
    expect(html).toContain("4 of 4 picked");
  });

  it("keeps each project's own labelled checkbox with its full name on hover", () => {
    const html = render();
    for (const project of PROJECTS) {
      expect(html).toContain(`title="${project.fullName}"`);
      expect(html).toContain(`>${project.fullName}</label>`);
    }
  });

  it("speaks Polish", () => {
    const html = render("pl");
    const copy = getMessages("pl").broadcast;
    expect(html).toContain(`>${copy.projectsNoGroup}</label>`);
    expect(html).toContain(copy.groupPickedCount.replace("{picked}", "2").replace("{total}", "2"));
  });
});
