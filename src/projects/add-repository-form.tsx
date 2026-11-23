"use client";

// The form that adds a watched repository; the server action checks the access before anything is saved.
import { Button, Field, FieldDescription, FieldError, FieldLabel, Input } from "@softure-ai/theme-notion";
import { useActionState } from "react";
import type { AppMessages } from "../../messages/index.ts";

export interface AddRepositoryFormState {
  readonly status: "idle" | "added" | "failed";
  readonly message: string;
  readonly value: string;
}

export interface AddRepositoryFormProps {
  readonly copy: AppMessages["repositories"];
  readonly action: (previous: AddRepositoryFormState, formData: FormData) => Promise<AddRepositoryFormState>;
}

const INITIAL_STATE: AddRepositoryFormState = { status: "idle", message: "", value: "" };

export function AddRepositoryForm({ copy, action }: AddRepositoryFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const hasFailed = state.status === "failed";
  return (
    <form action={formAction} className="grid gap-2">
      <Field data-invalid={hasFailed || undefined}>
        <FieldLabel htmlFor="repository">{copy.nameLabel}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          <Input
            id="repository"
            name="repository"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder={copy.namePlaceholder}
            defaultValue={state.value}
            key={state.status === "added" ? state.message : "repository"}
            aria-invalid={hasFailed || undefined}
            aria-describedby="repository-hint repository-result"
            className="min-w-0 flex-1 basis-48"
          />
          <Button type="submit" size="touch" className="md:h-7 md:px-2.5" disabled={isPending}>
            {isPending ? copy.adding : copy.add}
          </Button>
        </div>
        <FieldDescription id="repository-hint">{copy.nameHint}</FieldDescription>
        <div id="repository-result" role="status" aria-live="polite">
          {hasFailed ? <FieldError>{state.message}</FieldError> : null}
          {state.status === "added" ? <p className="text-small text-muted-foreground">{state.message}</p> : null}
        </div>
      </Field>
    </form>
  );
}
