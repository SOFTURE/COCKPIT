// One answer whose entry has left its project's queue ("Answered earlier", FR-6) in the theme's list row (CT-26): the entry's
// text, its project and the answer's facts (its issue and who answered, CT-24) on the left; the answer's state alone on
// top of the right column. The row has no controls: the entry can no longer be answered.
import { ListEntry, ListItem } from "@softure-ai/theme-notion";
import type { AppMessages } from "../../messages/index.ts";
import { AppLink } from "../shell/app-link.tsx";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { AnswerFacts } from "./answer-facts.tsx";
import { getAnswerLabel } from "./answer-label.ts";
import { AnswerStateBadge } from "./answer-state-badge.tsx";
import type { HistoryRow } from "./build-inbox.ts";

export function AnsweredEarlierRow({ answer, copy }: { readonly answer: HistoryRow; readonly copy: AppMessages["inbox"] }) {
  return (
    <ListItem>
      <ListEntry
        title={<InlineMarkdown text={answer.entryText} />}
        data-answered={`${answer.projectName}#${String(answer.issueNumber)}`}
        status={<AnswerStateBadge state={answer.done ? "done" : "sent"} copy={copy} />}
        details={
          <>
            <AppLink href={`/projects/${answer.projectName}`} title={copy.project} className="text-small font-medium hover:underline">
              {answer.projectName}
            </AppLink>
            <AnswerFacts
              copy={copy}
              answerLabel={getAnswerLabel(copy, answer.entryKind, answer.answer)}
              issueNumber={answer.issueNumber}
              issueUrl={answer.issueUrl}
              answeredBy={answer.answeredBy}
            />
          </>
        }
      />
    </ListItem>
  );
}

