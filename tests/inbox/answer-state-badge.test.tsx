// An answered entry's state reads the same in the inbox, on the project page and in "Answered earlier" (CT-19): done
// green, sent, sending and put off gray, each with its own icon and word.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { AnswerStateBadge, type AnswerState } from "../../src/inbox/answer-state-badge.tsx";
import { getResultBadge } from "../support/result-badge-markup.ts";

const COPY = getMessages("en").inbox;

function render(state: AnswerState) {
  return getResultBadge(renderToStaticMarkup(<AnswerStateBadge state={state} copy={COPY} />), "data-answer-state", state);
}

describe("an answer state badge", () => {
  it("shows a done answer green with a check", () => {
    const badge = render("done");
    expect(badge.attributes["data-tone"]).toBe("success");
    expect(badge.attributes["data-color"]).toBe("green");
    expect(badge.icon).toBe("circle-check");
    expect(badge.word).toBe("Done");
  });

  it("shows a sent, a sending and a put-off answer gray, each with its own icon", () => {
    for (const state of ["sent", "sending", "deferred"] as const) {
      expect(render(state).attributes["data-color"]).toBe("gray");
    }
    expect(render("sent").icon).toBe("send");
    expect(render("sending").isSpinning).toBe(true);
    expect(render("deferred").icon).toBe("clock");
    expect(render("deferred").word).toBe("Put off");
  });
});
