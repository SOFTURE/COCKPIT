import { describe, expect, it } from "vitest";
import { buildRoadmapView, findRoadmapTarget, groupStatus, isReadableRoadmapPath, splitLabelledParts, splitRoadmapTitle } from "../../src/roadmap/build-roadmap-view.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const STATE = createStateFixture({
  active_roadmap: {
    slug: "notes-v1",
    title: "Notes v1",
    status: "ready",
    version: "2",
    path: "context/foundation/roadmap.md",
    done: 1,
    total: 3,
    items: [
      { id: "NB-2", change_id: "notes-sync", outcome: "notes sync", status: "in_progress", stage: "implement 2/3", since: "2026-11-19", detail: "plan, since 2026-11-19", prerequisites: ["NB-1"], mode: "autonomous" },
      { id: "NB-3", change_id: "notes-share", outcome: "a note is shared", status: "blocked", stage: null, since: null, detail: "waits", prerequisites: ["NB-1", "NB-2"], mode: "manual" },
    ],
  },
  queued: [{ slug: "later", title: null, status: "queued", path: "context/foundation/roadmaps/roadmap-later.md", start_condition: "after notes-v1", done: 0, total: 1, items: [{ id: "LT-1", change_id: null, outcome: "later work", status: "proposed" }] }],
});

const FILE = `---
roadmap: notes-v1
version: 2
status: ready
updated: 2026-11-20
---

# Roadmap notes-v1: notes that sync

> - Release: no

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **NB-1** | \`notes-storage\` | notes are stored | — | autonomous | done |
| **NB-2** | \`notes-sync\` | notes sync | NB-1 | autonomous | in_progress (plan, since 2026-11-19) |
| **NB-3** | \`notes-share\` | a note is shared | NB-1, NB-2 | manual | blocked (waits) |

### NB-2: Notes sync
- **Outcome:** notes sync across every device of the owner
- **Size:** M
- **Risk:** conflicts

## Before the next release
- [x] done step
- [ ] open step
`;

describe("findRoadmapTarget", () => {
  it("finds the active roadmap by slug, or as `active` when it has none, and a queued one by slug", () => {
    expect(findRoadmapTarget(STATE, "notes-v1")?.kind).toBe("active");
    expect(findRoadmapTarget({ ...STATE, active_roadmap: STATE.active_roadmap === null ? null : { ...STATE.active_roadmap, slug: null } }, "active")?.kind).toBe("active");
    expect(findRoadmapTarget(STATE, "later")).toMatchObject({ kind: "queued", startCondition: "after notes-v1", path: "context/foundation/roadmaps/roadmap-later.md" });
    expect(findRoadmapTarget(STATE, "missing")).toBeNull();
  });
});

describe("isReadableRoadmapPath", () => {
  it("accepts markdown under context/ only", () => {
    expect(isReadableRoadmapPath("context/foundation/roadmap.md")).toBe(true);
    expect(isReadableRoadmapPath(".github/workflows/deploy.yml")).toBe(false);
    expect(isReadableRoadmapPath("context/../secrets.md")).toBe(false);
    expect(isReadableRoadmapPath("context//roadmap.md")).toBe(false);
    expect(isReadableRoadmapPath("README.md")).toBe(false);
  });
});

describe("groupStatus", () => {
  it("groups the status keywords", () => {
    expect(["done", "done_code", "in_progress", "ready_to_merge", "blocked", "ready", "proposed"].map(groupStatus)).toEqual(["done", "done", "active", "active", "blocked", "ready", "other"]);
  });
});

describe("buildRoadmapView", () => {
  const target = findRoadmapTarget(STATE, "notes-v1");
  if (target === null) {
    throw new Error("fixture: the active roadmap is missing");
  }

  it("merges the table rows with the item blocks and the state's stage, in roadmap order", () => {
    const view = buildRoadmapView({ target, file: { ok: true, value: FILE } });

    expect(view.fallback).toBeNull();
    expect(view.title).toBe("Notes v1");
    expect(view.heading).toBe("Roadmap notes-v1: notes that sync");
    expect(view).toMatchObject({ status: "ready", version: "2", updated: "2026-11-20", done: 1, total: 3 });
    expect(view.orders).toEqual([{ label: "Release", text: "no" }]);
    expect(view.items.map((item) => item.id)).toEqual(["NB-1", "NB-2", "NB-3"]);
    expect(view.items[1]).toEqual({
      id: "NB-2",
      title: "Notes sync",
      outcome: "notes sync across every device of the owner",
      status: "in_progress",
      group: "active",
      statusDetail: "implement 2/3",
      prerequisites: ["NB-1"],
      size: "M",
      changeId: "notes-sync",
      mode: "autonomous",
      ownerStep: null,
      facts: [{ label: "Risk", text: "conflicts", list: [] }],
      fields: [],
    });
    expect(view.items[2]).toMatchObject({ title: null, outcome: "a note is shared", status: "blocked", statusDetail: "waits", prerequisites: ["NB-1", "NB-2"] });
  });

  it("lists the owner's open steps before the done ones", () => {
    const view = buildRoadmapView({ target, file: { ok: true, value: FILE } });

    expect(view.checks.map((check) => [check.text, check.isDone])).toEqual([
      ["open step", false],
      ["done step", true],
    ]);
  });

  it("falls back to the state's items and says why when the file is refused, empty or not read", () => {
    const refused = buildRoadmapView({ target, file: { ok: false, kind: "refused", status: 403, acceptedPermissions: "contents=read" } });
    expect(refused.fallback).toBe("refused");
    expect(refused.items.map((item) => [item.id, item.statusDetail])).toEqual([
      ["NB-2", "implement 2/3"],
      ["NB-3", "waits"],
    ]);
    expect(buildRoadmapView({ target, file: { ok: true, value: "# Nothing here\n" } }).fallback).toBe("no_items");
    expect(buildRoadmapView({ target, file: null }).fallback).toBe("not_configured");
  });
});

describe("splitLabelledParts", () => {
  it("cuts a text at inline bold labels into a lead and labelled parts", () => {
    expect(splitLabelledParts("does a thing. **Owner step:** add the key. **PRD refs:** FR-3")).toEqual({
      lead: "does a thing.",
      parts: [
        { label: "Owner step", text: "add the key." },
        { label: "PRD refs", text: "FR-3" },
      ],
    });
  });

  it("keeps a text without labels whole and ignores bold text that is no label", () => {
    expect(splitLabelledParts("a **bold** word")).toEqual({ lead: "a **bold** word", parts: [] });
  });

  it("gives an empty lead when the text starts with a label", () => {
    expect(splitLabelledParts("**Owner step:** add it")).toEqual({ lead: "", parts: [{ label: "Owner step", text: "add it" }] });
  });
});

describe("buildRoadmapView item cleanup", () => {
  const MESSY = `# Roadmap

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **MX-1** | \`mx-one\` | a search behind a port. **Owner step:** create the key in production; until then it answers "no key". **PRD refs:** a new FR | — | autonomous | proposed |
| **MX-2** | \`mx-two\` | adding things | MX-1 | autonomous | proposed |

### MX-1: a search behind a port
- **Change:** \`mx-one\`
- **Priority:** P1
- **Feedback:** the owner's message (<!-- language: pl -->"tak"<!-- /language -->); the mockup's screens. **PRD refs:** a new FR written by the item
- **Depends on:** —
- **Files:** \`src/integrations/search/\` (new), \`src/app/api/\` (a route), their tests

### MX-2: adding things
- **Change ID:** \`mx-two\`
- **Depends on:** MX-1, MX-3
- **Owner step:** approve the scope
`;
  const target = findRoadmapTarget(STATE, "notes-v1");
  if (target === null) {
    throw new Error("fixture: the active roadmap is missing");
  }
  const view = buildRoadmapView({ target, file: { ok: true, value: MESSY } });

  it("takes the owner step out of the outcome, merges repeated labels and keeps short fields as facts", () => {
    expect(view.items[0]).toMatchObject({
      outcome: "a search behind a port.",
      ownerStep: 'create the key in production; until then it answers "no key".',
      changeId: "mx-one",
      prerequisites: [],
      facts: [
        { label: "PRD refs", text: "a new FR; a new FR written by the item", list: [] },
        { label: "Priority", text: "P1", list: [] },
      ],
    });
  });

  it("shows the change and the dependencies once, keeps long fields as paragraphs and drops comments", () => {
    const first = view.items[0];
    expect(first?.fields).toEqual([
      { label: "Feedback", text: 'the owner\'s message ("tak"); the mockup\'s screens.', list: [] },
      { label: "Files", text: "`src/integrations/search/` (new), `src/app/api/` (a route), their tests", list: [] },
    ]);
    expect(JSON.stringify(first)).not.toContain("<!--");
  });

  it("shows a part written the same way twice once", () => {
    const twice = buildRoadmapView({ target, file: { ok: true, value: "### TW-1: twice\n- **Outcome:** x. **PRD refs:** FR-1\n- **Feedback:** y. **PRD refs:** FR-1\n" } });
    expect(twice.items[0]?.facts).toEqual([
      { label: "PRD refs", text: "FR-1", list: [] },
      { label: "Feedback", text: "y.", list: [] },
    ]);
  });

  it("reads an owner step field and joins Depends on into the prerequisites", () => {
    expect(view.items[1]).toMatchObject({ ownerStep: "approve the scope", prerequisites: ["MX-1", "MX-3"], changeId: "mx-two", facts: [], fields: [] });
  });
});

describe("splitRoadmapTitle", () => {
  it("splits a long title at its first colon into a short title and a subtitle", () => {
    expect(splitRoadmapTitle("Roadmap later: what cannot run yet: dated acts")).toEqual({ title: "Roadmap later", subtitle: "what cannot run yet: dated acts" });
  });

  it("keeps a title without a colon whole", () => {
    expect(splitRoadmapTitle("Omicron v1")).toEqual({ title: "Omicron v1", subtitle: null });
  });

  it("keeps a title whole when the part before the colon is too long to be a name", () => {
    const title = `${"a".repeat(41)}: rest`;
    expect(splitRoadmapTitle(title)).toEqual({ title, subtitle: null });
  });

  it("keeps a title whole when nothing follows the colon", () => {
    expect(splitRoadmapTitle("Notes: ")).toEqual({ title: "Notes: ", subtitle: null });
  });
});
