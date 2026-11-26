"use client";

// The project picker in the owner's groups (CT-34; shared since CT-38 by the Broadcast form and the scheduled task
// dialog). One fieldset named by its legend, with the "?" hint, Pick all / Clear all and the total "N of M picked"; then
// one fieldset per `groupProjects` section with a checkbox that picks or clears that group and its own count, and one
// labelled checkbox per project (`name="project"`, so the form posts the picked keys). Controlled: the form owns the
// picked set. `layout="page"` lays projects out in more columns as the screen widens; `layout="dialog"` keeps at most
// two in a bordered box that scrolls after 320 px.
import { Button, Checkbox, FieldLegend, FieldSet } from "@softure-ai/theme-notion";
import { useId } from "react";
import { fillMessage } from "../../messages/index.ts";
import type { ProjectGroupSection } from "../projects/group-projects.ts";
import { LabelWithHelp } from "./field-help.tsx";
import { countPicked, getGroupPickState, setPicked, type GroupPickState } from "./project-picks.ts";

export interface PickerProject {
  readonly key: string;
  readonly fullName: string;
}

/** The picker's words; each form passes its own block's keys. */
export interface ProjectPickerCopy {
  readonly fieldHelpLabel: string;
  readonly projectsLegend: string;
  readonly projectsHint: string;
  readonly pickAll: string;
  readonly clearAll: string;
  /** "{picked} of {total} picked" */
  readonly pickedCount: string;
  readonly projectsNoGroup: string;
  /** "{picked} of {total}" */
  readonly groupPickedCount: string;
}

export type ProjectPickerLayout = "page" | "dialog";

export interface ProjectPickerProps {
  readonly copy: ProjectPickerCopy;
  /** The watched projects in the owner's groups, as `groupProjects` lays them out (No group last). */
  readonly sections: readonly ProjectGroupSection<PickerProject>[];
  readonly picked: ReadonlySet<string>;
  readonly onPickedChange: (picked: ReadonlySet<string>) => void;
  readonly layout?: ProjectPickerLayout;
  /** Ids of elements that describe the field too, such as its error. */
  readonly describedBy?: string;
  readonly isInvalid?: boolean;
}

type CheckedState = boolean | "indeterminate";

const GROUP_CHECKED: Record<GroupPickState, CheckedState> = { all: true, some: "indeterminate", none: false };

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

const LAYOUT_CLASSES: Record<ProjectPickerLayout, { readonly groups: string; readonly projects: string }> = {
  // One column on a phone, more as the width allows, so a long list does not scroll forever.
  page: { groups: "grid gap-4", projects: "grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" },
  // A dialog is narrow whatever the screen: two columns at most, the list scrolling inside its own box. The box is
  // `relative` so the checkboxes' hidden form inputs (absolutely placed) stay inside it instead of stretching the
  // dialog's own scroll height.
  dialog: {
    groups: "relative grid max-h-80 gap-4 overflow-y-auto rounded-md border border-border p-3",
    projects: "grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2",
  },
};

export function ProjectPicker({ copy, sections, picked, onPickedChange, layout = "page", describedBy, isInvalid }: ProjectPickerProps) {
  const baseId = useId();
  const labelId = `${baseId}-label`;
  const hintId = `${baseId}-hint`;
  const allKeys = sections.flatMap((section) => section.projects.map((project) => project.key));
  // Counted against the projects shown now, so a key left over from an earlier list never counts.
  const pickedCount = countPicked(allKeys, picked);
  const classes = LAYOUT_CLASSES[layout];

  function pick(keys: readonly string[], isPicked: boolean) {
    onPickedChange(setPicked(picked, keys, isPicked));
  }

  return (
    // The group is named by the legend's text alone, so the "?" and its hidden hint stay out of the name.
    <FieldSet
      aria-labelledby={labelId}
      aria-describedby={describedBy === undefined ? hintId : `${hintId} ${describedBy}`}
      aria-invalid={isInvalid || undefined}
      data-invalid={isInvalid || undefined}
      data-project-picker={layout}
    >
      <FieldLegend variant="label">
        <LabelWithHelp id={hintId} label={fillMessage(copy.fieldHelpLabel, { field: copy.projectsLegend })} text={copy.projectsHint}>
          <span id={labelId}>{copy.projectsLegend}</span>
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
      <div className={classes.groups}>
        {sections.map((section) => {
          const groupId = `${baseId}-group-${String(section.group?.id ?? "none")}`;
          const keys = section.projects.map((project) => project.key);
          return (
            // Named by the group's name alone, so the count beside it stays out of the name.
            <FieldSet key={groupId} aria-labelledby={`${groupId}-name`} className="gap-1" data-group={section.group?.id ?? "none"}>
              <FieldLegend className="mb-0 flex w-full min-w-0 items-center gap-2 font-normal">
                <span className="flex min-h-touch-target min-w-0 items-center gap-2 md:min-h-row-height">
                  <Checkbox id={groupId} checked={GROUP_CHECKED[getGroupPickState(keys, picked)]} onCheckedChange={(checked) => pick(keys, checked === true)} />
                  <label id={`${groupId}-name`} htmlFor={groupId} title={section.group?.name ?? copy.projectsNoGroup} className="min-w-0 truncate py-2 text-ui font-semibold">
                    {section.group?.name ?? copy.projectsNoGroup}
                  </label>
                </span>
                <span className="shrink-0 text-small text-muted-foreground" data-slot="group-picked-count">
                  {fillMessage(copy.groupPickedCount, { picked: countPicked(keys, picked), total: keys.length })}
                </span>
              </FieldLegend>
              <ul className={classes.projects}>
                {section.projects.map((project) => {
                  const checkboxId = `${baseId}-${project.key}`;
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
  );
}
