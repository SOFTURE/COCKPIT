// COCKPIT's overview module: what the scan reads from the forge about each watched project (release, CI and
// quality-review runs), kept beside the project's state in its own schema.
import { defineModule, resolveMigrationsDir } from "@softure-ai/core";
import { checkOverview } from "./health.ts";

export const overview = defineModule({
  manifest: {
    id: "overview",
    version: "0.1.0",
    dependsOn: { projects: "^0.1.0" },
    dbSchema: "overview",
    tables: ["forge_facts"],
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
  health: checkOverview,
});
