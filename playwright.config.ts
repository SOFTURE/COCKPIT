import { defineConfig, devices } from "@playwright/test";
import { softurePlaywrightUse } from "@softure-ai/testing/playwright";
import {
  E2E_DATABASE_URL,
  E2E_FORGE_TOKEN,
  E2E_GRAFANA_PATH,
  E2E_GRAFANA_TOKEN,
  E2E_POLISH_DATABASE_URL,
  E2E_POLISH_PORT,
  E2E_PORT,
  E2E_SLOW_LIST_DATABASE_URL,
  E2E_SLOW_LIST_PORT,
  E2E_EMAIL_KEY_SECRET,
  E2E_UNSUBSCRIBE_SECRET,
  FAKE_FORGE_PORT,
  SLOW_LIST_PATH,
} from "./e2e/fixtures.ts";

// Black-box tests of the built app (`npm run build` first). The server starts on a fresh, migrated PGlite directory
// with the owner account (e2e/prepare.ts).
const ORIGIN = `http://localhost:${String(E2E_PORT)}`;
const POLISH_ORIGIN = `http://localhost:${String(E2E_POLISH_PORT)}`;
const SLOW_LIST_ORIGIN = `http://localhost:${String(E2E_SLOW_LIST_PORT)}`;
const FORGE_ORIGIN = `http://127.0.0.1:${String(FAKE_FORGE_PORT)}`;
/** The settings both servers share; the Polish one changes its origin, database and locale. */
const SERVER_ENV = {
  APP_ORIGIN: ORIGIN,
  DATABASE_URL: E2E_DATABASE_URL,
  E2E_DATABASE_URL,
  FORGE_API_URL: FORGE_ORIGIN,
  FORGE_TOKEN: E2E_FORGE_TOKEN,
  GRAFANA_URL: `${FORGE_ORIGIN}${E2E_GRAFANA_PATH}`,
  GRAFANA_TOKEN: E2E_GRAFANA_TOKEN,
  JOBS_IN_APP_PROCESS: "true",
  MAILING_UNSUBSCRIBE_SECRET: E2E_UNSUBSCRIBE_SECRET,
  SOFTURE_EMAIL_KEY_SECRET: E2E_EMAIL_KEY_SECRET,
};
const POLISH_SPEC = /polish\.spec\.ts$/;
const SLOW_LIST_SPEC = /slow-repository-list\.spec\.ts$/;

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
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: [POLISH_SPEC, SLOW_LIST_SPEC] },
    // The same build with APP_LOCALE=pl: no English copy may show (CV-3).
    { name: "polish", use: { ...devices["Desktop Chrome"], baseURL: POLISH_ORIGIN }, testMatch: POLISH_SPEC },
    // The same build whose forge lists the token's repositories slowly: Settings before the list arrives (#55).
    { name: "slow-list", use: { ...devices["Desktop Chrome"], baseURL: SLOW_LIST_ORIGIN }, testMatch: SLOW_LIST_SPEC },
  ],
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
      env: SERVER_ENV,
    },
    {
      command: `npx tsx e2e/prepare.ts && npm run start -- --port ${String(E2E_POLISH_PORT)}`,
      url: `${POLISH_ORIGIN}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...SERVER_ENV,
        APP_LOCALE: "pl",
        APP_ORIGIN: POLISH_ORIGIN,
        DATABASE_URL: E2E_POLISH_DATABASE_URL,
        E2E_DATABASE_URL: E2E_POLISH_DATABASE_URL,
      },
    },
    {
      command: `npx tsx e2e/prepare.ts && npm run start -- --port ${String(E2E_SLOW_LIST_PORT)}`,
      url: `${SLOW_LIST_ORIGIN}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...SERVER_ENV,
        APP_ORIGIN: SLOW_LIST_ORIGIN,
        DATABASE_URL: E2E_SLOW_LIST_DATABASE_URL,
        E2E_DATABASE_URL: E2E_SLOW_LIST_DATABASE_URL,
        FORGE_API_URL: `${FORGE_ORIGIN}${SLOW_LIST_PATH}`,
      },
    },
  ],
});
