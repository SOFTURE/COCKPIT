"use client";

// The Routines tab's controls (CT-10): add a routine and replace its token, each in a dialog; Test it; switch it on or
// off. A token field is a password field; the token is never sent back to the page. A dialog closes once its form is
// saved, and opens empty again.
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@softure-ai/theme-notion";
import { FlaskConical, KeyRound, Plus } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { COCKPIT_ISSUES_KIND, ROUTINE_KINDS } from "../../modules/projects/routine-kinds.ts";
import { FieldHelp } from "../shell/field-help.tsx";
import { INITIAL_ROUTINE_FORM_STATE, type RoutineFormAction as FormAction, type RoutineFormState } from "./routine-form-state.ts";

type Copy = AppMessages["routines"];

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

function Result({ state, id, isHidden = false }: { readonly state: RoutineFormState; readonly id: string; readonly isHidden?: boolean }) {
  return (
    <div id={id} role="status" aria-live="polite" className={isHidden ? "sr-only" : undefined}>
      {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      {state.status === "done" ? <p className="text-small text-muted-foreground">{state.message}</p> : null}
    </div>
  );
}

/** The action, closing the dialog once it saved. */
function closingOnSave(action: FormAction, close: () => void): FormAction {
  return async (previous, formData) => {
    const state = await action(previous, formData);
    if (state.status === "done") {
      close();
    }
    return state;
  };
}

function AddRoutineFields({ copy, repositoryKey, action, close }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly action: FormAction;
  readonly close: () => void;
}) {
  const [state, formAction, isPending] = useActionState(closingOnSave(action, close), INITIAL_ROUTINE_FORM_STATE);
  const ids = { name: useId(), kind: useId(), trigger: useId(), token: useId(), result: useId() };
  return (
    <form action={formAction} className="grid gap-4" aria-label={copy.addTitle} data-routine-add>
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <div className="grid gap-3">
        <Field>
          <FieldLabel htmlFor={ids.name}>{copy.name}</FieldLabel>
          <Input id={ids.name} name="name" required maxLength={80} autoComplete="off" />
        </Field>
        <Field>
          <span className="flex items-center gap-1">
            <FieldLabel htmlFor={ids.kind}>{copy.kind}</FieldLabel>
            <FieldHelp id={`${ids.kind}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.kind })} text={copy.kindHint} />
          </span>
          {/* A fixed list, never free text: the kind decides when COCKPIT fires the routine. */}
          <Select name="kind" defaultValue={COCKPIT_ISSUES_KIND}>
            <SelectTrigger id={ids.kind} size="touch" className="w-full md:h-8" aria-describedby={`${ids.kind}-hint`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTINE_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {copy.kinds[kind]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <span className="flex items-center gap-1">
            <FieldLabel htmlFor={ids.trigger}>{copy.trigger}</FieldLabel>
            <FieldHelp id={`${ids.trigger}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.trigger })} text={copy.triggerHint} />
          </span>
          <Input id={ids.trigger} name="trigger" required autoComplete="off" aria-describedby={`${ids.trigger}-hint`} />
        </Field>
        <Field>
          <span className="flex items-center gap-1">
            <FieldLabel htmlFor={ids.token}>{copy.token}</FieldLabel>
            <FieldHelp id={`${ids.token}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.token })} text={copy.tokenHint} />
          </span>
          <Input id={ids.token} name="token" type="password" required autoComplete="off" aria-describedby={`${ids.token}-hint`} />
        </Field>
      </div>
      <Result state={state} id={ids.result} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} disabled={isPending}>
            {copy.cancel}
          </Button>
        </DialogClose>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending}>
          <Plus aria-hidden="true" />
          {copy.add}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** The Routines card's "Add routine" button and its dialog. A new routine starts enabled. */
export function AddRoutineDialog({ copy, repositoryKey, action, disabled }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly action: FormAction;
  readonly disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="touch" className={CONTROL_SIZE} disabled={disabled} data-routine-add-open>
          <Plus aria-hidden="true" />
          {copy.add}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={copy.cancel} closeButtonSize="touch">
        <DialogHeader>
          <DialogTitle>{copy.addTitle}</DialogTitle>
          <DialogDescription>{copy.addHint}</DialogDescription>
        </DialogHeader>
        <AddRoutineFields copy={copy} repositoryKey={repositoryKey} action={action} close={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ReplaceTokenFields({ copy, repositoryKey, routineId, action, close }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly action: FormAction;
  readonly close: () => void;
}) {
  const [state, formAction, isPending] = useActionState(closingOnSave(action, close), INITIAL_ROUTINE_FORM_STATE);
  const tokenId = useId();
  const resultId = useId();
  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <input type="hidden" name="routineId" value={routineId} />
      <Field>
        <FieldLabel htmlFor={tokenId}>{copy.replaceToken}</FieldLabel>
        <Input id={tokenId} name="token" type="password" required autoComplete="off" />
      </Field>
      <Result state={state} id={resultId} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} disabled={isPending}>
            {copy.cancel}
          </Button>
        </DialogClose>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending}>
          <KeyRound aria-hidden="true" />
          {copy.replace}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** A routine's "Replace token" button and its dialog. */
export function ReplaceTokenDialog({ copy, repositoryKey, routineId, name, action, disabled }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly name: string;
  readonly action: FormAction;
  readonly disabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const label = fillMessage(copy.replaceLabel, { name });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} disabled={disabled} aria-label={label}>
          <KeyRound aria-hidden="true" />
          {copy.replace}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={copy.cancel} closeButtonSize="touch">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{copy.replaceHint}</DialogDescription>
        </DialogHeader>
        <ReplaceTokenFields copy={copy} repositoryKey={repositoryKey} routineId={routineId} action={action} close={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
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
    // The result is announced, not shown: the row's last-call badge shows it, so the button keeps its width.
    <form action={formAction}>
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
      <Result state={state} id={resultId} isHidden />
    </form>
  );
}

/** A routine's on/off switch: flipping it saves at once. */
export function RoutineEnabledSwitch({ copy, repositoryKey, routineId, name, enabled, action }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly name: string;
  readonly enabled: boolean;
  readonly action: (formData: FormData) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const switchId = useId();
  const change = (checked: boolean) => {
    const formData = new FormData();
    formData.set("repositoryKey", repositoryKey);
    formData.set("routineId", String(routineId));
    formData.set("enabled", checked ? "true" : "false");
    startTransition(() => action(formData));
  };
  return (
    <span className="flex min-h-touch-target items-center gap-2 md:min-h-7">
      <Switch
        id={switchId}
        size="touch"
        checked={enabled}
        disabled={isPending}
        onCheckedChange={change}
        aria-label={fillMessage(copy.switchLabel, { name })}
        data-routine-switch
      />
      <label htmlFor={switchId} className="text-ui" aria-hidden="true">
        {enabled ? copy.enabled : copy.disabledBadge}
      </label>
    </span>
  );
}
