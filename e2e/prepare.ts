// Builds the e2e's database from nothing before the server starts: a fresh PGlite directory, every migration, and
// the owner account the operator would create with `npm run create-account`.
import { rm } from "node:fs/promises";
import { getAuthOptions } from "@softure-ai/auth/server";
import { createTestAccount } from "@softure-ai/auth/testing";
import { createDatabase, migrate } from "@softure-ai/db";
import config from "../softure.config.ts";
import { ensurePgliteParent } from "../scripts/pglite-directory.ts";
import { E2E_DATABASE_URL, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

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
  await createTestAccount(handle.db, {
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    scrypt: getAuthOptions(config).password.scrypt,
  });
} finally {
  await handle.close();
}
