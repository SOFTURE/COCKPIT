// A project's deploy state on its page (FR-17): the version in production, and the last deploy with its result, its
// verification and a link to its run; or unknown with the reason. A project without a deploy workflow shows nothing.
import { Badge } from "@softure-ai/theme-notion";
import { ExternalLink } from "lucide-react";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import type { DeployState } from "./deploy-state.ts";
import type { DeployView } from "./deploy-view.ts";

type Copy = AppMessages["deploy"];

interface DetailsProps {
  readonly deploy: DeployView;
  readonly copy: Copy;
  readonly formatTime: (date: Date) => string;
}

function Production({ production, copy, formatTime }: { readonly production: DeployState["production"]; readonly copy: Copy; readonly formatTime: (date: Date) => string }) {
  if (production === null) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <Badge variant="tag" color="gray" data-deploy-production="unknown">
          {copy.productionUnknown}
        </Badge>
        <span className="text-small text-muted-foreground">{copy.productionUnknownHint}</span>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Badge variant="tag" color="blue" className="max-w-full truncate" data-deploy-production="known">
        {fillMessage(copy.production, { version: production.version })}
      </Badge>
      <span className="text-small text-muted-foreground">{fillMessage(copy.productionSince, { time: formatTime(new Date(production.at)) })}</span>
    </div>
  );
}

function LastDeploy({ last, copy, formatTime }: { readonly last: DeployState["last"]; readonly copy: Copy; readonly formatTime: (date: Date) => string }) {
  const result = last.result === "failed" && last.failedStep !== null ? fillMessage(copy.failedAt, { step: last.failedStep }) : copy.results[last.result];
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      {last.version === null ? null : <span className="text-small">{fillMessage(copy.lastVersion, { version: last.version })}</span>}
      <Badge variant="tag" color={last.result === "failed" ? "red" : "gray"} data-deploy-result={last.result}>
        {result}
      </Badge>
      {last.result === "running" ? null : (
        <Badge variant="tag" color={last.verify === "failed" ? "red" : "gray"} data-deploy-verify={last.verify ?? "unknown"}>
          {last.verify === null ? copy.verifyUnknown : copy.verify[last.verify]}
        </Badge>
      )}
      <a href={last.url} className="inline-flex items-center gap-1 text-small underline underline-offset-2" rel="noreferrer" target="_blank">
        <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
        {copy.openRun}
      </a>
      <span className="text-small text-muted-foreground">{fillMessage(copy.lastAt, { time: formatTime(new Date(last.at)) })}</span>
    </div>
  );
}

export function DeployDetails({ deploy, copy, formatTime }: DetailsProps) {
  if (deploy.kind === "none") {
    return null;
  }
  return (
    <section aria-label={copy.label} className="grid gap-2" data-deploy-details={deploy.kind}>
      <h2 className="text-ui font-semibold">{copy.label}</h2>
      {deploy.kind === "unknown" ? (
        <>
          <div>
            <Badge variant="tag" color="gray" title={copy.unknownReasons[deploy.reason]} data-deploy-production="unknown">
              {copy.unknown}
            </Badge>
          </div>
          <p className="text-small text-muted-foreground">{copy.unknownReasons[deploy.reason]}</p>
        </>
      ) : (
        <>
          <Production production={deploy.state.production} copy={copy} formatTime={formatTime} />
          <LastDeploy last={deploy.state.last} copy={copy} formatTime={formatTime} />
        </>
      )}
    </section>
  );
}
