// COCKPIT's SOFTURE configuration. Every secret and every watched repository comes from the environment or the
// database at run time; nothing here names a real person, project or host.
import { auth, AUTH_RATE_LIMIT_BUCKETS, consoleInvitationSender } from "@softure-ai/auth";
import { mailingInvitationSender } from "@softure-ai/auth/mailing";
import { authJobSchedules } from "@softure-ai/auth/jobs";
import { defineSoftureConfig } from "@softure-ai/core";
import { registerSoftureConfig } from "@softure-ai/core/next";
import { jobs } from "@softure-ai/jobs";
import { mailing, resend } from "@softure-ai/mailing";
import { MCP_RATE_LIMIT_BUCKETS, mcpAccess } from "@softure-ai/mcp-access";
import { mcpAccessJobSchedules } from "@softure-ai/mcp-access/jobs";
import { ops } from "@softure-ai/ops";
import { security } from "@softure-ai/security";
import { securityJobSchedules } from "@softure-ai/security/jobs";
import { digest } from "./modules/digest/index.ts";
import { overview } from "./modules/overview/index.ts";
import { projects } from "./modules/projects/index.ts";
import { DIGEST_QUEUE } from "./src/digest/digest-queue.ts";
import { getDigestAt, PLACEHOLDER_SENDER } from "./src/digest/digest-settings.ts";
import { MCP_SERVER_NAME, MCP_TOOL_CATALOG } from "./src/mcp/tool-catalog.ts";
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

/** The app's time zone: dates in the screens and the digest's local time of day. */
const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Europe/Warsaw";

const config = defineSoftureConfig({
  database: { url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL },
  locale: "en",
  timezone: APP_TIMEZONE,
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:3000",
  modules: [
    security({
      clientIp: getClientIpResolver(process.env),
      unidentified: isUnidentifiedClientAllowed ? { key: "local" } : "refuse",
      buckets: { ...AUTH_RATE_LIMIT_BUCKETS, ...MCP_RATE_LIMIT_BUCKETS },
    }),
    // One owner account, created by the operator (`npm run create-account`) and made admin (`npm run grant-role`);
    // nobody can sign up (FR-1). The owner invites teammates by email, who see and answer the same projects (FR-16).
    // Invitations go out as mail through the mailing module below in production (an invitation stays pending, "not
    // sent", until RESEND_API_KEY and MAIL_FROM are set); development prints the link to the console.
    auth({
      registrationClosed: true,
      routes: { afterLogin: LANDING_PATH, afterLogout: "/login", invitations: TEAM_PATH },
      password: { minLength: 12 },
      invitations: { send: process.env.NODE_ENV === "production" ? mailingInvitationSender() : consoleInvitationSender },
    }),
    ops(),
    // COCKPIT's own tables: the watched repositories (FR-2) and their latest scan reads (FR-3).
    projects(),
    // What the scan reads from the forge beside the state: release, CI and quality-review runs (FR-7, FR-8).
    overview(),
    // The digest log: what the last digest mail compared, so the next one reports only what changed (FR-12).
    digest(),
    // The digest mail (FR-12): list mail with a one-click unsubscribe. RESEND_API_KEY and MAILING_UNSUBSCRIBE_SECRET
    // are read at send time, so the app starts without them.
    mailing({ from: process.env.MAIL_FROM?.trim() || PLACEHOLDER_SENDER, provider: resend() }),
    // Assistants read the overview, the inbox and a project over MCP with a read token or OAuth (FR-13). No
    // write tool yet: every token reads only until answering over MCP comes (CMP-15).
    mcpAccess({
      serverName: MCP_SERVER_NAME,
      tools: [...MCP_TOOL_CATALOG],
      allowWrites: false,
      oauth: { enabled: true },
    }),
    // The scan runs once per period however many workers run (FR-3), the digest once a day (FR-12);
    // scripts/worker.ts runs the queues.
    jobs({
      queues: {
        [SCAN_QUEUE]: { maxAttempts: 3, concurrency: 1, leaseSeconds: 600 },
        // A provider outage retries the same mail; the next day's run picks it up after the last attempt.
        [DIGEST_QUEUE]: { maxAttempts: 10, concurrency: 1, leaseSeconds: 300 },
      },
      schedules: {
        ...authJobSchedules,
        ...securityJobSchedules,
        ...mcpAccessJobSchedules,
        [SCAN_QUEUE]: { every: `${String(getScanIntervalMinutes(process.env.SCAN_INTERVAL_MINUTES))}m` },
        [DIGEST_QUEUE]: { at: [getDigestAt(process.env.DIGEST_AT)], timeZone: APP_TIMEZONE },
      },
    }),
  ],
});

registerSoftureConfig(config);
export default config;
