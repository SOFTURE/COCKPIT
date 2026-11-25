// An answered entry's state reads the same in the inbox, on the project page and in "Answered earlier" (CT-19): done
// green, sent, sending and put off gray, each with its own icon and word.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { AnswerStateBadge, type AnswerState } from "../../src/inbox/answer-state-badge.tsx";

const COPY = getMessages("en").inbox;

function render(state: AnswerState): string {
  return renderToStaticMarkup(<AnswerStateBadge state={state} copy={COPY} />);
}

describe("an answer state badge", () => {
  it("shows a done answer green with a check", () => {
    const markup = render("done");
    expect(markup).toContain('data-answer-state="done" data-result="success" data-tone="green"');
    expect(markup).toContain("lucide-circle-check");
    expect(markup).toContain(">Done</span>");
  });

  it("shows a sent, a sending and a put-off answer gray, each with its own icon", () => {
    expect(render("sent")).toContain('data-result="muted" data-tone="gray"');
    expect(render("sent")).toContain("lucide-send");
    expect(render("sending")).toContain("animate-spin");
    expect(render("deferred")).toContain("lucide-clock");
    expect(render("deferred")).toContain(">Put off</span>");
  });
});
