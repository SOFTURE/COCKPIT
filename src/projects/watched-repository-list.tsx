// The watched repositories on the Settings screen, each in the theme's list row (CT-18, CT-26): the name and what to fix on the
// left; its access status on top of the right column and, under it, a trash can that asks in the shared confirmation
// dialog before the repository is removed.
import { List, ListEntry, ListItem } from "@softure-ai/theme-notion";
import type { WatchedRepository } from "../../modules/projects/queries.ts";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { describePermissions, getRepositoryAccessStatus } from "./repository-copy.ts";
import { RepositoryStatus } from "./repository-status.tsx";
import { ConfirmDeleteButton } from "../shell/confirm-delete-button.tsx";

export interface WatchedRepositoryListProps {
  readonly repositories: readonly WatchedRepository[];
  readonly copy: AppMessages["repositories"];
  readonly formatTime: (date: Date) => string;
  readonly removeAction: (formData: FormData) => Promise<void>;
}

export function WatchedRepositoryList({ repositories, copy, formatTime, removeAction }: WatchedRepositoryListProps) {
  if (repositories.length === 0) {
    return <p className="border-t border-border pt-4 text-small text-muted-foreground">{copy.empty}</p>;
  }
  return (
    <List aria-label={copy.listLabel} density="roomy" className="border-t border-border">
      {repositories.map((repository) => {
        const status = getRepositoryAccessStatus(repository);
        return (
          <ListItem key={repository.key}>
            <ListEntry
              title={repository.fullName}
              status={<RepositoryStatus status={status} copy={copy} />}
              details={
                <>
                  {status === "no_state" ? <p className="text-small text-muted-foreground">{copy.noStateHint}</p> : null}
                  {status === "missing_permissions" ? (
                    <p className="text-small text-muted-foreground">
                      {fillMessage(copy.missingHint, { permissions: describePermissions(copy, repository.missingPermissions) })}
                    </p>
                  ) : null}
                  <p className="text-small text-muted-foreground">{fillMessage(copy.checkedAt, { time: formatTime(repository.checkedAt) })}</p>
                </>
              }
              actions={
                <ConfirmDeleteButton
                  copy={{
                    label: fillMessage(copy.removeLabel, { name: repository.fullName }),
                    question: fillMessage(copy.removeQuestion, { name: repository.fullName }),
                    hint: copy.removeHint,
                    delete: copy.remove,
                    deleting: copy.removing,
                    cancel: copy.cancel,
                  }}
                  fields={{ repository: repository.fullName }}
                  action={removeAction}
                />
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
}
