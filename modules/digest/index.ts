// COCKPIT's digest module: the log of digest runs and the snapshot each one compared (FR-12).
import { defineModule, resolveMigrationsDir } from "@softure-ai/core";
import { checkDigest } from "./health.ts";

export const digest = defineModule({
  manifest: {
    id: "digest",
    version: "0.1.0",
    dependsOn: { projects: "^0.1.0", overview: "^0.1.0" },
    dbSchema: "digest",
    tables: ["digests"],
    env: [],
    switches: [],
    routes: {},
    mount: [],
    privacy: { exports: false, deletes: false },
    runtimes: ["node"],
  },
  // The app's dictionaries in messages/ hold every text.
  messages: { en: {} },
  migrations: { dir: resolveMigrationsDir(import.meta.url, "./migrations/") },
  health: checkDigest,
});
