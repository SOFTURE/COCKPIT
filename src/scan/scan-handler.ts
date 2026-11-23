// The scan as a job: run once per period by the schedule, and on "Scan now".
import { ok } from "@softure-ai/core";
import { defineJobHandler, failJob, retryJobLater } from "@softure-ai/jobs";
import { z } from "zod";
import type { ProjectAdapter } from "../adapters/contract.ts";
import type { ForgeClient } from "../forge/client.ts";
import { scanProjects } from "./scan-projects.ts";

export function createScanHandler(getClient: () => ForgeClient | null, getAdapters: () => readonly ProjectAdapter[] = () => []) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async (_payload, { db, clock }) => {
      const client = getClient();
      if (client === null) {
        return failJob("scan.forge_not_configured", { expected: true });
      }
      const outcome = await scanProjects({ db, client, clock, adapters: getAdapters() });
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
