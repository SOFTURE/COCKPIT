// The operator creates the owner's account once: `npm run create-account -- --email=<owner> --commit`.
// Without --commit it shows what it would create and rolls back. It prints a temporary password once.
import { createCreateAccountScript } from "@softure-ai/auth/scripts";
import { runOpsScript } from "@softure-ai/ops/scripts";
import config from "../softure.config.ts";

process.exitCode = await runOpsScript({
  script: createCreateAccountScript(config, { maxAccounts: 1 }),
  argv: process.argv.slice(2),
  config,
});
