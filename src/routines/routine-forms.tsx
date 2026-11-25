"use client";

// The Routines tab's forms (CT-10): add a routine, replace its token, and Test it. A token field is a password field
// that the browser clears after each submit; the token is never sent back to the page.
import { Button, Field, FieldDescription, FieldError, FieldLabel, Input } from "@softure-ai/theme-notion";
import { FlaskConical, KeyRound, Plus } from "lucide-react";
import { useActionState, useId } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { INITIAL_ROUTINE_FORM_STATE, type RoutineFormAction as FormAction, type RoutineFormState } from "./routine-form-state.ts";

type Copy = AppMessages["routines"];

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

function Result({ state, id }: { readonly state: RoutineFormState; readonly id: string }) {
  return (
    <div id={id} role="status" aria-live="polite">
      {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      {state.status === "done" ? <p className="text-small text-muted-foreground">{state.message}</p> : null}
    </div>
  );
}

export function AddRoutineForm({ copy, repositoryKey, action, disabled }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly action: FormAction;
  readonly disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_ROUTINE_FORM_STATE);
  const ids = { name: useId(), kind: useId(), trigger: useId(), token: useId(), enabled: useId(), result: useId() };
  return (
    <form action={formAction} className="grid gap-3" aria-label={copy.addTitle} data-routine-add>
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <div className="grid gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={ids.name}>{copy.name}</FieldLabel>
          <Input id={ids.name} name="name" required maxLength={80} autoComplete="off" disabled={disabled} />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.kind}>{copy.kind}</FieldLabel>
          <Input id={ids.kind} name="kind" defaultValue="cockpit-issues" maxLength={40} autoComplete="off" disabled={disabled} />
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.trigger}>{copy.trigger}</FieldLabel>
          <Input id={ids.trigger} name="trigger" required autoComplete="off" disabled={disabled} aria-describedby={`${ids.trigger}-hint`} />
          <FieldDescription id={`${ids.trigger}-hint`} className="break-all">{copy.triggerHint}</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.token}>{copy.token}</FieldLabel>
          <Input id={ids.token} name="token" type="password" required autoComplete="off" disabled={disabled} aria-describedby={`${ids.token}-hint`} />
          <FieldDescription id={`${ids.token}-hint`}>{copy.tokenHint}</FieldDescription>
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={ids.enabled} className="flex min-h-11 items-center gap-2 text-ui md:min-h-0">
          <input id={ids.enabled} type="checkbox" name="enabled" defaultChecked disabled={disabled} className="size-4" />
          {copy.enabled}
        </label>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={disabled || isPending}>
          <Plus aria-hidden="true" />
          {copy.add}
        </Button>
      </div>
      <Result state={state} id={ids.result} />
    </form>
  );
}

export function ReplaceTokenForm({ copy, repositoryKey, routineId, name, action, disabled }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly name: string;
  readonly action: FormAction;
  readonly disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_ROUTINE_FORM_STATE);
  const tokenId = useId();
  const resultId = useId();
  return (
    <form action={formAction} className="grid gap-1" aria-label={fillMessage(copy.replaceLabel, { name })}>
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <input type="hidden" name="routineId" value={routineId} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={tokenId} className="sr-only">{copy.replaceToken}</label>
        <Input id={tokenId} name="token" type="password" required autoComplete="off" placeholder={copy.replaceToken} disabled={disabled} className="w-full sm:w-56" />
        <Button type="submit" variant="outline" size="touch" className={CONTROL_SIZE} disabled={disabled || isPending}>
          <KeyRound aria-hidden="true" />
          {copy.replace}
        </Button>
      </div>
      <Result state={state} id={resultId} />
    </form>
  );
}

export function TestRoutineForm({ copy, repositoryKey, routineId, name, action, disabled }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly name: string;
  readonly action: FormAction;
  readonly disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_ROUTINE_FORM_STATE);
  const resultId = useId();
  return (
    <form action={formAction} className="grid gap-1">
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <input type="hidden" name="routineId" value={routineId} />
      <Button
        type="submit"
        variant="outline"
        size="touch"
        className={CONTROL_SIZE}
        disabled={disabled || isPending}
        aria-label={fillMessage(copy.testLabel, { name })}
        aria-describedby={resultId}
      >
        <FlaskConical aria-hidden="true" />
        {copy.test}
      </Button>
      <Result state={state} id={resultId} />
    </form>
  );
}
