// The forge facts of watched projects (release, CI and quality-review runs, doctor): one row per project, a failed
// read keeps the last good value.
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { sql } from "drizzle-orm";
import { forgeFacts } from "./schema.ts";

export type FactStatus = "ok" | "not_readable" | "unavailable";

export interface StoredForgeFacts {
  readonly key: string;
  /** The latest release as read (`{ version, date }`), or null when the project has none; read defensively. */
  readonly release: unknown;
  readonly releaseStatus: FactStatus;
  readonly ciRun: unknown;
  readonly qualityReviewRun: unknown;
  readonly runsStatus: FactStatus;
  /** The doctor result as read (`src/doctor/read-doctor.ts`); read defensively. */
  readonly doctor: unknown;
  readonly doctorStatus: FactStatus;
  readonly readAt: Date;
}

export type FactUpdate<T> = { readonly status: "ok"; readonly value: T | null } | { readonly status: Exclude<FactStatus, "ok"> };

export interface RecordForgeFactsInput {
  readonly key: string;
  readonly release: FactUpdate<unknown>;
  readonly runs: FactUpdate<{ readonly ci: unknown; readonly qualityReview: unknown }>;
  readonly doctor: FactUpdate<unknown>;
  readonly readAt: Date;
}

/** Writes one project's facts; a fact whose read failed keeps its last good value. */
export async function recordForgeFacts(db: Queryable, input: RecordForgeFactsInput): Promise<Result<undefined>> {
  const isReleaseRead = input.release.status === "ok";
  const areRunsRead = input.runs.status === "ok";
  const releaseJson = input.release.status === "ok" ? JSON.stringify(input.release.value) : null;
  const runs = input.runs.status === "ok" ? input.runs.value : null;
  const ciJson = runs === null ? null : JSON.stringify(runs.ci);
  const qualityJson = runs === null ? null : JSON.stringify(runs.qualityReview);
  const isDoctorRead = input.doctor.status === "ok";
  const doctorJson = input.doctor.status === "ok" ? JSON.stringify(input.doctor.value) : null;
  try {
    await db.execute(sql`
      insert into overview.forge_facts (repository_key, release, release_status, ci_run, quality_review_run, runs_status, doctor, doctor_status, read_at)
      values (${input.key}, ${releaseJson}::jsonb, ${input.release.status}, ${ciJson}::jsonb, ${qualityJson}::jsonb, ${input.runs.status},
        ${doctorJson}::jsonb, ${input.doctor.status}, ${input.readAt})
      on conflict (repository_key) do update set
        release = case when ${isReleaseRead}::boolean then excluded.release else overview.forge_facts.release end,
        release_status = excluded.release_status,
        ci_run = case when ${areRunsRead}::boolean then excluded.ci_run else overview.forge_facts.ci_run end,
        quality_review_run = case when ${areRunsRead}::boolean then excluded.quality_review_run else overview.forge_facts.quality_review_run end,
        runs_status = excluded.runs_status,
        doctor = case when ${isDoctorRead}::boolean then excluded.doctor else overview.forge_facts.doctor end,
        doctor_status = excluded.doctor_status,
        read_at = excluded.read_at`);
    return ok();
  } catch (error) {
    return fail("recording forge facts", error);
  }
}

export async function findForgeFacts(db: Queryable): Promise<Result<StoredForgeFacts[]>> {
  try {
    const rows = await db.select().from(forgeFacts);
    return ok(
      rows.map((row) => ({
        key: row.repositoryKey,
        release: row.release,
        releaseStatus: row.releaseStatus as FactStatus,
        ciRun: row.ciRun,
        qualityReviewRun: row.qualityReviewRun,
        runsStatus: row.runsStatus as FactStatus,
        doctor: row.doctor,
        doctorStatus: row.doctorStatus as FactStatus,
        readAt: row.readAt,
      })),
    );
  } catch (error) {
    return fail("listing forge facts", error);
  }
}

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  console.error(`overview: ${operation} failed: ${errorLogLabel(error)}`);
  return safeError(error);
}
