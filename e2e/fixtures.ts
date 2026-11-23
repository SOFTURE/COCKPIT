// The e2e's fictional owner and its stack. Nothing here is a real person or a secret.
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "pglite://.data/e2e";
export const OWNER_EMAIL = "owner@example.com";
export const OWNER_PASSWORD = "e2e owner password 2026";
/** The fake forge (e2e/fake-forge.ts) and the fictional token it accepts. */
export const FAKE_FORGE_PORT = Number(process.env.FAKE_FORGE_PORT ?? 3101);
export const E2E_FORGE_TOKEN = "e2e-forge-token";
/** Signs the digest's unsubscribe links in the e2e; fictional, at least 32 characters. */
export const E2E_UNSUBSCRIBE_SECRET = "e2e-fictional-unsubscribe-secret-0001";
