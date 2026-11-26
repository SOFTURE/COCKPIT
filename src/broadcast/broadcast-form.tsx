"use client";

// Writing a broadcast (CV-1): a title, the message, and the projects it goes to (every watched one picked at first).
// The form carries the broadcast's id from the page that showed it, so sending it twice is one broadcast. The projects
// sit in the owner's groups (CT-34): one fieldset per section from `groupProjects`, each with a checkbox that picks or
// clears that group, under the field's Pick all / Clear all and total count.
import { Button, Checkbox, Field, FieldError, FieldLabel, FieldLegend, FieldSet, Input, Textarea } from "@softure-ai/theme-notion";
import { useActionState, useId, useState } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { LabelWithHelp } from "../shell/field-help.tsx";
import type { ProjectGroupSection } from "../projects/group-projects.ts";
import { INITIAL_BROADCAST_FORM_STATE, type BroadcastFormState } from "./broadcast-form-state.ts";
import { MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from "./broadcast-limits.ts";
import { countPicked, getGroupPickState, setPicked, type GroupPickState } from "./project-picks.ts";

export interface BroadcastFormProject {
  readonly key: string;
  readonly fullName: string;
}

type CheckedState = boolean | "indeterminate";

const GROUP_CHECKED: Record<GroupPickState, CheckedState> = { all: true, some: "indeterminate", none: false };

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
  const projectsLabelId = useId();
  const projectsHintId = useId();

  function pick(keys: readonly string[], isPicked: boolean) {
    setPickedKeys((current) => setPicked(current, keys, isPicked));
  }

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
      {/* The group is named by the legend's text alone, so the "?" and its hidden hint stay out of the name. */}
      <FieldSet aria-labelledby={projectsLabelId} aria-describedby={projectsHintId}>
        <FieldLegend variant="label">
          <LabelWithHelp id={projectsHintId} label={fillMessage(copy.fieldHelpLabel, { field: copy.projectsLegend })} text={copy.projectsHint}>
            <span id={projectsLabelId}>{copy.projectsLegend}</span>
          </LabelWithHelp>
        </FieldLegend>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} onClick={() => pick(allKeys, true)} disabled={pickedCount === allKeys.length}>
            {copy.pickAll}
          </Button>
          <Button type="button" variant="outline" size="touch" className={CONTROL_SIZE} onClick={() => pick(allKeys, false)} disabled={pickedCount === 0}>
            {copy.clearAll}
          </Button>
          <span className="text-small text-muted-foreground" aria-live="polite">
            {fillMessage(copy.pickedCount, { picked: pickedCount, total: allKeys.length })}
          </span>
        </div>
        <div className="grid gap-4">
          {sections.map((section) => {
            const groupId = `${resultId}-group-${String(section.group?.id ?? "none")}`;
            const keys = section.projects.map((project) => project.key);
            return (
              // Named by the group's name alone, so the count beside it stays out of the name.
              <FieldSet key={groupId} aria-labelledby={`${groupId}-name`} className="gap-1" data-group={section.group?.id ?? "none"}>
                <FieldLegend className="mb-0 flex w-full min-w-0 items-center gap-2 font-normal">
                  <span className="flex min-h-touch-target min-w-0 items-center gap-2 md:min-h-row-height">
                    <Checkbox
                      id={groupId}
                      checked={GROUP_CHECKED[getGroupPickState(keys, picked)]}
                      onCheckedChange={(checked) => pick(keys, checked === true)}
                    />
                    <label id={`${groupId}-name`} htmlFor={groupId} title={section.group?.name ?? copy.projectsNoGroup} className="min-w-0 truncate py-2 text-ui font-semibold">
                      {section.group?.name ?? copy.projectsNoGroup}
                    </label>
                  </span>
                  <span className="shrink-0 text-small text-muted-foreground" data-slot="group-picked-count">
                    {fillMessage(copy.groupPickedCount, { picked: countPicked(keys, picked), total: keys.length })}
                  </span>
                </FieldLegend>
                {/* One column on a phone, more as the width allows, so a long list does not scroll forever. */}
                <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {section.projects.map((project) => {
                    const checkboxId = `${resultId}-${project.key}`;
                    return (
                      <li key={project.key} className="flex min-h-touch-target min-w-0 items-center gap-2 md:min-h-row-height">
                        <Checkbox
                          id={checkboxId}
                          name="project"
                          value={project.key}
                          checked={picked.has(project.key)}
                          onCheckedChange={(checked) => pick([project.key], checked === true)}
                        />
                        <label htmlFor={checkboxId} title={project.fullName} className="min-w-0 flex-1 truncate py-2 text-ui">
                          {project.fullName}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </FieldSet>
            );
          })}
        </div>
      </FieldSet>
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
