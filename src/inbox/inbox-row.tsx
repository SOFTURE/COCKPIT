// One inbox entry: the project's text, its properties as chips, and its answer state.
import { Badge, Status } from "@softure-ai/theme-notion";
import { CircleCheck, History, LoaderCircle, Send } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { AnswerForm, type AnswerFormProps } from "./answer-form.tsx";
import type { InboxRow as InboxRowData } from "./build-inbox.ts";
import { describeAge } from "./describe-age.ts";

export interface InboxRowProps {
  readonly row: InboxRowData;
  readonly copy: AppMessages["inbox"];
  readonly answerAction: AnswerFormProps["action"];
}

export function InboxRow({ row, copy, answerAction }: InboxRowProps) {
  const { entry, answer, previousAnswer } = row;
  return (
    <li className="grid gap-2 py-3">
      <p className="min-w-0 break-words">{entry.text}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <Badge variant="tag" color="blue" title={copy.project}>
          {row.projectName}
        </Badge>
        <Badge variant="tag" color={entry.kind === "secret" ? "red" : "purple"}>
          {copy.kinds[entry.kind]}
        </Badge>
        <Badge variant="tag" color="gray" title={copy.source} className="max-w-full truncate">
          {entry.source}
        </Badge>
        {entry.item === null ? null : (
          <Badge variant="tag" color="gray" title={copy.item}>
            {entry.item}
          </Badge>
        )}
        <Badge variant="tag" color="default">
          {describeAge(copy, row.ageDays)}
        </Badge>
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
      {answer.kind === "open" ? (
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
        <div className="flex flex-wrap items-center gap-2">
          <Status color={answer.kind === "done" ? "green" : "blue"} icon={answer.kind === "done" ? CircleCheck : Send}>
            {answer.kind === "done" ? copy.done : copy.sent}
          </Status>
          <a href={answer.issueUrl} className="text-small underline underline-offset-2" rel="noreferrer" target="_blank">
            {fillMessage(copy.answerIssue, { answer: copy.answers[answer.answer], number: answer.issueNumber })}
          </a>
          {answer.answeredBy === null ? null : (
            <span className="text-small text-muted-foreground">{fillMessage(copy.answeredBy, { name: answer.answeredBy })}</span>
          )}
        </div>
      )}
    </li>
  );
}
