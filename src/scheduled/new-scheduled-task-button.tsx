"use client";

// The Scheduled tasks page's "New task" button (CT-38) in the page header: opens the task dialog with tomorrow 08:00
// and nothing picked; the dialog gives focus back to the button when it closes.
import { Button } from "@softure-ai/theme-notion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ScheduledTaskDialog, type ScheduledDialogContext } from "./scheduled-task-dialog.tsx";
import type { ScheduledTaskFormAction } from "./scheduled-task-action-state.ts";

export interface NewScheduledTaskButtonProps {
  readonly label: string;
  readonly context: ScheduledDialogContext;
  readonly action: ScheduledTaskFormAction;
}

export function NewScheduledTaskButton({ label, context, action }: NewScheduledTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button type="button" size="touch" className="md:h-7 md:px-2.5" onClick={() => setIsOpen(true)} data-new-scheduled-task>
        <Plus aria-hidden="true" />
        {label}
      </Button>
      <ScheduledTaskDialog context={context} task={null} action={action} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
