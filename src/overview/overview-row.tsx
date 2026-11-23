// One project of the overview: its name and status, why it is broken, and the numbers behind the status as
// property chips (FR-7), the doctor's among them.
import { Badge } from "@softure-ai/theme-notion";
import Link from "next/link";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ProjectStatusBadge } from "../status/project-status-badge.tsx";
import { countFailures } from "../doctor/parse-failure-codes.ts";
import type { OverviewDoctor, OverviewRelease, OverviewRow as OverviewRowData, OverviewRun } from "./build-overview.ts";

type Copy = AppMessages["overview"];
type FormatTime = (date: Date) => string;

function describeRelease(copy: Copy, release: OverviewRelease | null): string {
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

function describeRun(copy: Copy, label: string, run: OverviewRun, formatTime: FormatTime): string {
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

function RunChip({ copy, label, run, formatTime }: { readonly copy: Copy; readonly label: string; readonly run: OverviewRun; readonly formatTime: FormatTime }) {
  const text = describeRun(copy, label, run, formatTime);
  const color = run.kind === "run" && run.result === "failed" ? "red" : "gray";
  return (
    <Badge variant="tag" color={color} className="max-w-full truncate">
      {run.kind === "run" ? (
        <a href={run.url} rel="noreferrer" target="_blank" className="underline-offset-2 hover:underline">
          {text}
        </a>
      ) : (
        text
      )}
    </Badge>
  );
}

interface DoctorChipText {
  readonly text: string;
  readonly hint: string | undefined;
}

function describeDoctor(copy: Copy, doctor: OverviewDoctor): DoctorChipText {
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

function DoctorChip({ copy, doctor }: { readonly copy: Copy; readonly doctor: OverviewDoctor }) {
  const { text, hint } = describeDoctor(copy, doctor);
  const url = "url" in doctor ? doctor.url : null;
  return (
    <Badge variant="tag" color={doctor.kind === "failing" ? "red" : "gray"} title={hint} className="max-w-full truncate" data-doctor={doctor.kind}>
      {url === null ? (
        text
      ) : (
        <a href={url} rel="noreferrer" target="_blank" className="underline-offset-2 hover:underline">
          {text}
        </a>
      )}
    </Badge>
  );
}

export function OverviewRow({ row, copy, formatTime }: { readonly row: OverviewRowData; readonly copy: Copy; readonly formatTime: FormatTime }) {
  const { numbers } = row;
  const roadmap = numbers?.activeRoadmap ?? null;
  return (
    <li className="grid gap-2 py-3" data-project={row.fullName}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Link href={`/projects/${row.fullName}`} className="min-w-0 truncate font-medium underline-offset-2 hover:underline">
          {row.fullName}
        </Link>
        <ProjectStatusBadge status={row.status} copy={copy} />
      </div>
      {row.brokenReasons.map((reason) => (
        <p key={reason} className="text-small text-muted-foreground">
          {copy.brokenReasons[reason]}
        </p>
      ))}
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {numbers === null ? (
          <Badge variant="tag" color="gray">
            {copy.noState}
          </Badge>
        ) : (
          <>
            <Badge variant="tag" color="blue" title={roadmap?.title ?? copy.roadmap} className="max-w-full truncate">
              {roadmap === null
                ? copy.noRoadmap
                : `${fillMessage(copy.roadmapValue, { slug: roadmap.slug ?? "?", done: roadmap.done, total: roadmap.total })}${roadmap.title === null ? "" : ` · ${roadmap.title}`}`}
            </Badge>
            <Badge variant="tag" color="gray">
              {fillMessage(copy.queued, { count: numbers.queued })}
            </Badge>
            <Badge variant="tag" color="gray">
              {fillMessage(copy.openChanges, { count: numbers.openChanges })}
            </Badge>
            <Badge variant="tag" color={numbers.unanswered > 0 ? "orange" : "gray"}>
              {fillMessage(copy.waiting, { count: numbers.waiting })}
            </Badge>
          </>
        )}
        <Badge variant="tag" color="gray">
          {describeRelease(copy, row.release)}
        </Badge>
        <DoctorChip copy={copy} doctor={row.doctor} />
        <RunChip copy={copy} label={copy.ci} run={row.ci} formatTime={formatTime} />
        <RunChip copy={copy} label={copy.qualityReview} run={row.qualityReview} formatTime={formatTime} />
      </div>
      <p className="text-small text-muted-foreground">
        {row.readAt === null ? copy.neverRead : fillMessage(copy.readAt, { time: formatTime(row.readAt) })}
      </p>
    </li>
  );
}
