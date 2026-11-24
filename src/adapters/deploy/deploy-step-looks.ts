// How each state of a deploy's steps looks on the project page: a palette colour and an icon, so the state reads at a
// glance and never by colour alone. Passed is green, skipped amber, failed red, running blue, cancelled grey.
import { CircleCheck, CircleDashed, CircleMinus, CircleX, LoaderCircle, type LucideIcon } from "lucide-react";
import type { DeployResult, VerifyResult } from "./deploy-state.ts";

export type StepColor = "green" | "yellow" | "red" | "blue" | "gray";

export interface StepLook {
  readonly color: StepColor;
  readonly icon: LucideIcon;
  /** The icon turns while the step runs. */
  readonly isSpinning?: boolean;
}

const RESULT_LOOKS: Readonly<Record<DeployResult, StepLook>> = {
  passed: { color: "green", icon: CircleCheck },
  failed: { color: "red", icon: CircleX },
  cancelled: { color: "gray", icon: CircleMinus },
  running: { color: "blue", icon: LoaderCircle, isSpinning: true },
};

const VERIFY_LOOKS: Readonly<Record<VerifyResult, StepLook>> = {
  passed: { color: "green", icon: CircleCheck },
  failed: { color: "red", icon: CircleX },
  skipped: { color: "yellow", icon: CircleMinus },
  cancelled: { color: "gray", icon: CircleMinus },
};

const UNREPORTED_LOOK: StepLook = { color: "gray", icon: CircleDashed };

/** The look of a deploy run's result. */
export function getDeployResultLook(result: DeployResult): StepLook {
  return RESULT_LOOKS[result];
}

/** The look of a release's verification; null when no release report names it. */
export function getVerifyLook(verify: VerifyResult | null): StepLook {
  return verify === null ? UNREPORTED_LOOK : VERIFY_LOOKS[verify];
}
