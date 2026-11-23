"use client";

// Answering one entry (FR-5): pick Yes, No or Later, add an optional note, then confirm; only the confirmation sends.
import { Button, Field, FieldError, FieldLabel, Textarea } from "@softure-ai/theme-notion";
import { useActionState, useId, useState } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { INITIAL_ANSWER_FORM_STATE, type AnswerFormState } from "./answer-form-state.ts";
import { OWNER_WORD_ANSWERS, type OwnerWordAnswer } from "./owner-word-marker.ts";

export interface AnswerFormProps {
  readonly copy: AppMessages["inbox"];
  readonly projectKey: string;
  readonly projectName: string;
  readonly entryId: string;
  readonly entryText: string;
  readonly action: (previous: AnswerFormState, formData: FormData) => Promise<AnswerFormState>;
}

export function AnswerForm({ copy, projectKey, projectName, entryId, entryText, action }: AnswerFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_ANSWER_FORM_STATE);
  const [chosen, setChosen] = useState<OwnerWordAnswer | null>(null);
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
    <form action={formAction} className="grid gap-2" aria-describedby={resultId}>
      <input type="hidden" name="repositoryKey" value={projectKey} />
      <input type="hidden" name="entryId" value={entryId} />
      <input type="hidden" name="entryText" value={entryText} />
      {chosen === null ? (
        <div role="group" aria-label={copy.answerGroup} className="flex flex-wrap gap-2">
          {OWNER_WORD_ANSWERS.map((answer) => (
            <Button key={answer} type="button" variant="outline" size="touch" onClick={() => setChosen(answer)}>
              {copy.answers[answer]}
            </Button>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
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
          <p className="text-small font-medium">{fillMessage(copy.confirmQuestion, { answer: copy.answers[chosen], project: projectName })}</p>
          <p className="text-small text-muted-foreground">{copy.confirmHint}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="touch" disabled={isPending}>
              {isPending ? copy.sendingAnswer : copy.send}
            </Button>
            <Button type="button" variant="ghost" size="touch" disabled={isPending} onClick={() => setChosen(null)}>
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
