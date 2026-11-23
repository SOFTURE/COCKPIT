// A project's status as its word with its icon (FR-8), and the sidebar's compact icon that keeps the word for
// screen readers and as a tooltip.
import { ICON_STROKE_WIDTH, Status } from "@softure-ai/theme-notion";
import type { AppMessages } from "../../messages/index.ts";
import type { ProjectStatus } from "./project-status.ts";
import { STATUS_LOOKS } from "./status-look.ts";

export function ProjectStatusBadge({ status, copy }: { readonly status: ProjectStatus; readonly copy: AppMessages["overview"] }) {
  const look = STATUS_LOOKS[status];
  return (
    <Status color={look.color} icon={look.icon}>
      {copy.statuses[status]}
    </Status>
  );
}

// Literal class names, so Tailwind generates each one.
const ICON_COLOR_CLASSES: Readonly<Record<ProjectStatus, string>> = {
  broken: "text-red",
  waiting: "text-orange",
  stalled: "text-yellow",
  moving: "text-blue",
  idle: "text-gray",
};

export function ProjectStatusIcon({ status, copy }: { readonly status: ProjectStatus; readonly copy: AppMessages["overview"] }) {
  const Icon = STATUS_LOOKS[status].icon;
  const word = copy.statuses[status];
  return (
    <span title={word} className={`inline-flex shrink-0 [&>svg]:size-4 ${ICON_COLOR_CLASSES[status]}`} data-status={status}>
      <Icon aria-hidden="true" strokeWidth={ICON_STROKE_WIDTH} />
      <span className="sr-only">{word}</span>
    </span>
  );
}
