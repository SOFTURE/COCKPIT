// The e2e's fictional owner and its stack. Nothing here is a real person or a secret.
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "pglite://.data/e2e";
/** A second server of the same build with APP_LOCALE=pl, on its own port and database (e2e/polish.spec.ts). */
export const E2E_POLISH_PORT = Number(process.env.E2E_POLISH_PORT ?? 3102);
export const E2E_POLISH_DATABASE_URL = "pglite://.data/e2e-pl";
/** A third server whose forge lists the token's repositories slowly (e2e/slow-repository-list.spec.ts), on its own database. */
export const E2E_SLOW_LIST_PORT = Number(process.env.E2E_SLOW_LIST_PORT ?? 3103);
export const E2E_SLOW_LIST_DATABASE_URL = "pglite://.data/e2e-slow-list";
/**
 * A fourth server whose scan queue only e2e/header-refresh.spec.ts fills: the header's Refresh ends when no scan is
 * live, which never holds on the shared database while the other specs keep queuing scans.
 */
export const E2E_REFRESH_PORT = Number(process.env.E2E_REFRESH_PORT ?? 3104);
export const E2E_REFRESH_DATABASE_URL = "pglite://.data/e2e-refresh";
/** The fake forge's path prefix that serves the same forge with a slow repository listing, and that delay. */
export const SLOW_LIST_PATH = "/slow-list";
export const SLOW_LIST_DELAY_MS = 6_000;
export const OWNER_EMAIL = "owner@example.com";
export const OWNER_PASSWORD = "e2e owner password 2026";
/** A fictional teammate the owner invited earlier (FR-16): no admin role. */
export const TEAMMATE_EMAIL = "teammate@example.com";
export const TEAMMATE_PASSWORD = "e2e teammate password 2026";
/** The fake forge (e2e/fake-forge.ts) and the fictional token it accepts. */
export const FAKE_FORGE_PORT = Number(process.env.FAKE_FORGE_PORT ?? 3101);
export const E2E_FORGE_TOKEN = "e2e-forge-token";
/** A second fictional token, of another resource owner, passed as FORGE_EXTRA_TOKENS (CT-6). */
export const E2E_EXTRA_FORGE_TOKEN = "e2e-extra-forge-token";
/** The fake observability backend (Grafana's rules API, served by the fake forge under /grafana) and its token. */
export const E2E_GRAFANA_PATH = "/grafana";
export const E2E_GRAFANA_TOKEN = "e2e-grafana-token";
/** Signs the digest's unsubscribe links in the e2e; fictional, at least 32 characters. */
export const E2E_UNSUBSCRIBE_SECRET = "e2e-fictional-unsubscribe-secret-0001";
/** Keys each recipient (@softure-ai/mailing 0.3): at least 32 characters, fictional. */
export const E2E_EMAIL_KEY_SECRET = "e2e-fictional-email-key-secret-000000001";
/** The fake npm registry (dist-tags only), served by the fake forge under /npm (CT-1). */
export const E2E_NPM_PATH = "/npm";
/** The fake routines API (CT-10), served by the fake forge under /anthropic: COCKPIT never calls api.anthropic.com. */
export const E2E_ROUTINES_PATH = "/anthropic";
/** The fictional routine token the fake routines API accepts. */
export const E2E_ROUTINE_TOKEN = "e2e-fictional-routine-token-7f3a";
/** Seals routine tokens in the e2e; fictional, at least 32 characters. */
export const E2E_ROUTINE_TOKEN_SECRET = "e2e-fictional-routine-token-secret-0001";
/** A trigger id the fake routines API refuses once with a 503, then accepts (the Retry e2e). */
export const E2E_FLAKY_TRIGGER = "trig_e2e_flaky";
/**
 * The project groups e2e (CT-30): repositories of two fictional forge owners, which join the groups that take new
 * projects from their owner (the spec types the second owner with capitals). Only e2e/project-groups.spec.ts watches them.
 */
export const GROUP_OWNER_REPOSITORIES = {
  atlas: ["atlas-works/atlas-app", "atlas-works/atlas-docs"],
  birch: ["birch-labs/birch-app"],
} as const;
