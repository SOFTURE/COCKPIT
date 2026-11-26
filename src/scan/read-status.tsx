// A project's latest read as a result badge (CT-18): read green, needs attention orange, broken red, never grey.
import { CircleCheck, CircleDashed, CircleDot, CircleX, CloudOff, History, type LucideIcon } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import { ResultBadge, type Tone } from "@softure-ai/theme-notion";
import type { ProjectScanRow } from "./scan-status.ts";

const LOOKS: Readonly<Record<ProjectScanRow["status"], { tone: Tone; icon: LucideIcon }>> = {
  ok: { tone: "success", icon: CircleCheck },
  no_state: { tone: "warning", icon: CircleDashed },
  state_too_old: { tone: "warning", icon: History },
  state_invalid: { tone: "danger", icon: CircleX },
  not_readable: { tone: "danger", icon: CircleX },
  unavailable: { tone: "warning", icon: CloudOff },
  never: { tone: "muted", icon: CircleDot },
};

export function ReadStatus({ status, copy }: { readonly status: ProjectScanRow["status"]; readonly copy: AppMessages["scan"] }) {
  const look = LOOKS[status];
  return (
    <ResultBadge tone={look.tone} icon={look.icon} data-read-status={status}>
      {copy.status[status]}
    </ResultBadge>
  );
}
