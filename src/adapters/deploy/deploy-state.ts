// A project's deploy state as the deploy adapter reads it (FR-17): the version running in production and the last
// deploy with its result and verification; and the reason codes of a source that failed.
import { z } from "zod";

export const DEPLOY_ADAPTER_ID = "deploy";

/** The deploy workflow `softure-deploy init` writes (server and Cloudflare templates alike). */
export const DEPLOY_WORKFLOW_FILE = "deploy.yml";

const isoTime = z.string().min(1);

export const deployResultSchema = z.enum(["passed", "failed", "cancelled", "running"]);
export type DeployResult = z.infer<typeof deployResultSchema>;

export const verifyResultSchema = z.enum(["passed", "failed", "skipped", "cancelled"]);
export type VerifyResult = z.infer<typeof verifyResultSchema>;

export const deployStateSchema = z.object({
  /** The newest version known to run in production; null when no successful production deploy is known. */
  production: z.object({ version: z.string().min(1), at: isoTime }).nullable(),
  last: z.object({
    result: deployResultSchema,
    /** The release tag the run deployed; null when neither the run nor a release report names it. */
    version: z.string().min(1).nullable(),
    /** The verification of the release; null when no release report names it. */
    verify: verifyResultSchema.nullable(),
    /** The server step a failed deploy stopped at (`migrate`), from the release report. */
    failedStep: z.string().min(1).nullable(),
    url: z.string().min(1),
    at: isoTime,
  }),
});

export type DeployState = z.infer<typeof deployStateSchema>;

export const DEPLOY_UNKNOWN_REASONS = [
  // The deploy workflow's runs could not be read from the forge.
  "runs_unreadable",
  // The forge answered something that is not a list of runs.
  "runs_invalid",
] as const;

export type DeployUnknownReason = (typeof DEPLOY_UNKNOWN_REASONS)[number];
