// An answered entry's state as a result badge (CT-19), the same in the inbox, on the project page and in "Answered
// earlier": done green, sent (the issue is open, the work not yet done) and sending gray with their own icons, and
// deferred ("later") gray with a clock.
import { CircleCheck, Clock, LoaderCircle, Send, type LucideIcon } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import { ResultBadge, type ResultTone } from "../shell/result-badge.tsx";

export type AnswerState = "done" | "sent" | "sending" | "deferred";

const LOOKS: Readonly<Record<AnswerState, { readonly tone: ResultTone; readonly icon: LucideIcon }>> = {
  done: { tone: "success", icon: CircleCheck },
  sent: { tone: "muted", icon: Send },
  sending: { tone: "muted", icon: LoaderCircle },
  deferred: { tone: "muted", icon: Clock },
};

export function AnswerStateBadge({ state, copy }: { readonly state: AnswerState; readonly copy: AppMessages["inbox"] }) {
  const look = LOOKS[state];
  return (
    <ResultBadge tone={look.tone} icon={look.icon} isSpinning={state === "sending"} data={{ "data-answer-state": state }}>
      {copy[state]}
    </ResultBadge>
  );
}
