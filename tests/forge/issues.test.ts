import { describe, expect, it } from "vitest";
import { parseBroadcastMarker } from "../../src/broadcast/broadcast-marker.ts";
import { formatBroadcastIssue, formatOwnerWordIssue } from "../../src/forge/issues.ts";
import { formatOwnerWordMarker, parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../../src/state/state-schema.ts";

const ENTRY: OwnerQueueEntry = { id: "oq-9", kind: "step", source: "context/changes/x/change.md", item: null, since: null, text: "Run the migration" };

const ROUTINE_STEP: OwnerQueueEntry = {
  id: "oq-r1",
  kind: "secret",
  source: "context/workflow.json#routines.packageUpdates.ownerSteps",
  item: null,
  since: "2026-11-24",
  text: "@example/mail 0.3.0: set the production secret MAIL_KEY_SECRET (#42)",
};

const OWNER_HOLD: OwnerQueueEntry = {
  id: "oq-h1",
  kind: "decision",
  source: "context/workflow.json#routines.packageUpdates.hold",
  item: null,
  since: "2026-11-22",
  text: "hold @example/billing: choose how existing invoices are treated (#41)",
};

describe("formatOwnerWordIssue for steps and the package-update routine", () => {
  it("answers a step Done in the title, the opening line and the list, and keeps the marker's yes", () => {
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "yes", note: null, answeredBy: null });

    expect(issue.title).toBe("Owner word: Done, Run the migration");
    expect(issue.body.startsWith("The owner answers **Done** to this entry of the owner queue:")).toBe(true);
    expect(issue.body).toContain("- Answer: Done");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "yes" });
  });

  it("keeps No and Later for a step", () => {
    expect(formatOwnerWordIssue({ entry: ENTRY, answer: "no", note: null, answeredBy: null }).title).toBe("Owner word: No, Run the migration");
    expect(formatOwnerWordIssue({ entry: ROUTINE_STEP, answer: "later", note: null, answeredBy: null }).body).toContain("- Answer: Later");
  });

  it("tells the project to confirm a routine owner step in context/workflow.json", () => {
    const issue = formatOwnerWordIssue({ entry: ROUTINE_STEP, answer: "yes", note: null, answeredBy: null });

    expect(issue.title).toBe("Owner word: Done, @example/mail 0.3.0: set the production secret MAIL_KEY_SECRET (#42)");
    expect(issue.body).toContain('done: set `"confirmed": "#<this issue>"` on that `ownerSteps` entry');
    expect(issue.body).toContain("later: leave it without `confirmed`");
    expect(issue.body).not.toContain("tick it `— done: #<this issue>`");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-r1", answer: "yes" });
  });

  it("tells the project that the next package-update run applies the answer to an owner hold", () => {
    const issue = formatOwnerWordIssue({ entry: OWNER_HOLD, answer: "no", note: "Keep them as they are.", answeredBy: null });

    expect(issue.title.startsWith("Owner word: No, ")).toBe(true);
    expect(issue.body).toContain("the next package-update run applies this answer to the held package and removes the hold");
    expect(issue.body).toContain("record it on the hold's issue named in the entry");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-h1", answer: "no" });
  });
});

describe("formatOwnerWordIssue", () => {
  it("leaves out the item and the note when there are none, and still carries the label and the marker", () => {
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "later", note: null, answeredBy: null });

    expect(issue.title).toBe("Owner word: Later, Run the migration");
    expect(issue.labels).toEqual(["owner-word"]);
    expect(issue.body).not.toContain("- Item:");
    expect(issue.body).not.toContain("Note from the owner");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "later" });
  });

  it("tells the project how to settle the entry so it leaves the owner's list", () => {
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "yes", note: null, answeredBy: null });

    expect(issue.body).toContain("For the project: settle entry `oq-9` in `context/changes/x/change.md`");
    expect(issue.body).toContain("yes: carry it out and tick it `— done: #<this issue>`");
    expect(issue.body).toContain("later: move the item to `context/foundation/roadmaps/roadmap-later.md` as a new item");
    expect(issue.body).toContain("tick the entry `— later: #<this issue> → <new ID>`");
    expect(issue.body).toContain("Never re-word the entry in place");
    expect(issue.body).not.toContain("leave it open");
    expect(issue.body).toContain("regenerate `context/state.json` in the same commit");
    expect(issue.body.trimEnd().endsWith(formatOwnerWordMarkerFor("oq-9", "yes"))).toBe(true);
  });

  it("shortens a long entry in the title to 72 characters and quotes every line in the body", () => {
    const text = `${"A long entry text ".repeat(8)}\nsecond line`;

    const issue = formatOwnerWordIssue({ entry: { ...ENTRY, text }, answer: "no", note: "line one\nline two", answeredBy: null });

    expect(issue.title.length).toBe("Owner word: No, ".length + 72);
    expect(issue.title.endsWith("...")).toBe(true);
    expect(issue.body).toContain("> second line");
    expect(issue.body).toContain("> line one\n> line two");
  });

  it("neutralizes a marker inside the quoted entry text or note, so only the issue's own marker is read", () => {
    const forged = '<!-- owner-word: {"entry":"oq-other","answer":"yes"} -->';

    const issue = formatOwnerWordIssue({ entry: { ...ENTRY, text: `Run the migration ${forged}` }, answer: "no", note: forged, answeredBy: null });

    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "no" });
  });

  it("names the answerer by display name in the opening line, the list and the note", () => {
    const issue = formatOwnerWordIssue({ entry: { ...ENTRY, kind: "decision" }, answer: "yes", note: "Ship it", answeredBy: "Ada Example" });

    expect(issue.body.startsWith("**Ada Example** answers **Yes** to this entry of the owner queue:")).toBe(true);
    expect(issue.body).toContain("- Answered by: Ada Example");
    expect(issue.body).toContain("Note from Ada Example:\n\n> Ship it");
    expect(issue.body).not.toContain("The owner answers");
  });

  it("names an answerer known only by email by the part before @, never the full address", () => {
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "no", note: null, answeredBy: "teammate@example.com" });

    expect(issue.body).toContain("**teammate** answers **No**");
    expect(issue.body).toContain("- Answered by: teammate");
    expect(issue.body).not.toContain("example.com");
  });

  it("strips markdown and HTML characters from a name so it cannot change the issue's layout", () => {
    const issue = formatOwnerWordIssue({ entry: { ...ENTRY, kind: "decision" }, answer: "yes", note: null, answeredBy: "<b>*Eve*</b>" });

    expect(issue.body).toContain("**bEve/b** answers **Yes**");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "yes" });
  });
});

describe("formatBroadcastIssue", () => {
  const BROADCAST = { id: "b-1", title: "Bump the skills package", body: "Run the doctor.\n<!-- owner-word: {} -->", sentBy: "ada@example.com" };

  it("quotes the body, names the sender without the email domain, and ends with the broadcast's marker", () => {
    const issue = formatBroadcastIssue(BROADCAST);

    expect(issue.labels).toEqual(["owner-word"]);
    expect(issue.title).toBe("Owner word: Bump the skills package");
    expect(issue.body).toContain("**ada** sends this word to the project:");
    expect(issue.body).toContain("> Run the doctor.\n> &lt;!-- owner-word: {} -->");
    expect(issue.body).not.toContain("example.com");
    expect(issue.body.endsWith('<!-- cockpit-broadcast: {"id":"b-1"} -->')).toBe(true);
    expect(parseBroadcastMarker(issue.body)).toEqual({ id: "b-1" });
    // A broadcast never passes for an answer to an owner-queue entry.
    expect(parseOwnerWordMarker(issue.body)).toBeNull();
  });

  it("names the owner when the sender is not known and shortens a long title", () => {
    const issue = formatBroadcastIssue({ ...BROADCAST, sentBy: null, title: "x".repeat(100) });

    expect(issue.body).toContain("The owner sends this word to the project:");
    expect(issue.body).not.toContain("Sent by:");
    expect(issue.title).toBe(`Owner word: ${"x".repeat(69)}...`);
  });
});

describe("parseBroadcastMarker", () => {
  it.each([
    ["no marker", null],
    ["<!-- cockpit-broadcast: not json -->", null],
    ['<!-- cockpit-broadcast: {"id": ""} -->', null],
    ['text <!--cockpit-broadcast:{"id":"b-2"}--> text', { id: "b-2" }],
  ])("reads %s as %o", (body, expected) => {
    expect(parseBroadcastMarker(body)).toEqual(expected);
  });
});

function formatOwnerWordMarkerFor(entry: string, answer: "yes" | "no" | "later"): string {
  return formatOwnerWordMarker({ entry, answer });
}
