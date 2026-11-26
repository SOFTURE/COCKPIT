// One project's package updates on the Packages page (CT-1): the last pull request of the nightly routine, the
// packages it holds back with their date and issue on the line under the name (CT-24), and each SOFTURE package's
// locked version against the newest on npm. The held packages and the versions are shared list rows (CT-19); every
// state is a result badge in the one colour map.
import { ExternalLink } from "lucide-react";
import { useId } from "react";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import { getIssueLink } from "./issue-link.ts";
import { LabelWithHelp } from "../../shell/field-help.tsx";
import { ListRow } from "../../shell/list-row.tsx";
import { ResultBadge, type Tone } from "@softure-ai/theme-notion";
import { getPackageVersionTone } from "../../status/state-colors.ts";
import type { HeldPackage, PackagesState, PackageUpdate, PackageVersion } from "./packages-state.ts";
import type { PackagesView } from "./packages-view.ts";
import { isBehind } from "./versions.ts";

type Copy = AppMessages["packages"];
type FormatTime = (date: Date) => string;

function Update({ update, copy, formatTime }: { readonly update: PackageUpdate; readonly copy: Copy; readonly formatTime: FormatTime }) {
  const hintId = useId();
  if (update.kind !== "pull") {
    const isNone = update.kind === "none";
    const badge = isNone ? copy.noUpdate : copy.updateUnknown;
    return (
      <LabelWithHelp id={hintId} label={fillMessage(copy.fieldHelpLabel, { field: badge })} text={isNone ? copy.noUpdateHint : copy.updateUnknownHint}>
        <span className="inline-flex" aria-describedby={hintId} data-package-update={update.kind}>
          <ResultBadge tone="muted" data-package-update-state={update.kind}>
            {badge}
          </ResultBadge>
        </span>
      </LabelWithHelp>
    );
  }
  const isRed = update.state === "open" && update.checks === "failed";
  let label: string = copy.states[update.state];
  if (isRed) {
    label = update.failingCheck === null ? copy.states.failed : fillMessage(copy.failedCheck, { check: update.failingCheck });
  }
  // Merged success, red danger; open (waiting for its checks or a merge) and closed muted.
  let tone: Tone = "muted";
  if (update.state === "merged") {
    tone = "success";
  } else if (isRed) {
    tone = "danger";
  }
  const time = formatTime(new Date(update.at));
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <ResultBadge tone={tone} data-package-update={isRed ? "failed" : update.state}>
        {label}
      </ResultBadge>
      {update.state === "open" && update.checks === "running" ? <span className="text-small text-muted-foreground">{copy.checksRunning}</span> : null}
      {update.state === "open" && update.checks === "unknown" ? <span className="text-small text-muted-foreground">{copy.checksUnknown}</span> : null}
      <a href={update.url} className="inline-flex items-center gap-1 text-small underline underline-offset-2" rel="noreferrer" target="_blank">
        <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
        {fillMessage(copy.pull, { number: update.number })}
      </a>
      {/* The badge names the event (merged, open); its time stands alone (CT-24). */}
      <span className="text-small text-muted-foreground" data-package-update-at="">{time}</span>
    </div>
  );
}

function HeldIssue({ issue, link, copy }: { readonly issue: string | null; readonly link: string | null; readonly copy: Copy }) {
  if (issue === null) {
    return <span data-held-issue="none">{copy.heldNoIssue}</span>;
  }
  if (link === null) {
    return (
      <span className="text-foreground" data-held-issue={issue}>
        {issue}
      </span>
    );
  }
  return (
    <a href={link} className="inline-flex items-center gap-1 text-foreground underline underline-offset-2" rel="noreferrer" target="_blank" data-held-issue={issue}>
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
      {issue}
    </a>
  );
}

interface HeldProps {
  readonly held: readonly HeldPackage[] | null;
  readonly copy: Copy;
  readonly webUrl: string;
  readonly fullName: string;
}

function Held({ held, copy, webUrl, fullName }: HeldProps) {
  if (held === null || held.length === 0) {
    return <p className="text-small text-muted-foreground">{held === null ? copy.heldUnknown : copy.heldNone}</p>;
  }
  return (
    <ul aria-label={copy.heldLabel} className="grid divide-y divide-border border-y border-border">
      {held.map((entry) => {
        const link = entry.issue === null ? null : getIssueLink(entry.issue, webUrl, fullName);
        // Its date and its issue are facts, not controls: both on the muted line under the name (CT-24).
        return (
          <ListRow
            key={entry.package}
            title={entry.package}
            data={{ "data-held-package": entry.package }}
            details={
              <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground">
                {entry.since === null ? null : <span>{fillMessage(copy.heldSince, { since: entry.since })}</span>}
                <HeldIssue issue={entry.issue} link={link} copy={copy} />
              </span>
            }
          />
        );
      })}
    </ul>
  );
}

function Versions({ packages, copy }: { readonly packages: readonly PackageVersion[]; readonly copy: Copy }) {
  if (packages.length === 0) {
    return <p className="text-small text-muted-foreground">{copy.versionsNone}</p>;
  }
  return (
    <ul aria-label={copy.versionsListLabel} className="grid divide-y divide-border border-y border-border">
      {packages.map((version) => {
        const behind = isBehind(version.locked, version.latest);
        const isCurrent = !behind && version.locked !== null && version.latest !== null;
        return (
          <ListRow
            key={version.name}
            title={version.name}
            data={{ "data-package": version.name, "data-package-behind": behind ? "true" : "false" }}
            details={
              <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground">
                <span>{version.locked === null ? copy.notLocked : fillMessage(copy.locked, { version: version.locked })}</span>
                <span>{version.latest === null ? copy.newestUnknown : fillMessage(copy.newest, { version: version.latest })}</span>
              </span>
            }
            status={
              behind || isCurrent ? (
                <ResultBadge tone={getPackageVersionTone(behind ? "behind" : "current")} data-package-version={behind ? "behind" : "current"}>
                  {behind ? copy.behind : copy.current}
                </ResultBadge>
              ) : null
            }
          />
        );
      })}
    </ul>
  );
}

/** How many of the project's packages are behind the newest on npm. */
export function countBehind(state: PackagesState): number {
  return state.packages.filter((version) => isBehind(version.locked, version.latest)).length;
}

interface DetailsProps {
  readonly view: Exclude<PackagesView, { readonly kind: "none" }>;
  readonly copy: Copy;
  readonly webUrl: string;
  readonly fullName: string;
  readonly formatTime: FormatTime;
}

export function PackagesDetails({ view, copy, webUrl, fullName, formatTime }: DetailsProps) {
  if (view.kind === "unknown") {
    return (
      <div className="grid gap-2" data-packages-details="unknown">
        <div>
          <ResultBadge tone="muted" data-packages-state="unknown">
            {copy.unknown}
          </ResultBadge>
        </div>
        <p className="text-small text-muted-foreground">{copy.unknownReasons[view.reason]}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4" data-packages-details="state">
      <section aria-label={copy.updateLabel} className="grid gap-2">
        <h3 className="text-ui font-semibold">{copy.updateLabel}</h3>
        <Update update={view.state.update} copy={copy} formatTime={formatTime} />
      </section>
      <section aria-label={copy.heldLabel} className="grid gap-2">
        <h3 className="text-ui font-semibold">{copy.heldLabel}</h3>
        <Held held={view.state.held} copy={copy} webUrl={webUrl} fullName={fullName} />
      </section>
      <section aria-label={copy.versionsLabel} className="grid gap-2">
        <h3 className="text-ui font-semibold">{copy.versionsLabel}</h3>
        <Versions packages={view.state.packages} copy={copy} />
      </section>
    </div>
  );
}
