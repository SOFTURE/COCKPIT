// One inbox entry in the shared list row (CT-19): its text and one quiet line of facts (project, kind, item, age,
// source file) on the left, and once answered a second line with the answer's issue and who answered (CT-24); on top
// of the right column its answer state and the issue's routine fires, under it the answer buttons or Retry.
// `data-entry` names the project and the id, because entry ids repeat across projects. While an answer is being
// confirmed the right column takes the row's whole width.
import { Badge, Status } from "@softure-ai/theme-notion";
import { History } from "lucide-react";
import type { ReactNode } from "react";
import { ListRow } from "../shell/list-row.tsx";
import { AnswerStateBadge } from "./answer-state-badge.tsx";
import { AppLink } from "../shell/app-link.tsx";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { AnswerForm, type AnswerFormProps } from "./answer-form.tsx";
import { getAnswerLabel } from "./answer-label.ts";
import type { InboxRow as InboxRowData } from "./build-inbox.ts";
import { describeAge } from "./describe-age.ts";
import { IssueFireBadges, RetryWakeForm } from "../routines/wake-chip.tsx";
import { AnswerFacts, DeferredFacts, stripDeferralMarker } from "./answer-facts.tsx";

/** What an answered row needs to show its issue's routine fires with a Retry (CT-10). */
export interface RowWakeProps {
  readonly copy: AppMessages["wake"];
  readonly retryAction: (formData: FormData) => Promise<void>;
  readonly formatTime: (date: Date) => string;
}

export interface InboxRowProps {
  readonly row: InboxRowData;
  readonly copy: AppMessages["inbox"];
  readonly answerAction: AnswerFormProps["action"];
  /** False on the project's own page, where the project is known. */
  readonly showProject?: boolean;
  /** Shows the answer issue's routine fires; left out, they are not shown. */
  readonly wake?: RowWakeProps;
}

/** The file a source points at, without its folders or its `#section`: the full source stays in the title. */
export function getSourceLabel(source: string): string {
  const [file = source] = source.split("#");
  return file.split("/").at(-1) ?? file;
}

const KIND_COLORS = { word: "purple", decision: "blue", step: "gray", secret: "red" } as const;

interface AnswerSide {
  readonly status: ReactNode;
  readonly actions: ReactNode;
  /** The answer's facts for the muted lines on the left: its issue and who answered. */
  readonly facts: ReactNode;
}

function getAnswerSide({ row, copy, answerAction, wake }: InboxRowProps): AnswerSide {
  const { entry, answer } = row;
  const form = (
    <AnswerForm
      copy={copy}
      projectKey={row.projectKey}
      projectName={row.projectName}
      entryId={entry.id}
      entryText={entry.text}
      entryKind={entry.kind}
      action={answerAction}
    />
  );
  switch (answer.kind) {
    case "open":
      return { status: null, actions: form, facts: null };
    case "sending":
      return { status: <AnswerStateBadge state="sending" copy={copy} />, actions: null, facts: null };
    case "deferred":
      return {
        status: <AnswerStateBadge state="deferred" copy={copy} />,
        actions: form,
        facts: <DeferredFacts copy={copy} issueNumber={answer.issueNumber} issueUrl={answer.issueUrl} />,
      };
    default: {
      // The issue's routine fires are its state, on the badge line; only Retry is a control.
      const issueWake = wake === undefined || row.wake === undefined || row.wake === null ? null : { ...wake, issue: row.wake };
      return {
        status: [
          <AnswerStateBadge key="state" state={answer.kind} copy={copy} />,
          issueWake === null ? null : <IssueFireBadges key="fires" wake={issueWake.issue} copy={issueWake.copy} formatTime={issueWake.formatTime} />,
        ],
        actions:
          issueWake === null || !issueWake.issue.canRetry ? null : (
            <RetryWakeForm wake={issueWake.issue} copy={issueWake.copy} name={row.projectName} retryAction={issueWake.retryAction} />
          ),
        facts: (
          <AnswerFacts
            copy={copy}
            answerLabel={getAnswerLabel(copy, entry.kind, answer.answer)}
            issueNumber={answer.issueNumber}
            issueUrl={answer.issueUrl}
            answeredBy={answer.answeredBy}
          />
        ),
      };
    }
  }
}

export function InboxRow(props: InboxRowProps) {
  const { row, copy, showProject = true } = props;
  const { entry, previousAnswer } = row;
  const side = getAnswerSide(props);
  return (
    <ListRow
      title={<InlineMarkdown text={row.answer.kind === "deferred" ? stripDeferralMarker(entry.text) : entry.text} />}
      data={{ "data-entry": `${row.projectKey}:${entry.id}` }}
      status={side.status}
      actions={side.actions}
      details={
        <>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted-foreground">
            {showProject ? (
              <AppLink href={`/projects/${row.projectName}`} title={copy.project} className="font-medium text-foreground hover:underline">
                {row.projectName}
              </AppLink>
            ) : null}
            <Badge variant="tag" color={KIND_COLORS[entry.kind]}>
              {copy.kinds[entry.kind]}
            </Badge>
            {entry.item === null ? null : (
              <Badge variant="tag" color="gray" title={copy.item}>
                {entry.item}
              </Badge>
            )}
            <span>{describeAge(copy, row.ageDays)}</span>
            <span aria-hidden="true">·</span>
            <span title={entry.source} className="min-w-0 truncate">
              {fillMessage(copy.fromSource, { file: getSourceLabel(entry.source) })}
            </span>
          </div>
          {side.facts}
          {entry.kind === "secret" ? <p className="text-small text-muted-foreground">{copy.secretHint}</p> : null}
          {previousAnswer === null ? null : (
            <div className="flex flex-wrap items-center gap-2">
              <Status color="orange" icon={History}>
                <a href={previousAnswer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                  {fillMessage(copy.changedSince, { answer: getAnswerLabel(copy, entry.kind, previousAnswer.answer), number: previousAnswer.issueNumber })}
                </a>
              </Status>
            </div>
          )}
        </>
      }
    />
  );
}
