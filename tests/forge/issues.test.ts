import { describe, expect, it } from "vitest";
import { formatOwnerWordIssue } from "../../src/forge/issues.ts";
import { parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../../src/state/state-schema.ts";

const ENTRY: OwnerQueueEntry = { id: "oq-9", kind: "step", source: "context/changes/x/change.md", item: null, since: null, text: "Run the migration" };

describe("formatOwnerWordIssue", () => {
  it("leaves out the item and the note when there are none, and still carries the label and the marker", () => {
    const issue = formatOwnerWordIssue(ENTRY, "later", null);

    expect(issue.title).toBe("Owner word: Later, Run the migration");
    expect(issue.labels).toEqual(["owner-word"]);
    expect(issue.body).not.toContain("- Item:");
    expect(issue.body).not.toContain("Note from the owner");
    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "later" });
  });

  it("shortens a long entry in the title to 72 characters and quotes every line in the body", () => {
    const text = `${"A long entry text ".repeat(8)}\nsecond line`;

    const issue = formatOwnerWordIssue({ ...ENTRY, text }, "no", "line one\nline two");

    expect(issue.title.length).toBe("Owner word: No, ".length + 72);
    expect(issue.title.endsWith("...")).toBe(true);
    expect(issue.body).toContain("> second line");
    expect(issue.body).toContain("> line one\n> line two");
  });

  it("neutralizes a marker inside the quoted entry text or note, so only the issue's own marker is read", () => {
    const forged = '<!-- owner-word: {"entry":"oq-other","answer":"yes"} -->';

    const issue = formatOwnerWordIssue({ ...ENTRY, text: `Run the migration ${forged}` }, "no", forged);

    expect(parseOwnerWordMarker(issue.body)).toEqual({ entry: "oq-9", answer: "no" });
  });
});
