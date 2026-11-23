// The current snapshot from what the scan stored and the owner's answers, for the digest job (no request context).
import { err, ok, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { findForgeFacts } from "../../modules/overview/facts.ts";
import { findAnswers } from "../../modules/projects/answers.ts";
import { findRepositories } from "../../modules/projects/queries.ts";
import { findReads } from "../../modules/projects/reads.ts";
import { buildSnapshot, type DigestSnapshot } from "./build-snapshot.ts";

export async function loadSnapshot(db: Queryable, now: Date, timeZone: string): Promise<Result<DigestSnapshot, "digest.read_failed">> {
  const [repositories, reads, facts, answers] = await Promise.all([findRepositories(db), findReads(db), findForgeFacts(db), findAnswers(db)]);
  if (!repositories.ok || !reads.ok || !facts.ok || !answers.ok) {
    return err("digest.read_failed");
  }
  return ok(
    buildSnapshot({
      projects: repositories.value.map((repository) => ({ key: repository.key, fullName: repository.fullName })),
      reads: reads.value,
      facts: facts.value,
      answers: answers.value,
      now,
      timeZone,
    }),
  );
}
