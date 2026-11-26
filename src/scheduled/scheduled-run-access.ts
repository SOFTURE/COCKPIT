// What a scheduled run needs in the app and the worker: the database, the system clock, the forge client and the
// routines' wake-up.
import "server-only";
import { systemClock } from "@softure-ai/core";
import config from "../../softure.config.ts";
import { getDatabase } from "../database.ts";
import { getForgeClient } from "../projects/forge-access.ts";
import { getWakeDependencies } from "../routines/wake-access.ts";
import type { ScheduledRunDependencies } from "./run-scheduled-task.ts";

export async function getScheduledRunDependencies(): Promise<ScheduledRunDependencies> {
  const { db } = await getDatabase();
  return { db, clock: systemClock, client: getForgeClient(), wake: await getWakeDependencies(), timeZone: config.timezone };
}
