// A Recent fires row: title and fire time on the left, a coloured state badge and Retry on the right (CT-15).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { FiredIssueRow } from "../../src/routines/fired-issue-row.tsx";
import type { FiredIssue, FiredIssueState } from "../../src/routines/routines-tab.ts";
import type { FireView } from "../../src/routines/wake-view.ts";
import { getResultBadge } from "../support/result-badge-markup.ts";

const AT = new Date("2026-11-25T12:00:00Z");
const MESSAGES = getMessages("en");

function renderRow(state: FiredIssueState, fires: readonly FireView[], canRetry: boolean): string {
  const issue: FiredIssue = {
    number: 77,
    title: "COCKPIT command: Test",
    url: "https://github.com/example-org/alpha-app/issues/77",
    firedAt: AT,
    state,
    wake: { repositoryKey: "example-org/alpha-app", issueNumber: 77, fires, canRetry },
  };
  return renderToStaticMarkup(
    <FiredIssueRow issue={issue} messages={MESSAGES} name="example-org/alpha-app" retryAction={() => Promise.resolve()} formatTime={() => "25 Nov, 13:00"} />,
  );
}

const SENT: FireView = { routineName: "Coordinator", status: "sent", httpStatus: 200, reason: null, at: AT, nextAttemptAt: null };
const FAILED: FireView = { routineName: "Coordinator", status: "failed", httpStatus: 503, reason: "server_error", at: AT, nextAttemptAt: null };
const NONE: FireView = { routineName: null, status: "no_routine", httpStatus: null, reason: null, at: AT, nextAttemptAt: null };

describe("a Recent fires row", () => {
  it("shows the issue, the fire's time and a green Fired badge with the routine in its tooltip, and no Retry", () => {
    const markup = renderRow("fired", [SENT], false);
    expect(markup).toContain(">#77 COCKPIT command: Test</a>");
    expect(markup).toContain(">fired 25 Nov, 13:00</span>");
    const badge = getResultBadge(markup, "data-fired-badge", "fired");
    expect(badge.attributes["data-color"]).toBe("green");
    expect(badge.attributes.title).toBe("Coordinator: Routine fired");
    expect(badge.word).toBe("Fired");
    expect(markup).not.toContain("Retry");
  });

  it("shows a red Failed badge with the reason in its tooltip, and Retry", () => {
    const markup = renderRow("failed", [FAILED], true);
    const badge = getResultBadge(markup, "data-fired-badge", "failed");
    expect(badge.attributes["data-color"]).toBe("red");
    expect(badge.attributes.title).toBe("Coordinator: Fire failed · HTTP 503 · API error");
    expect(badge.word).toBe("Failed");
    expect(markup).toContain('aria-label="Retry waking example-org/alpha-app for issue #77"');
  });

  it("shows a grey No routine badge", () => {
    const markup = renderRow("no_routine", [NONE], true);
    const badge = getResultBadge(markup, "data-fired-badge", "no_routine");
    expect(badge.attributes["data-color"]).toBe("gray");
    expect(badge.attributes.title).toBe("No routine to fire");
    expect(badge.word).toBe("No routine");
  });
});
