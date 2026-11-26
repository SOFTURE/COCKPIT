// One project of the overview in the shared list row (CT-19): the whole row opens the project; its name, why it is
// broken, the numbers behind the status as property chips (FR-7) and the read time on the left; its status and any
// context drift on top of the right column. Results among the chips (doctor, health, waking, CI, quality review) are
// result badges in the one colour map; the chip line sits above the row's link, so the run and pull request links
// inside the chips stay their own.
import { Badge } from "@softure-ai/theme-notion";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { DriftChips } from "../drift/drift-flags.tsx";
import { WakeChip } from "../routines/wake-chip.tsx";
import { HealthChip } from "../adapters/observability/health-chip.tsx";
import { ListRow } from "../shell/list-row.tsx";
import { ResultBadge } from "@softure-ai/theme-notion";
import { ProjectStatusBadge } from "../status/project-status-badge.tsx";
import { getDoctorTone, getRunTone } from "../status/state-colors.ts";
import type { OverviewDoctor, OverviewRow as OverviewRowData, OverviewRun } from "./build-overview.ts";
import { describeDoctor, describeRelease, describeRoadmap, describeRun, describeRunSource } from "./describe-overview-row.ts";

type Copy = AppMessages["overview"];
type FormatTime = (date: Date) => string;

const CHIP_LINK_CLASS = "underline-offset-2 hover:underline";

function RunChip({ copy, label, run, formatTime }: { readonly copy: Copy; readonly label: string; readonly run: OverviewRun; readonly formatTime: FormatTime }) {
  const text = describeRun(copy, label, run, formatTime);
  const source = describeRunSource(copy, run);
  return (
    <ResultBadge tone={getRunTone(run)} title={source === null ? text : copy.runFromPullRequestHint} data-run-chip={run.kind === "run" ? run.result : run.kind}>
      <>
        {run.kind === "run" ? (
          <a href={run.url} rel="noreferrer" target="_blank" className={CHIP_LINK_CLASS}>
            {text}
          </a>
        ) : (
          text
        )}
        {run.kind === "run" && run.pullRequest !== null && source !== null ? (
          <>
            {" · "}
            <a href={run.pullRequest.url} rel="noreferrer" target="_blank" className={CHIP_LINK_CLASS}>
              {source}
            </a>
          </>
        ) : null}
      </>
    </ResultBadge>
  );
}

function DoctorChip({ copy, doctor }: { readonly copy: Copy; readonly doctor: OverviewDoctor }) {
  const { text, hint } = describeDoctor(copy, doctor);
  const url = "url" in doctor ? doctor.url : null;
  return (
    <ResultBadge tone={getDoctorTone(doctor)} title={hint} data-doctor={doctor.kind}>
      {url === null ? (
        text
      ) : (
        <a href={url} rel="noreferrer" target="_blank" className={CHIP_LINK_CLASS}>
          {text}
        </a>
      )}
    </ResultBadge>
  );
}

function NumberChips({ row, copy }: { readonly row: OverviewRowData; readonly copy: Copy }) {
  const { numbers } = row;
  if (numbers === null) {
    return (
      <Badge variant="tag" color="gray">
        {copy.noState}
      </Badge>
    );
  }
  const roadmap = numbers.activeRoadmap;
  return (
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
  return (
    <ListRow
      title={row.fullName}
      href={`/projects/${row.fullName}`}
      data={{ "data-project": row.fullName }}
      status={[<ProjectStatusBadge key="status" status={row.status} copy={copy} />, <DriftChips key="drift" drift={row.drift} copy={driftCopy} />]}
      details={
        <>
          {row.brokenReasons.map((reason) => (
            <p key={reason} className="text-small text-muted-foreground">
              {reason === "ci_failed" && row.ci.kind === "run" && row.ci.pullRequest !== null
                ? fillMessage(copy.ciFailedFromPullRequest, { number: row.ci.pullRequest.number })
                : copy.brokenReasons[reason]}
            </p>
          ))}
          <div className="relative flex min-w-0 flex-wrap items-center gap-1.5" data-row-chips="">
            <NumberChips row={row} copy={copy} />
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
        </>
      }
    />
  );
}
