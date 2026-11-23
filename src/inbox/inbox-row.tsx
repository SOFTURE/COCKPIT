// One inbox entry: the project's text, its properties as chips, and its answer state.
import { Badge, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Send } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { InboxRow as InboxRowData } from "./build-inbox.ts";

function describeAge(copy: AppMessages["inbox"], ageDays: number | null): string {
  if (ageDays === null) {
    return copy.noDate;
  }
  if (ageDays === 0) {
    return copy.ageToday;
  }
  return ageDays === 1 ? copy.ageOneDay : fillMessage(copy.ageDays, { days: ageDays });
}

export function InboxRow({ row, copy }: { readonly row: InboxRowData; readonly copy: AppMessages["inbox"] }) {
  const { entry, answer } = row;
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
      {answer.kind === "open" ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <Status color={answer.kind === "done" ? "green" : "blue"} icon={answer.kind === "done" ? CircleCheck : Send}>
            {answer.kind === "done" ? copy.done : copy.sent}
          </Status>
          <a href={answer.issueUrl} className="text-small underline underline-offset-2" rel="noreferrer" target="_blank">
            {fillMessage(copy.answerIssue, { answer: copy.answers[answer.answer], number: answer.issueNumber })}
          </a>
        </div>
      )}
    </li>
  );
}
