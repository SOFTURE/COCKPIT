"use client";

// One task still to fire (CT-37): the title, then "N projects · <first prompt line>"; on the right the planned time
// with how far away it is, and the row menu (Run now, Delete). A task being sent shows a grey "Sending" and no menu,
// since neither action applies to it. A refused action is shown under the title until the next one.
import { Badge, FieldError, ListEntry, ListItem, ResultBadge } from "@softure-ai/theme-notion";
import { useState } from "react";
import type { AppMessages } from "../../messages/index.ts";
import { ScheduledRowMenu, type ScheduledTaskAction } from "./scheduled-row-menu.tsx";

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
}

export interface ScheduledTaskRowProps {
  readonly copy: AppMessages["scheduledPage"];
  readonly row: ScheduledTaskRowView;
  readonly runNowAction: ScheduledTaskAction;
  readonly deleteAction: ScheduledTaskAction;
}

export function ScheduledTaskRow({ copy, row, runNowAction, deleteAction }: ScheduledTaskRowProps) {
  const [refusal, setRefusal] = useState<string | null>(null);
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
            <ScheduledRowMenu copy={copy} taskId={row.id} title={row.title} runNowAction={runNowAction} deleteAction={deleteAction} onResult={setRefusal} />
          )
        }
      />
    </ListItem>
  );
}
