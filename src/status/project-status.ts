// A project's one status (FR-8, the PRD's core rule), the first that applies: broken (its state cannot be read,
// the last CI run on its main branch failed, its doctor fails, or its observability backend reports it unhealthy), waiting for you (an unanswered entry), stalled (open work whose
// state has not changed for longer than the stall threshold), moving (open work that changed within it), idle.
export const PROJECT_STATUSES = ["broken", "waiting", "stalled", "moving", "idle"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Open work with no change of its state for longer than this is stalled (PRD: 48 hours by default). */
export const STALL_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export type BrokenReason = "state_unreadable" | "ci_failed" | "doctor_failing" | "unhealthy";

export interface ProjectStatusFacts {
  /** The latest read found a valid state. */
  readonly isStateRead: boolean;
  /** The last completed CI run on the main branch failed. */
  readonly hasCiFailed: boolean;
  /** The `context-doctor` check run on the main branch's head failed. */
  readonly hasDoctorFailed: boolean;
  /** The project's observability backend reports it unhealthy (FR-17); an unknown or absent health never is. */
  readonly isUnhealthy: boolean;
  readonly unansweredCount: number;
  /** Open roadmap items or open changes. */
  readonly hasOpenWork: boolean;
  /** The state's `updated_at`; null when unknown. */
  readonly stateUpdatedAt: Date | null;
}

export interface ProjectStatusResult {
  readonly status: ProjectStatus;
  readonly brokenReasons: readonly BrokenReason[];
}

export function getProjectStatus(facts: ProjectStatusFacts, now: Date, stallThresholdMs: number = STALL_THRESHOLD_MS): ProjectStatusResult {
  const brokenReasons: BrokenReason[] = [];
  if (!facts.isStateRead) {
    brokenReasons.push("state_unreadable");
  }
  if (facts.hasCiFailed) {
    brokenReasons.push("ci_failed");
  }
  if (facts.hasDoctorFailed) {
    brokenReasons.push("doctor_failing");
  }
  if (facts.isUnhealthy) {
    brokenReasons.push("unhealthy");
  }
  if (brokenReasons.length > 0) {
    return { status: "broken", brokenReasons };
  }
  if (facts.unansweredCount > 0) {
    return { status: "waiting", brokenReasons };
  }
  if (!facts.hasOpenWork) {
    return { status: "idle", brokenReasons };
  }
  const isStale = facts.stateUpdatedAt === null || now.getTime() - facts.stateUpdatedAt.getTime() > stallThresholdMs;
  return { status: isStale ? "stalled" : "moving", brokenReasons };
}
