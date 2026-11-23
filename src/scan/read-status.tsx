// A project's latest read as a status word with its icon.
import { Status } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, CircleDot, CircleX, CloudOff, History, type LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { AppMessages } from "../../messages/index.ts";
import type { ProjectScanRow } from "./scan-status.ts";

const LOOKS: Readonly<Record<ProjectScanRow["status"], { color: ComponentProps<typeof Status>["color"]; icon: LucideIcon }>> = {
  ok: { color: "green", icon: CircleCheck },
  no_state: { color: "yellow", icon: CircleDashed },
  state_too_old: { color: "orange", icon: History },
  state_invalid: { color: "red", icon: CircleX },
  not_readable: { color: "red", icon: CircleX },
  unavailable: { color: "orange", icon: CloudOff },
  never: { color: "gray", icon: CircleDot },
};

export function ReadStatus({ status, copy }: { readonly status: ProjectScanRow["status"]; readonly copy: AppMessages["scan"] }) {
  const look = LOOKS[status];
  return (
    <Status color={look.color} icon={look.icon}>
      {copy.status[status]}
    </Status>
  );
}
