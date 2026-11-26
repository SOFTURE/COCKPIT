// A Broadcast project row (CT-23): a row with two or more controls shows one inline control plus the row menu on its
// actions line; a row with one control keeps it inline, with no menu. The menu's items are pinned by the menu's
// trigger only here (its content renders once opened); opening and running them is in the Broadcast e2e.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import type { SendView } from "../../src/broadcast/build-broadcast-view.ts";
import { SendRow } from "../../src/broadcast/send-row.tsx";
import type { IssueWake } from "../../src/routines/wake-view.ts";

const MESSAGES = getMessages("en");
const AT = new Date("2026-11-25T21:04:00Z");
const ACTIONS = { retryFire: () => Promise.resolve(), retrySend: () => Promise.resolve() };

function wake(canRetry: boolean): IssueWake {
  return {
    repositoryKey: "example-org/alpha-app",
    issueNumber: 4,
    fires: [{ routineName: null, status: canRetry ? "no_routine" : "sent", httpStatus: null, reason: null, at: AT, nextAttemptAt: null }],
    canRetry,
  };
}

function send(overrides: Partial<SendView>): SendView {
  return {
    key: "example-org/alpha-app",
    fullName: "example-org/alpha-app",
    state: "sent",
    issueNumber: 4,
    issueUrl: "https://forge.example.test/example-org/alpha-app/issues/4",
    failure: null,
    failureToken: null,
    failedAt: null,
    wake: null,
    ...overrides,
  };
}

function render(view: SendView): string {
  return renderToStaticMarkup(
    <ul>
      <SendRow broadcastId="b-1" send={view} messages={MESSAGES} actions={ACTIONS} formatTime={() => "21:04"} />
    </ul>,
  );
}

/** The actions line of the right column: from its opening tag to the end of the row. */
function actionsLine(markup: string): string {
  const start = markup.indexOf('data-slot="list-entry-actions"');
  expect(start).toBeGreaterThanOrEqual(0);
  return markup.slice(start);
}

/** How many controls the line holds: links, buttons (the menu's trigger counts as one) and nothing else. */
function countControls(line: string): number {
  return (line.match(/<(a|button)\b/g) ?? []).length;
}

describe("a broadcast project row", () => {
  it("keeps the Issue link inline and puts Retry the fire in the menu when both are there", () => {
    const line = actionsLine(render(send({ wake: wake(true) })));
    expect(countControls(line)).toBe(2);
    expect(line).toMatch(/<a[^>]*href="https:\/\/forge\.example\.test\/example-org\/alpha-app\/issues\/4"[^>]*rel="noreferrer"[^>]*target="_blank"/);
    expect(line).toContain("Issue #4");
    expect(line).toContain('aria-label="More actions for example-org/alpha-app"');
    expect(line).toContain("data-row-actions-menu");
    // The fire's Retry is not on the row itself.
    expect(line).not.toContain("Retry waking");
    // The inline control comes first, the menu's button after it, in the theme row's menu slot (CT-26).
    expect(line.indexOf("Issue #4")).toBeLessThan(line.indexOf('data-slot="list-entry-menu"'));
    expect(line.slice(line.indexOf('data-slot="list-entry-menu"'))).toContain("data-row-actions-menu");
  });

  it("keeps Retry send inline and the Issue and the fire in the menu when all three are there", () => {
    const line = actionsLine(render(send({ state: "sending", wake: wake(true) })));
    expect(countControls(line)).toBe(2);
    expect(line).toContain('aria-label="Retry example-org/alpha-app"');
    expect(line).toContain('<input type="hidden" name="broadcastId" value="b-1"/>');
    expect(line).toContain('<input type="hidden" name="repository" value="example-org/alpha-app"/>');
    expect(line).not.toContain("Issue #4");
    expect(line).toContain("data-row-actions-menu");
  });

  it("keeps a single Issue link inline, with no menu", () => {
    const line = actionsLine(render(send({ wake: wake(false) })));
    expect(countControls(line)).toBe(1);
    expect(line).toContain("Issue #4");
    expect(line).not.toContain("data-row-actions-menu");
  });

  it("keeps a single Retry send inline on a failed project, with no menu", () => {
    const line = actionsLine(
      render(send({ state: "failed", issueNumber: null, issueUrl: null, failure: "label_missing", failedAt: AT })),
    );
    expect(countControls(line)).toBe(1);
    expect(line).toContain('aria-label="Retry example-org/alpha-app"');
    expect(line).not.toContain("data-row-actions-menu");
  });

  it("keeps a single Retry fire inline as its form, with no menu", () => {
    const line = actionsLine(render(send({ issueUrl: null, wake: wake(true) })));
    expect(countControls(line)).toBe(1);
    expect(line).toContain('aria-label="Retry waking example-org/alpha-app for issue #4"');
    expect(line).toContain('<input type="hidden" name="repositoryKey" value="example-org/alpha-app"/>');
    expect(line).toContain('<input type="hidden" name="issueNumber" value="4"/>');
    expect(line).not.toContain("data-row-actions-menu");
  });

  it("has no actions line when there is nothing to do, and keeps the send line's selector", () => {
    const markup = render(send({ issueNumber: null, issueUrl: null }));
    expect(markup).not.toContain('data-slot="list-entry-actions"');
    expect(markup).toContain("data-send-line");
    expect(markup).toContain('data-send-row="example-org/alpha-app"');
  });
});
