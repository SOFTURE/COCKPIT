// The tone of each result the screens show as a badge, in the one colour map of CT-18 (`ResultBadge`): done green
// (success), failed red (danger), needs attention orange (warning), and none, pending or still running gray (muted).
// The word or icon beside it keeps every state readable without colour.
import type { DeployResult } from "../adapters/deploy/deploy-state.ts";
import { getDeployResultLook } from "../adapters/deploy/deploy-step-looks.ts";
import type { OverviewDoctor, OverviewRun } from "../overview/build-overview.ts";
import type { Tone } from "@softure-ai/theme-notion";

/** The tone of a CI or quality-review run chip. */
export function getRunTone(run: OverviewRun): Tone {
  if (run.kind !== "run") {
    return "muted";
  }
  return getDeployResultTone(run.result);
}

/** The tone of the doctor chip. */
export function getDoctorTone(doctor: OverviewDoctor): Tone {
  switch (doctor.kind) {
    case "ok":
      return "success";
    case "failing":
      return "danger";
    default:
      return "muted";
  }
}

/** The tone of the health chip. */
export function getHealthTone(kind: "healthy" | "unhealthy" | "unknown"): Tone {
  if (kind === "healthy") {
    return "success";
  }
  return kind === "unhealthy" ? "danger" : "muted";
}

/** The tone of a package's locked version against the newest on npm. */
export function getPackageVersionTone(state: "current" | "behind"): Tone {
  return state === "current" ? "success" : "warning";
}

/** The tone of a run's or a deploy's result: passed success, failed danger, running and cancelled muted. */
export function getDeployResultTone(result: DeployResult): Tone {
  return getDeployResultLook(result).tone;
}
