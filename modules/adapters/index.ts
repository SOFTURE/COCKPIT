// COCKPIT's adapters module: what the optional adapters (FR-17: health from observability, deploy state) last read
// about each watched project, in its own schema.
import { defineModule, resolveMigrationsDir } from "@softure-ai/core";
import { checkAdapters } from "./health.ts";

export const adapters = defineModule({
  manifest: {
    id: "adapters",
    version: "0.1.0",
    dependsOn: { projects: "^0.1.0" },
    dbSchema: "adapters",
    tables: ["reads"],
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
  health: checkAdapters,
});
