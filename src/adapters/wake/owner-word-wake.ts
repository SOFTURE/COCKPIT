// What wakes a watched project when an owner-word issue lands (CV-2), as the project declares it in
// `context/workflow.json` → `autonomy.ownerWordWake` (`@softure-ai/skills`, routines/owner-word-wake.md):
// `routine` (the GitHub-triggered wake routine is set up), `heartbeat` (only the roadmap heartbeat while a run
// works), `none` (nothing), or `undeclared` when the key is left out.
import { z } from "zod";

export const WAKE_ADAPTER_ID = "wake";

/** Where every SOFTURE project keeps its workflow settings. */
export const WORKFLOW_FILE_PATH = "context/workflow.json";

/** The public setup steps of the wake routine, shipped with `@softure-ai/skills`. */
export const WAKE_SETUP_URL = "https://github.com/SOFTURE/SKILLS/blob/main/routines/owner-word-wake.md#setting-it-up";

export const OWNER_WORD_WAKES = ["routine", "heartbeat", "none", "undeclared"] as const;
export type OwnerWordWake = (typeof OWNER_WORD_WAKES)[number];

export const ownerWordWakeSchema = z.object({ wake: z.enum(OWNER_WORD_WAKES) });
export type WakeDeclaration = z.infer<typeof ownerWordWakeSchema>;

export const WAKE_UNKNOWN_REASONS = ["workflow_unreadable", "workflow_invalid", "wake_invalid"] as const;
export type WakeUnknownReason = (typeof WAKE_UNKNOWN_REASONS)[number];
