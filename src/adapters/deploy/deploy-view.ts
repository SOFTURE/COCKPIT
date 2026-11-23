// What a project's stored deploy read shows: nothing (no deploy workflow), its deploy state, or unknown with the
// reason its source failed.
import type { StoredAdapterRead } from "../../../modules/adapters/reads.ts";
import { DEPLOY_ADAPTER_ID, DEPLOY_UNKNOWN_REASONS, deployStateSchema, type DeployState, type DeployUnknownReason } from "./deploy-state.ts";

export type DeployView =
  | { readonly kind: "none" }
  | { readonly kind: "state"; readonly state: DeployState }
  | { readonly kind: "unknown"; readonly reason: DeployUnknownReason | "other" };

export const NO_DEPLOY: DeployView = { kind: "none" };

function toReason(reason: string): DeployUnknownReason | "other" {
  return (DEPLOY_UNKNOWN_REASONS as readonly string[]).includes(reason) ? (reason as DeployUnknownReason) : "other";
}

/** The deploy view of one project, from every stored adapter read (the deploy one, if any). */
export function getDeployView(reads: readonly StoredAdapterRead[], key: string): DeployView {
  const read = reads.find((candidate) => candidate.key === key && candidate.adapter === DEPLOY_ADAPTER_ID);
  if (read === undefined || read.status === "absent") {
    return NO_DEPLOY;
  }
  if (read.status === "unknown") {
    return { kind: "unknown", reason: toReason(read.reason) };
  }
  // The stored value was valid when written; it is read defensively all the same.
  const state = deployStateSchema.safeParse(read.value);
  return state.success ? { kind: "state", state: state.data } : { kind: "unknown", reason: "other" };
}
