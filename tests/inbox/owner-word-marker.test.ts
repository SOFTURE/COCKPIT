import { describe, expect, it } from "vitest";
import { formatOwnerWordMarker, parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";

describe("the owner-word marker", () => {
  it("reads the entry and the answer from an issue body", () => {
    const body = `Answer: yes\n\n<!-- owner-word: {"entry": "oq-1a2b3c", "answer": "yes"} -->\n`;
    expect(parseOwnerWordMarker(body)).toEqual({ entry: "oq-1a2b3c", answer: "yes" });
  });

  it("reads the cockpit marker of @softure-ai/skills 0.39 and newer", () => {
    expect(parseOwnerWordMarker(`<!-- cockpit: {"entry": "oq-7", "answer": "no"} -->`)).toEqual({ entry: "oq-7", answer: "no" });
  });

  it("writes the cockpit marker by default and the owner-word one when asked", () => {
    const marker = { entry: "oq-9", answer: "later" } as const;
    expect(formatOwnerWordMarker(marker)).toBe('<!-- cockpit: {"entry":"oq-9","answer":"later"} -->');
    expect(formatOwnerWordMarker(marker, "owner-word")).toBe('<!-- owner-word: {"entry":"oq-9","answer":"later"} -->');
  });

  it("does not read the broadcast marker as an answer", () => {
    expect(parseOwnerWordMarker('<!-- cockpit-broadcast: {"id":"b-1"} -->')).toBeNull();
  });

  it("writes a marker it reads back", () => {
    const marker = { entry: "oq-9", answer: "later" } as const;
    expect(parseOwnerWordMarker(`text ${formatOwnerWordMarker(marker)}`)).toEqual(marker);
  });

  it.each(["no marker here", "<!-- owner-word: not json -->", '<!-- owner-word: {"entry": "x", "answer": "maybe"} -->', '<!-- owner-word: {"answer": "yes"} -->'])(
    "answers nothing for %j",
    (body) => {
      expect(parseOwnerWordMarker(body)).toBeNull();
    },
  );
});
