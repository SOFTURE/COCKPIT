"use client";

// A field's hint as a question mark beside its label: hover or focus shows it as a tooltip, a tap toggles it (a phone
// has no hover). The hint text also stays in the page, hidden, so the field can name it with aria-describedby.
import { Tooltip, TooltipContent, TooltipTrigger } from "@softure-ai/theme-notion";
import { CircleHelp } from "lucide-react";
import { useState } from "react";

export function FieldHelp({ id, label, text }: {
  /** The id of the hidden hint, for the field's aria-describedby. */
  readonly id: string;
  /** The button's name, e.g. "Help: Token". */
  readonly label: string;
  readonly text: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={() => setIsOpen((open) => !open)}
            className="-my-2 inline-flex size-touch-target items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:my-0 md:size-5"
            data-field-help
          >
            <CircleHelp aria-hidden="true" className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-72 break-words">
          {text}
        </TooltipContent>
      </Tooltip>
      <span id={id} className="sr-only">
        {text}
      </span>
    </>
  );
}
