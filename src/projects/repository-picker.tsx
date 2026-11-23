"use client";

// The Repository field: a search over the repositories the token can read, as a combobox. Picking fills the field;
// a typed `owner/name` is sent as it is, so a repository missing from the list can still be added. The command menu
// names its input itself (`label`, its own id), so the field's accessible name is the label passed here.
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@softure-ai/theme-notion";
import { FolderGit2 } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import type { AppMessages } from "../../messages/index.ts";

export interface RepositoryPickerProps {
  readonly copy: AppMessages["repositories"];
  readonly suggestions: readonly string[];
  readonly defaultValue: string;
  readonly isInvalid: boolean;
  readonly describedBy: string;
}

export function RepositoryPicker({ copy, suggestions, defaultValue, isInvalid, describedBy }: RepositoryPickerProps) {
  const [value, setValue] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const hasSuggestions = suggestions.length > 0;

  function choose(name: string) {
    setValue(name);
    setIsOpen(false);
  }

  function submitWhenNothingHighlighted(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    const root = event.currentTarget.closest("[cmdk-root]");
    const isItemHighlighted = isOpen && root?.querySelector('[cmdk-item][data-selected="true"]') != null;
    if (!isItemHighlighted) {
      // The command menu swallows Enter; with nothing to pick it submits the form, as a plain field would.
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <Command label={copy.nameLabel} loop className="relative min-w-0 flex-1 basis-48 overflow-visible bg-transparent">
      <CommandInput
        name="repository"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder={hasSuggestions ? copy.searchPlaceholder : copy.namePlaceholder}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={submitWhenNothingHighlighted}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className="h-full py-0"
        wrapperClassName="h-touch-target rounded-md border border-input bg-background px-2.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 md:h-7"
      />
      {isOpen && hasSuggestions ? (
        <CommandList aria-label={copy.suggestionsLabel} className="absolute top-full right-0 left-0 z-50 mt-1 rounded-lg bg-popover p-1 shadow-menu">
          <CommandEmpty>{copy.noMatch}</CommandEmpty>
          {suggestions.map((name) => (
            <CommandItem key={name} value={name} onMouseDown={(event) => event.preventDefault()} onSelect={() => choose(name)}>
              <FolderGit2 aria-hidden="true" />
              <span className="truncate">{name}</span>
            </CommandItem>
          ))}
        </CommandList>
      ) : null}
    </Command>
  );
}
