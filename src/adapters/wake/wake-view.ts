// What a project's stored wake read shows: nothing (no workflow file, or never read), what wakes it on an
// owner-word issue, or unknown with the reason.
import type { StoredAdapterRead } from "../../../modules/adapters/reads.ts";
import { ownerWordWakeSchema, WAKE_ADAPTER_ID, WAKE_UNKNOWN_REASONS, type OwnerWordWake, type WakeUnknownReason } from "./owner-word-wake.ts";

export type WakeView =
  | { readonly kind: "none" }
  | { readonly kind: "declared"; readonly wake: OwnerWordWake }
  | { readonly kind: "unknown"; readonly reason: WakeUnknownReason | "other" };

export const NO_WAKE: WakeView = { kind: "none" };

function toReason(reason: string): WakeUnknownReason | "other" {
  return (WAKE_UNKNOWN_REASONS as readonly string[]).includes(reason) ? (reason as WakeUnknownReason) : "other";
}

/** The wake view of one project, from every stored adapter read (the wake one, if any). */
export function getWakeView(reads: readonly StoredAdapterRead[], key: string): WakeView {
  const read = reads.find((candidate) => candidate.key === key && candidate.adapter === WAKE_ADAPTER_ID);
  if (read === undefined || read.status === "absent") {
    return NO_WAKE;
  }
  if (read.status === "unknown") {
    return { kind: "unknown", reason: toReason(read.reason) };
  }
  // The stored value was valid when written; it is read defensively all the same.
  const declared = ownerWordWakeSchema.safeParse(read.value);
  return declared.success ? { kind: "declared", wake: declared.data.wake } : { kind: "unknown", reason: "other" };
}

/** True when an owner-word issue is picked up the moment it lands, with no run in flight. */
export function isWakingOnItsOwn(view: WakeView): boolean {
  return view.kind === "declared" && view.wake === "routine";
}
