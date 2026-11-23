// One watched project's deploy state for its page, from the adapters' stored reads.
import "server-only";
import { connection } from "next/server";
import { findAdapterReads } from "../../../modules/adapters/reads.ts";
import { getDatabase } from "../../database.ts";
import { getDeployView, type DeployView } from "./deploy-view.ts";

export async function loadProjectDeploy(key: string): Promise<DeployView> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const reads = await findAdapterReads(db);
  if (!reads.ok) {
    throw new Error(`loadProjectDeploy: reading the adapter reads of ${key} failed`);
  }
  return getDeployView(reads.value, key);
}
