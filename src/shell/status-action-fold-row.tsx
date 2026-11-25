// The one folding list row with a status and an action: the status sits at the top of the bar's right column and the
// action (a button, or the link it became) right under it, both inside the row's bar, which lights as one box on hover.
// Use it for every `FoldRow` that carries a control; the theme's own `FoldRow actions` strip stands beside the bar and
// stops under the control when the summary takes more lines.
//
// The action is a control, so it cannot sit in the `<summary>` (a control there folds the row): it is laid over the
// summary from the row's `li`, and the summary keeps an invisible, inert copy of it to hold its place, so the right
// column is exactly as wide and as tall as the control, whatever it is.
import { FoldRow, type DetailRow } from "@softure-ai/theme-notion";
import type { ReactNode } from "react";
import { FOLD_ROW_INSET_CLASS } from "./row-inset.ts";

export interface StatusActionFoldRowProps {
  /** The bar's main content: what the row is (title, facts); it takes the width the right column leaves. */
  readonly summary: ReactNode;
  /** The row's status (a pill, badges) at the top of the right column. */
  readonly status: ReactNode;
  /** The row's control under the status, or null for none. */
  readonly action: ReactNode;
  readonly detailsLabel?: string;
  readonly details?: readonly DetailRow[];
  /** More content under the details when the row is open. */
  readonly children?: ReactNode;
  /** The `li`'s own id, classes and `data-*` attributes. */
  readonly id?: string;
  readonly className?: string;
  readonly data?: Readonly<Record<`data-${string}`, string>>;
}

export function StatusActionFoldRow({ summary, status, action, detailsLabel, details, children, id, className = "", data }: StatusActionFoldRowProps) {
  const hasAction = action !== null && action !== undefined;
  const bar = (
    <span className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3" data-row-bar>
      <span className="min-w-0">{summary}</span>
      <span className="flex flex-col items-end gap-1" data-row-side>
        <span className="flex h-6 items-center gap-2 whitespace-nowrap" data-row-status>
          {status}
        </span>
        {hasAction ? (
          <span aria-hidden="true" inert className="invisible" data-action-place>
            {action}
          </span>
        ) : null}
      </span>
    </span>
  );
  return (
    // The chevron sits on the first line, not in the middle of the row; hovering anywhere on the row, the laid-over
    // action included, lights the bar.
    <li
      {...data}
      id={id}
      className={`relative [&_[data-slot=fold-row-summary]]:items-start [&_[data-slot=fold-row-summary]>svg]:mt-1 [&:hover_[data-slot=fold-row-summary]]:bg-accent ${FOLD_ROW_INSET_CLASS} ${className}`}
    >
      {details === undefined || detailsLabel === undefined ? (
        <FoldRow size="touch" summary={bar}>
          {children}
        </FoldRow>
      ) : (
        <FoldRow size="touch" summary={bar} detailsLabel={detailsLabel} details={details}>
          {children}
        </FoldRow>
      )}
      {hasAction ? (
        // Over its inert copy: the summary's top padding (4 px), the status line (24 px) and the gap (4 px) down, the
        // summary's side padding (8 px) in.
        <div className="absolute top-8 right-2" data-row-action>
          {action}
        </div>
      ) : null}
    </li>
  );
}
