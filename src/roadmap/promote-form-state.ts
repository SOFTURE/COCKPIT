// What a promote control shows after a send: nothing yet, the issue it became, or why nothing was sent.
export type PromoteFormState =
  | { readonly status: "idle" }
  | { readonly status: "sent"; readonly message: string; readonly issueUrl: string; readonly issueNumber: number }
  | { readonly status: "failed"; readonly message: string };

export const INITIAL_PROMOTE_FORM_STATE: PromoteFormState = { status: "idle" };
