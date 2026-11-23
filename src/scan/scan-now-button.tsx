"use client";

// The "Scan now" button; while a scan waits or runs, the page refreshes itself so the reads appear.
import { Button } from "@softure-ai/theme-notion";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import type { AppMessages } from "../../messages/index.ts";

export type ScanNowState = "idle" | "queued" | "failed";

const REFRESH_MS = 2_000;

export interface ScanNowButtonProps {
  readonly copy: AppMessages["scan"];
  readonly isScanning: boolean;
  readonly action: (previous: ScanNowState) => Promise<ScanNowState>;
}

export function ScanNowButton({ copy, isScanning, action }: ScanNowButtonProps) {
  const [state, formAction, isPending] = useActionState(action, "idle");
  const router = useRouter();
  const isWaiting = isScanning || (state === "queued" && !isPending);

  useEffect(() => {
    if (!isWaiting) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      router.refresh();
    }, REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [isWaiting, router]);

  return (
    <form action={formAction} className="grid gap-2">
      <div>
        <Button type="submit" size="touch" className="md:h-7 md:px-2.5" disabled={isPending}>
          {copy.scanNow}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="text-small text-muted-foreground">
        {state === "queued" && isScanning ? copy.queued : null}
        {state === "failed" ? copy.queueFailed : null}
      </p>
    </form>
  );
}
