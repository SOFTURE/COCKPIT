"use client";

// The "Scan now" button; while a scan waits or runs, the page refreshes itself so the reads appear.
// A refresh is a navigation to the current URL that re-fetches everything, and one started while another navigation
// is in flight replaces that navigation's pending render. So the next refresh starts only after the previous one
// committed: a fixed interval shorter than a slow answer kept replacing every render and held the person on this page.
import { Button } from "@softure-ai/theme-notion";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
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
  const [isRefreshing, startRefresh] = useTransition();
  // The page after a press is rendered fresh (the action revalidates it), so isScanning alone says whether to wait.
  const isWaiting = isScanning && !isPending;

  useEffect(() => {
    if (!isWaiting || isRefreshing) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      startRefresh(() => {
        router.refresh();
      });
    }, REFRESH_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isWaiting, isRefreshing, router]);

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
