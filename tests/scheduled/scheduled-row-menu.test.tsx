// A scheduled task row's menu (CT-37, Edit from CT-38): Edit, Run now, then Delete after the separator, confirmed with
// the task's own title.
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
      edit: () => calls.push("edit"),
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
  it("names the task on its button and lists Edit, Run now, then Delete with its confirmation", () => {
    const menu = buildScheduledMenu(COPY, "Weekly check", handlers().value);
    expect(menu.label).toBe("More actions: Weekly check");
    expect(menu.actions.map((action) => [action.id, action.label, action.isDisabled])).toEqual([
      ["edit", "Edit", undefined],
      ["run-now", "Run now", false],
    ]);
    expect(menu.actions[0]?.opensDialog).toBe(true);
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
    menu.actions[1]?.onSelect();
    await menu.destructiveAction.onSelect();
    expect(calls).toEqual(["edit", "run", "delete"]);
  });

  it("disables Run now while it runs", () => {
    const menu = buildScheduledMenu(COPY, "Weekly check", handlers({ isRunning: true }).value);
    expect(menu.actions[1]?.isDisabled).toBe(true);
  });
});
