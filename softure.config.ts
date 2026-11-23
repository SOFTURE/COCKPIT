// COCKPIT's SOFTURE configuration. Every secret and every watched repository comes from the environment or the
// database at run time; nothing here names a real person, project or host.
import { auth, AUTH_RATE_LIMIT_BUCKETS, consoleInvitationSender } from "@softure-ai/auth";
import { authJobSchedules } from "@softure-ai/auth/jobs";
import { defineSoftureConfig } from "@softure-ai/core";
import { registerSoftureConfig } from "@softure-ai/core/next";
import { jobs } from "@softure-ai/jobs";
import { ops } from "@softure-ai/ops";
import { security } from "@softure-ai/security";
import { securityJobSchedules } from "@softure-ai/security/jobs";
import { overview } from "./modules/overview/index.ts";
import { projects } from "./modules/projects/index.ts";
import { getScanIntervalMinutes } from "./src/scan/scan-interval.ts";
import { SCAN_QUEUE } from "./src/scan/scan-queue.ts";
import { getClientIpResolver } from "./src/security/client-ip-resolver.ts";

/** Local runs, tests and the e2e use an in-process Postgres (PGlite) in this folder; production sets DATABASE_URL. */
export const LOCAL_DATABASE_URL = "pglite://.data/dev";

/** The page the owner lands on after signing in (FR-1). */
export const LANDING_PATH = "/inbox";

/** Settings → Team: the members and the invitations (FR-16); auth's invitation actions return here. */
export const TEAM_PATH = "/settings/team";

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
      clientIp: getClientIpResolver(process.env),
      unidentified: isUnidentifiedClientAllowed ? { key: "local" } : "refuse",
      buckets: { ...AUTH_RATE_LIMIT_BUCKETS },
    }),
    // One owner account, created by the operator (`npm run create-account`) and made admin (`npm run grant-role`);
    // nobody can sign up (FR-1). The owner invites teammates by email, who see and answer the same projects (FR-16).
    // Invitation links are printed by the console sender until the mailing module exists (CMP-12, then CMP-20 wires
    // mailingInvitationSender); in production the console sender refuses and the invitation stays pending.
    auth({
      registrationClosed: true,
      routes: { afterLogin: LANDING_PATH, afterLogout: "/login", invitations: TEAM_PATH },
      password: { minLength: 12 },
      invitations: { send: consoleInvitationSender },
    }),
    ops(),
    // COCKPIT's own tables: the watched repositories (FR-2) and their latest scan reads (FR-3).
    projects(),
    // What the scan reads from the forge beside the state: release, CI and quality-review runs (FR-7, FR-8).
    overview(),
    // The scan runs once per period however many workers run (FR-3); scripts/worker.ts runs the queues.
    jobs({
      queues: { [SCAN_QUEUE]: { maxAttempts: 3, concurrency: 1, leaseSeconds: 600 } },
      schedules: {
        ...authJobSchedules,
        ...securityJobSchedules,
        [SCAN_QUEUE]: { every: `${String(getScanIntervalMinutes(process.env.SCAN_INTERVAL_MINUTES))}m` },
      },
    }),
  ],
});

registerSoftureConfig(config);
export default config;
