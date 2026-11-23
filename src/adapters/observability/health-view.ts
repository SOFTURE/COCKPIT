// What a project's stored observability read shows: nothing (no source), healthy, unhealthy with the firing rules,
// or unknown with the reason its source failed.
import type { StoredAdapterRead } from "../../../modules/adapters/reads.ts";
import { HEALTH_UNKNOWN_REASONS, OBSERVABILITY_ADAPTER_ID, projectHealthSchema, type HealthUnknownReason, type ProjectHealth } from "./project-health.ts";

export type HealthView = { readonly kind: "none" } | ProjectHealth | { readonly kind: "unknown"; readonly reason: HealthUnknownReason | "other" };

export const NO_HEALTH: HealthView = { kind: "none" };

function toReason(reason: string): HealthUnknownReason | "other" {
  return (HEALTH_UNKNOWN_REASONS as readonly string[]).includes(reason) ? (reason as HealthUnknownReason) : "other";
}

/** The health view of one project, from every stored adapter read (the observability one, if any). */
export function getHealthView(reads: readonly StoredAdapterRead[], key: string): HealthView {
  const read = reads.find((candidate) => candidate.key === key && candidate.adapter === OBSERVABILITY_ADAPTER_ID);
  if (read === undefined || read.status === "absent") {
    return NO_HEALTH;
  }
  if (read.status === "unknown") {
    return { kind: "unknown", reason: toReason(read.reason) };
  }
  // The stored value was valid when written; it is read defensively all the same.
  const health = projectHealthSchema.safeParse(read.value);
  return health.success ? health.data : { kind: "unknown", reason: "other" };
}
