import { describe, expect, it } from "vitest";
import { formatAnswerMarker, parseAnswerMarker } from "../../src/inbox/answer-marker.ts";

describe("the cockpit answer marker", () => {
  it("reads the entry and the answer from an issue body", () => {
    const body = `Answer: yes\n\n<!-- cockpit: {"entry": "oq-1a2b3c", "answer": "yes"} -->\n`;
    expect(parseAnswerMarker(body)).toEqual({ entry: "oq-1a2b3c", answer: "yes" });
  });

  it("writes the cockpit marker", () => {
    expect(formatAnswerMarker({ entry: "oq-9", answer: "later" })).toBe('<!-- cockpit: {"entry":"oq-9","answer":"later"} -->');
  });

  it("does not read the broadcast marker as an answer", () => {
    expect(parseAnswerMarker('<!-- cockpit-broadcast: {"id":"b-1"} -->')).toBeNull();
  });

  it("writes a marker it reads back", () => {
    const marker = { entry: "oq-9", answer: "later" } as const;
    expect(parseAnswerMarker(`text ${formatAnswerMarker(marker)}`)).toEqual(marker);
  });

  it.each([
    "no marker here",
    "<!-- cockpit: not json -->",
    '<!-- cockpit: {"entry": "x", "answer": "maybe"} -->',
    '<!-- cockpit: {"answer": "yes"} -->',
    '<!-- decision: {"entry": "x", "answer": "yes"} -->',
  ])("answers nothing for %j", (body) => {
    expect(parseAnswerMarker(body)).toBeNull();
  });
});
