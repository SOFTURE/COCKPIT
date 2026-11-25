// One project of the overview: its name and status, why it is broken, and the numbers behind the status as
// property chips (FR-7), the doctor's and the health from observability (FR-17) among them.
import { Badge } from "@softure-ai/theme-notion";
import { AppLink } from "../shell/app-link.tsx";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { DriftChips } from "../drift/drift-flags.tsx";
import { WakeChip } from "../routines/wake-chip.tsx";
import { HealthChip } from "../adapters/observability/health-chip.tsx";
import { ProjectStatusBadge } from "../status/project-status-badge.tsx";
import { getDoctorColor, getRunColor } from "../status/state-colors.ts";
import type { OverviewDoctor, OverviewRow as OverviewRowData, OverviewRun } from "./build-overview.ts";
import { describeDoctor, describeRelease, describeRoadmap, describeRun, describeRunSource } from "./describe-overview-row.ts";

type Copy = AppMessages["overview"];
type FormatTime = (date: Date) => string;

function RunChip({ copy, label, run, formatTime }: { readonly copy: Copy; readonly label: string; readonly run: OverviewRun; readonly formatTime: FormatTime }) {
  const text = describeRun(copy, label, run, formatTime);
  const source = describeRunSource(copy, run);
  const color = getRunColor(run);
  return (
    <Badge variant="tag" color={color} className="max-w-full truncate" title={source === null ? undefined : copy.runFromPullRequestHint} data-tone={color}>
      {run.kind === "run" ? (
        <a href={run.url} rel="noreferrer" target="_blank" className="underline-offset-2 hover:underline">
          {text}
        </a>
      ) : (
        text
      )}
      {run.kind === "run" && run.pullRequest !== null && source !== null ? (
        <>
          {" · "}
          <a href={run.pullRequest.url} rel="noreferrer" target="_blank" className="underline-offset-2 hover:underline">
            {source}
          </a>
        </>
      ) : null}
    </Badge>
  );
}

function DoctorChip({ copy, doctor }: { readonly copy: Copy; readonly doctor: OverviewDoctor }) {
  const { text, hint } = describeDoctor(copy, doctor);
  const url = "url" in doctor ? doctor.url : null;
  const color = getDoctorColor(doctor);
  return (
    <Badge variant="tag" color={color} title={hint} className="max-w-full truncate" data-doctor={doctor.kind} data-tone={color}>
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

export function OverviewRow({
  row,
  copy,
  healthCopy,
  wakeCopy,
  driftCopy,
  formatTime,
}: {
  readonly row: OverviewRowData;
  readonly copy: Copy;
  readonly healthCopy: AppMessages["health"];
  readonly wakeCopy: AppMessages["wake"];
  readonly driftCopy: AppMessages["drift"];
  readonly formatTime: FormatTime;
}) {
  const { numbers } = row;
  const roadmap = numbers?.activeRoadmap ?? null;
  return (
    <li className="grid gap-2 py-3" data-project={row.fullName}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <AppLink href={`/projects/${row.fullName}`} className="min-w-0 truncate font-medium underline-offset-2 hover:underline">
          {row.fullName}
        </AppLink>
        <ProjectStatusBadge status={row.status} copy={copy} />
        <DriftChips drift={row.drift} copy={driftCopy} />
      </div>
      {row.brokenReasons.map((reason) => (
        <p key={reason} className="text-small text-muted-foreground">
          {reason === "ci_failed" && row.ci.kind === "run" && row.ci.pullRequest !== null
            ? fillMessage(copy.ciFailedFromPullRequest, { number: row.ci.pullRequest.number })
            : copy.brokenReasons[reason]}
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
              {`${describeRoadmap(copy, roadmap)}${roadmap === null || roadmap.title === null ? "" : ` · ${roadmap.title}`}`}
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
        <HealthChip health={row.health} copy={healthCopy} />
        <WakeChip wake={row.wake} copy={wakeCopy} />
        <RunChip copy={copy} label={copy.ci} run={row.ci} formatTime={formatTime} />
        <RunChip copy={copy} label={copy.qualityReview} run={row.qualityReview} formatTime={formatTime} />
      </div>
      <p className="text-small text-muted-foreground">
        {row.readAt === null ? copy.neverRead : fillMessage(copy.readAt, { time: formatTime(row.readAt) })}
      </p>
    </li>
  );
}
