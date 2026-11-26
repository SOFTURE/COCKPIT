// What a scheduled task's action returns to its form (CT-36): nothing yet, saved, or failed with the message to show.
export type ScheduledTaskActionState =
  | { readonly status: "idle" }
  | { readonly status: "saved" }
  | { readonly status: "failed"; readonly message: string };
