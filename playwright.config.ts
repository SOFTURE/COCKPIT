import { defineConfig, devices } from "@playwright/test";
import { softurePlaywrightUse } from "@softure-ai/testing/playwright";
import { E2E_DATABASE_URL, E2E_FORGE_TOKEN, E2E_PORT, E2E_UNSUBSCRIBE_SECRET, FAKE_FORGE_PORT } from "./e2e/fixtures.ts";

// Black-box tests of the built app (`npm run build` first). The server starts on a fresh, migrated PGlite directory
// with the owner account (e2e/prepare.ts).
const ORIGIN = `http://localhost:${String(E2E_PORT)}`;
const FORGE_ORIGIN = `http://127.0.0.1:${String(FAKE_FORGE_PORT)}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // No retries: a test that passes on the second try is a flaky test, not a green one.
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    ...softurePlaywrightUse(),
    baseURL: ORIGIN,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: `npx tsx e2e/fake-forge.ts`,
      url: `${FORGE_ORIGIN}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { FAKE_FORGE_PORT: String(FAKE_FORGE_PORT) },
    },
    {
      command: `npx tsx e2e/prepare.ts && npm run start -- --port ${String(E2E_PORT)}`,
      url: `${ORIGIN}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        APP_ORIGIN: ORIGIN,
        DATABASE_URL: E2E_DATABASE_URL,
        E2E_DATABASE_URL,
        FORGE_API_URL: FORGE_ORIGIN,
        FORGE_TOKEN: E2E_FORGE_TOKEN,
        JOBS_IN_APP_PROCESS: "true",
        MAILING_UNSUBSCRIBE_SECRET: E2E_UNSUBSCRIBE_SECRET,
      },
    },
  ],
});
