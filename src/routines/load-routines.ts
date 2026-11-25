// A project's Routines tab (CT-10): its routines without their sealed tokens, and its recent fires by issue (the last
// 14 days, CT-15).
import "server-only";
import { connection } from "next/server";
import { findRecentFires, findRoutines, type StoredRoutine } from "../../modules/projects/routines.ts";
import { getDatabase } from "../database.ts";
import { getTokenSecret } from "./token-box.ts";
import { buildRoutinesTab, getRecentFiresSince, type RoutinesTab } from "./routines-tab.ts";

/** How many recent fires the tab reads at most. */
const RECENT_FIRES = 50;

export async function loadProjectRoutines(key: string, env: Readonly<Record<string, string | undefined>> = process.env): Promise<RoutinesTab> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const now = new Date();
  const { db } = await getDatabase();
  const [routines, fires] = await Promise.all([findRoutines(db, key), findRecentFires(db, key, { limit: RECENT_FIRES, since: getRecentFiresSince(now) })]);
  if (!routines.ok || !fires.ok) {
    throw new Error(`loadProjectRoutines: reading the routines of ${key} failed`);
  }
  return buildRoutinesTab({ routines: routines.value satisfies StoredRoutine[], fires: fires.value, canStore: getTokenSecret(env) !== null, now });
}
