// The wake adapter as the scan runs it. It needs no configuration: the forge token already reads the repository's
// files (Contents read).
import type { ProjectAdapter } from "../contract.ts";
import { WAKE_ADAPTER_ID, type WakeDeclaration } from "./owner-word-wake.ts";
import { readWake } from "./read-wake.ts";

export function createWakeAdapter(): ProjectAdapter<WakeDeclaration> {
  return { id: WAKE_ADAPTER_ID, read: readWake };
}
