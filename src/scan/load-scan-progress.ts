// Reads how far the scan is for the header's refresh: the scan queue's live jobs and every project's last read.
import "server-only";
import { systemClock } from "@softure-ai/core";
import { listRecentJobs } from "@softure-ai/jobs/server";
import { findReads } from "../../modules/projects/reads.ts";
import config from "../../softure.config.ts";
import { getDatabase } from "../database.ts";
import { createTimeFormatter } from "../projects/format-time.ts";
import { SCAN_QUEUE } from "./scan-queue.ts";
import { toScanProgress, toScanProgressView, type ScanProgressView } from "./scan-progress.ts";

/** A running scan and the follow-up "Scan now" may queue behind it are at most two; a few more cost nothing. */
const LIVE_SCAN_LIMIT = 5;

export async function loadScanProgress(): Promise<ScanProgressView> {
  const { db } = await getDatabase();
  const [jobs, reads] = await Promise.all([
    listRecentJobs({ db, clock: systemClock, config }, { statuses: ["pending", "retrying", "running"], queue: SCAN_QUEUE, limit: LIVE_SCAN_LIMIT }),
    findReads(db),
  ]);
  if (!reads.ok) {
    throw new Error(`loadScanProgress: reading the projects' last reads failed (${reads.error})`);
  }
  const progress = toScanProgress({ jobs, readTimes: reads.value.map((read) => read.readAt) });
  return toScanProgressView(progress, createTimeFormatter(config.locale, config.timezone));
}
