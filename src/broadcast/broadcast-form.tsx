"use client";

// Writing a broadcast (CV-1): a title, the message, and the projects it goes to (every watched one picked at first).
// The form carries the broadcast's id from the page that showed it, so sending it twice is one broadcast.
import { Button, Checkbox, Field, FieldError, FieldLabel, FieldLegend, FieldSet, Input, Textarea } from "@softure-ai/theme-notion";
import { useActionState, useId, useState } from "react";
import type { AppMessages } from "../../messages/index.ts";
import { INITIAL_BROADCAST_FORM_STATE, type BroadcastFormState } from "./broadcast-form-state.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "./broadcast-limits.ts";

export interface BroadcastFormProject {
  readonly key: string;
  readonly fullName: string;
}

export interface BroadcastFormProps {
  readonly copy: AppMessages["broadcast"];
  readonly broadcastId: string;
  readonly projects: readonly BroadcastFormProject[];
  readonly action: (previous: BroadcastFormState, formData: FormData) => Promise<BroadcastFormState>;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export function BroadcastForm({ copy, broadcastId, projects, action }: BroadcastFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_BROADCAST_FORM_STATE);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(projects.map((project) => project.key)));
  const titleId = useId();
  const bodyId = useId();
  const resultId = useId();

  function togglePicked(key: string, isPicked: boolean) {
    setPicked((current) => {
      const next = new Set(current);
      if (isPicked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  return (
    <form action={formAction} className="grid gap-4" aria-describedby={resultId}>
      <input type="hidden" name="broadcastId" value={broadcastId} />
      <Field>
        <FieldLabel htmlFor={titleId}>{copy.titleLabel}</FieldLabel>
        <Input
          id={titleId}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={copy.titlePlaceholder}
          maxLength={MAX_TITLE_LENGTH}
          required
          className="min-h-touch-target md:min-h-0"
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={bodyId}>{copy.bodyLabel}</FieldLabel>
        <Textarea
          id={bodyId}
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={copy.bodyPlaceholder}
          maxLength={MAX_BODY_LENGTH}
          rows={6}
          required
        />
      </Field>
      <FieldSet>
        <FieldLegend variant="label">{copy.projectsLegend}</FieldLegend>
        <p className="text-small text-muted-foreground">{copy.projectsHint}</p>
        <ul className="grid gap-1">
          {projects.map((project) => {
            const checkboxId = `${resultId}-${project.key}`;
            return (
              <li key={project.key} className="flex min-h-touch-target min-w-0 items-center gap-2 md:min-h-row-height">
                <Checkbox
                  id={checkboxId}
                  name="project"
                  value={project.key}
                  checked={picked.has(project.key)}
                  onCheckedChange={(checked) => togglePicked(project.key, checked === true)}
                />
                <label htmlFor={checkboxId} className="min-w-0 flex-1 truncate py-2 text-ui">
                  {project.fullName}
                </label>
              </li>
            );
          })}
        </ul>
      </FieldSet>
      <p className="text-small text-muted-foreground">{copy.confirmHint}</p>
      <div>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending || picked.size === 0}>
          {isPending ? copy.sending : copy.send}
        </Button>
      </div>
      <div id={resultId} role="status" aria-live="polite">
        {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      </div>
    </form>
  );
}
