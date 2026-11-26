"use client";

// Writing a broadcast (CV-1): a title, the message, and the projects it goes to (every watched one picked at first).
// The form carries the broadcast's id from the page that showed it, so sending it twice is one broadcast. The projects
// sit in the owner's groups (CT-34) in the shared `ProjectPicker` (CT-38).
import { Button, Field, FieldError, FieldLabel, Input, Textarea } from "@softure-ai/theme-notion";
import { useActionState, useId, useState } from "react";
import type { AppMessages } from "../../messages/index.ts";
import type { ProjectGroupSection } from "../projects/group-projects.ts";
import { ProjectPicker, type PickerProject } from "../shell/project-picker.tsx";
import { countPicked } from "../shell/project-picks.ts";
import { INITIAL_BROADCAST_FORM_STATE, type BroadcastFormState } from "./broadcast-form-state.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "./broadcast-limits.ts";

export type BroadcastFormProject = PickerProject;

export interface BroadcastFormProps {
  readonly copy: AppMessages["broadcast"];
  readonly broadcastId: string;
  /** The watched projects in the owner's groups, as `groupProjects` lays them out (No group last). */
  readonly sections: readonly ProjectGroupSection<BroadcastFormProject>[];
  readonly action: (previous: BroadcastFormState, formData: FormData) => Promise<BroadcastFormState>;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export function BroadcastForm({ copy, broadcastId, sections, action }: BroadcastFormProps) {
  const allKeys = sections.flatMap((section) => section.projects.map((project) => project.key));
  const [state, formAction, isPending] = useActionState(action, INITIAL_BROADCAST_FORM_STATE);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [picked, setPickedKeys] = useState<ReadonlySet<string>>(() => new Set(allKeys));
  const titleId = useId();
  const bodyId = useId();
  const resultId = useId();

  // Counted against the projects shown now, so a key left over from an earlier list never counts.
  const pickedCount = countPicked(allKeys, picked);

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
      <ProjectPicker copy={copy} sections={sections} picked={picked} onPickedChange={setPickedKeys} />
      <p className="text-small text-muted-foreground">{copy.confirmHint}</p>
      <div>
        <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending || pickedCount === 0}>
          {isPending ? copy.sending : copy.send}
        </Button>
      </div>
      <div id={resultId} role="status" aria-live="polite">
        {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
      </div>
    </form>
  );
}
