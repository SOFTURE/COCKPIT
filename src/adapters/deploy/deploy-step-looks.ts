// How each state of a deploy's steps looks on the project page: a result tone (CT-18's one colour map) and an icon, so
// the state reads at a glance and never by colour alone. Passed is success, skipped needs attention (warning), failed
// danger, running and cancelled muted.
import { CircleCheck, CircleDashed, CircleMinus, CircleX, LoaderCircle, type LucideIcon } from "lucide-react";
import type { ResultTone } from "../../shell/result-badge.tsx";
import type { DeployResult, VerifyResult } from "./deploy-state.ts";

export interface StepLook {
  readonly tone: ResultTone;
  readonly icon: LucideIcon;
  /** The icon turns while the step runs. */
  readonly isSpinning?: boolean;
}

const RESULT_LOOKS: Readonly<Record<DeployResult, StepLook>> = {
  passed: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  cancelled: { tone: "muted", icon: CircleMinus },
  running: { tone: "muted", icon: LoaderCircle, isSpinning: true },
};

const VERIFY_LOOKS: Readonly<Record<VerifyResult, StepLook>> = {
  passed: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  skipped: { tone: "warning", icon: CircleMinus },
  cancelled: { tone: "muted", icon: CircleMinus },
};

const UNREPORTED_LOOK: StepLook = { tone: "muted", icon: CircleDashed };

/** The look of a deploy run's result. */
export function getDeployResultLook(result: DeployResult): StepLook {
  return RESULT_LOOKS[result];
}

/** The look of a release's verification; null when no release report names it. */
export function getVerifyLook(verify: VerifyResult | null): StepLook {
  return verify === null ? UNREPORTED_LOOK : VERIFY_LOOKS[verify];
}
