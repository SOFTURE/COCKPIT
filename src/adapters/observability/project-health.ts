// A project's health as the observability adapter reads it: healthy, or unhealthy with the titles of its firing
// alert rules; and the reason codes of a source that failed.
import { z } from "zod";

export const OBSERVABILITY_ADAPTER_ID = "observability";

export const projectHealthSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("healthy"), rules: z.number().int().nonnegative() }),
  z.object({ kind: z.literal("unhealthy"), firing: z.array(z.string()).min(1) }),
]);

export type ProjectHealth = z.infer<typeof projectHealthSchema>;

export const HEALTH_UNKNOWN_REASONS = [
  // The project's rules file could not be read from the forge.
  "rules_unreadable",
  // The rules file is not a valid `softure-observability` rules file.
  "rules_invalid",
  // The backend refused COCKPIT's token.
  "backend_refused",
  // The backend did not answer.
  "backend_unavailable",
  // The backend answered something that is not a rules list.
  "backend_invalid_answer",
  // None of the project's rules is in the backend: the file was never applied.
  "rules_not_applied",
] as const;

export type HealthUnknownReason = (typeof HEALTH_UNKNOWN_REASONS)[number];
