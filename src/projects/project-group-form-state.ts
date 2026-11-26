// The answer a project group form gets from its server action (CT-30): what happened, the message to show, the field
// it is about, and what was typed, so a refused form keeps it.
import type { ProjectGroupField } from "./project-group-input.ts";

export interface ProjectGroupFormState {
  readonly status: "idle" | "done" | "failed";
  readonly message: string;
  readonly field: ProjectGroupField | null;
  readonly values: { readonly name: string; readonly owner: string };
}

export type ProjectGroupFormAction = (previous: ProjectGroupFormState, formData: FormData) => Promise<ProjectGroupFormState>;

export const INITIAL_PROJECT_GROUP_FORM_STATE: ProjectGroupFormState = { status: "idle", message: "", field: null, values: { name: "", owner: "" } };
