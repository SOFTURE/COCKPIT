"use client";

// Deleting one sent broadcast from COCKPIT's history: the trash can opens a confirm in place; only the confirmation
// sends. The issues the broadcast created in the projects stay, and the confirm says so.
import { Button } from "@softure-ai/theme-notion";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";

export interface DeleteBroadcastButtonProps {
  readonly copy: AppMessages["broadcast"];
  readonly broadcastId: string;
  readonly title: string;
  readonly action: (formData: FormData) => Promise<void>;
}

// 44 px on a phone, the theme's 28 px control from md up (as on Settings).
const CONTROL_SIZE = "md:h-7 md:px-2.5";

export function DeleteBroadcastButton({ copy, broadcastId, title, action }: DeleteBroadcastButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isConfirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-touch"
        className="text-muted-foreground hover:text-foreground md:size-8"
        aria-label={fillMessage(copy.deleteLabel, { title })}
        title={copy.delete}
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    );
  }

  return (
    <form
      action={(formData) => startTransition(() => action(formData))}
      role="group"
      aria-label={fillMessage(copy.deleteLabel, { title })}
      className="grid justify-items-start gap-2 md:justify-items-end"
    >
      <input type="hidden" name="broadcastId" value={broadcastId} />
      <p className="text-small font-medium">{copy.deleteQuestion}</p>
      <p className="text-small text-muted-foreground">{copy.deleteHint}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="destructive" size="touch" className={CONTROL_SIZE} disabled={isPending}>
          {isPending ? copy.deleting : copy.delete}
        </Button>
        <Button type="button" variant="ghost" size="touch" className={CONTROL_SIZE} disabled={isPending} onClick={() => setIsConfirming(false)}>
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}
