import { describe, expect, it } from "vitest";
import type { ProjectRead } from "../../modules/projects/reads.ts";
import type { InboxRow } from "../../src/inbox/build-inbox.ts";
import { buildProjectPage, type ProjectPageInput } from "../../src/project-page/build-project-page.ts";
import type { ProjectState } from "../../src/state/state-schema.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const KEY = "example-org/alpha-app";
const READ_AT = new Date("2026-11-20T09:00:00Z");
const GOOD_AT = new Date("2026-11-19T09:00:00Z");

type Item = NonNullable<ProjectState["active_roadmap"]>["items"][number];

function item(id: string, overrides: Partial<Item> = {}): Item {
  return { id, change_id: `change-${id.toLowerCase()}`, outcome: `outcome of ${id}`, status: "ready", stage: null, since: null, detail: null, prerequisites: [], mode: "autonomous", ...overrides };
}

function read(state: unknown, overrides: Partial<ProjectRead> = {}): ProjectRead {
  return { key: KEY, status: "ok", issuesStatus: "ok", state, issues: [], readAt: READ_AT, lastGoodAt: READ_AT, ...overrides };
}

function row(projectKey: string, id: string): InboxRow {
  return {
    projectKey,
    projectName: projectKey,
    entry: { id, kind: "decision", source: "context/foundation/roadmap.md", item: null, since: "2026-11-18", text: `Entry ${id}` },
    ageDays: 2,
    answer: { kind: "open" },
    previousAnswer: null,
  };
}

function input(overrides: Partial<ProjectPageInput> = {}): ProjectPageInput {
  return {
    repository: { key: KEY, fullName: KEY, defaultBranch: "trunk" },
    read: read(createStateFixture()),
    inboxRows: [],
    webUrl: "https://github.com",
    ...overrides,
  };
}

const ROADMAP: NonNullable<ProjectState["active_roadmap"]> = {
  slug: "alpha-v1",
  title: "Alpha v1",
  status: "ready",
  version: "1",
  path: "context/foundation/roadmap.md",
  done: 2,
  total: 7,
  items: [
    item("AL-3", { status: "in_progress", stage: "implement 2/3", since: "2026-11-18", detail: "phase 2 of 3" }),
    item("AL-7", { status: "ready_to_merge" }),
    item("AL-4", { status: "blocked", detail: "waits for an upstream fix" }),
    item("AL-5", { change_id: null }),
    item("AL-6", { status: "done_code", stage: null }),
  ],
};

describe("buildProjectPage", () => {
  it("lists the active roadmap's items in roadmap order with ID, outcome and stage", () => {
    const page = buildProjectPage(
      input({
        read: read(
          createStateFixture({
            active_roadmap: ROADMAP,
            open_changes: [{ change_id: "change-al-3", title: "Third", status: "implementing", roadmap_item: "AL-3", updated: "2026-11-19", stage: null }],
          }),
        ),
      }),
    );
    const roadmap = page.state?.activeRoadmap;
    expect(roadmap?.items.map((entry) => [entry.id, entry.outcome, entry.stage])).toEqual([
      ["AL-3", "outcome of AL-3", "implement 2/3"],
      ["AL-7", "outcome of AL-7", "ready_to_merge"],
      ["AL-4", "outcome of AL-4", "blocked"],
      ["AL-5", "outcome of AL-5", "ready"],
      ["AL-6", "outcome of AL-6", "done_code"],
    ]);
    expect(roadmap?.items[0]).toMatchObject({ status: "in_progress", detail: "phase 2 of 3", since: "2026-11-18" });
    expect(roadmap).toMatchObject({ slug: "alpha-v1", title: "Alpha v1", done: 2, total: 7 });
  });

  it("links the roadmap file, and an item's change folder only while the change is open", () => {
    const page = buildProjectPage(
      input({
        read: read(
          createStateFixture({
            main_branch: "main",
            active_roadmap: ROADMAP,
            open_changes: [{ change_id: "change-al-3", title: "Third", status: "implementing", roadmap_item: "AL-3", updated: null, stage: "implement" }],
          }),
        ),
      }),
    );
    const roadmap = page.state?.activeRoadmap;
    expect(page.links.repository).toBe("https://github.com/example-org/alpha-app");
    expect(roadmap?.link).toBe("https://github.com/example-org/alpha-app/blob/main/context/foundation/roadmap.md");
    expect(roadmap?.items.map((entry) => entry.link)).toEqual([
      "https://github.com/example-org/alpha-app/tree/main/context/changes/change-al-3",
      null,
      null,
      null,
      null,
    ]);
  });

  it("uses the repository's default branch when the state names none", () => {
    const page = buildProjectPage(input({ read: read(createStateFixture({ main_branch: null })) }));
    expect(page.state?.activeRoadmap?.link).toBe("https://github.com/example-org/alpha-app/blob/trunk/context/foundation/roadmap.md");
  });

  it("shows each queued roadmap with its title, start condition, counter and file", () => {
    const page = buildProjectPage(
      input({
        read: read(
          createStateFixture({
            main_branch: "main",
            queued: [
              { slug: "alpha-v2", title: "Alpha v2", status: "queued", path: "context/foundation/roadmaps/alpha-v2.md", start_condition: "after alpha-v1", done: 0, total: 4, items: [] },
              { slug: "alpha-ops", title: null, status: null, path: "context/foundation/roadmaps/alpha-ops.md", start_condition: null, done: 1, total: 2, items: [] },
            ],
          }),
        ),
      }),
    );
    expect(page.state?.queued).toEqual([
      { slug: "alpha-v2", title: "Alpha v2", startCondition: "after alpha-v1", done: 0, total: 4, link: "https://github.com/example-org/alpha-app/blob/main/context/foundation/roadmaps/alpha-v2.md" },
      { slug: "alpha-ops", title: null, startCondition: null, done: 1, total: 2, link: "https://github.com/example-org/alpha-app/blob/main/context/foundation/roadmaps/alpha-ops.md" },
    ]);
  });

  it("shows each open change with its stage (status when it has none), item and folder", () => {
    const page = buildProjectPage(
      input({
        read: read(
          createStateFixture({
            main_branch: "main",
            open_changes: [
              { change_id: "fix-login", title: "Fix the login", status: "planned", roadmap_item: null, updated: "2026-11-19", stage: null },
              { change_id: "change-al-3", title: null, status: null, roadmap_item: "AL-3", updated: null, stage: "implement 2/3" },
            ],
          }),
        ),
      }),
    );
    expect(page.state?.openChanges).toEqual([
      { changeId: "fix-login", title: "Fix the login", stage: "planned", roadmapItem: null, updated: "2026-11-19", link: "https://github.com/example-org/alpha-app/tree/main/context/changes/fix-login" },
      { changeId: "change-al-3", title: null, stage: "implement 2/3", roadmapItem: "AL-3", updated: null, link: "https://github.com/example-org/alpha-app/tree/main/context/changes/change-al-3" },
    ]);
  });

  it("keeps only this project's entries, in the inbox's order", () => {
    const page = buildProjectPage(input({ inboxRows: [row(KEY, "a1"), row("example-org/beta-app", "b1"), row(KEY, "a2")] }));
    expect(page.entries.map((entry) => entry.entry.id)).toEqual(["a1", "a2"]);
  });

  it("says there is no state when the project was never read well", () => {
    expect(buildProjectPage(input({ read: undefined }))).toMatchObject({ readStatus: "never", readAt: null, failure: null, state: null });
    expect(buildProjectPage(input({ read: read(null, { status: "no_state", lastGoodAt: null }) }))).toMatchObject({
      readStatus: "no_state",
      failure: { status: "no_state", readAt: READ_AT, lastGoodAt: null },
      state: null,
    });
  });

  it("says there is no active roadmap instead of an empty list", () => {
    const page = buildProjectPage(input({ read: read(createStateFixture({ active_roadmap: null })) }));
    expect(page.state).not.toBeNull();
    expect(page.state?.activeRoadmap).toBeNull();
  });

  it("keeps the last good data with the failure and its time when the last read failed", () => {
    const page = buildProjectPage(input({ read: read(createStateFixture({ active_roadmap: ROADMAP }), { status: "unavailable", lastGoodAt: GOOD_AT }) }));
    expect(page.failure).toEqual({ status: "unavailable", readAt: READ_AT, lastGoodAt: GOOD_AT });
    expect(page.state?.activeRoadmap?.items).toHaveLength(5);
    expect(page.state?.updatedAt).toBe("2026-11-01T10:00:00Z");
  });

  it("treats a stored state that no longer matches the contract as no state", () => {
    const page = buildProjectPage(input({ read: read({ schema_version: 2, project: "alpha-app" }) }));
    expect(page.state).toBeNull();
    expect(page.failure).toBeNull();
  });
});
