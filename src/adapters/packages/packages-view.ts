// What a project's stored packages read shows: nothing (not a Node project, or never read), its package updates, or
// unknown with the reason its source failed.
import type { StoredAdapterRead } from "../../../modules/adapters/reads.ts";
import { PACKAGES_ADAPTER_ID, PACKAGES_UNKNOWN_REASONS, packagesStateSchema, type PackagesState, type PackagesUnknownReason } from "./packages-state.ts";

export type PackagesView =
  | { readonly kind: "none" }
  | { readonly kind: "state"; readonly state: PackagesState }
  | { readonly kind: "unknown"; readonly reason: PackagesUnknownReason | "other" };

export const NO_PACKAGES: PackagesView = { kind: "none" };

function toReason(reason: string): PackagesUnknownReason | "other" {
  return (PACKAGES_UNKNOWN_REASONS as readonly string[]).includes(reason) ? (reason as PackagesUnknownReason) : "other";
}

/** The packages view of one project, from every stored adapter read (the packages one, if any). */
export function getPackagesView(reads: readonly StoredAdapterRead[], key: string): PackagesView {
  const read = reads.find((candidate) => candidate.key === key && candidate.adapter === PACKAGES_ADAPTER_ID);
  if (read === undefined || read.status === "absent") {
    return NO_PACKAGES;
  }
  if (read.status === "unknown") {
    return { kind: "unknown", reason: toReason(read.reason) };
  }
  // The stored value was valid when written; it is read defensively all the same.
  const state = packagesStateSchema.safeParse(read.value);
  return state.success ? { kind: "state", state: state.data } : { kind: "unknown", reason: "other" };
}
