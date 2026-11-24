import { describe, expect, it } from "vitest";
import { en } from "../../messages/en.ts";
import { pl } from "../../messages/pl.ts";
import { getAnswerLabel, isStepKind } from "../../src/inbox/answer-label.ts";

describe("getAnswerLabel", () => {
  it.each(["step", "secret"] as const)("reads yes as Done for a %s entry", (kind) => {
    expect(getAnswerLabel(en.inbox, kind, "yes")).toBe("Done");
    expect(getAnswerLabel(pl.inbox, kind, "yes")).toBe("Zrobione");
  });

  it.each(["word", "decision"] as const)("keeps Yes for a %s entry", (kind) => {
    expect(getAnswerLabel(en.inbox, kind, "yes")).toBe("Yes");
  });

  it("keeps No and Later for a step, and Yes when the kind is not known", () => {
    expect(getAnswerLabel(en.inbox, "step", "no")).toBe("No");
    expect(getAnswerLabel(en.inbox, "secret", "later")).toBe("Later");
    expect(getAnswerLabel(en.inbox, null, "yes")).toBe("Yes");
  });

  it("treats only steps and secrets as steps", () => {
    expect([isStepKind("step"), isStepKind("secret"), isStepKind("decision"), isStepKind("word"), isStepKind(null)]).toEqual([true, true, false, false, false]);
  });
});
