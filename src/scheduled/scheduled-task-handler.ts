// The scheduled-task schedule as a job (CT-36): every minute, sends the tasks whose time has come and takes over runs
// a dead worker left `sending`.
import { ok } from "@softure-ai/core";
import { defineJobHandler } from "@softure-ai/jobs";
import { createLogger } from "@softure-ai/observability";
import { z } from "zod";
import { runDueScheduledTasks, type ScheduledRunDependencies } from "./run-scheduled-task.ts";

const logger = createLogger("scheduled");

export function createScheduledTaskHandler(getDependencies: () => Promise<ScheduledRunDependencies>) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async () => {
      const ran = await runDueScheduledTasks(await getDependencies());
      if (!ran.ok) {
        logger.error("claiming scheduled tasks failed", { code: ran.error });
        return ran;
      }
      if (ran.value > 0) {
        logger.info("scheduled tasks run", { tasks: ran.value });
      }
      return ok(undefined);
    },
  });
}
