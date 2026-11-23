"use server";

// "Scan now": queues a run of the scan schedule (joining one that is already waiting).
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { revalidatePath } from "next/cache";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import type { ScanNowState } from "../../../src/scan/scan-now-button.tsx";
import { queueScan } from "../../../src/scan/queue-scan.ts";

export async function scanNowAction(): Promise<ScanNowState> {
  await requireUser();
  const { db } = await getDatabase();
  const result = await queueScan({ db, clock: systemClock, config });
  revalidatePath("/scan-status");
  return result.ok ? "queued" : "failed";
}
