// A watched repository's access as a result badge (CT-18): readable green, anything to fix orange.
import { CircleCheck, CircleDashed, TriangleAlert, type LucideIcon } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import { ResultBadge, type ResultTone } from "../shell/result-badge.tsx";
import type { RepositoryAccessStatus } from "./repository-copy.ts";

const LOOKS: Readonly<Record<RepositoryAccessStatus, { tone: ResultTone; icon: LucideIcon; word: "statusReadable" | "statusNoState" | "statusMissingPermissions" }>> = {
  readable: { tone: "success", icon: CircleCheck, word: "statusReadable" },
  no_state: { tone: "warning", icon: CircleDashed, word: "statusNoState" },
  missing_permissions: { tone: "warning", icon: TriangleAlert, word: "statusMissingPermissions" },
};

export function RepositoryStatus({ status, copy }: { readonly status: RepositoryAccessStatus; readonly copy: AppMessages["repositories"] }) {
  const look = LOOKS[status];
  return (
    <ResultBadge tone={look.tone} icon={look.icon} data={{ "data-access-status": status }}>
      {copy[look.word]}
    </ResultBadge>
  );
}
