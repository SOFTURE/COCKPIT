// The operator makes the owner an admin once, after create-account, so the owner can invite and remove teammates
// (FR-16): `npm run grant-role -- --email=<owner> --role=admin --commit` locally, or on the server
// `softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`. Without --commit it shows
// the account's roles before and after and rolls back. The Dockerfile bundles this file into ops/grant-role.mjs.
import { createGrantRoleScript } from "@softure-ai/auth/scripts";
import { runOpsScript } from "@softure-ai/ops/scripts";
import config from "../../softure.config.ts";

process.exitCode = await runOpsScript({ script: createGrantRoleScript(config), argv: process.argv.slice(2), config });
