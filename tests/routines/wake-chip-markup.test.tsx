// A fire reads only its state; the routine's name is in the tooltip (CT-13, F-12).
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { IssueWakeStatus } from "../../src/routines/wake-chip.tsx";
import type { FireView, IssueWake } from "../../src/routines/wake-view.ts";
import { getResultBadges } from "../support/result-badge-markup.ts";

const AT = new Date("2026-11-25T12:00:00Z");
const COPY = getMessages("en").wake;

function renderFires(fires: readonly FireView[]): string {
  const wake: IssueWake = { repositoryKey: "example-org/alpha-app", issueNumber: 7, fires, canRetry: false };
  return renderToStaticMarkup(
    <IssueWakeStatus wake={wake} copy={COPY} name="example-org/alpha-app" retryAction={() => Promise.resolve()} formatTime={(date) => date.toISOString()} />,
  );
}

/** The visible labels of the fires: the word after each result badge's icon. */
function getVisibleText(markup: string): string {
  return getResultBadges(markup)
    .map((badge) => badge.word)
    .join(" | ");
}

describe("a fire's status markup", () => {
  it("shows only the state of a fired routine and keeps the routine's name in the tooltip", () => {
    const markup = renderFires([{ routineName: "Coordinator", status: "sent", httpStatus: 200, reason: null, at: AT, nextAttemptAt: null }]);
    expect(getVisibleText(markup)).toBe("Routine fired");
    expect(markup).toContain('title="Coordinator: Routine fired"');
  });

  it("keeps the HTTP status and the reason of a failed fire, without the routine's name", () => {
    const markup = renderFires([{ routineName: "Coordinator", status: "failed", httpStatus: 503, reason: "server_error", at: AT, nextAttemptAt: null }]);
    expect(getVisibleText(markup)).toBe("Fire failed · HTTP 503 · API error");
    expect(markup).toContain('title="Coordinator: Fire failed · HTTP 503 · API error"');
  });

  it("reads No routine to fire when the project has no routine", () => {
    const markup = renderFires([{ routineName: null, status: "no_routine", httpStatus: null, reason: null, at: AT, nextAttemptAt: null }]);
    expect(getVisibleText(markup)).toBe("No routine to fire");
    expect(markup).toContain('title="No routine to fire"');
  });
});
