// What the answer form shows after a send: nothing yet, the issue it became, or why nothing was sent.
export type AnswerFormState =
  | { readonly status: "idle" }
  | { readonly status: "sent"; readonly message: string; readonly issueUrl: string }
  | { readonly status: "failed"; readonly message: string };

export const INITIAL_ANSWER_FORM_STATE: AnswerFormState = { status: "idle" };
