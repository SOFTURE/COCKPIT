// The inbox for the signed-in owner, from the scan's stored reads.
import "server-only";
import { systemClock } from "@softure-ai/core";
import { connection } from "next/server";
import { findAnswers } from "../../modules/projects/answers.ts";
import { findFires } from "../../modules/projects/routines.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import config from "../../softure.config.ts";
import { getDatabase } from "../database.ts";
import { getIssueWake } from "../routines/wake-view.ts";
import { buildInbox, type Inbox, type InboxRow } from "./build-inbox.ts";

export async function loadInbox(): Promise<Inbox> {
  // Request-time data: never read while the build prerenders.
  await connection();
  const { db } = await getDatabase();
  const [repositories, reads, answers] = await Promise.all([findRepositories(db), findReads(db), findAnswers(db)]);
  if (!repositories.ok || !reads.ok || !answers.ok) {
    throw new Error("loadInbox: reading the watched projects, their reads or the answers failed");
  }
  const readsByKey = new Map(reads.value.map((read) => [read.key, read]));
  const sources = repositories.value.flatMap((repository) => {
    const read = readsByKey.get(repository.key);
    return read === undefined ? [] : [{ key: repository.key, fullName: repository.fullName, state: read.state, issues: read.issues }];
  });
  const inbox = buildInbox(sources, systemClock.now(), config.timezone, answers.value);
  return { ...inbox, rows: await attachIssueWakes(inbox.rows) };
}

function getIssueNumber(row: InboxRow): number | null {
  return row.answer.kind === "sent" || row.answer.kind === "done" ? row.answer.issueNumber : null;
}

/** Each answered row gets the routine fires of its issue (CT-10). */
async function attachIssueWakes(rows: readonly InboxRow[]): Promise<InboxRow[]> {
  const issues = rows.flatMap((row) => {
    const issueNumber = getIssueNumber(row);
    return issueNumber === null ? [] : [{ repositoryKey: row.projectKey, issueNumber }];
  });
  const { db } = await getDatabase();
  const fires = await findFires(db, issues);
  if (!fires.ok) {
    throw new Error("loadInbox: reading the routine fires of the answered entries failed");
  }
  return rows.map((row) => {
    const issueNumber = getIssueNumber(row);
    return issueNumber === null ? row : { ...row, wake: getIssueWake(fires.value, row.projectKey, issueNumber) };
  });
}
