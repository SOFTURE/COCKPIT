"use client";

// The form that adds a watched repository; the server action checks the access before anything is saved.
import { Button, Field, FieldDescription, FieldError, FieldLabel } from "@softure-ai/theme-notion";
import { useActionState } from "react";
import type { AppMessages } from "../../messages/index.ts";
import type { RepositorySuggestions } from "./load-repository-suggestions.ts";
import { RepositoryPicker } from "./repository-picker.tsx";

export interface AddRepositoryFormState {
  readonly status: "idle" | "added" | "failed";
  readonly message: string;
  readonly value: string;
}

export interface AddRepositoryFormProps {
  readonly copy: AppMessages["repositories"];
  readonly suggestions: RepositorySuggestions;
  readonly action: (previous: AddRepositoryFormState, formData: FormData) => Promise<AddRepositoryFormState>;
}

const HINTS: Record<RepositorySuggestions["kind"], (copy: AppMessages["repositories"]) => string> = {
  listed: (copy) => copy.pickHint,
  loading: (copy) => copy.loadingHint,
  unavailable: (copy) => copy.unlistedHint,
};

const INITIAL_STATE: AddRepositoryFormState = { status: "idle", message: "", value: "" };

export function AddRepositoryForm({ copy, suggestions, action }: AddRepositoryFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const hasFailed = state.status === "failed";
  return (
    <form action={formAction} className="grid gap-2">
      <Field data-invalid={hasFailed || undefined}>
        {/* The picker's input carries the same name for assistive technology (see RepositoryPicker). */}
        <FieldLabel aria-hidden="true">{copy.nameLabel}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <RepositoryPicker
            key={state.status === "added" ? state.message : "repository"}
            copy={copy}
            suggestions={suggestions.kind === "listed" ? suggestions.names : []}
            defaultValue={state.value}
            isInvalid={hasFailed}
            describedBy="repository-hint repository-result"
          />
          <Button type="submit" size="touch" className="md:h-7 md:px-2.5" disabled={isPending}>
            {isPending ? copy.adding : copy.add}
          </Button>
        </div>
        <FieldDescription id="repository-hint">{HINTS[suggestions.kind](copy)}</FieldDescription>
        <div id="repository-result" role="status" aria-live="polite">
          {hasFailed ? <FieldError>{state.message}</FieldError> : null}
          {state.status === "added" ? <p className="text-small text-muted-foreground">{state.message}</p> : null}
        </div>
      </Field>
    </form>
  );
}
