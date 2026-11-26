// The project groups for a screen, with their project counts; a failed read is a bug to surface, not an empty list.
import "server-only";
import { connection } from "next/server";
import { findProjectGroups, type ProjectGroupWithCount } from "../../modules/projects/groups.ts";
import { getDatabase } from "../database.ts";

export async function loadProjectGroups(): Promise<ProjectGroupWithCount[]> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const result = await findProjectGroups(db);
  if (!result.ok) {
    throw new Error(`loadProjectGroups: listing project groups failed (${result.error})`);
  }
  return result.value;
}
