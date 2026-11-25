// A Broadcast project row's controls (CT-23): one inline, the rest in the row menu.
import { describe, expect, it } from "vitest";
import { pickSendControls } from "../../src/broadcast/send-controls.ts";

describe("a broadcast project row's controls", () => {
  it("has none when there is nothing to do", () => {
    expect(pickSendControls({ hasIssue: false, canRetryFire: false, canRetrySend: false })).toEqual({ inline: null, menu: [] });
  });

  it("keeps a single control inline, with no menu", () => {
    expect(pickSendControls({ hasIssue: true, canRetryFire: false, canRetrySend: false })).toEqual({ inline: "issue", menu: [] });
    expect(pickSendControls({ hasIssue: false, canRetryFire: true, canRetrySend: false })).toEqual({ inline: "retry-fire", menu: [] });
    expect(pickSendControls({ hasIssue: false, canRetryFire: false, canRetrySend: true })).toEqual({ inline: "retry-send", menu: [] });
  });

  it("keeps the Issue link inline and moves Retry fire to the menu on a sent project whose fire can be retried", () => {
    expect(pickSendControls({ hasIssue: true, canRetryFire: true, canRetrySend: false })).toEqual({ inline: "issue", menu: ["retry-fire"] });
  });

  it("keeps Retry send inline whenever it is there", () => {
    expect(pickSendControls({ hasIssue: true, canRetryFire: false, canRetrySend: true })).toEqual({ inline: "retry-send", menu: ["issue"] });
    expect(pickSendControls({ hasIssue: false, canRetryFire: true, canRetrySend: true })).toEqual({ inline: "retry-send", menu: ["retry-fire"] });
  });

  it("puts Issue then Retry fire in the menu when all three are there", () => {
    expect(pickSendControls({ hasIssue: true, canRetryFire: true, canRetrySend: true })).toEqual({ inline: "retry-send", menu: ["issue", "retry-fire"] });
  });
});
