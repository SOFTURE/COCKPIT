// A project's Routines tab (CT-10): its routines without their sealed tokens, and its recent fires by issue.
import "server-only";
import { connection } from "next/server";
import { findRecentFires, findRoutines, type StoredRoutine } from "../../modules/projects/routines.ts";
import { getDatabase } from "../database.ts";
import { getTokenSecret } from "./token-box.ts";
import { buildRoutinesTab, type RoutinesTab } from "./routines-tab.ts";

/** How many recent fires the tab reads. */
const RECENT_FIRES = 50;

export async function loadProjectRoutines(key: string, env: Readonly<Record<string, string | undefined>> = process.env): Promise<RoutinesTab> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [routines, fires] = await Promise.all([findRoutines(db, key), findRecentFires(db, key, RECENT_FIRES)]);
  if (!routines.ok || !fires.ok) {
    throw new Error(`loadProjectRoutines: reading the routines of ${key} failed`);
  }
  return buildRoutinesTab(routines.value satisfies StoredRoutine[], fires.value, getTokenSecret(env) !== null);
}
