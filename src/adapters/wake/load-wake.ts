// One watched project's wake view for its page, from the adapters' stored reads.
import "server-only";
import { connection } from "next/server";
import { findAdapterReads } from "../../../modules/adapters/reads.ts";
import { getDatabase } from "../../database.ts";
import { getWakeView, type WakeView } from "./wake-view.ts";

export async function loadProjectWake(key: string): Promise<WakeView> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const reads = await findAdapterReads(db);
  if (!reads.ok) {
    throw new Error(`loadProjectWake: reading the adapter reads of ${key} failed`);
  }
  return getWakeView(reads.value, key);
}
