// The e2e's fictional owner and its stack. Nothing here is a real person or a secret.
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "pglite://.data/e2e";
/** A second server of the same build with APP_LOCALE=pl, on its own port and database (e2e/polish.spec.ts). */
export const E2E_POLISH_PORT = Number(process.env.E2E_POLISH_PORT ?? 3102);
export const E2E_POLISH_DATABASE_URL = "pglite://.data/e2e-pl";
export const OWNER_EMAIL = "owner@example.com";
export const OWNER_PASSWORD = "e2e owner password 2026";
/** A fictional teammate the owner invited earlier (FR-16): no admin role. */
export const TEAMMATE_EMAIL = "teammate@example.com";
export const TEAMMATE_PASSWORD = "e2e teammate password 2026";
/** The fake forge (e2e/fake-forge.ts) and the fictional token it accepts. */
export const FAKE_FORGE_PORT = Number(process.env.FAKE_FORGE_PORT ?? 3101);
export const E2E_FORGE_TOKEN = "e2e-forge-token";
/** The fake observability backend (Grafana's rules API, served by the fake forge under /grafana) and its token. */
export const E2E_GRAFANA_PATH = "/grafana";
export const E2E_GRAFANA_TOKEN = "e2e-grafana-token";
/** Signs the digest's unsubscribe links in the e2e; fictional, at least 32 characters. */
export const E2E_UNSUBSCRIBE_SECRET = "e2e-fictional-unsubscribe-secret-0001";
/** Keys each recipient (@softure-ai/mailing 0.3): at least 32 characters, fictional. */
export const E2E_EMAIL_KEY_SECRET = "e2e-fictional-email-key-secret-000000001";
