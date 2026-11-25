import { describe, expect, it } from "vitest";
import type { StoredBroadcast, StoredSend } from "../../modules/projects/broadcasts.ts";
import type { StoredFire } from "../../modules/projects/routines.ts";
import { buildBroadcastView } from "../../src/broadcast/build-broadcast-view.ts";

const BROADCAST: StoredBroadcast = {
  id: "b-1",
  title: "Bump the skills package",
  body: "Run the doctor.",
  sentBy: "user-1",
  sentByName: "Ada Example",
  createdAt: new Date("2026-11-02T09:00:00Z"),
};

function send(repositoryKey: string, values: Partial<StoredSend>): StoredSend {
  return {
    id: 1,
    broadcastId: "b-1",
    repositoryKey,
    fullName: repositoryKey,
    status: "sent",
    failure: null,
    failureToken: null,
    issueNumber: 4,
    issueUrl: `https://forge.example.test/${repositoryKey}/issues/4`,
    updatedAt: BROADCAST.createdAt,
    ...values,
  };
}

describe("buildBroadcastView", () => {
  it("shows sent, done once the scan saw the issue closed, failed with its reason, and sending", () => {
    const view = buildBroadcastView(
      BROADCAST,
      [
        send("example-org/alpha-app", {}),
        send("example-org/beta-app", {}),
        send("example-org/gamma-app", { status: "failed", failure: "label_missing", issueNumber: null, issueUrl: null }),
        send("example-org/delta-app", { status: "creating", issueNumber: null, issueUrl: null }),
        send("example-org/other-app", { broadcastId: "b-2" }),
      ],
      [
        { key: "example-org/alpha-app", issues: [{ number: 4, state: "open", body: "", url: "" }] },
        { key: "example-org/beta-app", issues: [{ number: 3, state: "open" }, { number: 4, state: "closed" }, "garbage"] },
        { key: "example-org/gamma-app", issues: "not a list" },
      ],
    );

    expect(view.sends.map((row) => [row.key, row.state, row.failure])).toEqual([
      ["example-org/alpha-app", "sent", null],
      ["example-org/beta-app", "done", null],
      ["example-org/gamma-app", "failed", "label_missing"],
      ["example-org/delta-app", "sending", null],
    ]);
    expect(view.counts).toEqual({ sending: 1, sent: 1, done: 1, failed: 1 });
  });

  it("names the refused token and the last try on a failed send only (#85)", () => {
    const triedAt = new Date("2026-11-02T09:05:00Z");
    const view = buildBroadcastView(
      BROADCAST,
      [
        send("example-org/alpha-app", { status: "failed", failure: "forge_refused", failureToken: "FORGE_EXTRA_TOKENS[1]", issueNumber: null, issueUrl: null, updatedAt: triedAt }),
        send("example-org/beta-app", { status: "failed", failure: "forge_unavailable", issueNumber: null, issueUrl: null, updatedAt: triedAt }),
        send("example-org/gamma-app", { failureToken: "FORGE_TOKEN" }),
      ],
      [],
    );

    expect(view.sends.map((row) => [row.key, row.failureToken, row.failedAt])).toEqual([
      ["example-org/alpha-app", "FORGE_EXTRA_TOKENS[1]", triedAt],
      ["example-org/beta-app", null, triedAt],
      ["example-org/gamma-app", null, null],
    ]);
  });

  it("reads an unknown failure reason as the forge not answering", () => {
    const view = buildBroadcastView(BROADCAST, [send("example-org/alpha-app", { status: "failed", failure: "something_new", issueNumber: null, issueUrl: null })], []);

    expect(view.sends[0]?.failure).toBe("forge_unavailable");
  });

  it("shows the routine fires of each project's issue, and none for an issue without recorded fires (CT-10)", () => {
    const at = BROADCAST.createdAt;
    const fire = (repositoryKey: string, values: Partial<StoredFire>): StoredFire => ({
      id: 1,
      repositoryKey,
      fullName: repositoryKey,
      issueNumber: 4,
      issueUrl: `https://forge.example.test/${repositoryKey}/issues/4`,
      issueTitle: "COCKPIT command: Bump the skills package",
      routineId: 7,
      routineName: "Coordinator",
      status: "sent",
      httpStatus: 200,
      reason: null,
      attempts: 1,
      nextAttemptAt: null,
      createdAt: at,
      updatedAt: at,
      ...values,
    });
    const view = buildBroadcastView(
      BROADCAST,
      [send("example-org/alpha-app", {}), send("example-org/beta-app", {}), send("example-org/gamma-app", {})],
      [],
      [
        fire("example-org/alpha-app", {}),
        fire("example-org/beta-app", { status: "failed", httpStatus: 401, reason: "unauthorized" }),
        fire("example-org/beta-app", { issueNumber: 9 }),
      ],
    );

    expect(view.sends.map((row) => row.wake?.fires.map((one) => one.status) ?? null)).toEqual([["sent"], ["failed"], null]);
    expect(view.sends.map((row) => row.wake?.canRetry ?? null)).toEqual([false, true, null]);
  });
});
