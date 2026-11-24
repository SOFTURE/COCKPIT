// A project's page for the signed-in owner, from the scan's stored read; its entries come from the inbox so both
// screens show and answer them the same way.
import "server-only";
import { connection } from "next/server";
import { findForgeFacts } from "../../modules/overview/facts.ts";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { getDatabase } from "../database.ts";
import { DEFAULT_FORGE_API_URL } from "../forge/client.ts";
import { getForgeWebUrl } from "../forge/web-url.ts";
import { loadInbox } from "../inbox/load-inbox.ts";
import { buildProjectPage, type ProjectPage } from "./build-project-page.ts";

export async function loadProjectPage(repository: WatchedRepository): Promise<ProjectPage> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [reads, facts, inbox] = await Promise.all([findReads(db), findForgeFacts(db), loadInbox()]);
  if (!reads.ok) {
    throw new Error(`loadProjectPage: reading the scan reads for ${repository.fullName} failed (${reads.error})`);
  }
  if (!facts.ok) {
    throw new Error(`loadProjectPage: reading the forge facts for ${repository.fullName} failed (${String(facts.error)})`);
  }
  return buildProjectPage({
    repository,
    read: reads.value.find((read) => read.key === repository.key),
    inboxRows: inbox.rows,
    webUrl: getForgeWebUrl(process.env.FORGE_API_URL ?? DEFAULT_FORGE_API_URL),
    release: facts.value.find((fact) => fact.key === repository.key)?.release,
  });
}
