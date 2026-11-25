// The shared row menu (CT-22): one "More actions" button; the regular actions in their order, the destructive ones
// last. Opening it by keyboard (Enter, arrows, Escape) is pinned in the Routines e2e, in a real browser.
import { FlaskConical, KeyRound, Trash2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { orderRowActions, returnFocusTo, RowActionsMenu, type RowAction } from "../../src/shell/row-actions-menu.tsx";

function action(id: string, isDestructive = false): RowAction {
  return { id, label: id, icon: FlaskConical, onSelect: () => undefined, isDestructive };
}

describe("the row menu's order", () => {
  it("keeps the regular actions as given and puts every destructive one last", () => {
    const { regular, destructive } = orderRowActions([action("delete", true), action("test"), action("archive", true), action("token")]);
    expect(regular.map((item) => item.id)).toEqual(["test", "token"]);
    expect(destructive.map((item) => item.id)).toEqual(["delete", "archive"]);
  });

  it("has no destructive part when no action is destructive, and no regular part when all are", () => {
    expect(orderRowActions([action("test")]).destructive).toEqual([]);
    expect(orderRowActions([action("delete", true)]).regular).toEqual([]);
  });

  it("is empty for no actions", () => {
    expect(orderRowActions([])).toEqual({ regular: [], destructive: [] });
  });
});

describe("the row menu's button", () => {
  const items: readonly RowAction[] = [
    { id: "test", label: "Test", icon: FlaskConical, onSelect: () => undefined },
    { id: "replace-token", label: "Replace token", icon: KeyRound, onSelect: () => undefined },
    { id: "delete", label: "Delete", icon: Trash2, onSelect: () => undefined, isDestructive: true },
  ];

  it("is one 44 px icon button named by its label that opens a menu, closed until pressed", () => {
    const markup = renderToStaticMarkup(<RowActionsMenu label="More actions for Coordinator" items={items} />);
    expect(markup.match(/<button/g)).toHaveLength(1);
    expect(markup).toMatch(/^<button[^>]*aria-haspopup="menu"[^>]*aria-expanded="false"/);
    expect(markup).toContain('aria-label="More actions for Coordinator"');
    expect(markup).toContain('title="More actions for Coordinator"');
    expect(markup).toContain("size-touch-target");
    expect(markup).toContain("data-row-actions-menu");
    expect(markup).toContain("lucide-ellipsis");
    // The items render only once it opens.
    expect(markup).not.toContain("Replace token");
  });
});

describe("focus after a dialog the menu opened", () => {
  it("goes back to the menu's button instead of the page", () => {
    let focused = 0;
    let prevented = false;
    const triggerRef = { current: { focus: () => (focused += 1) } as unknown as HTMLButtonElement };
    returnFocusTo(triggerRef, { preventDefault: () => (prevented = true) } as unknown as Event);
    expect(prevented).toBe(true);
    expect(focused).toBe(1);
  });

  it("does nothing but keep the page's focus when the button is gone", () => {
    let prevented = false;
    expect(() => returnFocusTo({ current: null }, { preventDefault: () => (prevented = true) } as unknown as Event)).not.toThrow();
    expect(prevented).toBe(true);
  });
});
