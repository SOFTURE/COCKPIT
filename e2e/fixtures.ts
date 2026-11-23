// The e2e's fictional owner and its stack. Nothing here is a real person or a secret.
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "pglite://.data/e2e";
export const OWNER_EMAIL = "owner@example.com";
export const OWNER_PASSWORD = "e2e owner password 2026";
/** A fictional teammate the owner invited earlier (FR-16): no admin role. */
export const TEAMMATE_EMAIL = "teammate@example.com";
export const TEAMMATE_PASSWORD = "e2e teammate password 2026";
/** The fake forge (e2e/fake-forge.ts) and the fictional token it accepts. */
export const FAKE_FORGE_PORT = Number(process.env.FAKE_FORGE_PORT ?? 3101);
export const E2E_FORGE_TOKEN = "e2e-forge-token";
