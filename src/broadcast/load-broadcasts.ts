// The broadcast pages' data, from COCKPIT's own tables and the scan's stored reads (no forge call).
import "server-only";
import { connection } from "next/server";
import { findBroadcast, findBroadcasts, findSends } from "../../modules/projects/broadcasts.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { getDatabase } from "../database.ts";
import { buildBroadcastView, type BroadcastView } from "./build-broadcast-view.ts";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every broadcast, newest first, with the state of each of its sends. */
export async function loadBroadcasts(): Promise<BroadcastView[]> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [broadcasts, sends, reads] = await Promise.all([findBroadcasts(db), findSends(db, null), findReads(db)]);
  if (!broadcasts.ok || !sends.ok || !reads.ok) {
    throw new Error("loadBroadcasts: reading the broadcasts, their sends or the projects' reads failed");
  }
  return broadcasts.value.map((broadcast) => buildBroadcastView(broadcast, sends.value, reads.value));
}

/** One broadcast, or null when `id` names none. */
export async function loadBroadcast(id: string): Promise<BroadcastView | null> {
  await connection();
  if (!UUID_PATTERN.test(id)) {
    return null;
  }
  const { db } = await getDatabase();
  const [broadcast, sends, reads] = await Promise.all([findBroadcast(db, id), findSends(db, id), findReads(db)]);
  if (!broadcast.ok || !sends.ok || !reads.ok) {
    throw new Error(`loadBroadcast: reading broadcast ${id} failed`);
  }
  return broadcast.value === null ? null : buildBroadcastView(broadcast.value, sends.value, reads.value);
}
