import { describe, expect, it } from "vitest";
import type { DigestSnapshot, ProjectSnapshot } from "../../src/digest/build-snapshot.ts";
import { compareSnapshots, hasChanges } from "../../src/digest/compare-snapshots.ts";

const ALPHA = "example-org/alpha-app";
const BETA = "example-org/beta-app";

function project(overrides: Partial<ProjectSnapshot> = {}): ProjectSnapshot {
  return {
    name: ALPHA,
    doneItems: [{ id: "AL-1", outcome: "the first screen" }],
    release: "1.0.0",
    openEntries: [{ id: "oq-1", text: "Pick the mail provider" }],
    brokenReasons: [],
    ...overrides,
  };
}

function snapshot(projects: Record<string, ProjectSnapshot>): DigestSnapshot {
  return { projects };
}

describe("comparing digest snapshots", () => {
  it("finds nothing when nothing changed", () => {
    const changes = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: project() }));
    expect(changes).toEqual({ shipped: [], waiting: [], broke: [] });
    expect(hasChanges(changes)).toBe(false);
  });

  it("lists an item that became done and a new release as shipped", () => {
    const now = project({ doneItems: [{ id: "AL-1", outcome: "the first screen" }, { id: "AL-2", outcome: "the second screen" }], release: "1.1.0" });
    const changes = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: now }));
    expect(changes.shipped).toEqual([
      { kind: "item", projectKey: ALPHA, projectName: ALPHA, itemId: "AL-2", outcome: "the second screen" },
      { kind: "release", projectKey: ALPHA, projectName: ALPHA, version: "1.1.0" },
    ]);
    expect(hasChanges(changes)).toBe(true);
  });

  it("does not report a release that disappeared", () => {
    const changes = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: project({ release: null }) }));
    expect(changes.shipped).toEqual([]);
  });

  it("lists a new open entry as waiting, but not one that was already open", () => {
    const now = project({ openEntries: [{ id: "oq-1", text: "Pick the mail provider" }, { id: "oq-2", text: "Release 1.1.0?" }] });
    const changes = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: now }));
    expect(changes.waiting).toEqual([{ projectKey: ALPHA, projectName: ALPHA, entryId: "oq-2", text: "Release 1.1.0?" }]);
  });

  it("does not list an entry that was answered since", () => {
    const changes = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: project({ openEntries: [] }) }));
    expect(hasChanges(changes)).toBe(false);
  });

  it("lists a project that turned broken, with its reasons, and not one that stayed broken", () => {
    const broken = project({ brokenReasons: ["ci_failed", "doctor_failing"] });
    const turned = compareSnapshots(snapshot({ [ALPHA]: project() }), snapshot({ [ALPHA]: broken }));
    expect(turned.broke).toEqual([{ projectKey: ALPHA, projectName: ALPHA, reasons: ["ci_failed", "doctor_failing"] }]);
    const stayed = compareSnapshots(snapshot({ [ALPHA]: project({ brokenReasons: ["ci_failed"] }) }), snapshot({ [ALPHA]: broken }));
    expect(stayed.broke).toEqual([]);
  });

  it("does not report a project that recovered", () => {
    const changes = compareSnapshots(snapshot({ [ALPHA]: project({ brokenReasons: ["ci_failed"] }) }), snapshot({ [ALPHA]: project() }));
    expect(hasChanges(changes)).toBe(false);
  });

  it("reports nothing for a project added since the last digest", () => {
    const now = snapshot({ [ALPHA]: project(), [BETA]: project({ name: BETA, brokenReasons: ["state_unreadable"], release: "2.0.0" }) });
    expect(hasChanges(compareSnapshots(snapshot({ [ALPHA]: project() }), now))).toBe(false);
  });

  it("orders lines by project name", () => {
    const before = snapshot({ [BETA]: project({ name: BETA, openEntries: [] }), [ALPHA]: project({ openEntries: [] }) });
    const now = snapshot({ [BETA]: project({ name: BETA }), [ALPHA]: project() });
    expect(compareSnapshots(before, now).waiting.map((line) => line.projectName)).toEqual([ALPHA, BETA]);
  });
});
