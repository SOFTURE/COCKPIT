// What wakes a watched project when a cockpit issue lands (CV-2), as the project declares it in
// `context/workflow.json` → `autonomy.cockpitWake` (`ownerWordWake` before `@softure-ai/skills` 0.39,
// routines/cockpit-wake.md):
// `routine` (the GitHub-triggered wake routine is set up), `heartbeat` (only the roadmap heartbeat while a run
// works), `none` (nothing), or `undeclared` when the key is left out.
import { z } from "zod";

export const WAKE_ADAPTER_ID = "wake";

/** Where every SOFTURE project keeps its workflow settings. */
export const WORKFLOW_FILE_PATH = "context/workflow.json";

/** The public setup steps of the wake routine, shipped with `@softure-ai/skills` (its repository's default branch is `master`). */
export const WAKE_SETUP_URL = "https://github.com/SOFTURE/SKILLS/blob/master/routines/cockpit-wake.md#setting-it-up";

export const OWNER_WORD_WAKES = ["routine", "heartbeat", "none", "undeclared"] as const;
export type OwnerWordWake = (typeof OWNER_WORD_WAKES)[number];

export const ownerWordWakeSchema = z.object({ wake: z.enum(OWNER_WORD_WAKES) });
export type WakeDeclaration = z.infer<typeof ownerWordWakeSchema>;

export const WAKE_UNKNOWN_REASONS = ["workflow_unreadable", "workflow_invalid", "wake_invalid"] as const;
export type WakeUnknownReason = (typeof WAKE_UNKNOWN_REASONS)[number];
