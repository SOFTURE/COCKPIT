// COCKPIT's SOFTURE configuration. Every secret and every watched repository comes from the environment or the
// database at run time; nothing here names a real person, project or host.
import { auth, AUTH_RATE_LIMIT_BUCKETS } from "@softure-ai/auth";
import { defineSoftureConfig } from "@softure-ai/core";
import { registerSoftureConfig } from "@softure-ai/core/next";
import { ops } from "@softure-ai/ops";
import { clientIpFromEnv, security } from "@softure-ai/security";
import { projects } from "./modules/projects/index.ts";

/** Local runs, tests and the e2e use an in-process Postgres (PGlite) in this folder; production sets DATABASE_URL. */
export const LOCAL_DATABASE_URL = "pglite://.data/dev";

/** The page the owner lands on after signing in (FR-1). */
export const LANDING_PATH = "/inbox";

/**
 * A stack without an edge in front of it (`next dev`, the e2e) has no header naming the client. Such a stack counts
 * every request under one shared key; production refuses unidentified clients (security README §3).
 */
const isUnidentifiedClientAllowed = process.env.ALLOW_UNIDENTIFIED_CLIENTS === "true";

const config = defineSoftureConfig({
  database: { url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL },
  locale: "en",
  timezone: process.env.APP_TIMEZONE ?? "Europe/Warsaw",
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:3000",
  modules: [
    security({
      clientIp: clientIpFromEnv(process.env),
      unidentified: isUnidentifiedClientAllowed ? { key: "local" } : "refuse",
      buckets: { ...AUTH_RATE_LIMIT_BUCKETS },
    }),
    // One owner account, created by the operator (`npm run create-account`); nobody can sign up (FR-1).
    auth({
      registrationClosed: true,
      routes: { afterLogin: LANDING_PATH, afterLogout: "/login" },
      password: { minLength: 12 },
    }),
    ops(),
    // COCKPIT's own tables: the watched repositories (FR-2).
    projects(),
  ],
});

registerSoftureConfig(config);
export default config;
