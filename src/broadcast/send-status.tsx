// A project's send as a result badge (CT-18): done green, sent and still sending grey (pending), failed red.
import { CircleCheck, CircleDashed, Send, CircleX, type LucideIcon } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import { ResultBadge, type Tone } from "@softure-ai/theme-notion";
import type { SendState } from "./build-broadcast-view.ts";

const LOOKS: Readonly<Record<SendState, { tone: Tone; icon: LucideIcon }>> = {
  done: { tone: "success", icon: CircleCheck },
  sent: { tone: "muted", icon: Send },
  failed: { tone: "danger", icon: CircleX },
  sending: { tone: "muted", icon: CircleDashed },
};

export function SendStatus({ state, copy }: { readonly state: SendState; readonly copy: AppMessages["broadcast"] }) {
  const look = LOOKS[state];
  return (
    <ResultBadge tone={look.tone} icon={look.icon} data-send-state={state}>
      {copy.states[state]}
    </ResultBadge>
  );
}
