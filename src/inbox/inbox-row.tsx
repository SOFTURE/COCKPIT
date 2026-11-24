// One inbox entry: its text, one quiet line of facts (project, kind, item, age, source file) and its answer state.
// `data-entry` names the project and the id, because entry ids repeat across projects. From md up the answer buttons
// sit on the right of the text; while an answer is being confirmed it takes the row's whole width.
import { Badge, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Clock, History, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { AnswerForm, type AnswerFormProps } from "./answer-form.tsx";
import type { InboxRow as InboxRowData } from "./build-inbox.ts";
import { describeAge } from "./describe-age.ts";

export interface InboxRowProps {
  readonly row: InboxRowData;
  readonly copy: AppMessages["inbox"];
  readonly answerAction: AnswerFormProps["action"];
  /** False on the project's own page, where the project is known. */
  readonly showProject?: boolean;
}

/** The file a source points at, without its folders or its `#section`: the full source stays in the title. */
export function getSourceLabel(source: string): string {
  const [file = source] = source.split("#");
  return file.split("/").at(-1) ?? file;
}

const KIND_COLORS = { word: "purple", decision: "blue", step: "gray", secret: "red" } as const;

export function InboxRow({ row, copy, answerAction, showProject = true }: InboxRowProps) {
  const { entry, answer, previousAnswer } = row;
  return (
    <li className="grid gap-x-6 gap-y-2 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:has-[[data-answer-open]]:grid-cols-1" data-entry={`${row.projectKey}:${entry.id}`}>
      <div className="grid min-w-0 gap-1">
        <p className="min-w-0 break-words">
          <InlineMarkdown text={entry.text} />
        </p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-small text-muted-foreground">
          {showProject ? (
            <Link href={`/projects/${row.projectName}`} title={copy.project} className="font-medium text-foreground hover:underline">
              {row.projectName}
            </Link>
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
        {entry.kind === "secret" ? <p className="text-small text-muted-foreground">{copy.secretHint}</p> : null}
        {previousAnswer === null ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <Status color="orange" icon={History}>
              <a href={previousAnswer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                {fillMessage(copy.changedSince, { answer: copy.answers[previousAnswer.answer], number: previousAnswer.issueNumber })}
              </a>
            </Status>
          </div>
        )}
      </div>
      {answer.kind === "deferred" ? (
        <div className="grid justify-items-start gap-2 md:justify-items-end">
          <div className="flex flex-wrap items-center gap-2 text-small">
            <Status color="gray" icon={Clock}>
              {copy.deferred}
            </Status>
            {answer.issueUrl === null ? (
              <span>{fillMessage(copy.deferredIssue, { number: answer.issueNumber })}</span>
            ) : (
              <a href={answer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
                {fillMessage(copy.deferredIssue, { number: answer.issueNumber })}
              </a>
            )}
          </div>
          <AnswerForm
            copy={copy}
            projectKey={row.projectKey}
            projectName={row.projectName}
            entryId={entry.id}
            entryText={entry.text}
            action={answerAction}
          />
        </div>
      ) : answer.kind === "open" ? (
        <AnswerForm
          copy={copy}
          projectKey={row.projectKey}
          projectName={row.projectName}
          entryId={entry.id}
          entryText={entry.text}
          action={answerAction}
        />
      ) : answer.kind === "sending" ? (
        <Status color="gray" icon={LoaderCircle}>
          {copy.sending}
        </Status>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-small">
          <Status color={answer.kind === "done" ? "green" : "blue"} icon={answer.kind === "done" ? CircleCheck : Send}>
            {answer.kind === "done" ? copy.done : copy.sent}
          </Status>
          <a href={answer.issueUrl} className="underline underline-offset-2" rel="noreferrer" target="_blank">
            {fillMessage(copy.answerIssue, { answer: copy.answers[answer.answer], number: answer.issueNumber })}
          </a>
          {answer.answeredBy === null ? null : <span className="text-muted-foreground">{fillMessage(copy.answeredBy, { name: answer.answeredBy })}</span>}
        </div>
      )}
    </li>
  );
}
