"use client";

// One task still to fire (CT-37): the title, then "N projects · <first prompt line>"; on the right the planned time
// with how far away it is, and the row menu (Edit, Run now, Delete). A task being sent shows a grey "Sending" and no
// menu, since no action applies to it. A refused action is shown under the title until the next one. Edit (CT-38) opens
// the task dialog with the task's values and gives focus back to the menu's button when it closes.
import { Badge, FieldError, ListEntry, ListItem, ResultBadge } from "@softure-ai/theme-notion";
import { useRef, useState } from "react";
import type { AppMessages } from "../../messages/index.ts";
import { ScheduledRowMenu, type ScheduledTaskAction } from "./scheduled-row-menu.tsx";
import { ScheduledTaskDialog, type ScheduledDialogContext, type ScheduledTaskDraft } from "./scheduled-task-dialog.tsx";
import type { ScheduledTaskFormAction } from "./scheduled-task-action-state.ts";

export interface ScheduledTaskRowView {
  readonly id: string;
  readonly title: string;
  /** "2 projects · Run the code review on master." */
  readonly details: string;
  /** "Mon, Nov 30, 8:00 AM" */
  readonly time: string;
  /** "in 3 days" */
  readonly relative: string;
  readonly isSending: boolean;
  /** The task as the Edit dialog starts from it. */
  readonly draft: ScheduledTaskDraft;
}

export interface ScheduledTaskRowProps {
  readonly copy: AppMessages["scheduledPage"];
  readonly row: ScheduledTaskRowView;
  readonly runNowAction: ScheduledTaskAction;
  readonly deleteAction: ScheduledTaskAction;
  readonly editAction: ScheduledTaskFormAction;
  readonly dialog: ScheduledDialogContext;
}

export function ScheduledTaskRow({ copy, row, runNowAction, deleteAction, editAction, dialog }: ScheduledTaskRowProps) {
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const returnFocus = (event: Event) => {
    event.preventDefault();
    triggerRef.current?.focus();
  };
  return (
    <ListItem>
      <ListEntry
        data-scheduled-task={row.id}
        title={<span className="line-clamp-1">{row.title}</span>}
        details={
          <>
            <span className="line-clamp-1 text-small text-muted-foreground">{row.details}</span>
            {refusal === null ? null : <FieldError>{refusal}</FieldError>}
          </>
        }
        status={
          <>
            <Badge variant="tag" color="gray" data-planned-time>
              {row.time}
              <span className="text-muted-foreground"> · {row.relative}</span>
            </Badge>
            {row.isSending ? (
              <ResultBadge tone="muted" isSpinning data-run-result="sending">
                {copy.sending}
              </ResultBadge>
            ) : null}
          </>
        }
        menu={
          row.isSending ? undefined : (
            <ScheduledRowMenu
              copy={copy}
              taskId={row.id}
              title={row.title}
              runNowAction={runNowAction}
              deleteAction={deleteAction}
              onEdit={() => setIsEditing(true)}
              triggerRef={triggerRef}
              onResult={setRefusal}
            />
          )
        }
      />
      <ScheduledTaskDialog context={dialog} task={row.draft} action={editAction} isOpen={isEditing} onOpenChange={setIsEditing} onCloseAutoFocus={returnFocus} />
    </ListItem>
  );
}
