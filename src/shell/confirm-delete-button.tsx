"use client";

// Deleting one thing: a trash-can button opens a confirmation dialog; only its Delete sends. The dialog stays open,
// its buttons disabled, until the action has finished. A row menu's Delete uses theme-notion's `RowActionsMenu`
// confirmation instead (CT-27).
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
} from "@softure-ai/theme-notion";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

export interface ConfirmDeleteCopy {
  /** The trash can's name, e.g. "Delete Run the doctor". */
  readonly label: string;
  readonly question: string;
  readonly hint: string;
  readonly delete: string;
  readonly deleting: string;
  readonly cancel: string;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export interface ConfirmDeleteButtonProps {
  readonly copy: ConfirmDeleteCopy;
  /** The hidden fields the action reads. */
  readonly fields: Readonly<Record<string, string>>;
  readonly action: (formData: FormData) => Promise<void>;
}

export function ConfirmDeleteButton({ copy, fields, action }: ConfirmDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const send = (formData: FormData) =>
    startTransition(async () => {
      await action(formData);
      setIsOpen(false);
    });
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !isPending && setIsOpen(open)}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-touch"
          className="text-muted-foreground hover:text-foreground md:size-8"
          aria-label={copy.label}
          title={copy.delete}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={send} className="grid gap-4">
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.question}</AlertDialogTitle>
            <AlertDialogDescription>{copy.hint}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="touch" className={CONTROL_SIZE} disabled={isPending}>
              {copy.cancel}
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" size="touch" className={CONTROL_SIZE} disabled={isPending}>
              {isPending ? copy.deleting : copy.delete}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
