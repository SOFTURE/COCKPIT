// A project's deploy state on its page (FR-17): two cards side by side (one column on a phone). "In production" sets
// the running version large, tinted green while a version is known. "Last deploy" shows its version, its time, a
// link to its run, and its steps (deploy, verification) as filled badges coloured by state, each with an icon so the
// state never reads by colour alone. A failed last deploy tints its card red, a running one blue. Unknown shows the
// reason; a project without a deploy workflow shows nothing.
import { Badge, ICON_STROKE_WIDTH } from "@softure-ai/theme-notion";
import { ChevronRight, CircleDashed, ExternalLink, History, Rocket, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../../messages/index.ts";
import type { DeployResult, DeployState } from "./deploy-state.ts";
import { getDeployResultLook, getVerifyLook, type StepLook } from "./deploy-step-looks.ts";
import type { DeployView } from "./deploy-view.ts";

type Copy = AppMessages["deploy"];
type FormatTime = (date: Date) => string;

interface DetailsProps {
  readonly deploy: DeployView;
  readonly copy: Copy;
  readonly formatTime: FormatTime;
}

// Literal class names, so Tailwind generates each one.
const CARD = "grid min-w-0 content-start gap-1 rounded-lg border p-4";
const CARD_TINTS = {
  plain: "border-border bg-card",
  green: "border-transparent bg-green-bg",
  red: "border-transparent bg-red-bg",
  blue: "border-transparent bg-blue-bg",
} as const;
const LAST_DEPLOY_TINTS: Readonly<Record<DeployResult, keyof typeof CARD_TINTS>> = {
  passed: "plain",
  cancelled: "plain",
  failed: "red",
  running: "blue",
};
const LABEL_ICON_COLORS = { muted: "text-muted-foreground", green: "text-green" } as const;
const VERSION = "text-xl font-semibold leading-tight tabular-nums wrap-anywhere";
const HINT = "text-small text-muted-foreground";

function CardLabel({ icon: Icon, tone, children, aside }: { readonly icon: LucideIcon; readonly tone: keyof typeof LABEL_ICON_COLORS; readonly children: ReactNode; readonly aside?: ReactNode }) {
  return (
    <div className="mb-1 flex min-w-0 items-center gap-2">
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} className={`size-4 shrink-0 ${LABEL_ICON_COLORS[tone]}`} />
      <h3 className="min-w-0 flex-1 truncate text-small font-medium text-muted-foreground">{children}</h3>
      {aside}
    </div>
  );
}

function StepBadge({ look, data, children }: { readonly look: StepLook; readonly data: Readonly<Record<`data-${string}`, string>>; readonly children: string }) {
  const Icon = look.icon;
  return (
    <Badge variant="tag" color={look.color} title={children} className="h-6 max-w-full gap-1.5 px-2" data-tone={look.color} {...data}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} className={look.isSpinning === true ? "size-3.5 shrink-0 motion-safe:animate-spin" : "size-3.5 shrink-0"} />
      <span className="min-w-0 truncate">{children}</span>
    </Badge>
  );
}

function ProductionCard({ production, copy, formatTime }: { readonly production: DeployState["production"]; readonly copy: Copy; readonly formatTime: FormatTime }) {
  if (production === null) {
    return (
      <article className={`${CARD} ${CARD_TINTS.plain}`} data-deploy-production="unknown">
        <CardLabel icon={CircleDashed} tone="muted">
          {copy.production}
        </CardLabel>
        <p className="text-ui font-medium text-muted-foreground">{copy.productionUnknown}</p>
        <p className={HINT}>{copy.productionUnknownHint}</p>
      </article>
    );
  }
  return (
    <article className={`${CARD} ${CARD_TINTS.green}`} data-deploy-production="known">
      <CardLabel icon={Rocket} tone="green">
        {copy.production}
      </CardLabel>
      <p className={VERSION} data-deploy-version="production">
        {production.version}
      </p>
      <p className={HINT}>{fillMessage(copy.productionSince, { time: formatTime(new Date(production.at)) })}</p>
    </article>
  );
}

function LastDeployCard({ last, copy, formatTime }: { readonly last: DeployState["last"]; readonly copy: Copy; readonly formatTime: FormatTime }) {
  const result = last.result === "failed" && last.failedStep !== null ? fillMessage(copy.failedAt, { step: last.failedStep }) : copy.results[last.result];
  const runLink = (
    <a href={last.url} className="inline-flex shrink-0 items-center gap-1 text-small underline underline-offset-2" rel="noreferrer" target="_blank">
      <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
      {copy.openRun}
    </a>
  );
  return (
    <article className={`${CARD} ${CARD_TINTS[LAST_DEPLOY_TINTS[last.result]]}`} data-deploy-last={last.result}>
      <CardLabel icon={History} tone="muted" aside={runLink}>
        {copy.last}
      </CardLabel>
      {last.version === null ? (
        <p className="text-ui font-medium text-muted-foreground">{copy.lastUnnamed}</p>
      ) : (
        <p className={VERSION} data-deploy-version="last">
          {last.version}
        </p>
      )}
      <p className={HINT}>{fillMessage(copy.lastAt, { time: formatTime(new Date(last.at)) })}</p>
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
        <StepBadge look={getDeployResultLook(last.result)} data={{ "data-deploy-result": last.result }}>
          {result}
        </StepBadge>
        {last.result === "running" ? null : (
          <>
            <ChevronRight aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} className="size-4 shrink-0 text-muted-foreground" />
            <StepBadge look={getVerifyLook(last.verify)} data={{ "data-deploy-verify": last.verify ?? "unknown" }}>
              {last.verify === null ? copy.verifyUnknown : copy.verify[last.verify]}
            </StepBadge>
          </>
        )}
      </div>
    </article>
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
          <p className={HINT}>{copy.unknownReasons[deploy.reason]}</p>
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProductionCard production={deploy.state.production} copy={copy} formatTime={formatTime} />
          <LastDeployCard last={deploy.state.last} copy={copy} formatTime={formatTime} />
        </div>
      )}
    </section>
  );
}
