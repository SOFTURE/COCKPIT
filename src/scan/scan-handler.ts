// The scan as a job: run once per period by the schedule, and on "Scan now".
import { ok } from "@softure-ai/core";
import { defineJobHandler, failJob, retryJobLater } from "@softure-ai/jobs";
import { z } from "zod";
import type { ProjectAdapter } from "../adapters/contract.ts";
import type { ForgeClient } from "../forge/client.ts";
import { SCAN_PROGRESS_STEP } from "./scan-progress.ts";
import { scanProjects } from "./scan-projects.ts";

export function createScanHandler(getClient: () => ForgeClient | null, getAdapters: () => readonly ProjectAdapter[] = () => []) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async (_payload, { db, clock, reportProgress }) => {
      const client = getClient();
      if (client === null) {
        return failJob("scan.forge_not_configured", { expected: true });
      }
      const outcome = await scanProjects({
        db,
        client,
        clock,
        adapters: getAdapters(),
        // The header's refresh counts the projects read (FR-3); a failed progress write is logged, never thrown.
        onProgress: (done, total) => reportProgress({ step: SCAN_PROGRESS_STEP, done, total }),
      });
      if (!outcome.ok) {
        return outcome;
      }
      if (outcome.value.kind === "retry_later") {
        return retryJobLater("scan.forge_budget_low", outcome.value.seconds);
      }
      return ok();
    },
  });
}
