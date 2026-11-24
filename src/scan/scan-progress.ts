// How far the scan of every watched project is, for the header's refresh: a running scan's count, a waiting one, or
// the newest read time when none runs. The count is the job progress the scan handler reports (`SCAN_PROGRESS_STEP`).
import type { JobProgress, JobStatus } from "@softure-ai/jobs";
import { z } from "zod";

/** The step the scan reports its progress under: `done` of `total` projects read. */
export const SCAN_PROGRESS_STEP = "scan.projects";

export type ScanProgress =
  | { readonly kind: "idle"; readonly lastReadAt: Date | null }
  | { readonly kind: "queued"; readonly lastReadAt: Date | null }
  | { readonly kind: "running"; readonly done: number | null; readonly total: number | null; readonly lastReadAt: Date | null };

export interface ScanProgressInput {
  /** The scan queue's live jobs (pending or running), in any order. */
  readonly jobs: readonly { readonly status: JobStatus; readonly progress: JobProgress | null }[];
  /** When each watched project was last read. */
  readonly readTimes: readonly Date[];
}

function findNewest(times: readonly Date[]): Date | null {
  let newest: Date | null = null;
  for (const time of times) {
    if (newest === null || time.getTime() > newest.getTime()) {
      newest = time;
    }
  }
  return newest;
}

export function toScanProgress({ jobs, readTimes }: ScanProgressInput): ScanProgress {
  const lastReadAt = findNewest(readTimes);
  const running = jobs.find((job) => job.status === "running");
  if (running !== undefined) {
    const progress = running.progress?.step === SCAN_PROGRESS_STEP ? running.progress : null;
    return { kind: "running", done: progress?.done ?? null, total: progress?.total ?? null, lastReadAt };
  }
  if (jobs.some((job) => job.status === "pending")) {
    return { kind: "queued", lastReadAt };
  }
  return { kind: "idle", lastReadAt };
}

/** `ScanProgress` as the header's refresh shows it: the read time already written for the owner. */
export const scanProgressViewSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("idle"), lastRead: z.string().nullable() }),
  z.object({ kind: z.literal("queued"), lastRead: z.string().nullable() }),
  z.object({ kind: z.literal("running"), done: z.number().nullable(), total: z.number().nullable(), lastRead: z.string().nullable() }),
]);

export type ScanProgressView = z.output<typeof scanProgressViewSchema>;

export function toScanProgressView(progress: ScanProgress, formatTime: (date: Date) => string): ScanProgressView {
  const lastRead = progress.lastReadAt === null ? null : formatTime(progress.lastReadAt);
  if (progress.kind === "running") {
    return { kind: "running", done: progress.done, total: progress.total, lastRead };
  }
  return { kind: progress.kind, lastRead };
}
