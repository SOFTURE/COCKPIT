import { describe, expect, it } from "vitest";
import { buildInbox } from "../../src/inbox/build-inbox.ts";
import { toInboxAnswer, toOverviewAnswer, toProjectDetailAnswer } from "../../src/mcp/answers.ts";
import { buildOverview } from "../../src/overview/build-overview.ts";
import { buildFixtureInbox, buildFixtureOverview, FIXTURE_NOW, HOSTILE_TEXT } from "./cockpit-fixture.ts";

describe("the MCP answers", () => {
  const inbox = buildFixtureInbox();
  const overview = buildFixtureOverview(inbox);

  it("answers the overview with every project in the screen's groups and numbers", () => {
    const answer = toOverviewAnswer(overview);
    expect(answer.projectCount).toBe(2);
    expect(answer.groups.map((group) => group.status)).toEqual(overview.groups.map((group) => group.status));
    const alpha = answer.groups.flatMap((group) => group.projects).find((project) => project.project === "example-org/alpha-app");
    expect(alpha).toEqual({
      project: "example-org/alpha-app",
      status: "waiting",
      brokenReasons: [],
      read: { status: "ok", at: "2026-11-10T11:30:00.000Z" },
      numbers: { activeRoadmap: { slug: "alpha-v1", title: "Alpha v1", done: 1, total: 3 }, queued: 0, openChanges: 0, waiting: 2, unanswered: 2 },
      release: { version: "v0.4.1", date: "2026-11-03", source: "release" },
      ci: { kind: "run", result: "passed", url: "https://forge.example.test/run/1", at: "2026-11-10T10:00:00Z", pullRequest: null },
      qualityReview: { kind: "none" },
      doctor: { kind: "ok", url: null },
    });
  });

  it("answers the inbox oldest first with the unanswered count, as the screen lists it", () => {
    const answer = toInboxAnswer(inbox);
    expect(answer.unansweredCount).toBe(2);
    expect(answer.entries).toEqual([
      {
        project: "example-org/alpha-app",
        id: "oq-1a2b3c",
        kind: "decision",
        text: HOSTILE_TEXT,
        item: "AL-2",
        source: "context/foundation/roadmap.md",
        since: "2026-11-01",
        ageDays: 9,
        answer: { kind: "open" },
        previousAnswer: null,
      },
      expect.objectContaining({ id: "oq-4d5e6f", kind: "secret", ageDays: 2 }),
    ]);
    expect(answer.history).toEqual([]);
  });

  it("answers an empty inbox and overview when nothing is watched", () => {
    const empty = buildInbox([], FIXTURE_NOW, "Europe/Warsaw");
    expect(toInboxAnswer(empty)).toEqual({ unansweredCount: 0, entries: [], history: [] });
    const nothing = buildOverview({ projects: [], reads: [], facts: [], unansweredByKey: new Map(), now: FIXTURE_NOW });
    expect(toOverviewAnswer(nothing)).toEqual({ projectCount: 0, groups: [] });
  });

  it("answers one project's row and only its entries, whatever the letter case", () => {
    const detail = toProjectDetailAnswer(overview, inbox, " Example-Org/Alpha-App ");
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.project.project).toBe("example-org/alpha-app");
    expect(detail.value.entries.map((entry) => entry.id)).toEqual(["oq-1a2b3c", "oq-4d5e6f"]);
    const beta = toProjectDetailAnswer(overview, inbox, "example-org/beta-app");
    expect(beta.ok && beta.value.entries).toEqual([]);
  });

  it("refuses a malformed name and a project nobody watches", () => {
    expect(toProjectDetailAnswer(overview, inbox, "alpha-app")).toEqual({ ok: false, error: "mcp.project_invalid" });
    expect(toProjectDetailAnswer(overview, inbox, "example-org/omega-app")).toEqual({ ok: false, error: "mcp.project_unknown" });
  });
});
