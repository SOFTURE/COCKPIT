"use server";

// "Scan now": queues a run of the scan schedule (joining one that is already waiting).
import { requireUser } from "@softure-ai/auth/next";
import { systemClock } from "@softure-ai/core";
import { createLogger } from "@softure-ai/observability";
import { revalidatePath } from "next/cache";
import config from "../../../softure.config.ts";
import { getDatabase } from "../../../src/database.ts";
import type { ScanNowState } from "../../../src/scan/scan-now-button.tsx";
import { queueScan } from "../../../src/scan/queue-scan.ts";

const logger = createLogger("scan");

export async function scanNowAction(): Promise<ScanNowState> {
  const user = await requireUser();
  const { db } = await getDatabase();
  // queueScan logs the queued run; the member who asked is named here.
  const result = await queueScan({ db, clock: systemClock, config });
  logger.info("scan now asked", { user_id: user.id, queued: result.ok });
  revalidatePath("/scan-status");
  return result.ok ? "queued" : "failed";
}
