// What the scan status screen shows: the schedule's last run and each project's latest read.
import "server-only";
import { connection } from "next/server";
import { systemClock } from "@softure-ai/core";
import { getQueueStats } from "@softure-ai/jobs/server";
import { findRepositories } from "../../modules/projects/queries.ts";
import { findReads, type ReadStatus } from "../../modules/projects/reads.ts";
import config from "../../softure.config.ts";
import { getDatabase } from "../database.ts";
import { SCAN_QUEUE } from "./scan-queue.ts";

export interface ProjectScanRow {
  readonly key: string;
  readonly fullName: string;
  /** The owner's project group; null for No group (CT-35). */
  readonly groupId: number | null;
  readonly status: ReadStatus | "never";
  readonly hasIssuesProblem: boolean;
  readonly readAt: Date | null;
  readonly lastGoodAt: Date | null;
}

export interface ScanStatus {
  readonly intervalMinutes: number | null;
  readonly lastSucceededAt: Date | null;
  readonly failureCode: string | null;
  readonly isScanning: boolean;
  readonly projects: readonly ProjectScanRow[];
}

export async function loadScanStatus(): Promise<ScanStatus> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [repositories, reads, stats] = await Promise.all([
    findRepositories(db),
    findReads(db),
    getQueueStats({ db, clock: systemClock, config }),
  ]);
  if (!repositories.ok || !reads.ok) {
    throw new Error("loadScanStatus: reading the watched projects or their reads failed");
  }
  const readsByKey = new Map(reads.value.map((read) => [read.key, read]));
  const scan = stats.find((queue) => queue.queue === SCAN_QUEUE);
  const schedule = scan?.schedule ?? null;
  return {
    intervalMinutes: schedule === null ? null : Math.round(schedule.everySeconds / 60),
    lastSucceededAt: schedule?.lastSucceededAt ?? null,
    failureCode: schedule?.isFailing === true ? schedule.lastFailureCode : null,
    isScanning: scan !== undefined && (scan.counts.pending > 0 || scan.counts.running > 0),
    projects: repositories.value.map((repository) => {
      const read = readsByKey.get(repository.key);
      return {
        key: repository.key,
        fullName: repository.fullName,
        groupId: repository.groupId,
        status: read?.status ?? "never",
        hasIssuesProblem: read !== undefined && read.issuesStatus !== "ok",
        readAt: read?.readAt ?? null,
        lastGoodAt: read?.lastGoodAt ?? null,
      };
    }),
  };
}
