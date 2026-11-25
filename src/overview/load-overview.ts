// The overview for the signed-in owner, from the scan's stored reads, forge facts and adapter reads; the unanswered entries come
// from the inbox so both screens count them the same way.
import "server-only";
import { systemClock } from "@softure-ai/core";
import { connection } from "next/server";
import { findAdapterReads } from "../../modules/adapters/reads.ts";
import { findForgeFacts } from "../../modules/overview/facts.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { findRoutines } from "../../modules/projects/routines.ts";
import { getDatabase } from "../database.ts";
import type { Inbox } from "../inbox/build-inbox.ts";
import { buildOverview, countUnansweredByProject, type Overview } from "./build-overview.ts";

export async function loadOverview(inbox: Inbox): Promise<Overview> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [repositories, reads, facts, adapterReads, routines] = await Promise.all([
    findRepositories(db),
    findReads(db),
    findForgeFacts(db),
    findAdapterReads(db),
    findRoutines(db),
  ]);
  if (!repositories.ok || !reads.ok || !facts.ok || !adapterReads.ok || !routines.ok) {
    throw new Error("loadOverview: reading the watched projects, their reads, forge facts, adapter reads or routines failed");
  }
  return buildOverview({
    projects: repositories.value.map((repository) => ({ key: repository.key, fullName: repository.fullName })),
    reads: reads.value,
    facts: facts.value,
    adapterReads: adapterReads.value,
    routines: routines.value,
    unansweredByKey: countUnansweredByProject(inbox.rows),
    now: systemClock.now(),
  });
}
