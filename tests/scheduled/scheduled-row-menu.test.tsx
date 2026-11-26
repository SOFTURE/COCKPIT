// A scheduled task row's menu (CT-37): Run now, then Delete after the separator, confirmed with the task's own title.
// Opening the menu and running each item is in the Scheduled tasks e2e.
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { buildScheduledMenu, type ScheduledMenuHandlers } from "../../src/scheduled/scheduled-row-menu.tsx";

const COPY = getMessages("en").scheduledPage;

function handlers(overrides: Partial<ScheduledMenuHandlers> = {}): { readonly calls: string[]; readonly value: ScheduledMenuHandlers } {
  const calls: string[] = [];
  return {
    calls,
    value: {
      runNow: () => calls.push("run"),
      remove: () => {
        calls.push("delete");
        return Promise.resolve();
      },
      isRunning: false,
      ...overrides,
    },
  };
}

describe("the scheduled task row menu", () => {
  it("names the task on its button and lists Run now, then Delete with its confirmation", () => {
    const menu = buildScheduledMenu(COPY, "Weekly check", handlers().value);
    expect(menu.label).toBe("More actions: Weekly check");
    expect(menu.actions.map((action) => [action.id, action.label, action.isDisabled])).toEqual([["run-now", "Run now", false]]);
    expect(menu.destructiveAction.label).toBe("Delete");
    expect(menu.destructiveAction.confirm).toEqual({
      title: "Delete Weekly check?",
      description: COPY.deleteHint,
      confirmLabel: "Delete",
      pendingLabel: "Deleting…",
      cancelLabel: "Cancel",
    });
  });

  it("runs each item's own handler", async () => {
    const { calls, value } = handlers();
    const menu = buildScheduledMenu(COPY, "Weekly check", value);
    menu.actions[0]?.onSelect();
    await menu.destructiveAction.onSelect();
    expect(calls).toEqual(["run", "delete"]);
  });

  it("disables Run now while it runs", () => {
    const menu = buildScheduledMenu(COPY, "Weekly check", handlers({ isRunning: true }).value);
    expect(menu.actions[0]?.isDisabled).toBe(true);
  });
});
