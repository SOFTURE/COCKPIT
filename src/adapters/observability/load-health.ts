// One watched project's health for its page, from the adapters' stored reads.
import "server-only";
import { connection } from "next/server";
import { findAdapterReads } from "../../../modules/adapters/reads.ts";
import { getDatabase } from "../../database.ts";
import { getHealthView, type HealthView } from "./health-view.ts";

export async function loadProjectHealth(key: string): Promise<HealthView> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const reads = await findAdapterReads(db);
  if (!reads.ok) {
    throw new Error(`loadProjectHealth: reading the adapter reads of ${key} failed`);
  }
  return getHealthView(reads.value, key);
}
