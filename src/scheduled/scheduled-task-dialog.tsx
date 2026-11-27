"use client";

// Creating and editing a scheduled task (CT-38) in one theme `Dialog` with a server-action form: the title, the prompt,
// the date and the time with the zone and how far away it is, two quick times, and the shared grouped `ProjectPicker`.
// The form keeps what was typed when the action refuses it and shows the message under the field it names; it mounts
// only while the dialog is open, so every opening starts from the task (Edit) or from tomorrow 08:00 with nothing
// picked and a new id (New task). Saving closes the dialog; the page's refresh shows the row. Under "When" a radio
// group in one row picks how the task repeats (CT-39): "No", "Daily" or "Weekly on <the date's weekday>".
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
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  RadioGroup,
  RadioGroupItem,
  Spinner,
  Textarea,
} from "@softure-ai/theme-notion";
import { startTransition, useActionState, useId, useState, type FormEvent } from "react";
import type { ScheduledTaskRepeat } from "../../modules/projects/scheduled-tasks.ts";
import type { AppMessages } from "../../messages/index.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "../broadcast/broadcast-limits.ts";
import type { ProjectGroupSection } from "../projects/group-projects.ts";
import { ProjectPicker, type PickerProject } from "../shell/project-picker.tsx";
import { INITIAL_SCHEDULED_TASK_ACTION_STATE, type ScheduledTaskFormAction } from "./scheduled-task-action-state.ts";
import {
  getCounter,
  getDefaultRunAt,
  getQuickTimes,
  getRepeatChoices,
  getRunHint,
  joinRunAt,
  TITLE_COUNTER_FROM,
  toRepeat,
  type RunAtFields,
  type ScheduledTaskField,
} from "./scheduled-task-form-state.ts";

/** A stored task as the Edit dialog starts from it. */
export interface ScheduledTaskDraft {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  readonly runAt: RunAtFields;
  readonly repeat: ScheduledTaskRepeat;
  readonly projectKeys: readonly string[];
}

/** What every dialog on the page shares: its words, the picker's projects and the app's zone and locale. */
export interface ScheduledDialogContext {
  readonly copy: AppMessages["scheduledDialog"];
  readonly repeatCopy: AppMessages["scheduledRepeat"];
  readonly sections: readonly ProjectGroupSection<PickerProject>[];
  readonly timeZone: string;
  readonly locale: string;
}

export interface ScheduledTaskDialogProps {
  readonly context: ScheduledDialogContext;
  /** The task to edit, or null for a new one. */
  readonly task: ScheduledTaskDraft | null;
  readonly action: ScheduledTaskFormAction;
  readonly isOpen: boolean;
  readonly onOpenChange: (isOpen: boolean) => void;
  /** Where focus goes when the dialog closes, such as the menu's button; the dialog's trigger when not given. */
  readonly onCloseAutoFocus?: (event: Event) => void;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";
const INPUT_SIZE = "min-h-touch-target md:min-h-0";

/** The action, closing the dialog once it saved. */
function closingOnSave(action: ScheduledTaskFormAction, close: () => void): ScheduledTaskFormAction {
  return async (previous, formData) => {
    const state = await action(previous, formData);
    if (state.status === "saved") {
      close();
    }
    return state;
  };
}

function getStartingDraft(task: ScheduledTaskDraft | null, timeZone: string): ScheduledTaskDraft {
  if (task !== null) {
    return task;
  }
  // Taken when the dialog opens, never while the server renders: a resubmitted form is the same task, a new opening a new one.
  return { id: crypto.randomUUID(), title: "", prompt: "", runAt: getDefaultRunAt(new Date(), timeZone), repeat: "none", projectKeys: [] };
}

interface TaskFormProps {
  readonly context: ScheduledDialogContext;
  readonly task: ScheduledTaskDraft | null;
  readonly action: ScheduledTaskFormAction;
  readonly close: () => void;
}

function TaskForm({ context, task, action, close }: TaskFormProps) {
  const { copy, timeZone, locale } = context;
  const [start] = useState(() => getStartingDraft(task, timeZone));
  const [state, formAction, isPending] = useActionState(closingOnSave(action, close), INITIAL_SCHEDULED_TASK_ACTION_STATE);
  const [title, setTitle] = useState(start.title);
  const [prompt, setPrompt] = useState(start.prompt);
  const [runAt, setRunAt] = useState(start.runAt);
  const [repeat, setRepeat] = useState<ScheduledTaskRepeat>(start.repeat);
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(start.projectKeys));
  const baseId = useId();
  const ids = {
    title: `${baseId}-title`,
    prompt: `${baseId}-prompt`,
    date: `${baseId}-date`,
    time: `${baseId}-time`,
    hint: `${baseId}-when-hint`,
    repeat: `${baseId}-repeat`,
  };
  const errorId = (field: ScheduledTaskField | "task") => `${baseId}-${field}-error`;
  const failedField = state.status === "failed" ? state.field : undefined;
  const isInvalid = (field: ScheduledTaskField) => failedField === field;
  const errorFor = (field: ScheduledTaskField | null) =>
    state.status === "failed" && state.field === field ? <FieldError id={errorId(field ?? "task")}>{state.message}</FieldError> : null;
  const now = new Date();
  const quick = getQuickTimes(now, timeZone);
  const titleCounter = getCounter(title.length, MAX_TITLE_LENGTH, TITLE_COUNTER_FROM);
  const isNew = task === null;

  // Submitted by hand, not through `<form action>`: React resets a form after its action, and the theme's checkboxes
  // follow that reset back to their first state, which would drop the picked projects of a refused save.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    // The server's messages are the ones shown, so the browser's own checks stay off.
    <form onSubmit={submit} noValidate className="grid gap-4" data-scheduled-task-form={isNew ? "new" : "edit"}>
      <input type="hidden" name="taskId" value={start.id} />
      <input type="hidden" name="runAt" value={joinRunAt(runAt)} />
      <input type="hidden" name="repeat" value={repeat} />
      <Field data-invalid={isInvalid("title") || undefined}>
        <FieldLabel htmlFor={ids.title}>{copy.titleLabel}</FieldLabel>
        <Input
          id={ids.title}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={copy.titlePlaceholder}
          maxLength={MAX_TITLE_LENGTH}
          autoComplete="off"
          aria-invalid={isInvalid("title") || undefined}
          aria-describedby={isInvalid("title") ? errorId("title") : undefined}
          className={INPUT_SIZE}
        />
        {titleCounter === null ? null : <FieldDescription data-counter="title">{titleCounter}</FieldDescription>}
        {errorFor("title")}
      </Field>
      <Field data-invalid={isInvalid("prompt") || undefined}>
        <FieldLabel htmlFor={ids.prompt}>{copy.promptLabel}</FieldLabel>
        <Textarea
          id={ids.prompt}
          name="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={copy.promptPlaceholder}
          maxLength={MAX_BODY_LENGTH}
          rows={8}
          // Grows with the text from 8 rows to 16, then scrolls.
          className="min-h-44 max-h-80"
          aria-invalid={isInvalid("prompt") || undefined}
          aria-describedby={isInvalid("prompt") ? errorId("prompt") : undefined}
        />
        <FieldDescription data-counter="prompt">{getCounter(prompt.length, MAX_BODY_LENGTH)}</FieldDescription>
        {errorFor("prompt")}
      </Field>
      <FieldSet data-invalid={isInvalid("when") || undefined} className="gap-2">
        <FieldLegend variant="label">{copy.whenLabel}</FieldLegend>
        <div className="flex min-w-0 gap-2">
          <Input
            id={ids.date}
            type="date"
            value={runAt.date}
            onChange={(event) => setRunAt({ ...runAt, date: event.target.value })}
            aria-label={copy.dateLabel}
            aria-invalid={isInvalid("when") || undefined}
            aria-describedby={isInvalid("when") ? `${ids.hint} ${errorId("when")}` : ids.hint}
            className={`min-w-0 flex-1 ${INPUT_SIZE}`}
            data-run-date
          />
          <Input
            id={ids.time}
            type="time"
            value={runAt.time}
            onChange={(event) => setRunAt({ ...runAt, time: event.target.value })}
            aria-label={copy.timeLabel}
            aria-invalid={isInvalid("when") || undefined}
            aria-describedby={isInvalid("when") ? `${ids.hint} ${errorId("when")}` : ids.hint}
            className={`w-32 shrink-0 ${INPUT_SIZE}`}
            data-run-time
          />
        </div>
        <FieldDescription id={ids.hint} data-run-hint>
          {getRunHint({ fields: runAt, now, timeZone, locale })}
        </FieldDescription>
        <div role="group" aria-label={copy.quickTimesLabel} className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} onClick={() => setRunAt(quick.tomorrow)}>
            {copy.tomorrow}
          </Button>
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} onClick={() => setRunAt(quick.monday)}>
            {copy.monday}
          </Button>
        </div>
        {errorFor("when")}
      </FieldSet>
      <FieldSet className="gap-2">
        <FieldLegend variant="label" id={ids.repeat}>
          {context.repeatCopy.legend}
        </FieldLegend>
        {/* One row that wraps only when the weekday does not fit; each choice is 44 px high on a phone. */}
        <RadioGroup
          aria-labelledby={ids.repeat}
          value={repeat}
          onValueChange={(value) => setRepeat(toRepeat(value))}
          className="flex flex-row flex-wrap gap-x-6 gap-y-0"
          data-repeat-choice
        >
          {getRepeatChoices(context.repeatCopy, runAt.date, locale).map((choice) => {
            const choiceId = `${ids.repeat}-${choice.value}`;
            return (
              <div key={choice.value} className="flex min-h-touch-target items-center gap-2 md:min-h-row-height">
                <RadioGroupItem id={choiceId} value={choice.value} data-repeat={choice.value} />
                <label htmlFor={choiceId} className="py-2 text-ui">
                  {choice.label}
                </label>
              </div>
            );
          })}
        </RadioGroup>
      </FieldSet>
      <div className="grid gap-2">
        <ProjectPicker
          copy={copy}
          sections={context.sections}
          picked={picked}
          onPickedChange={setPicked}
          layout="dialog"
          isInvalid={isInvalid("projects")}
          describedBy={isInvalid("projects") ? errorId("projects") : undefined}
        />
        {errorFor("projects")}
      </div>
      <div aria-live="polite">{errorFor(null)}</div>
      {/* Stays at the dialog's bottom while the fields scroll; on a phone the buttons are full width, primary first. */}
      <DialogFooter sticky>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="touch" className={`w-full sm:w-auto ${CONTROL_SIZE}`} disabled={isPending}>
            {copy.cancel}
          </Button>
        </DialogClose>
        <Button type="submit" size="touch" className={`w-full sm:w-auto ${CONTROL_SIZE}`} disabled={isPending}>
          {isPending ? <Spinner aria-hidden="true" /> : null}
          {isNew ? (isPending ? copy.scheduling : copy.schedule) : isPending ? copy.saving : copy.save}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ScheduledTaskDialog({ context, task, action, isOpen, onOpenChange, onCloseAutoFocus }: ScheduledTaskDialogProps) {
  const { copy } = context;
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        // The theme's create or edit form: 672 px from `md`, scrolling inside on a short screen.
        size="form"
        closeLabel={copy.cancel}
        closeButtonSize="touch"
        onCloseAutoFocus={onCloseAutoFocus}
        data-scheduled-task-dialog
      >
        <DialogHeader>
          <DialogTitle>{task === null ? copy.newTitle : copy.editTitle}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <TaskForm context={context} task={task} action={action} close={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
