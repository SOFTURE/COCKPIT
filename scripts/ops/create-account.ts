// The operator creates the owner's account on the server once, through the live app container:
// `softure-deploy run --host=<ssh alias> create-account --email=<owner> --commit` (a dry run without --commit).
// The Dockerfile bundles this file into ops/create-account.mjs. It prints a temporary password once.
import { createCreateAccountScript } from "@softure-ai/auth/scripts";
import { runOpsScript } from "@softure-ai/ops/scripts";
import config from "../../softure.config.ts";

process.exitCode = await runOpsScript({
  script: createCreateAccountScript(config, { maxAccounts: 1 }),
  argv: process.argv.slice(2),
  config,
});
