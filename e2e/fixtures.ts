// The e2e's fictional owner and its stack. Nothing here is a real person or a secret.
export const E2E_PORT = Number(process.env.E2E_PORT ?? 3100);
export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "pglite://.data/e2e";
export const OWNER_EMAIL = "owner@example.com";
export const OWNER_PASSWORD = "e2e owner password 2026";
