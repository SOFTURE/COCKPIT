// The blocks of a project's history (FR-11), one per tab (CT-21): CI runs, quality-review runs, merges, releases and the
// doctor's findings. Each row is the shared list row (CT-19): what it is on the left (a run, merge or release opens on
// the forge), its state as a result badge on top of the right column. A block whose read failed says why in its own
// tab; the others render as usual. An empty block says so in one line.
import { Status } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, CircleX, ExternalLink, GitMerge, LoaderCircle, Tag, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import type { ForgeMerge } from "../../forge/merges.ts";
import type { ForgeReleaseEntry } from "../../forge/releases.ts";
import type { RunResult } from "../../forge/runs.ts";
import { ListRow } from "../../shell/list-row.tsx";
import { ResultBadge, type ResultTone } from "../../shell/result-badge.tsx";
import { ExternalAnchor, Muted, Section } from "../project-page-sections.tsx";
import type { DoctorFindings, HistoryBlock, HistoryRun, HistoryRuns } from "./build-history.ts";


type Copy = AppMessages["projectHistory"];
type FormatTime = (date: Date) => string;
type Failed = Extract<HistoryBlock<unknown>, { status: "failed" }>;

// A run as a result: passed success, failed danger, cancelled and still running muted (CT-18's map).
const RUN_LOOKS: Readonly<Record<RunResult, { readonly tone: ResultTone; readonly icon: LucideIcon }>> = {
  passed: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  cancelled: { tone: "muted", icon: CircleDashed },
  running: { tone: "muted", icon: LoaderCircle },
};

function formatIso(iso: string, formatTime: FormatTime): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : formatTime(date);
}

function describePermission(failure: Failed, copy: Copy): string | null {
  if (failure.permission === null) {
    return null;
  }
  return failure.permission.startsWith("checks") ? copy.checksPermission : fillMessage(copy.needsPermission, { permission: failure.permission });
}

function BlockFailure({ failure, copy }: { readonly failure: Failed; readonly copy: Copy }) {
  const permission = describePermission(failure, copy);
  return (
    <div role="alert" className="grid gap-1 rounded-md border border-border p-3" data-block-failure={failure.reason}>
      <Status color="orange" icon={TriangleAlert}>
        {copy.blockFailed}
      </Status>
      <Muted>{copy.reasons[failure.reason]}</Muted>
      {permission === null ? null : <Muted>{permission}</Muted>}
    </div>
  );
}

function Block<T>({ block, copy, children }: { readonly block: HistoryBlock<T>; readonly copy: Copy; readonly children: (value: T) => ReactNode }) {
  return block.status === "failed" ? <BlockFailure failure={block} copy={copy} /> : children(block.value);
}

function List({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <ul aria-label={label} className="grid divide-y divide-border border-y border-border">
      {children}
    </ul>
  );
}

function MergeRow({ merge, copy, formatTime }: { readonly merge: ForgeMerge; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <ListRow
      title={`#${String(merge.number)} ${merge.title}`}
      href={merge.url}
      isExternal
      data={{ "data-merge": String(merge.number) }}
      status={
        <ResultBadge tone="success" icon={GitMerge}>
          {copy.mergedState}
        </ResultBadge>
      }
      details={
        <span className="text-small text-muted-foreground">
          {fillMessage(copy.merged, { time: formatIso(merge.mergedAt, formatTime) })}
          {merge.author === null ? null : ` · ${fillMessage(copy.byAuthor, { author: merge.author })}`}
        </span>
      }
    />
  );
}

export function MergesSection({ block, copy, formatTime }: { readonly block: HistoryBlock<readonly ForgeMerge[]>; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <Section id="recent-merges" title={copy.mergesTitle}>
      <Block block={block} copy={copy}>
        {(merges) =>
          merges.length === 0 ? (
            <Muted>{copy.noMerges}</Muted>
          ) : (
            <List label={copy.mergesLabel}>
              {merges.map((merge) => (
                <MergeRow key={merge.number} merge={merge} copy={copy} formatTime={formatTime} />
              ))}
            </List>
          )
        }
      </Block>
    </Section>
  );
}

function ReleaseRow({ release, copy, formatTime }: { readonly release: ForgeReleaseEntry; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <ListRow
      title={<span className="break-all">{release.version}</span>}
      href={release.url}
      isExternal
      data={{ "data-release": release.version }}
      status={
        // A published release is done; a prerelease is not final yet, so it reads as pending.
        <ResultBadge tone={release.isPrerelease ? "muted" : "success"} icon={Tag}>
          {release.isPrerelease ? copy.prerelease : copy.publishedState}
        </ResultBadge>
      }
      details={
        <>
          {release.title === null || release.title === release.version ? null : <p className="min-w-0 break-words">{release.title}</p>}
          <span className="text-small text-muted-foreground">{fillMessage(copy.published, { time: formatIso(release.publishedAt, formatTime) })}</span>
        </>
      }
    />
  );
}

export function ReleasesSection({ block, copy, formatTime }: { readonly block: HistoryBlock<readonly ForgeReleaseEntry[]>; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <Section id="releases" title={copy.releasesTitle}>
      <Block block={block} copy={copy}>
        {(releases) =>
          releases.length === 0 ? (
            <Muted>{copy.noReleases}</Muted>
          ) : (
            <List label={copy.releasesLabel}>
              {releases.map((release) => (
                <ReleaseRow key={release.version} release={release} copy={copy} formatTime={formatTime} />
              ))}
            </List>
          )
        }
      </Block>
    </Section>
  );
}

function RunRow({ run, copy, formatTime }: { readonly run: HistoryRun; readonly copy: Copy; readonly formatTime: FormatTime }) {
  const look = RUN_LOOKS[run.result];
  return (
    <ListRow
      title={<span className="font-normal">{fillMessage(copy.runStarted, { time: formatIso(run.createdAt, formatTime) })}</span>}
      href={run.url}
      isExternal
      data={{ "data-run": run.result }}
      status={
        <ResultBadge tone={look.tone} icon={look.icon} isSpinning={run.result === "running"}>
          {copy.runResults[run.result]}
        </ResultBadge>
      }
    />
  );
}

function RunList({ label, empty, runs, copy, formatTime }: {
  readonly label: string;
  readonly empty: string;
  readonly runs: readonly HistoryRun[];
  readonly copy: Copy;
  readonly formatTime: FormatTime;
}) {
  return runs.length === 0 ? (
    <Muted>{empty}</Muted>
  ) : (
    <List label={label}>
      {runs.map((run) => (
        <RunRow key={run.url} run={run} copy={copy} formatTime={formatTime} />
      ))}
    </List>
  );
}

function CiSource({ source, copy }: { readonly source: HistoryRuns["ciPullRequest"]; readonly copy: Copy }) {
  return source === null ? null : (
    <p className="text-small text-muted-foreground" data-ci-source={source.number}>
      <ExternalAnchor href={source.url}>{fillMessage(copy.ciFromPullRequest, { number: source.number })}</ExternalAnchor>
    </p>
  );
}

export function CiSection({ block, copy, formatTime }: { readonly block: HistoryBlock<HistoryRuns>; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <Section id="ci-runs" title={copy.ciHeading}>
      <Block block={block} copy={copy}>
        {(runs) => (
          <>
            <CiSource source={runs.ciPullRequest} copy={copy} />
            <RunList label={copy.ciLabel} empty={copy.noCiRuns} runs={runs.ci} copy={copy} formatTime={formatTime} />
          </>
        )}
      </Block>
    </Section>
  );
}

export function QualityReviewSection({ block, copy, formatTime }: { readonly block: HistoryBlock<HistoryRuns>; readonly copy: Copy; readonly formatTime: FormatTime }) {
  return (
    <Section id="quality-review-runs" title={copy.qualityReviewHeading}>
      <Block block={block} copy={copy}>
        {(runs) => <RunList label={copy.qualityReviewLabel} empty={copy.noQualityReviewRuns} runs={runs.qualityReview} copy={copy} formatTime={formatTime} />}
      </Block>
    </Section>
  );
}

function RunLink({ url, copy }: { readonly url: string | null; readonly copy: Copy }) {
  return url === null ? null : (
    <p className="text-small">
      <ExternalAnchor href={url}>
        <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
        {copy.openRun}
      </ExternalAnchor>
    </p>
  );
}

function DoctorBody({ doctor, copy }: { readonly doctor: DoctorFindings; readonly copy: Copy }) {
  if (doctor.kind === "missing") {
    return <Muted>{copy.doctorMissing}</Muted>;
  }
  if (doctor.kind === "ok" || doctor.kind === "pending") {
    return (
      <div className="grid gap-1">
        <div>
          <ResultBadge tone={doctor.kind === "ok" ? "success" : "muted"} icon={doctor.kind === "ok" ? CircleCheck : LoaderCircle}>
            {doctor.kind === "ok" ? copy.doctorOk : copy.doctorPending}
          </ResultBadge>
        </div>
        <RunLink url={doctor.url} copy={copy} />
      </div>
    );
  }
  const more = doctor.total === null ? 0 : doctor.total - doctor.findings.length;
  return (
    <div className="grid gap-2">
      <div>
        <ResultBadge tone="danger" icon={CircleX}>
          {copy.doctorFailing}
        </ResultBadge>
      </div>
      {doctor.findings.length === 0 ? (
        <Muted>{copy.doctorNoFindings}</Muted>
      ) : (
        <List label={copy.findingsLabel}>
          {doctor.findings.map((finding, index) => (
            <ListRow
              key={`${finding.code}-${String(index)}`}
              title={finding.file === null ? finding.code : <code className="break-all text-small">{finding.file}</code>}
              data={{ "data-finding": finding.code }}
              status={
                <ResultBadge tone="danger" icon={CircleX}>
                  {finding.code}
                </ResultBadge>
              }
              details={finding.message === null ? undefined : <p className="min-w-0 break-words text-small">{finding.message}</p>}
            />
          ))}
        </List>
      )}
      {more > 0 ? <Muted>{fillMessage(copy.moreFindings, { count: more })}</Muted> : null}
      <RunLink url={doctor.url} copy={copy} />
    </div>
  );
}

export function DoctorSection({ block, copy }: { readonly block: HistoryBlock<DoctorFindings>; readonly copy: Copy }) {
  return (
    <Section id="doctor-findings" title={copy.doctorTitle}>
      <Block block={block} copy={copy}>
        {(doctor) => <DoctorBody doctor={doctor} copy={copy} />}
      </Block>
    </Section>
  );
}
