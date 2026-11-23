// What the broadcast form shows after a submit that did not send: why. A sent broadcast opens its own page instead.
export type BroadcastFormState = { readonly status: "idle" } | { readonly status: "failed"; readonly message: string };

export const INITIAL_BROADCAST_FORM_STATE: BroadcastFormState = { status: "idle" };
