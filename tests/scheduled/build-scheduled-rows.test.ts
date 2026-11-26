import { describe, expect, it } from "vitest";
import type { StoredSend } from "../../modules/projects/broadcasts.ts";
import type { StoredScheduledTask } from "../../modules/projects/scheduled-tasks.ts";
import { buildDoneRow, buildScheduledRow, getPromptLine, getRunResult, groupSendsByBroadcast } from "../../src/scheduled/build-scheduled-rows.ts";

const RUN_AT = new Date("2026-11-30T07:00:00Z");
const SENT_AT = new Date("2026-11-30T07:00:40Z");
const BROADCAST = "00000000-0000-4000-8000-00000000b001";

function task(overrides: Partial<StoredScheduledTask> = {}): StoredScheduledTask {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Weekly code quality check",
    prompt: "\n  Run the code review on master.  \nThen file what you find.",
    repositoryKeys: ["example-org/alpha-app", "example-org/beta-app"],
    runAt: RUN_AT,
    status: "scheduled",
    broadcastId: null,
    claimedAt: null,
    sentAt: null,
    skippedKeys: [],
    failure: null,
    createdBy: "user-1",
    createdByName: null,
    createdAt: new Date("2026-11-26T10:00:00Z"),
    updatedAt: new Date("2026-11-26T10:00:00Z"),
    ...overrides,
  };
}

function send(status: StoredSend["status"], key: string, broadcastId = BROADCAST): StoredSend {
  return {
    id: key.length,
    broadcastId,
    repositoryKey: key,
    fullName: key,
    status,
    failure: status === "failed" ? "forge_refused" : null,
    failureToken: null,
    issueNumber: status === "sent" ? 7 : null,
    issueUrl: null,
    updatedAt: SENT_AT,
  };
}

const fired = (status: "sent" | "failed", failure: string | null = null) =>
  task({ status, broadcastId: BROADCAST, claimedAt: SENT_AT, sentAt: SENT_AT, failure });

describe("the first prompt line", () => {
  it("skips blank lines and trims the first line that says something", () => {
    expect(getPromptLine("\n  Run the code review on master.  \nThen file.")).toBe("Run the code review on master.");
  });

  it("is empty for a prompt of blank lines", () => {
    expect(getPromptLine("\n \n")).toBe("");
  });
});

describe("a scheduled row", () => {
  it("counts the projects, takes the first prompt line, keeps the planned time and what Edit starts from", () => {
    expect(buildScheduledRow(task())).toEqual({
      id: task().id,
      title: "Weekly code quality check",
      projectCount: 2,
      promptLine: "Run the code review on master.",
      prompt: "\n  Run the code review on master.  \nThen file what you find.",
      repositoryKeys: ["example-org/alpha-app", "example-org/beta-app"],
      runAt: RUN_AT,
      isSending: false,
    });
  });

  it("marks a task being sent, which takes neither Run now nor Delete", () => {
    expect(buildScheduledRow(task({ status: "sending" })).isSending).toBe(true);
  });
});

describe("the result of a run", () => {
  it("is sent with every send made", () => {
    expect(getRunResult(fired("sent"), [send("sent", "a"), send("sent", "b")])).toEqual({ kind: "sent", sent: 2, total: 2 });
  });

  it("is failed when any send failed, counting the failures", () => {
    expect(getRunResult(fired("sent"), [send("failed", "a"), send("sent", "b"), send("failed", "c")])).toEqual({ kind: "failed", failed: 2, total: 3 });
  });

  it("is sending while a send is still being created", () => {
    expect(getRunResult(fired("sent"), [send("creating", "a"), send("sent", "b")])).toEqual({ kind: "sending" });
  });

  it("is not sent, with its reason, for a failed run that made no send", () => {
    expect(getRunResult(fired("failed", "no_projects"), [])).toEqual({ kind: "not_sent", failure: "no_projects" });
  });
});

describe("a done row", () => {
  it("opens the run's broadcast and shows the sent time", () => {
    const row = buildDoneRow(fired("sent"), groupSendsByBroadcast([send("sent", "a"), send("sent", "b"), send("sent", "z", "other")]));
    expect(row).toEqual({
      id: task().id,
      title: "Weekly code quality check",
      projectCount: 2,
      runAt: RUN_AT,
      sentAt: SENT_AT,
      result: { kind: "sent", sent: 2, total: 2 },
      href: `/broadcast/${BROADCAST}`,
    });
  });

  it("opens nothing when the run made no broadcast", () => {
    const row = buildDoneRow(fired("failed", "no_projects"), new Map());
    expect(row.href).toBeNull();
    expect(row.result).toEqual({ kind: "not_sent", failure: "no_projects" });
  });
});
