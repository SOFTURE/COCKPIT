// The watched repositories on the Settings screen: each with its access status, what to fix, and a remove button.
import { Button } from "@softure-ai/theme-notion";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { describePermissions, getRepositoryAccessStatus } from "./repository-copy.ts";
import { RepositoryStatus } from "./repository-status.tsx";

export interface WatchedRepositoryListProps {
  readonly repositories: readonly WatchedRepository[];
  readonly copy: AppMessages["repositories"];
  readonly formatTime: (date: Date) => string;
  readonly removeAction: (formData: FormData) => Promise<void>;
}

export function WatchedRepositoryList({ repositories, copy, formatTime, removeAction }: WatchedRepositoryListProps) {
  if (repositories.length === 0) {
    return <p className="text-small text-muted-foreground">{copy.empty}</p>;
  }
  return (
    <ul aria-label={copy.listLabel} className="grid divide-y divide-border border-y border-border">
      {repositories.map((repository) => {
        const status = getRepositoryAccessStatus(repository);
        return (
          <li key={repository.key} className="flex flex-wrap items-start justify-between gap-2 py-2">
            <div className="grid min-w-0 gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="truncate font-medium">{repository.fullName}</span>
                <RepositoryStatus status={status} copy={copy} />
              </div>
              {status === "no_state" ? <p className="text-small text-muted-foreground">{copy.noStateHint}</p> : null}
              {status === "missing_permissions" ? (
                <p className="text-small text-muted-foreground">
                  {fillMessage(copy.missingHint, { permissions: describePermissions(copy, repository.missingPermissions) })}
                </p>
              ) : null}
              <p className="text-small text-muted-foreground">
                {fillMessage(copy.checkedAt, { time: formatTime(repository.checkedAt) })}
              </p>
            </div>
            <form action={removeAction}>
              <input type="hidden" name="repository" value={repository.fullName} />
              <Button
                type="submit"
                variant="ghost"
                size="touch"
                className="md:h-7 md:px-2.5"
                aria-label={fillMessage(copy.removeLabel, { name: repository.fullName })}
              >
                {copy.remove}
              </Button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
