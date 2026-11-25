// One project on Scan status in the shared list row: its name, why its last read failed and when it was checked on
// the left; its read status alone on top of the right column. The status badge says whether it was read, so the time
// line says "Checked", and a project never read shows "Not read yet" once, as its badge (CT-24).
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { ListRow } from "../shell/list-row.tsx";
import { ReadStatus } from "./read-status.tsx";
import type { ProjectScanRow } from "./scan-status.ts";

export function ScanProjectRow({ project, copy, formatTime }: {
  readonly project: ProjectScanRow;
  readonly copy: AppMessages["scan"];
  readonly formatTime: (date: Date) => string;
}) {
  const lastGood = project.lastGoodAt !== null && project.status !== "ok" ? fillMessage(copy.lastGoodAt, { time: formatTime(project.lastGoodAt) }) : null;
  let checked: string | null = copy.neverRead;
  if (project.readAt !== null) {
    checked = fillMessage(copy.readAt, { time: formatTime(project.readAt) });
  } else if (project.status === "never") {
    checked = null;
  }
  const times = [checked, lastGood].filter((part): part is string => part !== null);
  return (
    <ListRow
      title={project.fullName}
      status={<ReadStatus status={project.status} copy={copy} />}
      details={
        <>
          {copy.reasons[project.status] === "" ? null : <p className="text-small text-muted-foreground">{copy.reasons[project.status]}</p>}
          {project.hasIssuesProblem ? <p className="text-small text-muted-foreground">{copy.issuesUnreadable}</p> : null}
          {times.length === 0 ? null : <p className="text-small text-muted-foreground">{times.join(" · ")}</p>}
        </>
      }
    />
  );
}
