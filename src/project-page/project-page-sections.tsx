// The sections of a project's page (FR-10), each a card as on Settings: the read failure, what waits for the owner
// (answered exactly as in the inbox), the active roadmap with its progress and open items, the queued roadmaps and
// the open changes. A roadmap opens inside COCKPIT; its file on the forge stays one click away on that view.
import { Badge, Button, MiniProgress, Status } from "@softure-ai/theme-notion";
import { ArrowRight, CircleCheck, CircleDashed, CircleDot, CircleSlash, Circle, ExternalLink, TriangleAlert, type LucideIcon } from "lucide-react";
import { AppLink } from "../shell/app-link.tsx";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { AnswerFormProps } from "../inbox/answer-form.tsx";
import { isDeferredRow } from "../inbox/build-inbox.ts";
import { InboxRow } from "../inbox/inbox-row.tsx";
import { groupStatus, type StatusGroup } from "../roadmap/build-roadmap-view.ts";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { SectionCard } from "../shell/section-card.tsx";
import type { ProjectPage, ProjectPageChange, ProjectPageFailure, ProjectPageItem, ProjectPageQueued, ProjectPageRoadmap } from "./build-project-page.ts";

type Copy = AppMessages["projectPage"];
type StatusCopy = AppMessages["roadmapView"];

/** A status keyword in words (`ready_to_merge` → "Ready to merge"); an unknown one with its underscores as spaces. */
export function describeStatus(copy: StatusCopy, status: string): string {
  return (copy.statuses as Readonly<Record<string, string>>)[status] ?? status.replaceAll("_", " ");
}
type FormatTime = (date: Date) => string;

/** 44 px on a phone, the theme's 28 px control from md up (as on Settings). */
export const ACTION_SIZE = "md:h-7 md:px-2.5";

/** The text colour of a roadmap status group, the same on the project page and the roadmap view. */
const STATUS_TEXT_COLORS: Readonly<Record<StatusGroup, "green" | "blue" | "red" | "gray">> = {
  done: "green",
  active: "blue",
  blocked: "red",
  ready: "gray",
  other: "gray",
};

const STATUS_ICONS: Readonly<Record<StatusGroup, LucideIcon>> = {
  done: CircleCheck,
  active: CircleDot,
  blocked: CircleSlash,
  ready: Circle,
  other: CircleDashed,
};

/** A roadmap status as a short coloured word with its icon (Notion-style), the same on the project page and the roadmap view. */
export function StatusPill({ group, children, title, isCount = false }: { readonly group: StatusGroup; readonly children: string; readonly title?: string; readonly isCount?: boolean }) {
  return (
    <span className="inline-flex min-w-0 shrink-0" data-stage={isCount ? undefined : true} data-group={group}>
      <Status color={STATUS_TEXT_COLORS[group]} icon={STATUS_ICONS[group]} title={title}>
        {children}
      </Status>
    </span>
  );
}

export function ExternalAnchor({ href, children, label }: { readonly href: string; readonly children: ReactNode; readonly label?: string }) {
  return (
    <a href={href} aria-label={label} className="inline-flex min-w-0 items-center gap-1 underline-offset-2 hover:underline" rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

/** A plain titled section, for pages that are not cards (the history). */
export function Section({ id, title, aside, children }: { readonly id: string; readonly title: string; readonly aside?: ReactNode; readonly children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={id} className="text-heading-3">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Muted({ children }: { readonly children: ReactNode }) {
  return <p className="text-small text-muted-foreground">{children}</p>;
}

/** An outline button that is a link: inside COCKPIT, or to the forge in a new tab. */
export function ActionLink({ href, children, isExternal = false }: { readonly href: string; readonly children: ReactNode; readonly isExternal?: boolean }) {
  return (
    <Button asChild variant="outline" size="touch" className={ACTION_SIZE}>
      {isExternal ? (
        <a href={href} rel="noreferrer" target="_blank">
          {children}
        </a>
      ) : (
        <AppLink href={href}>{children}</AppLink>
      )}
    </Button>
  );
}

export function ReadFailureNotice({ failure, reason, statusWord, copy, formatTime }: {
  readonly failure: ProjectPageFailure;
  readonly reason: string;
  readonly statusWord: string;
  readonly copy: Copy;
  readonly formatTime: FormatTime;
}) {
  return (
    <div role="alert" className="grid gap-1 rounded-lg border border-border bg-card p-4" data-read-failure={failure.status}>
      <Status color="orange" icon={TriangleAlert}>
        {`${copy.failureTitle}: ${statusWord}`}
      </Status>
      {reason === "" ? null : <Muted>{reason}</Muted>}
      <Muted>
        {`${fillMessage(copy.readAt, { time: formatTime(failure.readAt) })}. `}
        {failure.lastGoodAt === null ? copy.failureNothingKept : fillMessage(copy.failureKeeps, { time: formatTime(failure.lastGoodAt) })}
      </Muted>
    </div>
  );
}

function percentOf(done: number, total: number): number {
  return total <= 0 ? 0 : (done / total) * 100;
}

/** The counter of a roadmap as a bar with its words inside. */
export function RoadmapProgress({ done, total, copy }: { readonly done: number; readonly total: number; readonly copy: Copy }) {
  const counter = fillMessage(copy.roadmapCounter, { done, total });
  return (
    <MiniProgress
      value={percentOf(done, total)}
      label={counter}
      aria-label={copy.progressLabel}
      tone={done >= total && total > 0 ? "success" : undefined}
      className="w-36 shrink-0"
      data-counter={counter}
    />
  );
}

function RoadmapItemRow({ item, copy, statusCopy }: { readonly item: ProjectPageItem; readonly copy: Copy; readonly statusCopy: StatusCopy }) {
  return (
    <li className="grid gap-1 py-2.5" data-item={item.id}>
      <div className="flex min-w-0 items-start gap-2">
        <span className="w-14 shrink-0 pt-0.5 font-mono text-small text-muted-foreground">{item.id}</span>
        <p className="min-w-0 flex-1 break-words">{item.outcome === null ? null : <InlineMarkdown text={item.outcome} />}</p>
        <StatusPill group={groupStatus(item.status)} title={copy.stage}>
          {item.stage === item.status ? describeStatus(statusCopy, item.status) : item.stage}
        </StatusPill>
      </div>
      {item.detail === null && item.since === null && item.link === null ? null : (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 pl-16 text-small text-muted-foreground">
          {item.detail === null ? null : <span className="min-w-0 break-words">{item.detail}</span>}
          {item.since === null ? null : <span>{fillMessage(copy.since, { date: item.since })}</span>}
          {item.link === null ? null : (
            <ExternalAnchor href={item.link}>
              <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
              {copy.openChange}
            </ExternalAnchor>
          )}
        </div>
      )}
    </li>
  );
}

export function RoadmapSection({ roadmap, copy, statusCopy }: { readonly roadmap: ProjectPageRoadmap | null; readonly copy: Copy; readonly statusCopy: StatusCopy }) {
  if (roadmap === null) {
    return <SectionCard id="active-roadmap" title={copy.roadmapTitle} description={copy.noRoadmap} />;
  }
  const name = roadmap.title ?? roadmap.slug ?? copy.roadmapTitle;
  return (
    <SectionCard
      id="active-roadmap"
      title={copy.roadmapTitle}
      description={roadmap.slug !== null && roadmap.title !== null ? `${roadmap.slug} · ${roadmap.title}` : name}
      action={
        <ActionLink href={roadmap.href}>
          {copy.openRoadmap}
          <ArrowRight aria-hidden="true" />
        </ActionLink>
      }
    >
      <div className="grid gap-3">
        <RoadmapProgress done={roadmap.done} total={roadmap.total} copy={copy} />
        {roadmap.items.length === 0 ? (
          <Muted>{copy.noOpenItems}</Muted>
        ) : (
          <ul aria-label={copy.roadmapItemsLabel} className="grid divide-y divide-border">
            {roadmap.items.map((item) => (
              <RoadmapItemRow key={item.id} item={item} copy={copy} statusCopy={statusCopy} />
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

function QueuedRow({ roadmap, copy }: { readonly roadmap: ProjectPageQueued; readonly copy: Copy }) {
  const name = roadmap.title ?? roadmap.slug;
  return (
    <li data-queued={roadmap.slug}>
      <AppLink href={roadmap.href} aria-label={name} className="-mx-2 grid gap-1.5 rounded-md px-2 py-2.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <span className="min-w-0 break-words font-medium">{name}</span>
          <RoadmapProgress done={roadmap.done} total={roadmap.total} copy={copy} />
        </span>
        <span className="text-small text-muted-foreground">
          {roadmap.startCondition === null ? copy.noStartCondition : <InlineMarkdown text={fillMessage(copy.startCondition, { condition: roadmap.startCondition })} />}
        </span>
      </AppLink>
    </li>
  );
}

export function QueuedSection({ queued, copy }: { readonly queued: readonly ProjectPageQueued[]; readonly copy: Copy }) {
  return (
    <SectionCard id="queued-roadmaps" title={copy.queuedTitle} count={queued.length} description={queued.length === 0 ? copy.noQueued : copy.queuedHint}>
      {queued.length === 0 ? undefined : (
        <ul aria-label={copy.queuedLabel} className="grid divide-y divide-border">
          {queued.map((roadmap) => (
            <QueuedRow key={roadmap.slug} roadmap={roadmap} copy={copy} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ChangeRow({ change, copy }: { readonly change: ProjectPageChange; readonly copy: Copy }) {
  return (
    <li className="grid gap-1 py-2.5" data-change={change.changeId}>
      <div className="flex min-w-0 items-start gap-2">
        <p className="min-w-0 flex-1 break-words">{change.title ?? change.changeId}</p>
        {change.stage === null ? null : (
          <Badge variant="tag" color="gray" title={copy.stage} className="mt-0.5 shrink-0">
            {change.stage}
          </Badge>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-small text-muted-foreground">
        <ExternalAnchor href={change.link}>
          <code className="min-w-0 break-all">{change.changeId}</code>
        </ExternalAnchor>
        {change.roadmapItem === null ? null : (
          <Badge variant="tag" color="blue">
            {change.roadmapItem}
          </Badge>
        )}
        {change.updated === null ? null : <span>{fillMessage(copy.changeUpdated, { date: change.updated })}</span>}
      </div>
    </li>
  );
}

export function ChangesSection({ changes, copy }: { readonly changes: readonly ProjectPageChange[]; readonly copy: Copy }) {
  return (
    <SectionCard id="open-changes" title={copy.changesTitle} count={changes.length} description={changes.length === 0 ? copy.noChanges : undefined}>
      {changes.length === 0 ? undefined : (
        <ul aria-label={copy.changesLabel} className="grid divide-y divide-border">
          {changes.map((change) => (
            <ChangeRow key={change.changeId} change={change} copy={copy} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function EntriesSection({ page, copy, inboxCopy, answerAction }: {
  readonly page: ProjectPage;
  readonly copy: Copy;
  readonly inboxCopy: AppMessages["inbox"];
  readonly answerAction: AnswerFormProps["action"];
}) {
  const waiting = page.entries.filter((row) => !isDeferredRow(row));
  const deferred = page.entries.filter(isDeferredRow);
  return (
    <SectionCard
      id="waiting-for-you"
      title={copy.entriesTitle}
      count={waiting.length}
      description={waiting.length === 0 ? copy.noEntries : copy.entriesHint}
    >
      {waiting.length === 0 && deferred.length === 0 ? undefined : (
        <div className="grid gap-4">
          {waiting.length === 0 ? null : (
            <ul aria-label={copy.entriesLabel} className="grid divide-y divide-border">
              {waiting.map((row) => (
                <InboxRow key={row.entry.id} row={row} copy={inboxCopy} answerAction={answerAction} showProject={false} />
              ))}
            </ul>
          )}
          {deferred.length === 0 ? null : (
            <section aria-labelledby="deferred-entries" className="grid gap-1">
              <h3 id="deferred-entries" className="flex items-center gap-2 text-small font-medium text-muted-foreground">
                {inboxCopy.deferredTitle}
                <Badge variant="tag" color="gray" data-count>
                  {deferred.length}
                </Badge>
              </h3>
              <ul aria-label={inboxCopy.deferredLabel} className="grid divide-y divide-border">
                {deferred.map((row) => (
                  <InboxRow key={row.entry.id} row={row} copy={inboxCopy} answerAction={answerAction} showProject={false} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </SectionCard>
  );
}
