// The one list row (CT-18): what the row is on the left (its title and the lines under it); on the right a column with
// the row's state on top (a result badge, tags) and its actions under it. On a phone the right column wraps under the
// left one, still right-aligned. A row that opens something has its title as a link stretched over the whole row, so
// the row is one box, lit on hover in the shared inset (`px-2`, as `ROW_SURFACE_CLASS`), with an arrow first in the
// right column; the right column sits above the stretched link, so its controls stay its own.
// The theme has no such row yet (SOFTURE/AI#1481); CT-11's `StatusActionFoldRow` is the same shape for a fold row.
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { AppLink } from "./app-link.tsx";

export interface ListRowProps {
  /** The row's name, the first line on the left; the link when the row opens something. */
  readonly title: ReactNode;
  /** Beside the title on its line (an email, a kind tag). */
  readonly titleAside?: ReactNode;
  /** The lines under the title (facts, hints, times). */
  readonly details?: ReactNode;
  /** The state on top of the right column. */
  readonly status?: ReactNode | readonly ReactNode[];
  /** The controls under the state; a list of controls, any of them null, or one node. */
  readonly actions?: ReactNode | readonly ReactNode[];
  /** What the row opens. */
  readonly href?: string;
  /** The link leaves the app: a new tab without a referrer. */
  readonly isExternal?: boolean;
  /** The `li`'s own `data-*` attributes. */
  readonly data?: Readonly<Record<`data-${string}`, string>>;
}

const LINK_CLASS =
  "min-w-0 break-words font-medium outline-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring";

// A control that needs room while it is open (an answer being confirmed) marks itself `data-row-wide`: the right column
// then takes the row's whole width under the identity, its lines starting on the left.
const LINE_CLASS = "flex min-h-6 flex-wrap items-center justify-end gap-2 has-[[data-row-wide]]:justify-start";
const SIDE_WIDE_CLASS = "has-[[data-row-wide]]:basis-full has-[[data-row-wide]]:items-start";


/** Whether a slot has anything to show: not empty, and not a list of nothing but empty entries. */
function isFilled(node: ReactNode | readonly ReactNode[]): boolean {
  if (Array.isArray(node)) {
    return node.some((entry: ReactNode) => isFilled(entry));
  }
  return node !== undefined && node !== null && node !== false;
}

function RowTitle({ title, href, isExternal }: Pick<ListRowProps, "title" | "href" | "isExternal">) {
  if (href === undefined) {
    return (
      <span className="min-w-0 break-words font-medium" data-row-title="">
        {title}
      </span>
    );
  }
  if (isExternal === true) {
    return (
      <a href={href} rel="noreferrer" target="_blank" className={LINK_CLASS} data-row-link="">
        {title}
      </a>
    );
  }
  return (
    <AppLink href={href} className={LINK_CLASS} data-row-link="">
      {title}
    </AppLink>
  );
}

export function ListRow({ title, titleAside, details, status, actions, href, isExternal, data }: ListRowProps) {
  const opens = href !== undefined;
  const arrow = opens && isExternal !== true ? <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null;
  const hasStatus = isFilled(status);
  const hasActions = isFilled(actions);
  const hasSide = hasStatus || hasActions || arrow !== null;
  return (
    <li
      {...data}
      className={`relative flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2 rounded-md px-2 py-2.5${opens ? " transition-colors hover:bg-accent" : ""}`}
      data-list-row=""
    >
      <div className="grid min-w-0 flex-1 basis-40 gap-1" data-row-identity="">
        {titleAside === undefined ? (
          <RowTitle title={title} href={href} isExternal={isExternal} />
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <RowTitle title={title} href={href} isExternal={isExternal} />
            {titleAside}
          </div>
        )}
        {details}
      </div>
      {hasSide ? (
        <div className={`relative ms-auto flex max-w-full flex-col items-end gap-1 ${SIDE_WIDE_CLASS}`} data-row-side="">
          {hasStatus ? (
            arrow === null ? (
              <div className={LINE_CLASS} data-row-status="">
                {status}
              </div>
            ) : (
              // The arrow stays beside the state when the state wraps on a phone, never alone on a line of its own.
              <div className="flex min-h-6 items-start justify-end gap-2" data-row-status="">
                <div className={LINE_CLASS}>{status}</div>
                <span className="flex h-6 items-center">{arrow}</span>
              </div>
            )
          ) : null}
          {hasActions || (!hasStatus && arrow !== null) ? (
            <div className={LINE_CLASS} data-row-actions="">
              {hasStatus ? null : arrow}
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
