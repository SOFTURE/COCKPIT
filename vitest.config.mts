import { softureVitestConfig } from "@softure-ai/testing";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  softureVitestConfig({ timeZone: "America/New_York" }),
  defineConfig({
    test: {
      include: ["tests/**/*.test.{ts,tsx}"],
      // Every module set is migrated once per run into a PGlite template (@softure-ai/db README §5).
      globalSetup: ["@softure-ai/db/testing/global-setup"],
      testTimeout: 30_000,
    },
  }),
);
