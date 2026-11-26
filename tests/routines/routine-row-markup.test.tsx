// A routine row (CT-22): the last call once, as one badge with its time on top of the right column; under it the
// on/off switch and the row menu on one line; no separate state icon and no "last call" detail line.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { RoutinesSection, type RoutineActions } from "../../src/routines/routines-section.tsx";
import type { RoutineView } from "../../src/routines/routines-tab.ts";
import { getResultBadge } from "../support/result-badge-markup.ts";

const AT = new Date("2026-11-25T21:04:00Z");
const MESSAGES = getMessages("en");
const STATE = Promise.resolve({ status: "idle" as const, message: "" });
const ACTIONS: RoutineActions = {
  add: () => STATE,
  replaceToken: () => STATE,
  test: () => STATE,
  setEnabled: () => Promise.resolve(),
  remove: () => Promise.resolve(),
  retry: () => Promise.resolve(),
};

function routine(overrides: Partial<RoutineView>): RoutineView {
  return {
    id: 7,
    name: "Coordinator",
    kind: "cockpit-issues",
    provider: "claude-code",
    target: "trig_example",
    tokenLast4: "7f3a",
    enabled: true,
    lastCall: null,
    ...overrides,
  };
}

function renderRows(routines: readonly RoutineView[], canStore = true): string {
  return renderToStaticMarkup(
    <RoutinesSection
      tab={{ routines, issues: [], canStore }}
      repositoryKey="example-org/alpha-app"
      fullName="example-org/alpha-app"
      messages={MESSAGES}
      actions={ACTIONS}
      formatTime={() => "21:04"}
    />,
  );
}

/** The markup of one part of the row, from its opening tag to the next sibling part. */
function slice(markup: string, from: string, to: string): string {
  const start = markup.indexOf(from);
  const end = markup.indexOf(to, start + from.length);
  expect(start).toBeGreaterThanOrEqual(0);
  return markup.slice(start, end === -1 ? undefined : end);
}

describe("a routine row", () => {
  it("shows a green badge with the result and time, alone on the first line of the right column", () => {
    const markup = renderRows([routine({ lastCall: { ok: true, status: 200, at: AT } })]);
    expect(markup.match(/data-last-call-badge=/g)).toHaveLength(1);
    const status = slice(markup, "data-row-status", "data-row-actions");
    const badge = getResultBadge(status, "data-last-call-badge", "ok");
    expect(badge.attributes["data-color"]).toBe("green");
    expect(badge.attributes.title).toBe("Last call succeeded");
    expect(status).toContain("HTTP 200 · 21:04");
    expect(status).not.toContain("<button");
  });

  it("shows a red badge on an error and a grey Never called before the first call", () => {
    const failed = getResultBadge(renderRows([routine({ lastCall: { ok: false, status: null, at: AT } })]), "data-last-call-badge", "failed");
    expect(failed.attributes["data-color"]).toBe("red");
    expect(failed.word).toContain("Error · 21:04");
    const never = getResultBadge(renderRows([routine({ lastCall: null })]), "data-last-call-badge", "never");
    expect(never.attributes["data-color"]).toBe("gray");
    expect(never.word).toBe("Never called");
  });

  it("says the state once: no state icon and no last-call detail, the enabled state only by the switch", () => {
    const markup = renderRows([routine({ lastCall: { ok: true, status: 200, at: AT } })]);
    expect(markup).not.toContain("data-routine-state");
    expect(markup).not.toContain("data-last-call=");
    expect(slice(markup, "data-row-identity", "data-row-side")).not.toMatch(/last call|21:04/i);
    expect(markup.match(/>Enabled</g)).toHaveLength(1);
    expect(markup).toContain("token ••••7f3a");
  });

  it("puts the switch and the row menu, and nothing else, on the controls line", () => {
    const markup = renderRows([routine({ enabled: false })]);
    const actions = slice(markup, "data-row-actions", "</li>");
    expect(actions).toContain("data-routine-controls");
    expect(actions).toMatch(/role="switch"[^>]*aria-checked="false"[^>]*aria-label="Routine Coordinator enabled"/);
    expect(actions).toContain(">Disabled</label>");
    expect(actions).toContain('aria-label="More actions for Coordinator"');
    // The switch and the menu's button; Test, Replace token and Delete wait in the menu.
    expect(actions.match(/<button/g)).toHaveLength(2);
    expect(actions).not.toContain(">Test<");
    expect(actions).not.toContain(">Replace token<");
    expect(actions).not.toContain("lucide-trash");
  });

  it("keeps the data attributes the e2e reads", () => {
    const markup = renderRows([routine({ lastCall: { ok: true, status: 200, at: AT } })]);
    for (const attribute of ['data-routine="7"', 'data-enabled="true"', "data-routine-switch", "data-token-last4", 'data-routine-provider="claude-code"']) {
      expect(markup).toContain(attribute);
    }
  });

  it("gives every row the same two lines", () => {
    const markup = renderRows([
      routine({ id: 1, lastCall: null }),
      routine({ id: 2, name: "Reviewer", lastCall: { ok: false, status: 503, at: AT } }),
    ]);
    expect(markup.match(/data-row-status=/g)).toHaveLength(2);
    expect(markup.match(/data-row-actions=/g)).toHaveLength(2);
    expect(markup).toContain("HTTP 503 · 21:04");
  });
});
