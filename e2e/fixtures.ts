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
/**
 * The grouped projects e2e (CT-32): repositories of two fictional forge owners, each joining the group that takes new
 * projects from it, and one project of no group. Only e2e/grouped-projects.spec.ts watches them.
 */
export const GROUPED_LIST_REPOSITORIES = {
  elm: ["elm-works/elm-app", "elm-works/elm-docs"],
  fir: ["fir-labs/fir-app"],
  loose: ["example-org/loose-app"],
} as const;
/**
 * The other grouped project lists e2e (CT-35): Scan status, Packages and Deploys in the owner's groups. oak-app and
 * stray-app have a deploy workflow and packages; oak-docs and hazel-app have packages only, so Hazel gets no section
 * on Deploys. Only e2e/grouped-other-lists.spec.ts watches them.
 */
export const GROUPED_OTHER_REPOSITORIES = {
  oak: ["oak-works/oak-app", "oak-works/oak-docs"],
  hazel: ["hazel-labs/hazel-app"],
  stray: ["example-org/stray-app"],
} as const;
/**
 * The grouped sidebar e2e (CT-33): repositories of two fictional forge owners, each joining the group that takes new
 * projects from it, and one project of no group. Only e2e/grouped-sidebar.spec.ts watches them.
 */
export const GROUPED_SIDEBAR_REPOSITORIES = {
  maple: ["maple-row/maple-app", "maple-row/maple-docs"],
  pine: ["pine-yard/pine-app"],
  loose: ["example-org/sidebar-loose-app"],
} as const;

/** The Scheduled tasks e2e (CT-37): two fictional projects only it watches, and its tasks, seeded by e2e/prepare.ts. */
export const SCHEDULED_REPOSITORIES = ["example-org/almanac-app", "example-org/almanac-web"] as const;

export interface ScheduledTaskFixture {
  readonly id: string;
  readonly title: string;
  readonly prompt: string;
  /** Days after the database is prepared, so the time is always ahead. */
  readonly daysAhead: number;
}

/** Soonest first: the first is run now, the second deleted, the third stays. */
export const SCHEDULED_TASKS: readonly ScheduledTaskFixture[] = [
  { id: "00000000-0000-4000-8000-00000000a1a1", title: "Almanac doctor sweep", prompt: "Run the context doctor and fix what it names.\nReport back.", daysAhead: 2 },
  { id: "00000000-0000-4000-8000-00000000a1a2", title: "Almanac dependency review", prompt: "Review the dependency updates of the week.", daysAhead: 4 },
  { id: "00000000-0000-4000-8000-00000000a1a3", title: "Almanac release notes", prompt: "Draft the release notes of the last sprint.", daysAhead: 6 },
];
