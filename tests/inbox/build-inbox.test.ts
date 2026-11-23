import { describe, expect, it } from "vitest";
import { buildInbox, type InboxSource } from "../../src/inbox/build-inbox.ts";
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
    expect(inbox.rows[0]?.answer).toEqual({ kind: "sent", answer: "yes", issueNumber: 4, issueUrl: "https://forge.example.test/issues/4" });
    expect(inbox.unansweredCount).toBe(1);
  });

  it("is empty for projects without a stored state", () => {
    expect(buildInbox([{ key: "x/y", fullName: "x/y", state: null, issues: [] }], NOW, ZONE)).toEqual({ rows: [], unansweredCount: 0 });
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
