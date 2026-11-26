// What a scheduled task's action returns to its form (CT-36): nothing yet, saved, or failed with the message to show
// and the dialog's field it names (CT-38), null when it is about the whole task.
import type { ScheduledTaskField } from "./scheduled-task-form-state.ts";

export type ScheduledTaskActionState =
  | { readonly status: "idle" }
  | { readonly status: "saved" }
  | { readonly status: "failed"; readonly message: string; readonly field: ScheduledTaskField | null };

export const INITIAL_SCHEDULED_TASK_ACTION_STATE: ScheduledTaskActionState = { status: "idle" };

/** A create or edit action as the task dialog's form calls it. */
export type ScheduledTaskFormAction = (previous: ScheduledTaskActionState, formData: FormData) => Promise<ScheduledTaskActionState>;
