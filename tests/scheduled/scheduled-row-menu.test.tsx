// A scheduled task row's menu (CT-37, Edit from CT-38, Pause/Resume from CT-39): Edit, Run now, Pause or Resume, then
// Delete after the separator, confirmed with the task's own title.
// Opening the menu and running each item is in the Scheduled tasks e2e.
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { buildScheduledMenu, type ScheduledMenuHandlers } from "../../src/scheduled/scheduled-row-menu.tsx";

const COPY = getMessages("en").scheduledPage;
const PAUSE_COPY = getMessages("en").scheduledRepeat;

function handlers(overrides: Partial<ScheduledMenuHandlers> = {}): { readonly calls: string[]; readonly value: ScheduledMenuHandlers } {
  const calls: string[] = [];
  return {
    calls,
    value: {
      edit: () => calls.push("edit"),
      runNow: () => calls.push("run"),
      togglePause: () => calls.push("pause"),
      isPaused: false,
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
  it("names the task on its button and lists Edit, Run now, Pause, then Delete with its confirmation", () => {
    const menu = buildScheduledMenu(COPY, PAUSE_COPY, "Weekly check", handlers().value);
    expect(menu.label).toBe("More actions: Weekly check");
    expect(menu.actions.map((action) => [action.id, action.label, action.isDisabled])).toEqual([
      ["edit", "Edit", undefined],
      ["run-now", "Run now", false],
      ["pause", "Pause", false],
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
    const menu = buildScheduledMenu(COPY, PAUSE_COPY, "Weekly check", value);
    menu.actions[0]?.onSelect();
    menu.actions[1]?.onSelect();
    menu.actions[2]?.onSelect();
    await menu.destructiveAction.onSelect();
    expect(calls).toEqual(["edit", "run", "pause", "delete"]);
  });

  it("disables Run now while it runs", () => {
    const menu = buildScheduledMenu(COPY, PAUSE_COPY, "Weekly check", handlers({ isRunning: true }).value);
    expect(menu.actions[1]?.isDisabled).toBe(true);
  });

  it("offers Resume instead of Pause on a paused task", () => {
    const menu = buildScheduledMenu(COPY, PAUSE_COPY, "Weekly check", handlers({ isPaused: true }).value);
    expect(menu.actions.map((action) => [action.id, action.label])).toEqual([
      ["edit", "Edit"],
      ["run-now", "Run now"],
      ["resume", "Resume"],
    ]);
  });
});
