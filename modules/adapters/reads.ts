// The adapters' last reads: one row per project and adapter. Unlike the forge facts, an unknown read replaces the
// last value (FR-17: a source that fails shows as unknown with its reason).
import { errorLogLabel, ok, safeError, type CoreErrorCode, type Err, type Result } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { sql } from "drizzle-orm";
import { adapterReads } from "./schema.ts";

/** What an adapter stored: the value it read, no source for this project, or a failed source with its reason code. */
export type StoredAdapterResult =
  | { readonly status: "value"; readonly value: unknown }
  | { readonly status: "absent" }
  | { readonly status: "unknown"; readonly reason: string };

export type StoredAdapterRead = StoredAdapterResult & {
  readonly key: string;
  readonly adapter: string;
  readonly readAt: Date;
};

export interface RecordAdapterReadInput {
  readonly key: string;
  readonly adapter: string;
  readonly result: StoredAdapterResult;
  readonly readAt: Date;
}

export async function recordAdapterRead(db: Queryable, input: RecordAdapterReadInput): Promise<Result<undefined>> {
  const { result } = input;
  const valueJson = result.status === "value" ? JSON.stringify(result.value) : null;
  const reason = result.status === "unknown" ? result.reason : null;
  try {
    await db.execute(sql`
      insert into adapters.reads (repository_key, adapter, status, value, reason, read_at)
      values (${input.key}, ${input.adapter}, ${result.status}, ${valueJson}::jsonb, ${reason}, ${input.readAt})
      on conflict (repository_key, adapter) do update set
        status = excluded.status,
        value = excluded.value,
        reason = excluded.reason,
        read_at = excluded.read_at`);
    return ok();
  } catch (error) {
    return fail("recording an adapter read", error);
  }
}

function toStored(row: typeof adapterReads.$inferSelect): StoredAdapterRead {
  const base = { key: row.repositoryKey, adapter: row.adapter, readAt: row.readAt };
  if (row.status === "value") {
    return { ...base, status: "value", value: row.value };
  }
  if (row.status === "unknown") {
    return { ...base, status: "unknown", reason: row.reason ?? "" };
  }
  return { ...base, status: "absent" };
}

export async function findAdapterReads(db: Queryable): Promise<Result<StoredAdapterRead[]>> {
  try {
    const rows = await db.select().from(adapterReads);
    return ok(rows.map(toStored));
  } catch (error) {
    return fail("listing adapter reads", error);
  }
}

function fail(operation: string, error: unknown): Err<CoreErrorCode> {
  console.error(`adapters: ${operation} failed: ${errorLogLabel(error)}`);
  return safeError(error);
}
