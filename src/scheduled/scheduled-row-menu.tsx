"use client";

// A scheduled task row's "More actions" menu (CT-37) on theme-notion's `RowActionsMenu`, straight in `ListEntry`'s
// `menu` slot: Run now, then Delete after the separator, confirmed in the menu's own dialog, which stays open and
// disabled while the delete runs. Each action reports its outcome to the row, which shows a refusal under the title.
// CT-38 adds Edit before Run now.
import { RowActionsMenu, type RowMenuAction, type RowMenuDestructiveAction } from "@softure-ai/theme-notion";
import { Play, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ScheduledTaskActionState } from "./scheduled-task-action-state.ts";

export type ScheduledMenuCopy = Pick<
  AppMessages["scheduledPage"],
  "moreActionsLabel" | "runNow" | "delete" | "deleteQuestion" | "deleteHint" | "deleting" | "cancel"
>;

type ActionResult = Promise<ScheduledTaskActionState>;

/** A server action of the row: Run now or Delete. */
export type ScheduledTaskAction = (formData: FormData) => ActionResult;

export interface ScheduledMenuHandlers {
  readonly runNow: () => void;
  /** Deletes the task: the server action's promise, so the confirmation waits for it. */
  readonly remove: () => Promise<void>;
  readonly isRunning: boolean;
}

export interface ScheduledMenu {
  readonly label: string;
  readonly actions: RowMenuAction[];
  readonly destructiveAction: RowMenuDestructiveAction;
}

/** The menu's props: Run now, then Delete, confirmed with the task's own title. */
export function buildScheduledMenu(copy: ScheduledMenuCopy, title: string, handlers: ScheduledMenuHandlers): ScheduledMenu {
  return {
    label: fillMessage(copy.moreActionsLabel, { title }),
    actions: [{ id: "run-now", label: copy.runNow, icon: <Play aria-hidden="true" />, onSelect: handlers.runNow, isDisabled: handlers.isRunning }],
    destructiveAction: {
      id: "delete",
      label: copy.delete,
      icon: <Trash2 aria-hidden="true" />,
      onSelect: handlers.remove,
      confirm: {
        title: fillMessage(copy.deleteQuestion, { title }),
        description: copy.deleteHint,
        confirmLabel: copy.delete,
        pendingLabel: copy.deleting,
        cancelLabel: copy.cancel,
      },
    },
  };
}

export interface ScheduledRowMenuProps {
  readonly copy: ScheduledMenuCopy;
  readonly taskId: string;
  readonly title: string;
  readonly runNowAction: ScheduledTaskAction;
  readonly deleteAction: ScheduledTaskAction;
  /** The refusal to show on the row, or null once an action went through. */
  readonly onResult: (message: string | null) => void;
}

function readMessage(state: ScheduledTaskActionState): string | null {
  return state.status === "failed" ? state.message : null;
}

export function ScheduledRowMenu({ copy, taskId, title, runNowAction, deleteAction, onResult }: ScheduledRowMenuProps) {
  const [isRunning, startRun] = useTransition();
  const fields = () => {
    const formData = new FormData();
    formData.set("taskId", taskId);
    return formData;
  };
  const menu = buildScheduledMenu(copy, title, {
    runNow: () =>
      startRun(async () => {
        onResult(readMessage(await runNowAction(fields())));
      }),
    remove: async () => {
      onResult(readMessage(await deleteAction(fields())));
    },
    isRunning,
  });
  return <RowActionsMenu label={menu.label} actions={menu.actions} destructiveAction={menu.destructiveAction} />;
}
