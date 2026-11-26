// Why a scheduled task could not be saved, deleted or run; each code has its message in `messages.scheduled.errors`.
export type ScheduledTaskErrorCode =
  | "scheduled.storage_failed"
  | "scheduled.title_missing"
  | "scheduled.title_too_long"
  | "scheduled.prompt_missing"
  | "scheduled.prompt_too_long"
  | "scheduled.no_projects"
  | "scheduled.project_not_watched"
  | "scheduled.time_invalid"
  | "scheduled.time_past"
  | "scheduled.not_found"
  | "scheduled.not_editable"
  | "scheduled.not_deletable"
  | "scheduled.not_scheduled"
  | "scheduled.forge_not_configured";
