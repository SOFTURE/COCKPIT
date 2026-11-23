import { describe, expect, it } from "vitest";
import type { StoredForgeFacts } from "../../modules/overview/facts.ts";
import type { ProjectRead } from "../../modules/projects/reads.ts";
import { buildSnapshot, parseSnapshot } from "../../src/digest/build-snapshot.ts";
import type { InboxAnswer } from "../../src/inbox/build-inbox.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const NOW = new Date("2026-11-10T12:00:00Z");
const ALPHA = "example-org/alpha-app";
const BETA = "example-org/beta-app";

function read(key: string, state: unknown, status: ProjectRead["status"] = "ok"): ProjectRead {
  return { key, status, issuesStatus: "ok", state, issues: [], readAt: NOW, lastGoodAt: state === null ? null : NOW };
}

function facts(key: string, overrides: Partial<StoredForgeFacts> = {}): StoredForgeFacts {
  return { key, release: null, releaseStatus: "ok", ciRun: null, qualityReviewRun: null, runsStatus: "ok", doctor: { kind: "ok", url: null }, doctorStatus: "ok", readAt: NOW, ...overrides };
}

const ALPHA_STATE = createStateFixture({
  active_roadmap: {
    slug: "alpha-v1",
    title: "Alpha v1",
    status: "ready",
    version: "1",
    path: "context/foundation/roadmap.md",
    done: 2,
    total: 3,
    items: [
      { id: "AL-1", change_id: "first-screen", outcome: "the first screen", status: "done", stage: null, since: null, detail: null, prerequisites: [], mode: "autonomous" },
      { id: "AL-2", change_id: "second-screen", outcome: null, status: "done_code (2026-11-09; waiting: release)", stage: null, since: null, detail: null, prerequisites: [], mode: "autonomous" },
      { id: "AL-3", change_id: "third-screen", outcome: "the third screen", status: "in_progress", stage: "plan", since: null, detail: null, prerequisites: [], mode: "autonomous" },
    ],
  },
  owner_queue: [
    { id: "oq-1", kind: "decision", source: "context/foundation/roadmap.md", item: "AL-3", since: "2026-11-01", text: "Pick the mail provider" },
    { id: "oq-2", kind: "word", source: "context/foundation/roadmap.md", item: null, since: "2026-11-02", text: "Release 1.1.0?" },
  ],
});

const ANSWERED: InboxAnswer = {
  repositoryKey: ALPHA,
  fullName: ALPHA,
  entryId: "oq-2",
  entryText: "Release 1.1.0?",
  answer: "yes",
  note: null,
  answeredAt: NOW,
  status: "sent",
  issueNumber: 7,
  issueUrl: "https://forge.example.test/example-org/alpha-app/issues/7",
};

describe("the digest snapshot", () => {
  it("holds each project's done items, release, open entries and broken reasons as the screens see them", () => {
    const snapshot = buildSnapshot({
      projects: [
        { key: ALPHA, fullName: ALPHA },
        { key: BETA, fullName: BETA },
      ],
      reads: [read(ALPHA, ALPHA_STATE), read(BETA, null, "no_state")],
      facts: [facts(ALPHA, { release: { version: "v1.0.0", date: "2026-11-01" }, ciRun: { result: "failed", url: "https://forge.example.test/run/2", at: "2026-11-10T10:00:00Z" } })],
      answers: [ANSWERED],
      now: NOW,
      timeZone: "Europe/Warsaw",
    });
    expect(snapshot).toEqual({
      projects: {
        [ALPHA]: {
          name: ALPHA,
          doneItems: [
            { id: "AL-1", outcome: "the first screen" },
            { id: "AL-2", outcome: null },
          ],
          release: "v1.0.0",
          openEntries: [{ id: "oq-1", text: "Pick the mail provider" }],
          brokenReasons: ["ci_failed"],
        },
        [BETA]: { name: BETA, doneItems: [], release: null, openEntries: [], brokenReasons: ["state_unreadable"] },
      },
    });
    expect(parseSnapshot(snapshot)).toEqual(snapshot);
  });

  it("counts a project whose observability reports alerts firing as broken, as the overview does", () => {
    const snapshot = buildSnapshot({
      projects: [{ key: ALPHA, fullName: ALPHA }],
      reads: [read(ALPHA, ALPHA_STATE)],
      facts: [facts(ALPHA)],
      adapterReads: [{ key: ALPHA, adapter: "observability", status: "value", value: { kind: "unhealthy", firing: ["Alpha app down"] }, readAt: NOW }],
      answers: [ANSWERED],
      now: NOW,
      timeZone: "Europe/Warsaw",
    });
    expect(snapshot.projects[ALPHA]?.brokenReasons).toEqual(["unhealthy"]);
    expect(parseSnapshot(snapshot)).toEqual(snapshot);
  });

  it("treats a stored value of another shape as no snapshot", () => {
    expect(parseSnapshot({ projects: { [ALPHA]: { name: ALPHA } } })).toBeNull();
    expect(parseSnapshot(null)).toBeNull();
  });
});
