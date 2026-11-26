"use client";

// The project group controls on Settings (CT-30): the add form (Name, the optional "New projects from" owner, Add) on
// one line from md and stacked on a phone, and a group row's menu on theme-notion's RowActionsMenu with Rename (a
// dialog with both fields prefilled) and Delete (the menu's own confirmation). A refused form keeps what was typed and
// names the field; the Rename dialog gives focus back to the menu's button when it closes.
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldError,
  FieldLabel,
  Input,
  RowActionsMenu,
} from "@softure-ai/theme-notion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useActionState, useId, useRef, useState } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { LabelWithHelp } from "../shell/field-help.tsx";
import {
  INITIAL_PROJECT_GROUP_FORM_STATE,
  type ProjectGroupFormAction,
  type ProjectGroupFormState,
} from "./project-group-form-state.ts";

type Copy = AppMessages["projectGroups"];

// 44 px on a phone, the theme's control height from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";
const INPUT_SIZE = "min-h-touch-target md:min-h-0";

function Result({ state, id }: { readonly state: ProjectGroupFormState; readonly id: string }) {
  return (
    // Announced politely, without the status role: the repositories card above owns the screen's status line.
    <div id={id} aria-live="polite" data-group-result>
      {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      {state.status === "done" ? <p className="text-small text-muted-foreground">{state.message}</p> : null}
    </div>
  );
}

interface GroupFieldsProps {
  readonly copy: Copy;
  readonly state: ProjectGroupFormState;
  readonly defaults: { readonly name: string; readonly owner: string };
  readonly resultId: string;
}

/** The Name and "New projects from" fields, each marked invalid when the answer names it. */
function GroupFields({ copy, state, defaults, resultId }: GroupFieldsProps) {
  const nameId = useId();
  const ownerId = useId();
  const values = state.status === "failed" ? state.values : defaults;
  const isNameInvalid = state.status === "failed" && state.field === "name";
  const isOwnerInvalid = state.status === "failed" && state.field === "owner";
  return (
    <>
      <Field data-invalid={isNameInvalid || undefined} className="min-w-0 md:flex-1">
        <FieldLabel htmlFor={nameId}>{copy.name}</FieldLabel>
        <Input
          id={nameId}
          name="name"
          defaultValue={values.name}
          required
          maxLength={60}
          autoComplete="off"
          aria-invalid={isNameInvalid || undefined}
          aria-describedby={isNameInvalid ? resultId : undefined}
          className={INPUT_SIZE}
          data-group-name
        />
      </Field>
      <Field data-invalid={isOwnerInvalid || undefined} className="min-w-0 md:flex-1">
        <LabelWithHelp id={`${ownerId}-hint`} label={fillMessage(copy.fieldHelpLabel, { field: copy.owner })} text={copy.ownerHint}>
          <FieldLabel htmlFor={ownerId}>{copy.owner}</FieldLabel>
        </LabelWithHelp>
        <Input
          id={ownerId}
          name="owner"
          defaultValue={values.owner}
          maxLength={39}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={copy.ownerPlaceholder}
          aria-invalid={isOwnerInvalid || undefined}
          aria-describedby={isOwnerInvalid ? `${ownerId}-hint ${resultId}` : `${ownerId}-hint`}
          className={INPUT_SIZE}
          data-group-owner
        />
      </Field>
    </>
  );
}

/** The add form: one line from md (Name, New projects from, Add), stacked full width on a phone. */
export function AddProjectGroupForm({ copy, action }: { readonly copy: Copy; readonly action: ProjectGroupFormAction }) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_PROJECT_GROUP_FORM_STATE);
  const resultId = useId();
  // A saved group empties the form: a new key mounts fresh fields.
  const formKey = state.status === "done" ? state.message : "group";
  return (
    <form action={formAction} className="grid gap-2" aria-label={copy.heading} data-group-add>
      <div key={formKey} className="flex flex-col gap-3 md:flex-row md:items-end">
        <GroupFields copy={copy} state={state} defaults={INITIAL_PROJECT_GROUP_FORM_STATE.values} resultId={resultId} />
        <Button type="submit" size="touch" className={`w-full md:w-auto ${CONTROL_SIZE}`} disabled={isPending}>
          <Plus aria-hidden="true" />
          {isPending ? copy.adding : copy.add}
        </Button>
      </div>
      <Result state={state} id={resultId} />
    </form>
  );
}

interface GroupRef {
  readonly id: number;
  readonly name: string;
  readonly defaultOwner: string | null;
}

/** The action, closing the dialog once it saved. */
function closingOnSave(action: ProjectGroupFormAction, close: () => void): ProjectGroupFormAction {
  return async (previous, formData) => {
    const state = await action(previous, formData);
    if (state.status === "done") {
      close();
    }
    return state;
  };
}

function RenameFields({ copy, group, action, close }: {
  readonly copy: Copy;
  readonly group: GroupRef;
  readonly action: ProjectGroupFormAction;
  readonly close: () => void;
}) {
  const [state, formAction, isPending] = useActionState(closingOnSave(action, close), INITIAL_PROJECT_GROUP_FORM_STATE);
  const resultId = useId();
  return (
    <form action={formAction} className="grid gap-4" data-group-rename>
      <input type="hidden" name="groupId" value={group.id} />
      <div className="grid gap-3">
        <GroupFields copy={copy} state={state} defaults={{ name: group.name, owner: group.defaultOwner ?? "" }} resultId={resultId} />
      </div>
      <Result state={state} id={resultId} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} disabled={isPending}>
            {copy.cancel}
          </Button>
        </DialogClose>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending}>
          {isPending ? copy.saving : copy.save}
        </Button>
      </DialogFooter>
    </form>
  );
}

export interface ProjectGroupRowActions {
  readonly rename: ProjectGroupFormAction;
  readonly remove: (formData: FormData) => Promise<void>;
}

/** A group row's menu: Rename, then Delete in the danger tone, asking first with the group's project count. */
export function ProjectGroupRowMenu({ copy, group, deleteHint, actions }: {
  readonly copy: Copy;
  readonly group: GroupRef;
  /** "Its N projects move to No group.", in the locale's plural form. */
  readonly deleteHint: string;
  readonly actions: ProjectGroupRowActions;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const remove = () => {
    const formData = new FormData();
    formData.set("groupId", String(group.id));
    return actions.remove(formData);
  };
  const returnFocus = (event: Event) => {
    event.preventDefault();
    triggerRef.current?.focus();
  };
  return (
    <>
      <RowActionsMenu
        label={fillMessage(copy.moreActionsLabel, { name: group.name })}
        triggerRef={triggerRef}
        actions={[{ id: "rename", label: copy.rename, icon: <Pencil aria-hidden="true" />, onSelect: () => setIsRenaming(true), opensDialog: true }]}
        destructiveAction={{
          id: "delete",
          label: copy.delete,
          icon: <Trash2 aria-hidden="true" />,
          onSelect: remove,
          confirm: {
            title: fillMessage(copy.deleteQuestion, { name: group.name }),
            description: deleteHint,
            confirmLabel: copy.delete,
            pendingLabel: copy.deleting,
            cancelLabel: copy.cancel,
          },
        }}
      />
      <Dialog open={isRenaming} onOpenChange={setIsRenaming}>
        <DialogContent closeLabel={copy.cancel} closeButtonSize="touch" onCloseAutoFocus={returnFocus}>
          <DialogHeader>
            <DialogTitle>{fillMessage(copy.renameTitle, { name: group.name })}</DialogTitle>
            <DialogDescription>{copy.renameHint}</DialogDescription>
          </DialogHeader>
          <RenameFields copy={copy} group={group} action={actions.rename} close={() => setIsRenaming(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
