// The sections of a project's page (FR-10): read failure, active roadmap, queued roadmaps, open changes and the
// owner's entries, which answer exactly as in the inbox.
import { Badge, Status } from "@softure-ai/theme-notion";
import { ExternalLink, FileText, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import type { AnswerFormProps } from "../inbox/answer-form.tsx";
import { InboxRow } from "../inbox/inbox-row.tsx";
import type { ProjectPage, ProjectPageChange, ProjectPageFailure, ProjectPageItem, ProjectPageQueued, ProjectPageRoadmap } from "./build-project-page.ts";

type Copy = AppMessages["projectPage"];
type FormatTime = (date: Date) => string;

export function ExternalAnchor({ href, children, label }: { readonly href: string; readonly children: ReactNode; readonly label?: string }) {
  return (
    <a href={href} aria-label={label} className="inline-flex min-w-0 items-center gap-1 underline-offset-2 hover:underline" rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

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

export function ReadFailureNotice({ failure, reason, statusWord, copy, formatTime }: {
  readonly failure: ProjectPageFailure;
  readonly reason: string;
  readonly statusWord: string;
  readonly copy: Copy;
  readonly formatTime: FormatTime;
}) {
  return (
    <div role="alert" className="grid gap-1 rounded-md border border-border p-3" data-read-failure={failure.status}>
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

function RoadmapItemRow({ item, copy }: { readonly item: ProjectPageItem; readonly copy: Copy }) {
  return (
    <li className="grid gap-1 py-3" data-item={item.id}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <Badge variant="tag" color="blue">
          {item.id}
        </Badge>
        <Badge variant="tag" color={item.status === "blocked" ? "red" : "gray"} title={copy.stage} data-stage>
          {item.stage}
        </Badge>
        {item.since === null ? null : <span className="text-small text-muted-foreground">{fillMessage(copy.since, { date: item.since })}</span>}
      </div>
      {item.outcome === null ? null : <p className="min-w-0 break-words">{item.outcome}</p>}
      {item.detail === null ? null : <Muted>{item.detail}</Muted>}
      {item.link === null ? null : (
        <p className="text-small">
          <ExternalAnchor href={item.link}>
            <ExternalLink aria-hidden="true" className="size-3.5 shrink-0" />
            {copy.openChange}
          </ExternalAnchor>
        </p>
      )}
    </li>
  );
}

export function RoadmapSection({ roadmap, copy }: { readonly roadmap: ProjectPageRoadmap | null; readonly copy: Copy }) {
  if (roadmap === null) {
    return (
      <Section id="active-roadmap" title={copy.roadmapTitle}>
        <Muted>{copy.noRoadmap}</Muted>
      </Section>
    );
  }
  const name = [roadmap.slug, roadmap.title].filter((part) => part !== null).join(" · ");
  return (
    <Section
      id="active-roadmap"
      title={copy.roadmapTitle}
      aside={
        <span className="flex min-w-0 flex-wrap items-center gap-2 text-small text-muted-foreground">
          {name === "" ? null : <span className="min-w-0 break-words">{name}</span>}
          <span>{fillMessage(copy.roadmapCounter, { done: roadmap.done, total: roadmap.total })}</span>
          <ExternalAnchor href={roadmap.link}>
            <FileText aria-hidden="true" className="size-3.5 shrink-0" />
            {copy.roadmapFile}
          </ExternalAnchor>
        </span>
      }
    >
      {roadmap.items.length === 0 ? (
        <Muted>{copy.noOpenItems}</Muted>
      ) : (
        <ul aria-label={copy.roadmapItemsLabel} className="grid divide-y divide-border border-y border-border">
          {roadmap.items.map((item) => (
            <RoadmapItemRow key={item.id} item={item} copy={copy} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function QueuedRow({ roadmap, copy }: { readonly roadmap: ProjectPageQueued; readonly copy: Copy }) {
  return (
    <li className="grid gap-1 py-3" data-queued={roadmap.slug}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ExternalAnchor href={roadmap.link}>
          <span className="min-w-0 break-words font-medium">{roadmap.title ?? roadmap.slug}</span>
        </ExternalAnchor>
        <Badge variant="tag" color="gray">
          {fillMessage(copy.roadmapCounter, { done: roadmap.done, total: roadmap.total })}
        </Badge>
      </div>
      <Muted>{roadmap.startCondition === null ? copy.noStartCondition : fillMessage(copy.startCondition, { condition: roadmap.startCondition })}</Muted>
    </li>
  );
}

export function QueuedSection({ queued, copy }: { readonly queued: readonly ProjectPageQueued[]; readonly copy: Copy }) {
  return (
    <Section id="queued-roadmaps" title={copy.queuedTitle}>
      {queued.length === 0 ? (
        <Muted>{copy.noQueued}</Muted>
      ) : (
        <ul aria-label={copy.queuedLabel} className="grid divide-y divide-border border-y border-border">
          {queued.map((roadmap) => (
            <QueuedRow key={roadmap.slug} roadmap={roadmap} copy={copy} />
          ))}
        </ul>
      )}
    </Section>
  );
}

function ChangeRow({ change, copy }: { readonly change: ProjectPageChange; readonly copy: Copy }) {
  return (
    <li className="grid gap-1 py-3" data-change={change.changeId}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <ExternalAnchor href={change.link}>
          <code className="min-w-0 break-all text-small">{change.changeId}</code>
        </ExternalAnchor>
        {change.stage === null ? null : (
          <Badge variant="tag" color="gray" title={copy.stage}>
            {change.stage}
          </Badge>
        )}
        {change.roadmapItem === null ? null : (
          <Badge variant="tag" color="blue">
            {change.roadmapItem}
          </Badge>
        )}
        {change.updated === null ? null : <span className="text-small text-muted-foreground">{fillMessage(copy.changeUpdated, { date: change.updated })}</span>}
      </div>
      {change.title === null ? null : <p className="min-w-0 break-words">{change.title}</p>}
    </li>
  );
}

export function ChangesSection({ changes, copy }: { readonly changes: readonly ProjectPageChange[]; readonly copy: Copy }) {
  return (
    <Section id="open-changes" title={copy.changesTitle}>
      {changes.length === 0 ? (
        <Muted>{copy.noChanges}</Muted>
      ) : (
        <ul aria-label={copy.changesLabel} className="grid divide-y divide-border border-y border-border">
          {changes.map((change) => (
            <ChangeRow key={change.changeId} change={change} copy={copy} />
          ))}
        </ul>
      )}
    </Section>
  );
}

export function EntriesSection({ page, copy, inboxCopy, answerAction }: {
  readonly page: ProjectPage;
  readonly copy: Copy;
  readonly inboxCopy: AppMessages["inbox"];
  readonly answerAction: AnswerFormProps["action"];
}) {
  return (
    <Section id="waiting-for-you" title={copy.entriesTitle}>
      {page.entries.length === 0 ? (
        <Muted>{copy.noEntries}</Muted>
      ) : (
        <ul aria-label={copy.entriesLabel} className="grid divide-y divide-border border-y border-border">
          {page.entries.map((row) => (
            <InboxRow key={row.entry.id} row={row} copy={inboxCopy} answerAction={answerAction} />
          ))}
        </ul>
      )}
    </Section>
  );
}
