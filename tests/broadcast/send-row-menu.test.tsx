// A Broadcast project row's menu (CT-27): its items on theme-notion's RowActionsMenu, in the order the row gives them,
// each bound to its own handler, a retry disabled while it runs. Opening the menu and running an item is in the
// Broadcast e2e.
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { buildSendMenuActions, type SendMenuHandlers, type SendMenuItem } from "../../src/broadcast/send-row-menu.tsx";

const COPY = getMessages("en").broadcast;
const ITEMS: readonly SendMenuItem[] = [
  { kind: "issue", url: "https://forge.example/example-org/alpha-app/issues/4", number: 4 },
  { kind: "retry-fire", fields: { broadcastId: "7", repositoryKey: "example-org/alpha-app" } },
  { kind: "retry-send", fields: { broadcastId: "7", repositoryKey: "example-org/alpha-app" } },
];

function handlers(overrides: Partial<SendMenuHandlers> = {}): { readonly calls: string[]; readonly value: SendMenuHandlers } {
  const calls: string[] = [];
  return {
    calls,
    value: {
      openIssue: (url) => calls.push(`issue ${url}`),
      retryFire: (fields) => calls.push(`fire ${fields.repositoryKey}`),
      retrySend: (fields) => calls.push(`send ${fields.repositoryKey}`),
      isRetryingFire: false,
      isRetryingSend: false,
      ...overrides,
    },
  };
}

describe("the Broadcast row menu's items", () => {
  it("lists Open issue, Retry the fire and Retry the send in the given order, each with its test hook", () => {
    const actions = buildSendMenuActions(COPY, ITEMS, handlers().value);
    expect(actions.map((action) => action.label)).toEqual(["Open issue #4", "Retry the fire", "Retry the send"]);
    expect(actions.map((action) => action.id)).toEqual(["issue", "retry-fire", "retry-send"]);
    expect(actions.every((action) => action.isDisabled !== true)).toBe(true);
    expect(actions.every((action) => action.opensDialog !== true)).toBe(true);
  });

  it("runs each item's own handler with its url or fields", () => {
    const { calls, value } = handlers();
    for (const action of buildSendMenuActions(COPY, ITEMS, value)) {
      action.onSelect();
    }
    expect(calls).toEqual(["issue https://forge.example/example-org/alpha-app/issues/4", "fire example-org/alpha-app", "send example-org/alpha-app"]);
  });

  it("disables only the retry that is running", () => {
    const fire = buildSendMenuActions(COPY, ITEMS, handlers({ isRetryingFire: true }).value);
    expect(fire.map((action) => action.isDisabled === true)).toEqual([false, true, false]);
    const send = buildSendMenuActions(COPY, ITEMS, handlers({ isRetryingSend: true }).value);
    expect(send.map((action) => action.isDisabled === true)).toEqual([false, false, true]);
  });

  it("is empty for no items", () => {
    expect(buildSendMenuActions(COPY, [], handlers().value)).toEqual([]);
  });
});
