// One project's package updates on the Packages page (CT-1): the last pull request of the nightly routine, the
// packages it holds back with their issue, and each SOFTURE package's locked version against the newest on npm.
import { Badge } from "@softure-ai/theme-notion";
import { ExternalLink } from "lucide-react";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import { getIssueLink } from "./issue-link.ts";
import type { HeldPackage, PackagesState, PackageUpdate, PackageVersion } from "./packages-state.ts";
import type { PackagesView } from "./packages-view.ts";
import { isBehind } from "./versions.ts";

type Copy = AppMessages["packages"];
type FormatTime = (date: Date) => string;

function Update({ update, copy, formatTime }: { readonly update: PackageUpdate; readonly copy: Copy; readonly formatTime: FormatTime }) {
  if (update.kind !== "pull") {
    const isNone = update.kind === "none";
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant="tag" color="gray" data-package-update={update.kind}>
          {isNone ? copy.noUpdate : copy.updateUnknown}
        </Badge>
        <span className="text-small text-muted-foreground">{isNone ? copy.noUpdateHint : copy.updateUnknownHint}</span>
      </div>
    );
  }
  const isRed = update.state === "open" && update.checks === "failed";
  let label: string = copy.states[update.state];
  if (isRed) {
    label = update.failingCheck === null ? copy.states.failed : fillMessage(copy.failedCheck, { check: update.failingCheck });
  }
  let color: "green" | "red" | "blue" | "gray" = "gray";
  if (update.state === "merged") {
    color = "green";
  } else if (isRed) {
    color = "red";
  } else if (update.state === "open") {
    color = "blue";
  }
  const time = formatTime(new Date(update.at));
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Badge variant="tag" color={color} className="max-w-full truncate" data-package-update={isRed ? "failed" : update.state}>
        {label}
      </Badge>
      {update.state === "open" && update.checks === "running" ? <span className="text-small text-muted-foreground">{copy.checksRunning}</span> : null}
      {update.state === "open" && update.checks === "unknown" ? <span className="text-small text-muted-foreground">{copy.checksUnknown}</span> : null}
      <a href={update.url} className="inline-flex items-center gap-1 text-small underline underline-offset-2" rel="noreferrer" target="_blank">
        <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
        {fillMessage(copy.pull, { number: update.number })}
      </a>
      <span className="text-small text-muted-foreground">{fillMessage(update.state === "merged" ? copy.mergedAt : copy.openedAt, { time })}</span>
    </div>
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
    <ul aria-label={copy.heldLabel} className="grid gap-1">
      {held.map((entry) => {
        const link = entry.issue === null ? null : getIssueLink(entry.issue, webUrl, fullName);
        return (
          <li key={entry.package} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1" data-held-package={entry.package}>
            <Badge variant="tag" color="orange" className="max-w-full truncate">
              {entry.package}
            </Badge>
            {entry.issue === null ? <span className="text-small text-muted-foreground">{copy.heldNoIssue}</span> : null}
            {entry.issue !== null && link === null ? <span className="text-small">{entry.issue}</span> : null}
            {entry.issue !== null && link !== null ? (
              <a href={link} className="inline-flex items-center gap-1 text-small underline underline-offset-2" rel="noreferrer" target="_blank">
                <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
                {entry.issue}
              </a>
            ) : null}
            {entry.since === null ? null : <span className="text-small text-muted-foreground">{fillMessage(copy.heldSince, { since: entry.since })}</span>}
          </li>
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
          <li key={version.name} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2" data-package={version.name} data-package-behind={behind ? "true" : "false"}>
            <span className="min-w-0 truncate font-medium">{version.name}</span>
            <span className="text-small text-muted-foreground">{version.locked === null ? copy.notLocked : fillMessage(copy.locked, { version: version.locked })}</span>
            <span className="text-small text-muted-foreground">{version.latest === null ? copy.newestUnknown : fillMessage(copy.newest, { version: version.latest })}</span>
            {behind ? (
              <Badge variant="tag" color="orange">
                {copy.behind}
              </Badge>
            ) : null}
            {isCurrent ? (
              <Badge variant="tag" color="gray">
                {copy.current}
              </Badge>
            ) : null}
          </li>
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
          <Badge variant="tag" color="gray">
            {copy.unknown}
          </Badge>
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
