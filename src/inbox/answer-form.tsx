"use client";

// Answering one entry (FR-5): pick Yes (Done for a step or a secret), No or Later, add an optional note, then confirm; only the confirmation sends.
import { Button, Field, FieldError, FieldLabel, Textarea } from "@softure-ai/theme-notion";
import { useActionState, useId, useState } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { INITIAL_ANSWER_FORM_STATE, type AnswerFormState } from "./answer-form-state.ts";
import { getAnswerLabel, type EntryKind } from "./answer-label.ts";
import { ANSWERS, type Answer } from "./answer-marker.ts";

export interface AnswerFormProps {
  readonly copy: AppMessages["inbox"];
  readonly projectKey: string;
  readonly projectName: string;
  readonly entryId: string;
  readonly entryText: string;
  /** A step or a secret offers Done for yes. */
  readonly entryKind: EntryKind;
  readonly action: (previous: AnswerFormState, formData: FormData) => Promise<AnswerFormState>;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export function AnswerForm({ copy, projectKey, projectName, entryId, entryText, entryKind, action }: AnswerFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_ANSWER_FORM_STATE);
  const [chosen, setChosen] = useState<Answer | null>(null);
  const [note, setNote] = useState("");
  const noteId = useId();
  const resultId = useId();

  if (state.status === "sent") {
    return (
      <p role="status" className="text-small">
        <a href={state.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
          {state.message}
        </a>
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-2" aria-describedby={resultId} data-answer-open={chosen === null ? undefined : ""}>
      <input type="hidden" name="repositoryKey" value={projectKey} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="entryText" value={entryText} />
      {chosen === null ? (
        <div role="group" aria-label={copy.answerGroup} className="flex flex-wrap gap-1.5">
          {ANSWERS.map((answer) => (
            <Button key={answer} type="button" variant="outline" size="touch" className={CONTROL_SIZE} onClick={() => setChosen(answer)}>
              {getAnswerLabel(copy, entryKind, answer)}
            </Button>
          ))}
        </div>
      ) : (
        <div className="grid max-w-xl gap-2">
          <input type="hidden" name="answer" value={chosen} />
          <Field>
            <FieldLabel htmlFor={noteId}>{copy.noteLabel}</FieldLabel>
            <Textarea
              id={noteId}
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={copy.notePlaceholder}
              maxLength={2000}
              rows={2}
            />
          </Field>
          <p className="text-small font-medium">{fillMessage(copy.confirmQuestion, { answer: getAnswerLabel(copy, entryKind, chosen), project: projectName })}</p>
          <p className="text-small text-muted-foreground">{copy.confirmHint}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending}>
              {isPending ? copy.sendingAnswer : copy.send}
            </Button>
            <Button type="button" variant="ghost" size="touch" className={CONTROL_SIZE} disabled={isPending} onClick={() => setChosen(null)}>
              {copy.back}
            </Button>
          </div>
        </div>
      )}
      <div id={resultId} role="status" aria-live="polite">
        {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      </div>
    </form>
  );
}
