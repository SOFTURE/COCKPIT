// The database every module uses: the process-wide handle for the configured URL (one pool on Postgres, one
// instance on a PGlite directory, which a second instance would corrupt).
import { getConfiguredDatabase, type DatabaseHandle } from "@softure-ai/db";
import config from "../softure.config.ts";

export function getDatabase(): Promise<DatabaseHandle> {
  if (config.database === null) {
    throw new Error("getDatabase: softure.config.ts has no database");
  }
  return getConfiguredDatabase(config.database);
}
