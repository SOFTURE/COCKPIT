"use client";

// A list row's "More actions" menu (CT-22): one 44 px icon button that opens the row's actions, so a row shows at most
// one inline control (ListRow's rule). Destructive actions come last, after a separator, in the danger tone. An item
// that opens a dialog (`opensDialog`) only sets the dialog's state: the dialog lives outside the menu (the menu's content
// is gone once it closes), the menu leaves focus to it, and the dialog gives focus back to this button through
// `useRowMenuFocus` once it closes.
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@softure-ai/theme-notion";
import { Ellipsis, type LucideIcon } from "lucide-react";
import { useRef, type RefObject } from "react";

export interface RowAction {
  /** Stable id, also the item's `data-row-action`. */
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
  /** Shown but not selectable (e.g. the server cannot store tokens). */
  readonly isDisabled?: boolean;
  /** Deletes or undoes something: last, after a separator, in the danger tone. */
  readonly isDestructive?: boolean;
  /** Opens a dialog: the menu then leaves focus to the dialog instead of taking it back to its button. */
  readonly opensDialog?: boolean;
}

export interface RowActionsMenuProps {
  /** The button's accessible name, e.g. "More actions for Coordinator". */
  readonly label: string;
  readonly items: readonly RowAction[];
  /** The button, for dialogs opened from an item to give focus back to. */
  readonly triggerRef?: RefObject<HTMLButtonElement | null>;
}

export interface OrderedRowActions {
  readonly regular: readonly RowAction[];
  readonly destructive: readonly RowAction[];
}

/** The menu's order: the regular actions as given, then the destructive ones as given. */
export function orderRowActions(items: readonly RowAction[]): OrderedRowActions {
  return {
    regular: items.filter((item) => item.isDestructive !== true),
    destructive: items.filter((item) => item.isDestructive === true),
  };
}

/** A dialog's `onCloseAutoFocus` for a dialog the menu opened: focus goes back to the menu's button, not the page. */
export function returnFocusTo(triggerRef: RefObject<HTMLButtonElement | null>, event: Event): void {
  event.preventDefault();
  triggerRef.current?.focus();
}

/** The menu button's ref and the close handler that returns focus to it, for the dialogs a row menu opens. */
export function useRowMenuFocus(): { readonly triggerRef: RefObject<HTMLButtonElement | null>; readonly returnFocus: (event: Event) => void } {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return { triggerRef, returnFocus: (event: Event) => returnFocusTo(triggerRef, event) };
}

function RowActionItem({ item, onSelect }: { readonly item: RowAction; readonly onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <DropdownMenuItem
      variant={item.isDestructive === true ? "destructive" : "default"}
      disabled={item.isDisabled === true}
      onSelect={onSelect}
      data-row-action={item.id}
    >
      <Icon aria-hidden="true" />
      {item.label}
    </DropdownMenuItem>
  );
}

export function RowActionsMenu({ label, items, triggerRef }: RowActionsMenuProps) {
  const { regular, destructive } = orderRowActions(items);
  // Set by an item that opened a dialog, read once the menu has closed.
  const hasOpenedDialog = useRef(false);
  const select = (item: RowAction) => () => {
    hasOpenedDialog.current = item.opensDialog === true;
    item.onSelect();
  };
  const keepFocusOnDialog = (event: Event) => {
    if (hasOpenedDialog.current) {
      event.preventDefault();
      hasOpenedDialog.current = false;
    }
  };
  return (
    // Not modal: a dialog opened from an item takes over focus and the page at once, with nothing left blocked.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="icon-touch"
          className="text-muted-foreground hover:text-foreground md:size-8"
          aria-label={label}
          title={label}
          data-row-actions-menu=""
        >
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" size="touch" className="md:[&_[role=menuitem]]:min-h-8" onCloseAutoFocus={keepFocusOnDialog}>
        {regular.map((item) => (
          <RowActionItem key={item.id} item={item} onSelect={select(item)} />
        ))}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((item) => (
          <RowActionItem key={item.id} item={item} onSelect={select(item)} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
