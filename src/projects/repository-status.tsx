// A watched repository's access as a status word with its icon (statuses always carry both).
import { Status } from "@softure-ai/theme-notion";
import { CircleCheck, CircleDashed, TriangleAlert } from "lucide-react";
import type { AppMessages } from "../../messages/index.ts";
import type { RepositoryAccessStatus } from "./repository-copy.ts";

export function RepositoryStatus({ status, copy }: { readonly status: RepositoryAccessStatus; readonly copy: AppMessages["repositories"] }) {
  if (status === "readable") {
    return <Status color="green" icon={CircleCheck}>{copy.statusReadable}</Status>;
  }
  if (status === "no_state") {
    return <Status color="yellow" icon={CircleDashed}>{copy.statusNoState}</Status>;
  }
  return <Status color="orange" icon={TriangleAlert}>{copy.statusMissingPermissions}</Status>;
}
