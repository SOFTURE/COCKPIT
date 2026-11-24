import { describe, expect, it } from "vitest";
import { buildInbox, type InboxAnswer, type InboxSource } from "../../src/inbox/build-inbox.ts";
import { formatOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../../src/state/state-schema.ts";
import { createStateFixture } from "../support/state-fixture.ts";

const NOW = new Date("2026-11-20T09:00:00Z");
const ZONE = "Europe/Warsaw";

function entry(id: string, since: string | null, kind: OwnerQueueEntry["kind"] = "decision"): OwnerQueueEntry {
  return { id, kind, source: "context/foundation/roadmap.md", item: "AL-2", since, text: `Entry ${id}` };
}

function source(name: string, entries: OwnerQueueEntry[], issues: unknown[] = []): InboxSource {
  return { key: name, fullName: name, state: createStateFixture({ owner_queue: entries }), issues };
}

function issue(number: number, state: "open" | "closed", entryId: string) {
  return {
    number,
    state,
    title: "Owner word",
    body: `Answer\n${formatOwnerWordMarker({ entry: entryId, answer: "yes" })}`,
    url: `https://forge.example.test/issues/${String(number)}`,
    createdAt: "2026-11-19T10:00:00Z",
    closedAt: null,
  };
}

describe("buildInbox", () => {
  it("lists the entries of every project, oldest first, with their age in days", () => {
    const inbox = buildInbox(
      [
        source("example-org/alpha-app", [entry("a1", "2026-11-10"), entry("a2", "2026-11-18")]),
        source("example-org/beta-app", []),
        source("example-org/gamma-app", [
          entry("g1", "2026-11-01", "secret"),
          entry("g2", null, "word"),
          entry("g3", "2026-11-12", "step"),
          entry("g4", "2026-11-10"),
          entry("g5", "2026-11-19"),
        ]),
      ],
      NOW,
      ZONE,
    );
    expect(inbox.rows.map((row) => [row.entry.id, row.ageDays])).toEqual([
      ["g1", 19],
      ["a1", 10],
      ["g4", 10],
      ["g3", 8],
      ["a2", 2],
      ["g5", 1],
      ["g2", null],
    ]);
    expect(inbox.unansweredCount).toBe(7);
  });

  it("shows sent for an open owner-word issue and done for a closed one, and counts only the rest", () => {
    const inbox = buildInbox(
      [source("example-org/alpha-app", [entry("a1", "2026-11-10"), entry("a2", "2026-11-11"), entry("a3", "2026-11-12")], [issue(4, "open", "a1"), issue(3, "closed", "a2")])],
      NOW,
      ZONE,
    );
    expect(inbox.rows.map((row) => [row.entry.id, row.answer.kind])).toEqual([
      ["a1", "sent"],
      ["a2", "done"],
      ["a3", "open"],
    ]);
    expect(inbox.rows[0]?.answer).toEqual({ kind: "sent", answer: "yes", issueNumber: 4, issueUrl: "https://forge.example.test/issues/4", answeredBy: null });
    expect(inbox.unansweredCount).toBe(1);
  });

  it("lists the owner work the package-update routine records, and keeps a step's kind with its answer in the history", () => {
    const routineStep: OwnerQueueEntry = {
      id: "oq-r1",
      kind: "secret",
      source: "context/workflow.json#routines.packageUpdates.ownerSteps",
      item: null,
      since: "2026-11-18",
      text: "@example/mail 0.3.0: set the production secret MAIL_KEY_SECRET (#42)",
    };
    const ownerHold: OwnerQueueEntry = { ...routineStep, id: "oq-h1", kind: "decision", source: "context/workflow.json#routines.packageUpdates.hold", text: "hold @example/billing: choose how invoices are treated (#41)" };
    const answered: InboxAnswer = {
      repositoryKey: "example-org/routine-app",
      fullName: "example-org/routine-app",
      entryId: "oq-gone",
      entryText: "@example/db 2.0.0: set the production secret DB_TOKEN (#40)",
      entryKind: "secret",
      answer: "yes",
      note: null,
      answeredByName: null,
      answeredAt: new Date("2026-11-19T08:00:00Z"),
      status: "sent",
      issueNumber: 7,
      issueUrl: "https://forge.example.test/issues/7",
    };

    const inbox = buildInbox([source("example-org/routine-app", [routineStep, ownerHold])], NOW, ZONE, [answered]);

    expect(inbox.rows.map((row) => [row.entry.id, row.entry.kind, row.answer.kind])).toEqual([
      ["oq-h1", "decision", "open"],
      ["oq-r1", "secret", "open"],
    ]);
    expect(inbox.unansweredCount).toBe(2);
    expect(inbox.history.map((row) => [row.entryText, row.entryKind, row.answer])).toEqual([[answered.entryText, "secret", "yes"]]);
  });

  it("is empty for projects without a stored state", () => {
    expect(buildInbox([{ key: "x/y", fullName: "x/y", state: null, issues: [] }], NOW, ZONE)).toEqual({ rows: [], unansweredCount: 0, deferredCount: 0, history: [] });
  });

  it("builds 200 entries over 30 projects quickly (NFR-1)", () => {
    const sources = Array.from({ length: 30 }, (_unused, project) =>
      source(
        `example-org/app-${String(project)}`,
        Array.from({ length: project < 20 ? 7 : 6 }, (_also, index) => entry(`e${String(project)}-${String(index)}`, `2026-10-${String(10 + index).padStart(2, "0")}`)),
      ),
    );
    const started = performance.now();
    const inbox = buildInbox(sources, NOW, ZONE);
    expect(inbox.rows).toHaveLength(200);
    expect(performance.now() - started).toBeLessThan(50);
  });
});

describe("buildInbox with COCKPIT's answers", () => {
  const KEY = "example-org/alpha-app";

  function answer(overrides: Partial<InboxAnswer> = {}): InboxAnswer {
    return {
      repositoryKey: KEY,
      fullName: KEY,
      entryId: "a1",
      entryText: "Entry a1",
      answer: "no",
      note: null,
      answeredByName: "Ada Example",
      answeredAt: new Date("2026-11-19T10:00:00Z"),
      status: "sent",
      issueNumber: 9,
      issueUrl: "https://forge.example.test/issues/9",
      ...overrides,
    };
  }

  it("shows sending while the issue is created, sent once recorded and done once the scanned issue is closed", () => {
    const entries = [entry("a1", "2026-11-10"), entry("a2", "2026-11-11"), entry("a3", "2026-11-12")];
    const inbox = buildInbox([source(KEY, entries, [issue(9, "closed", "a1")])], NOW, ZONE, [
      answer(),
      answer({ entryId: "a2", entryText: "Entry a2", issueNumber: 10, issueUrl: "https://forge.example.test/issues/10" }),
      answer({ entryId: "a3", entryText: "Entry a3", status: "creating", issueNumber: null, issueUrl: null }),
    ]);

    expect(inbox.rows.map((row) => row.answer.kind)).toEqual(["done", "sent", "sending"]);
    expect(inbox.rows[1]?.answer).toEqual({ kind: "sent", answer: "no", issueNumber: 10, issueUrl: "https://forge.example.test/issues/10", answeredBy: "Ada Example" });
    expect(inbox.unansweredCount).toBe(0);
  });

  it("opens a reworded entry again, shows the earlier answer as changed since, and does not match its issue by marker", () => {
    const reworded = { ...entry("a1", "2026-11-10"), text: "Entry a1, reworded" };
    const inbox = buildInbox([source(KEY, [reworded], [issue(9, "open", "a1")])], NOW, ZONE, [answer()]);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "open" });
    expect(inbox.rows[0]?.previousAnswer).toEqual({ answer: "no", issueNumber: 9, issueUrl: "https://forge.example.test/issues/9" });
    expect(inbox.unansweredCount).toBe(1);
    expect(inbox.history).toEqual([]);
  });

  it("keeps the answer of an entry its project re-worded while settling it, because the new text cites the answer's issue", () => {
    const settling = { ...entry("a1", "2026-11-10"), text: "Entry a1. State 2026-11-24 (#9): part done, the rest stays open" };
    const inbox = buildInbox([source(KEY, [settling], [issue(9, "open", "a1")])], NOW, ZONE, [answer()]);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "sent", answer: "no", issueNumber: 9, issueUrl: "https://forge.example.test/issues/9", answeredBy: "Ada Example" });
    expect(inbox.rows[0]?.previousAnswer).toBeNull();
    expect(inbox.unansweredCount).toBe(0);
  });

  it("opens a re-worded entry again when it cites another issue whose number only starts like the answer's", () => {
    const reworded = { ...entry("a1", "2026-11-10"), text: "Entry a1, see #90" };
    const inbox = buildInbox([source(KEY, [reworded])], NOW, ZONE, [answer()]);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "open" });
    expect(inbox.rows[0]?.previousAnswer).toMatchObject({ issueNumber: 9 });
  });

  it("keeps an owner-word issue created outside COCKPIT as the answer when no recorded answer claims it", () => {
    const inbox = buildInbox([source(KEY, [entry("a2", "2026-11-11")], [issue(9, "open", "a1"), issue(12, "open", "a2")])], NOW, ZONE, [answer()]);

    expect(inbox.rows[0]?.answer).toMatchObject({ kind: "sent", issueNumber: 12, answeredBy: null });
  });

  it("puts off an entry its project marked later, links its issue, sorts it last and counts it apart", () => {
    const putOff = { ...entry("a1", "2026-11-01"), text: "Start the queued roadmap: once the app is stable (later: #9)" };
    const inbox = buildInbox([source(KEY, [putOff, entry("a2", "2026-11-11")], [issue(9, "closed", "a1")])], NOW, ZONE, [answer()]);

    expect(inbox.rows.map((row) => [row.entry.id, row.answer.kind])).toEqual([
      ["a2", "open"],
      ["a1", "deferred"],
    ]);
    expect(inbox.rows[1]?.answer).toEqual({ kind: "deferred", issueNumber: 9, issueUrl: "https://forge.example.test/issues/9" });
    expect(inbox.rows[1]?.previousAnswer).toBeNull();
    expect(inbox.unansweredCount).toBe(1);
    expect(inbox.deferredCount).toBe(1);
    expect(inbox.history).toEqual([]);
  });

  it("puts off an entry marked later by an issue the scan did not store, without a link", () => {
    const putOff = { ...entry("a1", "2026-11-01"), text: "Entry a1 (later: #31)" };
    const inbox = buildInbox([source(KEY, [putOff])], NOW, ZONE);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "deferred", issueNumber: 31, issueUrl: null });
    expect(inbox.unansweredCount).toBe(0);
  });

  it("puts off an entry whose later marker sits inside the text, not at its end", () => {
    const putOff = { ...entry("a1", "2026-11-01"), text: "**AL-2** (later: #54, some day): two client quotes with consent" };
    const inbox = buildInbox([source(KEY, [putOff])], NOW, ZONE, [answer({ issueNumber: 54, issueUrl: "https://forge.example.test/issues/54" })]);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "deferred", issueNumber: 54, issueUrl: null });
    expect(inbox.rows[0]?.previousAnswer).toBeNull();
    expect(inbox.unansweredCount).toBe(0);
  });

  it("does not read a later marker that is not the entry's own parenthesis", () => {
    const quoted = { ...entry("a1", "2026-11-01"), text: "Decide later: #4 stays open" };
    const inbox = buildInbox([source(KEY, [quoted])], NOW, ZONE);

    expect(inbox.rows[0]?.answer).toEqual({ kind: "open" });
    expect(inbox.deferredCount).toBe(0);
  });

  it("lists answers whose entry left the queue, or whose project is no longer watched, newest first", () => {
    const inbox = buildInbox([source(KEY, [entry("a2", "2026-11-11")], [issue(9, "closed", "a1")])], NOW, ZONE, [
      answer(),
      answer({ repositoryKey: "example-org/old-app", fullName: "example-org/old-app", entryId: "o1", entryText: "Old entry", answeredAt: new Date("2026-11-19T11:00:00Z"), issueNumber: 3, issueUrl: "https://forge.example.test/issues/3" }),
    ]);

    expect(inbox.history.map((row) => [row.projectName, row.entryText, row.done, row.answeredBy])).toEqual([
      ["example-org/old-app", "Old entry", false, "Ada Example"],
      [KEY, "Entry a1", true, "Ada Example"],
    ]);
    expect(inbox.rows.map((row) => row.answer.kind)).toEqual(["open"]);
  });

  it("tells two projects apart whose queues carry the same entry id and text (F-8)", () => {
    const beta = "example-org/beta-app";
    const shared = { ...entry("oq-shared", "2026-11-11"), text: "Start the queued roadmap later" };
    const recorded = answer({ repositoryKey: beta, fullName: beta, entryId: shared.id, entryText: shared.text, answer: "later" });

    const open = buildInbox([source(KEY, [shared]), source(beta, [shared])], NOW, ZONE, [recorded]);
    expect(open.rows.map((row) => [row.projectKey, row.answer.kind])).toEqual([
      [KEY, "open"],
      [beta, "sent"],
    ]);
    expect(open.unansweredCount).toBe(1);
    expect(open.history).toEqual([]);

    const markerInAlpha = buildInbox([source(KEY, [shared], [issue(4, "open", shared.id)]), source(beta, [shared])], NOW, ZONE);
    expect(markerInAlpha.rows.map((row) => [row.projectKey, row.answer.kind])).toEqual([
      [KEY, "sent"],
      [beta, "open"],
    ]);

    const left = buildInbox([source(KEY, []), source(beta, [])], NOW, ZONE, [
      recorded,
      answer({ entryId: shared.id, entryText: shared.text, issueNumber: 11, issueUrl: "https://forge.example.test/issues/11", answeredAt: new Date("2026-11-19T12:00:00Z") }),
    ]);
    expect(left.history.map((row) => [row.projectName, row.entryText, row.issueNumber])).toEqual([
      [KEY, shared.text, 11],
      [beta, shared.text, 9],
    ]);
  });
});
