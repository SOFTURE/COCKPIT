// The Deploys page's list (CT-2): per app its last release, its version in production and last deploy, the changes
// merged since that release, and the required secrets added since the version in production. An app with new
// required secrets is marked: its deploy will stop at the secret check. Secret values are never readable, so the
// page asks to check each name is set, never says it is missing.
import { Badge } from "@softure-ai/theme-notion";
import { TriangleAlert } from "lucide-react";
import { useId } from "react";
import { AppLink } from "../../shell/app-link.tsx";
import { LabelWithHelp } from "../../shell/field-help.tsx";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import { getDeployResultColor } from "../../status/state-colors.ts";
import type { DeployState } from "./deploy-state.ts";
import { hasNewSecrets, type DeployRow } from "./deploys-view.ts";

interface ListCopy {
  readonly deploys: AppMessages["deploys"];
  readonly deploy: AppMessages["deploy"];
}

interface ListProps {
  readonly rows: readonly DeployRow[];
  readonly copy: ListCopy;
  readonly formatTime: (date: Date) => string;
}

type Waiting = NonNullable<DeployState["waiting"]>;

function Versions({ state, copy, formatTime }: { readonly state: DeployState; readonly copy: ListCopy; readonly formatTime: (date: Date) => string }) {
  const release = state.waiting?.release ?? null;
  const last = state.last;
  const result = last.result === "failed" && last.failedStep !== null ? fillMessage(copy.deploy.failedAt, { step: last.failedStep }) : copy.deploy.results[last.result];
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Badge variant="tag" color="gray" className="max-w-full truncate" data-deploy-release={release ?? "none"}>
        {release === null ? copy.deploys.noRelease : fillMessage(copy.deploys.lastRelease, { tag: release })}
      </Badge>
      <Badge variant="tag" color={state.production === null ? "gray" : "green"} className="max-w-full truncate" data-deploy-production={state.production === null ? "unknown" : "known"}>
        {state.production === null ? copy.deploys.productionUnknown : fillMessage(copy.deploys.production, { version: state.production.version })}
      </Badge>
      <Badge variant="tag" color={getDeployResultColor(last.result)} data-deploy-result={last.result} data-tone={getDeployResultColor(last.result)}>
        {result}
      </Badge>
      <a href={last.url} className="text-small text-muted-foreground underline underline-offset-2" rel="noreferrer" target="_blank">
        {fillMessage(copy.deploys.lastDeployAt, { time: formatTime(new Date(last.at)) })}
      </a>
    </div>
  );
}

function Merged({ waiting, copy }: { readonly waiting: Waiting; readonly copy: ListCopy }) {
  if (waiting.release === null) {
    return null;
  }
  if (waiting.merged === null) {
    return <p className="text-small text-muted-foreground" data-deploy-merged="unknown">{copy.deploys.mergedUnknown}</p>;
  }
  const message = waiting.merged.isLowerBound ? copy.deploys.mergedAtLeast : copy.deploys.merged;
  return (
    <p className="text-small" data-deploy-merged={waiting.merged.count}>
      {fillMessage(message, { tag: waiting.release, count: waiting.merged.count })}
    </p>
  );
}

function Secrets({ waiting, copy }: { readonly waiting: Waiting; readonly copy: ListCopy }) {
  const hintId = useId();
  if (waiting.secrets === null) {
    return <p className="text-small text-muted-foreground" data-deploy-secrets="unknown">{copy.deploys.secretsUnknown}</p>;
  }
  const { since, added } = waiting.secrets;
  if (added.length === 0) {
    return <p className="text-small text-muted-foreground" data-deploy-secrets="none">{fillMessage(copy.deploys.secretsNone, { tag: since })}</p>;
  }
  return (
    <div className="grid gap-1" data-deploy-secrets="added">
      <LabelWithHelp
        id={hintId}
        label={fillMessage(copy.deploys.fieldHelpLabel, { field: copy.deploys.secretsWarning })}
        text={fillMessage(copy.deploys.secretsHint, { tag: since })}
      >
        <Badge variant="tag" color="red" className="gap-1">
          <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {copy.deploys.secretsWarning}
        </Badge>
      </LabelWithHelp>
      <ul aria-label={copy.deploys.secretsLabel} aria-describedby={hintId} className="flex min-w-0 flex-wrap gap-2">
        {added.map((name) => (
          <li key={name}>
            <code className="break-all rounded-sm bg-muted px-1.5 py-0.5 text-small">{name}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Row({ row, copy, formatTime }: { readonly row: DeployRow; readonly copy: ListCopy; readonly formatTime: (date: Date) => string }) {
  return (
    <li className="grid gap-2 py-3" data-project={row.fullName} data-deploy-blocked={hasNewSecrets(row) ? "true" : "false"}>
      <AppLink href={`/projects/${row.fullName}`} className="min-w-0 truncate font-medium underline-offset-2 hover:underline">
        {row.fullName}
      </AppLink>
      {row.deploy.kind === "unknown" ? (
        <div className="grid gap-1">
          <div>
            <Badge variant="tag" color="gray" data-deploy-production="unknown">
              {copy.deploys.unknown}
            </Badge>
          </div>
          <p className="text-small text-muted-foreground">{copy.deploy.unknownReasons[row.deploy.reason]}</p>
        </div>
      ) : (
        <>
          <Versions state={row.deploy.state} copy={copy} formatTime={formatTime} />
          {row.deploy.state.waiting === undefined || row.deploy.state.waiting === null ? (
            <p className="text-small text-muted-foreground">{copy.deploys.notReadYet}</p>
          ) : (
            <>
              <Merged waiting={row.deploy.state.waiting} copy={copy} />
              <Secrets waiting={row.deploy.state.waiting} copy={copy} />
            </>
          )}
        </>
      )}
    </li>
  );
}

export function DeploysList({ rows, copy, formatTime }: ListProps) {
  return (
    <ul aria-label={copy.deploys.listLabel} className="grid divide-y divide-border border-y border-border">
      {rows.map((row) => (
        <Row key={row.key} row={row} copy={copy} formatTime={formatTime} />
      ))}
    </ul>
  );
}
