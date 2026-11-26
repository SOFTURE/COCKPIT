// Builds the e2e's database from nothing before the server starts: a fresh PGlite directory, every migration, and
// the owner account the operator would create with `npm run create-account` and make admin with `npm run grant-role`,
// and one teammate account as an accepted invitation would leave it; and the Scheduled tasks e2e's tasks (CT-37), ahead of
// the start, since no screen creates one before CT-38.
import { rm } from "node:fs/promises";
import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { createDatabase, migrate } from "@softure-ai/db";
import { insertScheduledTask } from "../modules/projects/scheduled-tasks.ts";
import config from "../softure.config.ts";
import { ensurePgliteParent } from "../scripts/pglite-directory.ts";
import { E2E_DATABASE_URL, OWNER_EMAIL, OWNER_PASSWORD, SCHEDULED_REPOSITORIES, SCHEDULED_TASKS, TEAMMATE_EMAIL, TEAMMATE_PASSWORD } from "./fixtures.ts";

const DAY_MS = 24 * 60 * 60_000;

if (E2E_DATABASE_URL.startsWith("pglite://")) {
  await rm(E2E_DATABASE_URL.slice("pglite://".length), { recursive: true, force: true });
}
await ensurePgliteParent(E2E_DATABASE_URL);
const handle = await createDatabase(E2E_DATABASE_URL);
try {
  const migrated = await migrate(handle, { modules: config.modules });
  if (!migrated.ok) {
    throw new Error(`e2e prepare: migrations failed: ${migrated.error}`);
  }
  const { scrypt } = getAuthOptions(config).password;
  const owner = await createTestAccount(handle.db, { email: OWNER_EMAIL, password: OWNER_PASSWORD, scrypt, roles: ["admin"] });
  await createTestAccount(handle.db, { email: TEAMMATE_EMAIL, password: TEAMMATE_PASSWORD, scrypt });
  const now = new Date();
  for (const task of SCHEDULED_TASKS) {
    const inserted = await insertScheduledTask(handle.db, {
      id: task.id,
      title: task.title,
      prompt: task.prompt,
      repositoryKeys: [...SCHEDULED_REPOSITORIES],
      runAt: new Date(now.getTime() + task.daysAhead * DAY_MS),
      createdBy: owner.id,
      createdByName: OWNER_EMAIL,
      at: now,
    });
    if (!inserted.ok) {
      throw new Error(`e2e prepare: storing the scheduled task ${task.title} failed: ${inserted.error}`);
    }
  }
} finally {
  await handle.close();
}
