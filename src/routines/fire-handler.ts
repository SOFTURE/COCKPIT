// The drain schedule as a job (CT-10): every minute, fires the queued fires whose time has come (a limit or a 429)
// and takes over fires a request left `sending`.
import { createLogger } from "@softure-ai/observability";
import { defineJobHandler } from "@softure-ai/jobs";
import { ok } from "@softure-ai/core";
import { z } from "zod";
import { drainQueuedFires, type WakeDependencies } from "./wake-issue.ts";

const logger = createLogger("routines");

export function createFireHandler(getDependencies: () => Promise<WakeDependencies>) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async () => {
      const drained = await drainQueuedFires(await getDependencies());
      if (!drained.ok) {
        logger.error("draining queued fires failed", { code: drained.error });
        return drained;
      }
      if (drained.value > 0) {
        logger.info("queued fires sent", { fires: drained.value });
      }
      return ok(undefined);
    },
  });
}
