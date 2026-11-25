"use client";

// Deleting one thing: a trash-can button opens a confirmation dialog; only its Delete sends. The dialog stays open,
// its buttons disabled, until the action has finished. `ConfirmDeleteDialog` is the same dialog without the button, for
// a row menu's Delete item (CT-22), which opens it by its state.
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
import { useState, useTransition, type ReactNode } from "react";

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

export interface ConfirmDeleteDialogProps extends Omit<ConfirmDeleteButtonProps, "copy"> {
  readonly copy: Omit<ConfirmDeleteCopy, "label">;
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** Where focus goes once it closes; by default back to what opened it. */
  readonly onCloseAutoFocus?: (event: Event) => void;
  /** The button that opens it, when it has one. */
  readonly trigger?: ReactNode;
}

export function ConfirmDeleteDialog({ copy, fields, action, isOpen, onOpenChange, onCloseAutoFocus, trigger }: ConfirmDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const send = (formData: FormData) =>
    startTransition(async () => {
      await action(formData);
      onOpenChange(false);
    });
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !isPending && onOpenChange(open)}>
      {trigger}
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
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

export function ConfirmDeleteButton({ copy, fields, action }: ConfirmDeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ConfirmDeleteDialog
      copy={copy}
      fields={fields}
      action={action}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
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
      }
    />
  );
}
