import { describe, expect, it } from "vitest";
import { formatOwnerWordMarker, parseOwnerWordMarker } from "../../src/inbox/owner-word-marker.ts";

describe("the owner-word marker", () => {
  it("reads the entry and the answer from an issue body", () => {
    const body = `Answer: yes\n\n<!-- owner-word: {"entry": "oq-1a2b3c", "answer": "yes"} -->\n`;
    expect(parseOwnerWordMarker(body)).toEqual({ entry: "oq-1a2b3c", answer: "yes" });
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
