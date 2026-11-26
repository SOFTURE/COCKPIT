"use client";

// The Routines tab's controls (CT-10): add a routine (its provider first, then that provider's fields, CT-20) and
// replace its token, each in a dialog; Test it; switch it on or off. A row shows its switch and one row menu with Test,
// Replace token and Delete (CT-22). A token field is a password field; the token is never sent back to the page. A dialog closes once its form is
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
import { FlaskConical, KeyRound, Plus, Trash2 } from "lucide-react";
import { useActionState, useId, useState, useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { COCKPIT_ISSUES_KIND, ROUTINE_KINDS } from "../../modules/projects/routine-kinds.ts";
import { CLAUDE_CODE_PROVIDER, PROVIDER_FIELDS, ROUTINE_PROVIDERS, type RoutineProviderId } from "../../modules/projects/routine-providers.ts";
import { ConfirmDeleteDialog } from "../shell/confirm-delete-button.tsx";
import { LabelWithHelp } from "../shell/field-help.tsx";
import { RowActionsMenu, useRowMenuFocus, type RowAction } from "../shell/row-actions-menu.tsx";
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

interface FieldCopy {
  readonly label: string;
  readonly hint: string;
}

/** The copy of one provider's field: its label and its "?" help. */
function getFieldCopy(copy: Copy, provider: RoutineProviderId, field: string): FieldCopy {
  const fields: Readonly<Record<string, FieldCopy>> = copy.providers[provider].fields;
  return fields[field] ?? { label: field, hint: "" };
}

function isProviderId(value: string): value is RoutineProviderId {
  return (ROUTINE_PROVIDERS as readonly string[]).includes(value);
}

/** One setting field the chosen provider declares, with its "?" help. */
function ProviderField({ copy, provider, field }: { readonly copy: Copy; readonly provider: RoutineProviderId; readonly field: string }) {
  const id = useId();
  const fieldCopy = getFieldCopy(copy, provider, field);
  return (
    <Field>
      <LabelWithHelp id={`${id}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: fieldCopy.label })} text={fieldCopy.hint}>
        <FieldLabel htmlFor={id}>{fieldCopy.label}</FieldLabel>
      </LabelWithHelp>
      <Input id={id} name={`settings.${field}`} required autoComplete="off" aria-describedby={`${id}-hint`} data-provider-field={field} />
    </Field>
  );
}

function AddRoutineFields({ copy, repositoryKey, action, close }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly action: FormAction;
  readonly close: () => void;
}) {
  const [state, formAction, isPending] = useActionState(closingOnSave(action, close), INITIAL_ROUTINE_FORM_STATE);
  const ids = { name: useId(), kind: useId(), provider: useId(), token: useId(), result: useId() };
  const [provider, setProvider] = useState<RoutineProviderId>(CLAUDE_CODE_PROVIDER);
  return (
    <form action={formAction} className="grid gap-4" aria-label={copy.addTitle} data-routine-add>
      <input type="hidden" name="repositoryKey" value={repositoryKey} />
      <div className="grid gap-3">
        <Field>
          <LabelWithHelp id={`${ids.provider}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.provider })} text={copy.providerHint}>
            <FieldLabel htmlFor={ids.provider}>{copy.provider}</FieldLabel>
          </LabelWithHelp>
          {/* Shown even with one provider, so the form's shape is visible: the fields below follow the choice. */}
          <Select name="provider" value={provider} onValueChange={(value) => isProviderId(value) && setProvider(value)}>
            <SelectTrigger id={ids.provider} size="touch" className="w-full md:h-8" aria-describedby={`${ids.provider}-hint`} data-routine-provider>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTINE_PROVIDERS.map((id) => (
                <SelectItem key={id} value={id}>
                  {copy.providers[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={ids.name}>{copy.name}</FieldLabel>
          <Input id={ids.name} name="name" required maxLength={80} autoComplete="off" />
        </Field>
        <Field>
          <LabelWithHelp id={`${ids.kind}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.kind })} text={copy.kindHint}>
            <FieldLabel htmlFor={ids.kind}>{copy.kind}</FieldLabel>
          </LabelWithHelp>
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
        {PROVIDER_FIELDS[provider].map((field) => (
          <ProviderField key={`${provider}.${field}`} copy={copy} provider={provider} field={field} />
        ))}
        <Field>
          <LabelWithHelp id={`${ids.token}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.token })} text={copy.tokenHint}>
            <FieldLabel htmlFor={ids.token}>{copy.token}</FieldLabel>
          </LabelWithHelp>
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

/** A routine's Replace token dialog, opened from the row menu (CT-22). */
function ReplaceTokenDialog({ copy, repositoryKey, routineId, name, action, isOpen, onOpenChange, onCloseAutoFocus }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routineId: number;
  readonly name: string;
  readonly action: FormAction;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onCloseAutoFocus: (event: Event) => void;
}) {
  const label = fillMessage(copy.replaceLabel, { name });
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent closeLabel={copy.cancel} closeButtonSize="touch" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{copy.replaceHint}</DialogDescription>
        </DialogHeader>
        <ReplaceTokenFields copy={copy} repositoryKey={repositoryKey} routineId={routineId} action={action} close={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export interface RoutineRowActions {
  readonly test: FormAction;
  readonly replaceToken: FormAction;
  readonly setEnabled: (formData: FormData) => Promise<void>;
  readonly remove: (formData: FormData) => Promise<void>;
}

/**
 * A routine row's controls line (CT-22): the on/off switch, then the row menu with Test, Replace token and Delete.
 * Test runs from the menu; its result is announced here and shown by the row's last-call badge once the page refreshes.
 */
export function RoutineRowControls({ copy, repositoryKey, routine, actions, canStore }: {
  readonly copy: Copy;
  readonly repositoryKey: string;
  readonly routine: { readonly id: number; readonly name: string; readonly enabled: boolean };
  readonly actions: RoutineRowActions;
  readonly canStore: boolean;
}) {
  const [testState, testAction, isTesting] = useActionState(actions.test, INITIAL_ROUTINE_FORM_STATE);
  const [, startTest] = useTransition();
  const [openDialog, setOpenDialog] = useState<"token" | "delete" | null>(null);
  const { triggerRef, returnFocus } = useRowMenuFocus();
  const resultId = useId();
  const { id, name } = routine;
  const runTest = () => {
    const formData = new FormData();
    formData.set("repositoryKey", repositoryKey);
    formData.set("routineId", String(id));
    startTest(() => testAction(formData));
  };
  const items: readonly RowAction[] = [
    { id: "test", label: copy.test, icon: FlaskConical, onSelect: runTest, isDisabled: !canStore || isTesting },
    { id: "replace-token", label: copy.replace, icon: KeyRound, onSelect: () => setOpenDialog("token"), isDisabled: !canStore, opensDialog: true },
    { id: "delete", label: copy.delete, icon: Trash2, onSelect: () => setOpenDialog("delete"), isDestructive: true, opensDialog: true },
  ];
  const setOpen = (dialog: "token" | "delete") => (open: boolean) => setOpenDialog(open ? dialog : null);
  return (
    // Busy while a Test runs: its menu item is disabled until the result is in.
    <div className="flex items-center gap-2" aria-busy={isTesting} data-routine-controls="">
      <RoutineEnabledSwitch copy={copy} repositoryKey={repositoryKey} routineId={id} name={name} enabled={routine.enabled} action={actions.setEnabled} />
      <RowActionsMenu label={fillMessage(copy.moreActionsLabel, { name })} items={items} triggerRef={triggerRef} />
      <Result state={testState} id={resultId} isHidden />
      <ReplaceTokenDialog
        copy={copy}
        repositoryKey={repositoryKey}
        routineId={id}
        name={name}
        action={actions.replaceToken}
        isOpen={openDialog === "token"}
        onOpenChange={setOpen("token")}
        onCloseAutoFocus={returnFocus}
      />
      <ConfirmDeleteDialog
        copy={{
          question: fillMessage(copy.deleteQuestion, { name }),
          hint: copy.deleteHint,
          delete: copy.delete,
          deleting: copy.deleting,
          cancel: copy.cancel,
        }}
        fields={{ repositoryKey, routineId: String(id) }}
        action={actions.remove}
        isOpen={openDialog === "delete"}
        onOpenChange={setOpen("delete")}
        onCloseAutoFocus={returnFocus}
      />
    </div>
  );
}

/** A routine's on/off switch: flipping it saves at once. */
function RoutineEnabledSwitch({ copy, repositoryKey, routineId, name, enabled, action }: {
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
