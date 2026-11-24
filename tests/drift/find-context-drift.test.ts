import { describe, expect, it } from "vitest";
import { findContextDrift } from "../../src/drift/find-context-drift.ts";
import type { ProjectState } from "../../src/state/state-schema.ts";
import { createStateFixture } from "../support/state-fixture.ts";

type Item = NonNullable<ProjectState["active_roadmap"]>["items"][number];

function item(id: string, status: string, detail: string | null = null, since: string | null = null): Item {
  return { id, change_id: null, outcome: null, status, stage: null, since, detail, prerequisites: [], mode: "autonomous" };
}

function stateWith(items: readonly Item[], ownerQueue: ProjectState["owner_queue"] = []): ProjectState {
  const base = createStateFixture({ owner_queue: ownerQueue });
  if (base.active_roadmap === null) {
    throw new Error("the fixture has an active roadmap");
  }
  return { ...base, active_roadmap: { ...base.active_roadmap, items: [...items], total: items.length } };
}

const RELEASE_WORD = { id: "oq-9f8e7d", kind: "word" as const, source: "context/foundation/roadmap.md#At a glance", item: null, since: "2026-11-18", text: "release: AL-2 merged and waiting for a release" };

describe("findContextDrift", () => {
  it("finds nothing for a settled project", () => {
    const state = stateWith([item("AL-1", "done"), item("AL-2", "in_progress", "implement, since 2026-11-01")]);
    expect(findContextDrift({ state, release: { version: "v1.0.0", date: "2026-11-20" } })).toEqual([]);
  });

  it("flags a release published after the rows still waiting for a release", () => {
    const state = stateWith([
      item("AL-1", "done_code", "2026-11-10; waiting: release", "2026-11-10"),
      item("AL-2", "done_code", "2026-11-12; waiting: release", "2026-11-12"),
      item("AL-3", "ready"),
    ]);
    expect(findContextDrift({ state, release: { version: "v1.4.0", date: "2026-11-15" } })).toEqual([
      { kind: "release_not_settled", version: "v1.4.0", date: "2026-11-15", items: ["AL-1", "AL-2"] },
    ]);
  });

  it("names only the rows merged before the release", () => {
    const state = stateWith([
      item("AL-1", "done_code", "2026-11-10; waiting: release", "2026-11-10"),
      item("AL-2", "done_code", "2026-11-16; waiting: release", "2026-11-16"),
    ]);
    expect(findContextDrift({ state, release: { version: "v1.4.0", date: "2026-11-15" } })).toEqual([
      { kind: "release_not_settled", version: "v1.4.0", date: "2026-11-15", items: ["AL-1"] },
    ]);
  });

  it("does not flag a release on the same day as the rows, which may predate the merge", () => {
    const state = stateWith([item("AL-1", "done_code", "2026-11-15; waiting: release", "2026-11-15")]);
    expect(findContextDrift({ state, release: { version: "v1.4.0", date: "2026-11-15" } })).toEqual([]);
  });

  it("dates rows written without a date by the owner queue's release word", () => {
    const state = stateWith([item("AL-1", "done"), item("AL-2", "done_code", "waiting: release")], [RELEASE_WORD]);
    expect(findContextDrift({ state, release: { version: "v2.0.0", date: "2026-11-19" } })).toEqual([
      { kind: "release_not_settled", version: "v2.0.0", date: "2026-11-19", items: ["AL-2"] },
    ]);
  });

  it("does not flag undated rows when nothing dates them", () => {
    const state = stateWith([item("AL-1", "done"), item("AL-2", "done_code", "waiting: release")]);
    expect(findContextDrift({ state, release: { version: "v2.0.0", date: "2026-11-19" } })).toEqual([]);
  });

  it("does not count rows waiting for the owner, not a release", () => {
    const state = stateWith([item("AL-1", "done_code", "2026-11-10; waiting: owner check", "2026-11-10")]);
    expect(findContextDrift({ state, release: { version: "v1.4.0", date: "2026-11-15" } })).toEqual([]);
  });

  it("does not flag waiting rows when the forge has no release or an undated one", () => {
    const state = stateWith([item("AL-1", "done_code", "2026-11-10; waiting: release", "2026-11-10")]);
    expect(findContextDrift({ state, release: null })).toEqual([]);
    expect(findContextDrift({ state, release: { version: "v1.4.0", date: null } })).toEqual([]);
  });

  it("flags a roadmap whose every row is done but which is still live", () => {
    const state = stateWith([item("AL-1", "done"), item("AL-2", "dropped"), item("AL-3", "done")]);
    expect(findContextDrift({ state, release: null })).toEqual([{ kind: "finished_roadmap_live", slug: "alpha-v1", total: 3 }]);
  });

  it("does not call a roadmap finished while rows wait for a release", () => {
    const state = stateWith([item("AL-1", "done"), item("AL-2", "done_code", "2026-11-16; waiting: release", "2026-11-16")]);
    expect(findContextDrift({ state, release: { version: "v1.0.0", date: "2026-11-01" } })).toEqual([]);
  });

  it("does not call an empty or only dropped roadmap finished", () => {
    expect(findContextDrift({ state: stateWith([]), release: null })).toEqual([]);
    expect(findContextDrift({ state: stateWith([item("AL-1", "dropped")]), release: null })).toEqual([]);
  });

  it("finds nothing without a readable state or roadmap, and ignores an unreadable release", () => {
    expect(findContextDrift({ state: null, release: { version: "v1.0.0", date: "2026-11-20" } })).toEqual([]);
    expect(findContextDrift({ state: { not: "a state" }, release: null })).toEqual([]);
    expect(findContextDrift({ state: createStateFixture({ active_roadmap: null }), release: null })).toEqual([]);
    const state = stateWith([item("AL-1", "done_code", "2026-11-10; waiting: release", "2026-11-10")]);
    expect(findContextDrift({ state, release: { tag: 1 } })).toEqual([]);
  });
});
