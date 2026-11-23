import { describe, expect, it } from "vitest";
import { formatOwnerWordIssue } from "../../src/forge/issues.ts";
import { parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../../src/state/state-schema.ts";

const ENTRY: OwnerQueueEntry = { id: "oq-9", kind: "step", source: "context/changes/x/change.md", item: null, since: null, text: "Run the migration" };

describe("formatOwnerWordIssue", () => {
  it("leaves out the item and the note when there are none, and still carries the label and the marker", () => {
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "later", note: null, answeredBy: null });

    expect(issue.title).toBe("Owner word: Later, Run the migration");
    expect(issue.labels).toEqual(["owner-word"]);
    expect(issue.body).not.toContain("- Item:");
    expect(issue.body).not.toContain("Note from the owner");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "later" });
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
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "yes", note: "Ship it", answeredBy: "Ada Example" });

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
    const issue = formatOwnerWordIssue({ entry: ENTRY, answer: "yes", note: null, answeredBy: "<b>*Eve*</b>" });

    expect(issue.body).toContain("**bEve/b** answers **Yes**");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "yes" });
  });
});
