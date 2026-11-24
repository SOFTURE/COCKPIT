// Every watched project's deploy row for the Deploys page, from the adapters' stored reads.
import "server-only";
import { connection } from "next/server";
import { findAdapterReads } from "../../../modules/adapters/reads.ts";
import { findRepositories } from "../../../modules/projects/queries.ts";
import { getDatabase } from "../../database.ts";
import { getDeployRows, type DeployRow } from "./deploys-view.ts";

export async function loadDeploys(): Promise<DeployRow[]> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [repositories, reads] = await Promise.all([findRepositories(db), findAdapterReads(db)]);
  if (!repositories.ok || !reads.ok) {
    throw new Error("loadDeploys: reading the watched projects or their adapter reads failed");
  }
  return getDeployRows(repositories.value, reads.value);
}
