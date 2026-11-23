// A module context ({ db, clock, config }) over a migrated in-memory PGlite, for tests that call server code.
import { createTestClock, getModule, type Clock, type SoftureConfig } from "@softure-ai/core";
import type { Queryable } from "@softure-ai/db";
import { createTestDatabase, type TestDatabase } from "@softure-ai/db/testing";
import config from "../../softure.config.ts";

export interface TestContext {
  readonly db: Queryable;
  readonly clock: Clock & { advance(ms: number): void; set(date: Date): void };
  readonly config: SoftureConfig;
  readonly database: TestDatabase;
}

export const TEST_START = new Date("2026-11-02T09:00:00Z");

export async function createTestContext(start: Date = TEST_START): Promise<TestContext> {
  const database = await createTestDatabase(config.modules);
  return { db: database.db, clock: createTestClock(start), config, database };
}

/** The health check a module contributes to `GET /api/health`. */
export function getModuleHealth(id: string) {
  const health = getModule(config, id)?.health;
  if (health === undefined || health === null) {
    throw new Error(`getModuleHealth: module ${id} has no health check`);
  }
  return health;
}
