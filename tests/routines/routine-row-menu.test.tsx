// A routine row's menu (CT-27): Test and Replace token, then Delete last, in the danger tone's slot, confirmed in the
// theme's dialog with the routine's own words; Test disabled while it runs, both disabled when tokens cannot be stored.
// Opening the menu, the dialogs and focus are in the Routines e2e.
import { describe, expect, it } from "vitest";
import { getMessages } from "../../messages/index.ts";
import { buildRoutineMenu, type RoutineMenuHandlers } from "../../src/routines/routine-forms.tsx";

const COPY = getMessages("en").routines;

function handlers(overrides: Partial<RoutineMenuHandlers> = {}): { readonly calls: string[]; readonly value: RoutineMenuHandlers } {
  const calls: string[] = [];
  return {
    calls,
    value: {
      test: () => calls.push("test"),
      openReplaceToken: () => calls.push("replace-token"),
      remove: () => {
        calls.push("delete");
        return Promise.resolve();
      },
      isTesting: false,
      canStore: true,
      ...overrides,
    },
  };
}

describe("the routine row menu", () => {
  it("names its button after the routine and lists Test, Replace token, then Delete as the destructive action", () => {
    const menu = buildRoutineMenu(COPY, "Coordinator", handlers().value);
    expect(menu.label).toBe("More actions for Coordinator");
    expect(menu.actions.map((action) => [action.id, action.label])).toEqual([
      ["test", "Test"],
      ["replace-token", "Replace token"],
    ]);
    expect([menu.destructiveAction.id, menu.destructiveAction.label]).toEqual(["delete", "Delete"]);
  });

  it("asks before deleting, in the routine's own words, with Deleting… while it runs", () => {
    expect(buildRoutineMenu(COPY, "Coordinator", handlers().value).destructiveAction.confirm).toEqual({
      title: "Delete the routine Coordinator?",
      description: "COCKPIT stops firing it; the issues it was fired for stay in the project.",
      confirmLabel: "Delete",
      pendingLabel: "Deleting…",
      cancelLabel: "Cancel",
    });
  });

  it("leaves focus to the Replace token dialog, and to nothing else", () => {
    const menu = buildRoutineMenu(COPY, "Coordinator", handlers().value);
    expect(menu.actions.map((action) => action.opensDialog === true)).toEqual([false, true]);
  });

  it("runs each item's handler, and hands the delete's promise to the confirmation", async () => {
    const { calls, value } = handlers();
    const menu = buildRoutineMenu(COPY, "Coordinator", value);
    for (const action of menu.actions) {
      action.onSelect();
    }
    const deleting = menu.destructiveAction.onSelect();
    expect(deleting).toBeInstanceOf(Promise);
    await deleting;
    expect(calls).toEqual(["test", "replace-token", "delete"]);
  });

  it("disables Test while it runs, and both Test and Replace token when the server cannot store tokens", () => {
    const testing = buildRoutineMenu(COPY, "Coordinator", handlers({ isTesting: true }).value);
    expect(testing.actions.map((action) => action.isDisabled === true)).toEqual([true, false]);
    const cannotStore = buildRoutineMenu(COPY, "Coordinator", handlers({ canStore: false }).value);
    expect(cannotStore.actions.map((action) => action.isDisabled === true)).toEqual([true, true]);
    // Delete stays available: a routine can always be removed.
    expect(cannotStore.destructiveAction.isDisabled).toBeUndefined();
  });
});
