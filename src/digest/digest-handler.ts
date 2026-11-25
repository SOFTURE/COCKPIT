// The digest as a job: run at the scheduled time of day (FR-12).
import { ok } from "@softure-ai/core";
import { defineJobHandler, failJob, retryJobLater } from "@softure-ai/jobs";
import { createLogger } from "@softure-ai/observability";
import { z } from "zod";
import type { DigestSettings } from "./digest-settings.ts";
import { runDigest } from "./run-digest.ts";

const logger = createLogger("digest");

export function createDigestHandler(getSettings: () => DigestSettings | null) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async (_payload, context) => {
      const settings = getSettings();
      if (settings === null) {
        logger.info("digest is off: recipients, sender or key secret not configured");
        return failJob("digest.not_configured", { expected: true });
      }
      const run = await runDigest(context, settings);
      if (!run.ok) {
        logger.error("digest run failed", { code: run.error });
        return run;
      }
      // The outcome only: recipients are mail addresses and never logged.
      const fields = { outcome: run.value.kind, recipients: settings.recipients.length };
      if (run.value.kind === "sent") {
        logger.info("digest mail sent", { ...fields, digest: run.value.digestId });
      } else if (run.value.kind === "retry_later") {
        logger.warn("digest mail delayed by the mail provider", { ...fields, retry_seconds: run.value.seconds });
      } else if (run.value.kind === "uncertain") {
        logger.error("digest mail delivery uncertain", fields);
      } else {
        logger.info("digest run sent nothing", fields);
      }
      if (run.value.kind === "retry_later") {
        return retryJobLater("digest.mail_unavailable", run.value.seconds);
      }
      if (run.value.kind === "uncertain") {
        // A send older than the provider's idempotency window may have gone out: an operator checks first.
        return failJob("digest.delivery_uncertain");
      }
      return ok();
    },
  });
}
