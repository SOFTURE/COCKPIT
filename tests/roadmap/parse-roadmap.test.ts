import { describe, expect, it } from "vitest";
import { parseRoadmap, parseStatus } from "../../src/roadmap/parse-roadmap.ts";

const ROADMAP = `---
project: "Notebook"
roadmap: notes-v1
version: 2
status: ready
updated: 2026-11-20
---

# Roadmap notes-v1: notes that sync

> Run-wide orders, read by orchestrators (not parsed):
> - Release: no
> - Start: after the beta feedback

## At a glance

| ID | Change | Outcome | Depends on | Mode | Status |
| --- | --- | --- | --- | --- | --- |
| **NB-1** | \`notes-storage\` | notes are stored | — | autonomous | done |
| **NB-2** | \`notes-sync\` | notes sync across devices | NB-1 | autonomous | **in_progress** (plan, since 2026-11-19) |
| **NB-3** | \`notes-share\` | a note is shared by link | NB-1, NB-2 | manual | blocked (waits for an upstream fix) |

## Items

### NB-1: Notes storage
- **Change ID:** \`notes-storage\`
- **Status:** done
- **Outcome:** notes are stored in the database
  with their history.
- **Prerequisites:** —
- **Size:** S

### NB-2: Notes sync
- **Change ID:** \`notes-sync\`
- **Size:** M
- **Unknowns:**
  - Which conflict rule wins? (owner: research;
    blocks: no)
  - How large can a note be?

## Before the next release
- [ ] **NB-2**: set the sync secret
- [x] **NB-1**: create the bucket

## Owner decisions and checks
- [ ] **NB-3**: approve the sharing scope

## Done
- [ ] not an owner check
`;

describe("parseRoadmap", () => {
  it("reads the frontmatter, the title and the run-wide orders", () => {
    const roadmap = parseRoadmap(ROADMAP);

    expect(roadmap.frontmatter).toEqual({ project: "Notebook", roadmap: "notes-v1", version: "2", status: "ready", updated: "2026-11-20" });
    expect(roadmap.title).toBe("Roadmap notes-v1: notes that sync");
    expect(roadmap.orders).toEqual([
      { label: "Release", text: "no" },
      { label: "Start", text: "after the beta feedback" },
    ]);
  });

  it("reads the at-a-glance rows with change, outcome, prerequisites, mode and status", () => {
    const { rows } = parseRoadmap(ROADMAP);

    expect(rows.map((row) => row.id)).toEqual(["NB-1", "NB-2", "NB-3"]);
    expect(rows[0]).toEqual({ id: "NB-1", changeId: "notes-storage", outcome: "notes are stored", prerequisites: [], mode: "autonomous", status: { keyword: "done", detail: null } });
    expect(rows[1]?.status).toEqual({ keyword: "in_progress", detail: "plan, since 2026-11-19" });
    expect(rows[2]?.prerequisites).toEqual(["NB-1", "NB-2"]);
    expect(rows[2]?.status).toEqual({ keyword: "blocked", detail: "waits for an upstream fix" });
  });

  it("reads item blocks, joining wrapped lines and nested list items", () => {
    const { items } = parseRoadmap(ROADMAP);

    expect(items.map((item) => [item.id, item.title])).toEqual([
      ["NB-1", "Notes storage"],
      ["NB-2", "Notes sync"],
    ]);
    expect(items[0]?.fields.find((field) => field.label === "Outcome")?.text).toBe("notes are stored in the database with their history.");
    expect(items[1]?.fields.find((field) => field.label === "Unknowns")).toEqual({
      label: "Unknowns",
      text: "",
      list: ["Which conflict rule wins? (owner: research; blocks: no)", "How large can a note be?"],
    });
  });

  it("reads the checkboxes of the owner sections only", () => {
    const { checks } = parseRoadmap(ROADMAP);

    expect(checks).toEqual([
      { section: "Before the next release", text: "**NB-2**: set the sync secret", isDone: false },
      { section: "Before the next release", text: "**NB-1**: create the bucket", isDone: true },
      { section: "Owner decisions and checks", text: "**NB-3**: approve the sharing scope", isDone: false },
    ]);
  });

  it("returns empty parts for an empty file", () => {
    expect(parseRoadmap("")).toEqual({ frontmatter: {}, title: null, orders: [], rows: [], items: [], checks: [] });
  });

  it("reads item blocks of a roadmap without a table", () => {
    const roadmap = parseRoadmap("# Later\n\n### LT-1: Something later\n- **Status:** proposed\n");

    expect(roadmap.rows).toEqual([]);
    expect(roadmap.items).toEqual([{ id: "LT-1", title: "Something later", fields: [{ label: "Status", text: "proposed", list: [] }] }]);
  });
});

describe("parseStatus", () => {
  it("reads an unknown word as its own keyword and an empty cell as unknown", () => {
    expect(parseStatus("waiting (owner)")).toEqual({ keyword: "waiting", detail: "owner" });
    expect(parseStatus("")).toEqual({ keyword: "unknown", detail: null });
    expect(parseStatus("done_code (2026-11-23; waiting: release)")).toEqual({ keyword: "done_code", detail: "2026-11-23; waiting: release" });
  });
});
