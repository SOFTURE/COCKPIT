"use client";

// A field's hint as a question mark beside its label: hover or focus shows it as a tooltip, and a click or a tap opens
// it (a phone has no hover). The hint text also stays in the page, hidden, so the field can name it with
// aria-describedby.
import { Tooltip, TooltipContent, TooltipTrigger } from "@softure-ai/theme-notion";
import { CircleHelp } from "lucide-react";
import { useState, type MouseEvent, type ReactNode } from "react";

export function FieldHelp({ id, label, text }: {
  /** The id of the hidden hint, for the field's aria-describedby. */
  readonly id: string;
  /** The button's name, e.g. "Help: Token". */
  readonly label: string;
  readonly text: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  // A click always opens the hint, never toggles it. Radix closes a tooltip on every click (its trigger calls onClose
  // unless the event is default-prevented), and hover may already have opened it during the press, so a toggle would
  // close the hint the click asked for. preventDefault skips that close; the button submits nothing. Escape, a press
  // elsewhere, a blur or leaving with the pointer still close it.
  function openOnClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsOpen(true);
  }
  return (
    <>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={openOnClick}
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

/**
 * A label (or a badge, a title) with its hint as the "?" beside it: the one shape every field and setting hint in
 * COCKPIT takes. The element the hint explains names it with `aria-describedby={id}`.
 */
export function LabelWithHelp({ id, label, text, children }: {
  /** The id of the hidden hint, for the described element's aria-describedby. */
  readonly id: string;
  /** The "?" button's name, e.g. "Help: Token". */
  readonly label: string;
  readonly text: string;
  readonly children: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      {children}
      <FieldHelp id={id} label={label} text={text} />
    </span>
  );
}
