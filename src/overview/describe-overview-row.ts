// The wording of an overview row's values, shared by the overview screen and the terminal (FR-7, FR-15).
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { countFailures } from "../doctor/parse-failure-codes.ts";
import type { OverviewDoctor, OverviewNumbers, OverviewRelease, OverviewRun } from "./build-overview.ts";

type Copy = AppMessages["overview"];
type FormatTime = (date: Date) => string;

/** The active roadmap as `slug done/total`, or that there is none. */
export function describeRoadmap(copy: Copy, roadmap: OverviewNumbers["activeRoadmap"]): string {
  return roadmap === null ? copy.noRoadmap : fillMessage(copy.roadmapValue, { slug: roadmap.slug ?? "?", done: roadmap.done, total: roadmap.total });
}

export function describeRelease(copy: Copy, release: OverviewRelease | null): string {
  if (release === null) {
    return copy.noRelease;
  }
  if (release.source === "roadmap") {
    return release.date === null
      ? fillMessage(copy.releaseFromRoadmapUndated, { version: release.version })
      : fillMessage(copy.releaseFromRoadmap, { version: release.version, date: release.date });
  }
  return release.date === null ? fillMessage(copy.release, { version: release.version }) : fillMessage(copy.releaseDated, { version: release.version, date: release.date });
}

export function describeRun(copy: Copy, label: string, run: OverviewRun, formatTime: FormatTime): string {
  if (run.kind === "none") {
    return fillMessage(copy.runNone, { label });
  }
  if (run.kind === "not_readable") {
    return fillMessage(copy.runNotReadable, { label });
  }
  if (run.kind === "not_read") {
    return fillMessage(copy.runNotRead, { label });
  }
  const at = new Date(run.at);
  const result = copy.runResults[run.result];
  return Number.isNaN(at.getTime())
    ? fillMessage(copy.runValue, { label, result })
    : fillMessage(copy.runValueDated, { label, result, time: formatTime(at) });
}

/** Where a run comes from when it is not the main branch's (`from PR #N`); null for a main-branch run. */
export function describeRunSource(copy: Copy, run: OverviewRun): string | null {
  return run.kind === "run" && run.pullRequest !== null ? fillMessage(copy.runFromPullRequest, { number: run.pullRequest.number }) : null;
}

/** The run and, when it comes from a pull request, its source: the terminal's one-line wording. */
export function describeRunWithSource(copy: Copy, label: string, run: OverviewRun, formatTime: FormatTime): string {
  const source = describeRunSource(copy, run);
  const text = describeRun(copy, label, run, formatTime);
  return source === null ? text : `${text} · ${source}`;
}

export interface DoctorText {
  readonly text: string;
  readonly hint: string | undefined;
}

export function describeDoctor(copy: Copy, doctor: OverviewDoctor): DoctorText {
  switch (doctor.kind) {
    case "ok":
      return { text: copy.doctorOk, hint: undefined };
    case "failing": {
      if (doctor.codes === null || doctor.codes.length === 0) {
        return { text: copy.doctorFailing, hint: copy.doctorFailingHint };
      }
      const count = countFailures(doctor.codes);
      const hint = doctor.codes.map((code) => fillMessage(copy.doctorCode, { code: code.code, count: code.count })).join(", ");
      return { text: count === 1 ? copy.doctorFailure : fillMessage(copy.doctorFailures, { count }), hint };
    }
    case "pending":
      return { text: copy.doctorPending, hint: undefined };
    case "missing":
      return { text: copy.doctorMissing, hint: copy.doctorMissingHint };
    case "not_readable":
      return { text: copy.doctorNotReadable, hint: undefined };
    case "not_read":
      return { text: copy.doctorNotRead, hint: undefined };
  }
}
