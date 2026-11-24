// The palette colour of each state the screens show as a chip: success green, warning amber, failure red, work in
// progress blue, and neutral or unknown grey. The word or icon beside it keeps every state readable without colour.
import type { DeployResult } from "../adapters/deploy/deploy-state.ts";
import { getDeployResultLook } from "../adapters/deploy/deploy-step-looks.ts";
import type { OverviewDoctor, OverviewRun } from "../overview/build-overview.ts";

export type StateColor = "green" | "orange" | "red" | "blue" | "gray";

/** The colour of a CI or quality-review run chip. */
export function getRunColor(run: OverviewRun): StateColor {
  if (run.kind !== "run") {
    return "gray";
  }
  return getDeployResultColor(run.result);
}

/** The colour of the doctor chip. */
export function getDoctorColor(doctor: OverviewDoctor): StateColor {
  switch (doctor.kind) {
    case "ok":
      return "green";
    case "failing":
      return "red";
    case "pending":
      return "blue";
    default:
      return "gray";
  }
}

/** The colour of the health chip. */
export function getHealthColor(kind: "healthy" | "unhealthy" | "unknown"): StateColor {
  if (kind === "healthy") {
    return "green";
  }
  return kind === "unhealthy" ? "red" : "gray";
}

/** The colour of a package's locked version against the newest on npm. */
export function getPackageVersionColor(state: "current" | "behind"): StateColor {
  return state === "current" ? "green" : "orange";
}

/** The colour of a run's or a deploy's result: passed green, failed red, running blue, cancelled grey. */
export function getDeployResultColor(result: DeployResult): StateColor {
  const color = getDeployResultLook(result).color;
  return color === "yellow" ? "orange" : color;
}
