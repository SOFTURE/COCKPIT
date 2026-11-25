"use client";

// Promoting a queued roadmap, or one of its items, to work: a button opens a confirmation that names the project and
// what happens; only the confirmation sends. Once sent (now or earlier) the control is the link to the issue.
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  FieldError,
} from "@softure-ai/theme-notion";
import { Rocket } from "lucide-react";
import { useActionState, useState } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { INITIAL_PROMOTE_FORM_STATE, type PromoteFormState } from "./promote-form-state.ts";

export interface PromoteFormProps {
  readonly copy: AppMessages["roadmapView"]["promote"];
  readonly repositoryKey: string;
  readonly projectName: string;
  readonly slug: string;
  readonly roadmapName: string;
  /** The item to promote; null promotes the whole roadmap. */
  readonly itemId: string | null;
  /** The open issue that already promotes it, with the text that names it. */
  readonly sent: { readonly text: string; readonly url: string; readonly number: number } | null;
  readonly action: (previous: PromoteFormState, formData: FormData) => Promise<PromoteFormState>;
}

// 44 px on a phone, the theme's 28 px control from md up (as the page's other actions).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

/** The issue it became; a row on a phone shows only its number, with the full text as its name. */
function SentLink({ text, url, number, isCompact }: { readonly text: string; readonly url: string; readonly number: number; readonly isCompact: boolean }) {
  return (
    <a
      href={url}
      rel="noreferrer"
      target="_blank"
      aria-label={isCompact ? text : undefined}
      className="inline-flex min-h-touch-target items-center px-1 text-small whitespace-nowrap underline underline-offset-2 md:min-h-7"
      data-promoted
    >
      {isCompact ? (
        <>
          <span className="hidden sm:inline">{text}</span>
          <span className="sm:hidden">{`#${String(number)}`}</span>
        </>
      ) : (
        text
      )}
    </a>
  );
}

export function PromoteForm({ copy, repositoryKey, projectName, slug, roadmapName, itemId, sent, action }: PromoteFormProps) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_PROMOTE_FORM_STATE);
  const [isOpen, setIsOpen] = useState(false);

  if (state.status === "sent") {
    return (
      <span role="status">
        <SentLink text={state.message} url={state.issueUrl} number={state.issueNumber} isCompact={itemId !== null} />
      </span>
    );
  }
  if (sent !== null) {
    return <SentLink text={sent.text} url={sent.url} number={sent.number} isCompact={itemId !== null} />;
  }

  const isWhole = itemId === null;
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !isPending && setIsOpen(open)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="touch"
          className={CONTROL_SIZE}
          aria-label={isWhole ? undefined : fillMessage(copy.itemButtonLabel, { id: itemId })}
          title={isWhole ? undefined : fillMessage(copy.itemButtonLabel, { id: itemId })}
          data-promote={itemId ?? "roadmap"}
        >
          <Rocket aria-hidden="true" />
          {isWhole ? copy.wholeButton : <span className="hidden sm:inline">{copy.itemButton}</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="repositoryKey" value={repositoryKey} />
          <input type="hidden" name="slug" value={slug} />
          {isWhole ? null : <input type="hidden" name="itemId" value={itemId} />}
          <AlertDialogHeader>
            <AlertDialogTitle>{isWhole ? fillMessage(copy.wholeQuestion, { roadmap: roadmapName }) : fillMessage(copy.itemQuestion, { id: itemId })}</AlertDialogTitle>
            <AlertDialogDescription>{fillMessage(isWhole ? copy.wholeHint : copy.itemHint, { project: projectName })}</AlertDialogDescription>
          </AlertDialogHeader>
          <div role="status" aria-live="polite">
            {state.status === "failed" ? <FieldError>{state.message}</FieldError> : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel size="touch" className={CONTROL_SIZE} disabled={isPending}>
              {copy.cancel}
            </AlertDialogCancel>
            <Button type="submit" size="touch" className={CONTROL_SIZE} disabled={isPending}>
              {isPending ? copy.sending : copy.send}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
