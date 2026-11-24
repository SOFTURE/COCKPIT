import { describe, expect, it } from "vitest";
import type { StoredBroadcast, StoredSend } from "../../modules/projects/broadcasts.ts";
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

  it("reads an unknown failure reason as the forge not answering", () => {
    const view = buildBroadcastView(BROADCAST, [send("example-org/alpha-app", { status: "failed", failure: "something_new", issueNumber: null, issueUrl: null })], []);

    expect(view.sends[0]?.failure).toBe("forge_unavailable");
  });

  it("shows what wakes each project on its issue, from the wake adapter's reads (CV-2)", () => {
    const at = { readAt: BROADCAST.createdAt };
    const view = buildBroadcastView(
      BROADCAST,
      [send("example-org/alpha-app", {}), send("example-org/beta-app", {}), send("example-org/gamma-app", {})],
      [],
      [
        { key: "example-org/alpha-app", adapter: "wake", status: "value", value: { wake: "routine" }, ...at },
        { key: "example-org/beta-app", adapter: "wake", status: "value", value: { wake: "undeclared" }, ...at },
      ],
    );

    expect(view.sends.map((row) => row.wake)).toEqual([{ kind: "declared", wake: "routine" }, { kind: "declared", wake: "undeclared" }, { kind: "none" }]);
  });
});
