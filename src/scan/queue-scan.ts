// Queues a run of the scan schedule now, joining one that is already waiting: "Scan now", and adding a watched
// repository so its first read does not wait for the next period.
import { runScheduleNow, type JobsContext, type RunScheduleNowResult } from "@softure-ai/jobs/server";
import { SCAN_QUEUE } from "./scan-queue.ts";

export type ScanOrigin = "manual" | "repository_added";

export async function queueScan(context: JobsContext, origin: ScanOrigin = "manual"): Promise<RunScheduleNowResult> {
  return runScheduleNow(context, SCAN_QUEUE, { origin });
}
