// The digest as a job: run at the scheduled time of day (FR-12).
import { ok } from "@softure-ai/core";
import { defineJobHandler, failJob, retryJobLater } from "@softure-ai/jobs";
import { z } from "zod";
import type { DigestSettings } from "./digest-settings.ts";
import { runDigest } from "./run-digest.ts";

export function createDigestHandler(getSettings: () => DigestSettings | null) {
  return defineJobHandler({
    payload: z.object({}).loose(),
    run: async (_payload, context) => {
      const settings = getSettings();
      if (settings === null) {
        return failJob("digest.not_configured", { expected: true });
      }
      const run = await runDigest(context, settings);
      if (!run.ok) {
        return run;
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
