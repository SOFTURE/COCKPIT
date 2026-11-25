// An answer's facts on the muted line under the entry (CT-24): the issue it became, as a link, and who answered. They
// are references, not controls, so they sit on the left with the entry's other facts; the answer's state stays the
// badge on top of the right column. The same line in the inbox, on the project page and in "Answered earlier".
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";

// Facts apart by a gap, not a "·", so a wrapped line never ends on a lone separator on a phone.
const FACT_LINE_CLASS = "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground";
const ISSUE_LINK_CLASS = "text-foreground underline underline-offset-2";

interface IssueLinkProps {
  readonly url: string | null;
  readonly children: ReactNode;
}

/** An issue as a reference: a link when its address is known, its words otherwise. */
export function IssueReference({ url, children }: IssueLinkProps) {
  if (url === null) {
    return <span className="text-foreground">{children}</span>;
  }
  return (
    <a href={url} className={ISSUE_LINK_CLASS} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

export interface AnswerFactsProps {
  readonly copy: AppMessages["inbox"];
  /** The answer in words, as `getAnswerLabel` says it for the entry's kind. */
  readonly answerLabel: string;
  readonly issueNumber: number;
  readonly issueUrl: string;
  readonly answeredBy: string | null;
}

export function AnswerFacts({ copy, answerLabel, issueNumber, issueUrl, answeredBy }: AnswerFactsProps) {
  return (
    <div className={FACT_LINE_CLASS} data-answer-facts="">
      <IssueReference url={issueUrl}>{fillMessage(copy.answerIssue, { answer: answerLabel, number: issueNumber })}</IssueReference>
      {answeredBy === null ? null : <span className="min-w-0 break-words">{fillMessage(copy.answeredBy, { name: answeredBy })}</span>}
    </div>
  );
}

/** A put-off entry's issue (CT-24): the badge already says "Put off", so the line names only the issue. */
export function DeferredFacts({ copy, issueNumber, issueUrl }: { readonly copy: AppMessages["inbox"]; readonly issueNumber: number; readonly issueUrl: string | null }) {
  return (
    <div className={FACT_LINE_CLASS} data-answer-facts="">
      <IssueReference url={issueUrl}>{fillMessage(copy.deferredIssue, { number: issueNumber })}</IssueReference>
    </div>
  );
}

const DEFERRAL_MARKER = /\s*\(later: #\d+\)\s*$/;

/**
 * A put-off entry's text without the project's bare `(later: #N)` marker, which only names the issue the row already
 * shows. A marker with more words (`(later: #N, after the launch)`) says something of its own and stays.
 */
export function stripDeferralMarker(text: string): string {
  return text.replace(DEFERRAL_MARKER, "");
}
