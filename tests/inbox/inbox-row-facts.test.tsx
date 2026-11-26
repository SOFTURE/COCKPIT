// CT-24: an inbox row says each fact once. Who answered and the answer's issue sit on the muted line on the left; the
// answer's state and the issue's fires on top of the right column, Retry under them; a put-off row's badge says
// "Put off" and its line names only the issue.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { stripDeferralMarker } from "../../src/inbox/answer-facts.tsx";
import { INITIAL_ANSWER_FORM_STATE } from "../../src/inbox/answer-form-state.ts";
import { AnsweredEarlierRow } from "../../src/inbox/answered-earlier-row.tsx";
import type { AnswerState, HistoryRow, InboxRow as InboxRowData } from "../../src/inbox/build-inbox.ts";
import { InboxRow } from "../../src/inbox/inbox-row.tsx";
import type { IssueWake } from "../../src/routines/wake-view.ts";
import { countText, getRowPart } from "../support/row-markup.ts";

const MESSAGES = getMessages("en");
const COPY = MESSAGES.inbox;
const ISSUE_URL = "https://forge.example.test/example-org/alpha-app/issues/12";
const FAILED_WAKE: IssueWake = {
  repositoryKey: "example-org/alpha-app",
  issueNumber: 12,
  fires: [{ routineName: "Coordinator", status: "failed", httpStatus: 500, reason: null, at: new Date("2026-11-25T10:00:00Z"), nextAttemptAt: null }],
  canRetry: true,
};

function row(answer: AnswerState, text = "Approve the alpha-app pricing page", wake: IssueWake | null = null): InboxRowData {
  return {
    projectKey: "example-org/alpha-app",
    projectName: "example-org/alpha-app",
    entry: { id: "oq-alpha-1", kind: "decision", source: "context/foundation/roadmap.md", item: "AL-2", since: "2026-11-20", text },
    ageDays: 5,
    answer,
    previousAnswer: null,
    wake,
  };
}

function render(data: InboxRowData, withWake = false): string {
  return renderToStaticMarkup(
    <InboxRow
      row={data}
      copy={COPY}
      answerAction={() => Promise.resolve(INITIAL_ANSWER_FORM_STATE)}
      wake={withWake ? { copy: MESSAGES.wake, retryAction: () => Promise.resolve(), formatTime: () => "11:00" } : undefined}
    />,
  );
}

const SENT: AnswerState = { kind: "sent", answer: "yes", issueNumber: 12, issueUrl: ISSUE_URL, answeredBy: "Alice Example" };

describe("an answered inbox row", () => {
  it("says who answered once, on the left", () => {
    const markup = render(row(SENT));
    expect(countText(markup, "by Alice Example")).toBe(1);
    expect(countText(getRowPart(markup, "identity"), "by Alice Example")).toBe(1);
    expect(countText(getRowPart(markup, "side"), "Alice")).toBe(0);
  });

  it("names the answer's issue once, as a link on the left", () => {
    const markup = render(row(SENT));
    expect(countText(markup, "issue #12")).toBe(1);
    expect(getRowPart(markup, "identity")).toContain(`href="${ISSUE_URL}"`);
    expect(getRowPart(markup, "side")).not.toContain("<a ");
  });

  it("shows its state once, as the badge on the right", () => {
    const markup = render(row(SENT));
    expect(countText(markup, "Sent")).toBe(1);
    expect(getRowPart(markup, "side")).toContain('data-answer-state="sent"');
  });

  it("puts the issue's fires on the state line and only Retry on the controls line", () => {
    const markup = render(row(SENT, undefined, FAILED_WAKE), true);
    const side = getRowPart(markup, "side");
    const status = side.slice(side.indexOf('data-slot="list-entry-status"'), side.indexOf('data-slot="list-entry-actions"'));
    const actions = side.slice(side.indexOf('data-slot="list-entry-actions"'));
    expect(status).toContain('data-fire="failed"');
    expect(actions).not.toContain("data-fire");
    expect(actions).toContain("Retry");
    expect(countText(markup, "Retry")).toBe(1);
  });

  it("leaves out who answered when nobody is recorded", () => {
    const markup = render(row({ ...SENT, answeredBy: null }));
    expect(countText(markup, "by ")).toBe(0);
    expect(countText(markup, "issue #12")).toBe(1);
  });
});

describe("a put-off inbox row", () => {
  const deferred = row({ kind: "deferred", issueNumber: 7, issueUrl: "https://forge.example.test/example-org/alpha-app/issues/7" }, "Decide the import format (later: #7)");

  it("says it is put off once, as its badge, never again as Later", () => {
    const markup = render(deferred);
    expect(countText(markup, "Put off")).toBe(1);
    expect(countText(markup, "Later ·")).toBe(0);
    expect(getRowPart(markup, "side")).toContain('data-answer-state="deferred"');
  });

  it("names its issue once, on the left, and not again in its title", () => {
    const markup = render(deferred);
    expect(countText(markup, "#7")).toBe(1);
    expect(countText(getRowPart(markup, "identity"), "Issue #7")).toBe(1);
    expect(countText(markup, "(later:")).toBe(0);
  });

  it("names an issue without a known address as text", () => {
    const markup = render(row({ kind: "deferred", issueNumber: 7, issueUrl: null }, "Decide the import format (later: #7)"));
    expect(countText(getRowPart(markup, "identity"), "Issue #7")).toBe(1);
    expect(markup).not.toContain('href="null"');
  });
});

describe("stripDeferralMarker", () => {
  it("drops a bare later marker at the end of the text", () => {
    expect(stripDeferralMarker("Decide the import format (later: #7)")).toBe("Decide the import format");
  });

  it("keeps a marker that says more than the issue", () => {
    expect(stripDeferralMarker("Decide the import format (later: #7, after the launch)")).toBe("Decide the import format (later: #7, after the launch)");
  });

  it("leaves a text without a marker as it is", () => {
    expect(stripDeferralMarker("Decide the import format")).toBe("Decide the import format");
  });
});

describe("an Answered earlier row", () => {
  const answer: HistoryRow = {
    projectName: "example-org/alpha-app",
    entryText: "Start the launch roadmap",
    entryKind: "word",
    answer: "yes",
    note: null,
    answeredBy: "Alice Example",
    answeredAt: new Date("2026-11-24T10:00:00Z"),
    issueNumber: 3,
    issueUrl: "https://forge.example.test/example-org/alpha-app/issues/3",
    done: false,
  };

  it("says who answered and its issue once, on the left, and has nothing but its state on the right", () => {
    const markup = renderToStaticMarkup(<AnsweredEarlierRow answer={answer} copy={COPY} />);
    expect(countText(markup, "by Alice Example")).toBe(1);
    expect(countText(markup, "issue #3")).toBe(1);
    const side = getRowPart(markup, "side");
    expect(side).toContain('data-answer-state="sent"');
    expect(side).not.toContain('data-slot="list-entry-actions"');
    expect(side).not.toContain("Alice");
  });
});
