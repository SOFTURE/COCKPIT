// What a routine form shows after its action: nothing yet, a short result, or why nothing changed.
export interface RoutineFormState {
  readonly status: "idle" | "done" | "failed";
  readonly message: string;
}

export const INITIAL_ROUTINE_FORM_STATE: RoutineFormState = { status: "idle", message: "" };

/** A routine form's server action, as `useActionState` calls it. */
export type RoutineFormAction = (previous: RoutineFormState, formData: FormData) => Promise<RoutineFormState>;

/** A plain form's server action (enable, disable, delete, Retry). */
export type PlainFormAction = (formData: FormData) => Promise<void>;
