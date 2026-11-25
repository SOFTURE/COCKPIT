import { readFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findRoutines } from "../../modules/projects/routines.ts";
import { createTokenBox } from "../../src/routines/token-box.ts";
import { wakeIssue } from "../../src/routines/wake-issue.ts";
import { createTestContext, type TestContext } from "../support/test-context.ts";
import { createFakeProviders, createFakeRoutinesApi } from "../routines/fake-routines-api.ts";

const MIGRATION = new URL("../../modules/projects/migrations/0008_add_routine_provider.sql", import.meta.url);
const ALPHA = "example-org/alpha-app";
const TOKEN = "fictional-routine-token-m8q2";
const box = createTokenBox("fictional-routine-token-secret-0001");

/** The rollback the migration's header gives, run as written there (statements only). */
async function readRollback(): Promise<string> {
  const text = await readFile(MIGRATION, "utf8");
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith("-- Rollback"));
  return lines
    .slice(start + 1)
    .filter((line) => line.startsWith("--   ALTER") || line.startsWith("--   UPDATE"))
    .map((line) => line.slice("--   ".length))
    .join("\n");
}

describe("migration projects/0008: routine provider", () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.database.close();
  });

  it("rolls back to the 0007 shape, then moves a stored Claude routine to claude-code with its token, and it still fires", async () => {
    const client = context.database.client;
    await client.exec(await readRollback());
    await client.query(
      `INSERT INTO projects.routines (repository_key, name, kind, trigger_id, token_ciphertext, token_last4, enabled, created_at, updated_at)
       VALUES ($1, 'Coordinator', 'cockpit-issues', 'trig_01Legacy', $2, 'm8q2', true, now(), now())`,
      [ALPHA, box.seal(TOKEN)],
    );

    await client.exec(`BEGIN; SET LOCAL search_path TO projects, public; ${await readFile(MIGRATION, "utf8")} COMMIT;`);

    const routines = await findRoutines(context.db, ALPHA);
    const [routine] = routines.ok ? routines.value : [];
    expect(routine).toMatchObject({ name: "Coordinator", provider: "claude-code", settings: { triggerId: "trig_01Legacy" }, tokenLast4: "m8q2" });
    expect(routine).not.toHaveProperty("triggerId");
    expect(box.open(routine?.tokenCiphertext ?? "")).toBe(TOKEN);
    const api = createFakeRoutinesApi();
    const woke = await wakeIssue(
      { db: context.db, clock: context.clock, box, providers: createFakeProviders(api) },
      { repositoryKey: ALPHA, fullName: ALPHA, number: 3, url: `https://forge.example.test/${ALPHA}/issues/3`, title: "COCKPIT command: Run the doctor" },
    );
    expect(woke).toEqual({ ok: true, value: { sent: 1, failed: 0, queued: 0, noRoutine: false } });
    expect(api.calls).toEqual([{ triggerId: "trig_01Legacy", token: TOKEN, text: `COCKPIT command: https://github.com/${ALPHA}/issues/3` }]);
  });
});
