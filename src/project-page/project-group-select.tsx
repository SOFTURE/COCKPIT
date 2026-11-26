"use client";

// The project's group on its Settings tab (CT-31): the theme Select saves the pick at once. While saving the select is
// disabled; a saved pick shows a muted "Saved" after the row's title; a refused one shows a FieldError under the
// select and the select goes back to the stored group.
import { FieldError, Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@softure-ai/theme-notion";
import { useState, useTransition } from "react";
import { SettingsRow } from "../settings/settings-row.tsx";
import { NO_GROUP_VALUE, toGroupIdField, type ProjectGroupOptions } from "./project-group-options.ts";

export interface ProjectGroupSaveResult {
  readonly ok: boolean;
  readonly message: string;
}

export interface ProjectGroupSelectCopy {
  readonly title: string;
  readonly hint: string;
  readonly helpLabel: string;
  readonly noGroup: string;
  readonly saved: string;
}

export interface ProjectGroupSelectProps {
  readonly repositoryKey: string;
  readonly options: ProjectGroupOptions;
  readonly copy: ProjectGroupSelectCopy;
  readonly action: (formData: FormData) => Promise<ProjectGroupSaveResult>;
}

// Items are touch targets on a phone and rows of the usual height from `md`, like the trigger.
const ITEM_SIZE = "max-md:min-h-touch-target";

type SaveState = { readonly status: "idle" } | { readonly status: "saved" } | { readonly status: "failed"; readonly message: string };

export function ProjectGroupSelect({ repositoryKey, options, copy, action }: ProjectGroupSelectProps) {
  const [value, setValue] = useState(options.selected);
  const [stored, setStored] = useState(options.selected);
  const [save, setSave] = useState<SaveState>({ status: "idle" });
  const [isSaving, startSaving] = useTransition();

  function pick(next: string) {
    if (next === value) {
      return;
    }
    setValue(next);
    setSave({ status: "idle" });
    startSaving(async () => {
      const formData = new FormData();
      formData.set("repositoryKey", repositoryKey);
      formData.set("groupId", toGroupIdField(next));
      const result = await action(formData);
      if (result.ok) {
        setStored(next);
        setSave({ status: "saved" });
      } else {
        setValue(stored);
        setSave({ status: "failed", message: result.message });
      }
    });
  }

  const isFailed = save.status === "failed";
  return (
    <SettingsRow
      title={copy.title}
      hint={copy.hint}
      helpLabel={copy.helpLabel}
      status={save.status === "saved" ? copy.saved : ""}
      stackOnPhone
      action={
        <>
          <Select value={value} onValueChange={pick} disabled={isSaving}>
            <SelectTrigger size="touch" className="w-full md:h-7 md:w-64" aria-label={copy.title} aria-invalid={isFailed || undefined} data-project-group-select>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.groups.map((group) => (
                <SelectItem key={group.value} value={group.value} className={ITEM_SIZE}>
                  {group.label}
                </SelectItem>
              ))}
              {options.groups.length === 0 ? null : <SelectSeparator />}
              <SelectItem value={NO_GROUP_VALUE} className={ITEM_SIZE}>{copy.noGroup}</SelectItem>
            </SelectContent>
          </Select>
          {isFailed ? <FieldError className="md:max-w-64">{save.message}</FieldError> : null}
        </>
      }
    />
  );
}
