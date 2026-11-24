"use client";

// The header's refresh (CT-9): "Refresh" queues a scan of every watched project; while it waits or runs the control
// asks how far it is every second and counts up live ("2 of 5 refreshed"), and once it ends the page reloads its data.
// When nothing runs it says when the projects were last read.
import { Button, ICON_STROKE_WIDTH, MiniProgress } from "@softure-ai/theme-notion";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { ScanNowState } from "../scan/scan-now-button.tsx";
import { scanProgressViewSchema, type ScanProgressView } from "../scan/scan-progress.ts";

/** The jobs package writes a scan's progress at most once a second, so asking more often shows nothing new. */
const POLL_MS = 1_000;
const PROGRESS_URL = "/api/scan-progress";

export interface RefreshControlProps {
  readonly copy: AppMessages["refresh"];
  /** How far the scan was when the page was rendered. */
  readonly initial: ScanProgressView;
  readonly action: (previous: ScanNowState) => Promise<ScanNowState>;
}

async function fetchProgress(): Promise<ScanProgressView | null> {
  try {
    const response = await fetch(PROGRESS_URL, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const parsed = scanProgressViewSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    // A lost poll is retried by the next tick; the control keeps the last answer meanwhile.
    return null;
  }
}

function describeProgress(copy: AppMessages["refresh"], progress: ScanProgressView): string {
  if (progress.kind === "running") {
    return progress.done === null || progress.total === null ? copy.running : fillMessage(copy.counted, { done: progress.done, total: progress.total });
  }
  if (progress.kind === "queued") {
    return copy.queued;
  }
  return progress.lastRead === null ? copy.neverRead : fillMessage(copy.lastRead, { time: progress.lastRead });
}

export function RefreshControl({ copy, initial, action }: RefreshControlProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<ScanProgressView>(initial);
  const [hasFailed, setHasFailed] = useState(false);
  const [isStarting, startTransition] = useTransition();
  const isBusy = isStarting || progress.kind !== "idle";

  // A fresh render of the page (after a scan, or a navigation) brings the server's newest answer.
  const initialKey = JSON.stringify(initial);
  const [shownKey, setShownKey] = useState(initialKey);
  if (shownKey !== initialKey) {
    setShownKey(initialKey);
    setProgress(initial);
  }

  useEffect(() => {
    if (progress.kind === "idle") {
      return undefined;
    }
    let isCurrent = true;
    const timer = window.setTimeout(() => {
      void fetchProgress().then((next) => {
        if (!isCurrent || next === null) {
          return;
        }
        setProgress(next);
        if (next.kind === "idle") {
          router.refresh();
        }
      });
    }, POLL_MS);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [progress, router]);

  function refresh() {
    setHasFailed(false);
    startTransition(async () => {
      const state = await action("idle");
      if (state === "queued") {
        setProgress((current) => (current.kind === "idle" ? { kind: "queued", lastRead: current.lastRead } : current));
      } else {
        setHasFailed(true);
      }
    });
  }

  const percent = progress.kind === "running" && progress.done !== null && progress.total !== null && progress.total > 0 ? (progress.done / progress.total) * 100 : null;
  return (
    <div role="group" aria-label={copy.groupLabel} className="flex min-w-0 items-center gap-2">
      <p aria-live="polite" aria-atomic="true" className="flex min-w-0 items-center gap-2 text-small text-muted-foreground">
        <span className="truncate">{hasFailed ? copy.failed : describeProgress(copy, progress)}</span>
        {percent === null ? null : <MiniProgress value={percent} label="" aria-label={copy.progressLabel} className="hidden w-16 shrink-0 sm:block" />}
      </p>
      <Button type="button" variant="outline" size="touch" className="shrink-0 md:h-7 md:px-2.5" onClick={refresh} disabled={isBusy}>
        <RefreshCw aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} className={isBusy ? "size-3.5 motion-safe:animate-spin" : "size-3.5"} />
        {copy.button}
      </Button>
    </div>
  );
}
