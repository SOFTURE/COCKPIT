// The roadmap view's sections: the overview (status, progress, start condition, counts by status), the run-wide
// orders, every item as a folding row (closed: ID, title, status, stage, an owner-step badge and two lines of the
// outcome; opened: the owner's step highlighted, one table of the short facts, then the long fields) and the owner's
// steps and decisions of the roadmap.
import { Alert, AlertDescription, AlertTitle, Badge, DetailTable, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Circle, Hand, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { describeStatus, ItemIdBadge, RoadmapProgress, StatusPill } from "../project-page/project-page-sections.tsx";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { SectionCard } from "../shell/section-card.tsx";
import { StatusActionFoldRow } from "../shell/status-action-fold-row.tsx";
import type { RoadmapView, RoadmapViewItem, StatusGroup } from "./build-roadmap-view.ts";
import { describeMode, describeOrder } from "./describe-order.ts";
import { CHECK_SECTIONS } from "./parse-roadmap.ts";

type Copy = AppMessages["roadmapView"];
type PageCopy = AppMessages["projectPage"];

const GROUP_ORDER: readonly StatusGroup[] = ["active", "blocked", "ready", "done", "other"];

function itemAnchor(id: string): string {
  return `item-${id}`;
}

export function RoadmapOverview({ view, copy, pageCopy }: { readonly view: RoadmapView; readonly copy: Copy; readonly pageCopy: PageCopy }) {
  const counts = GROUP_ORDER.map((group) => ({ group, count: view.items.filter((item) => item.group === group).length })).filter((entry) => entry.count > 0);
  return (
    <SectionCard
      id="roadmap-overview"
      title={copy.overviewTitle}
      actionPlacement="wrap"
      action={
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 sm:justify-end" data-overview-progress>
          <RoadmapProgress done={view.done} total={view.total} copy={pageCopy} />
          <div className="flex flex-wrap gap-x-4 gap-y-1" aria-label={copy.countsLabel}>
            {counts.map(({ group, count }) => (
              <StatusPill key={group} group={group} isCount>
                {fillMessage(copy.groups[group], { count })}
              </StatusPill>
            ))}
          </div>
        </div>
      }
    >
      <div className="grid gap-4">
        <DetailTable
          label={copy.overviewTitle}
          rows={[
            { key: "kind", label: copy.kindLabel, value: copy.kinds[view.kind] },
            { key: "start", label: copy.startLabel, value: view.startCondition === null ? null : <InlineMarkdown text={view.startCondition} /> },
            { key: "status", label: copy.statusLabel, value: view.status },
            { key: "version", label: copy.versionLabel, value: view.version },
            { key: "updated", label: copy.updatedLabel, value: view.updated },
            { key: "file", label: copy.fileLabel, value: <code className="break-all text-small">{view.path}</code> },
          ]}
        />
      </div>
    </SectionCard>
  );
}

export function FallbackNotice({ view, copy }: { readonly view: RoadmapView; readonly copy: Copy }) {
  if (view.fallback === null) {
    return null;
  }
  return (
    <div role="alert" className="grid gap-1 rounded-lg border border-border bg-card p-4" data-fallback={view.fallback}>
      <Status color="orange" icon={TriangleAlert}>
        {copy.fallbackTitle}
      </Status>
      <p className="text-small text-muted-foreground">{`${copy.fallbackReasons[view.fallback]} ${copy.fallbackShows}`}</p>
    </div>
  );
}

export function OrdersSection({ view, copy }: { readonly view: RoadmapView; readonly copy: Copy }) {
  if (view.orders.length === 0) {
    return null;
  }
  return (
    <SectionCard id="roadmap-orders" title={copy.ordersTitle} description={copy.ordersHint}>
      <DetailTable
        label={copy.ordersTitle}
        rows={view.orders.map((order, index) => {
          const described = describeOrder(order, copy);
          return {
            key: String(index),
            label: described.label,
            value: (
              <span className="grid gap-0.5" data-order={order.label}>
                <span className="min-w-0 break-words">
                  <InlineMarkdown text={described.text} />
                </span>
                {described.note === null ? null : (
                  <span className="text-small text-muted-foreground" data-order-note>
                    <InlineMarkdown text={described.note} />
                  </span>
                )}
              </span>
            ),
          };
        })}
      />
    </SectionCard>
  );
}

function PrerequisiteLinks({ item, known }: { readonly item: RoadmapViewItem; readonly known: ReadonlySet<string> }) {
  return (
    <span className="flex flex-wrap gap-1">
      {item.prerequisites.map((id) =>
        known.has(id) ? (
          <a key={id} href={`#${itemAnchor(id)}`} className="underline underline-offset-2">
            {id}
          </a>
        ) : (
          <span key={id}>{id}</span>
        ),
      )}
    </span>
  );
}

function ItemRow({ item, copy, known, action }: { readonly item: RoadmapViewItem; readonly copy: Copy; readonly known: ReadonlySet<string>; readonly action: ReactNode }) {
  const status = describeStatus(copy, item.status);
  const groupPrefix = (copy.detailPrefixes as Readonly<Partial<Record<StatusGroup, string>>>)[item.group];
  // A detail that already says "waits for …" needs no "Waits for:" in front of it.
  const prefix = groupPrefix !== undefined && item.statusDetail?.toLowerCase().startsWith(groupPrefix.toLowerCase()) === false ? groupPrefix : undefined;
  return (
    <StatusActionFoldRow
      id={itemAnchor(item.id)}
      className="scroll-mt-16"
      data={{ "data-item": item.id, "data-status": item.status }}
      status={
        <>
          <StatusPill group={item.group}>{status}</StatusPill>
          {item.ownerStep === null ? null : (
            <Badge variant="tag" color="orange" data-owner-step-badge>
              {copy.ownerStepLabel}
            </Badge>
          )}
        </>
      }
      action={action}
      summary={
        // The ID column and the content column (title, status detail, outcome), the same in every row.
        <span className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
          <span className="flex h-6 w-16 items-center">
            <ItemIdBadge id={item.id} />
          </span>
          <span className="min-w-0 break-words text-ui-medium leading-6">
            <InlineMarkdown text={item.title ?? item.outcome ?? item.id} />
          </span>
          {item.statusDetail === null ? null : (
            <span className="col-start-2 min-w-0 break-words text-small" data-status-detail>
              {prefix === undefined ? null : <span className="text-muted-foreground">{`${prefix}: `}</span>}
              <InlineMarkdown text={item.statusDetail} />
            </span>
          )}
          {item.title === null || item.outcome === null ? null : (
            // Two lines while closed; the whole outcome once the row is open.
            <span className="col-start-2 line-clamp-2 min-w-0 break-words text-small text-muted-foreground group-open/fold-row:line-clamp-none" data-outcome>
              <InlineMarkdown text={item.outcome} />
            </span>
          )}
        </span>
      }
        detailsLabel={fillMessage(copy.itemDetailsLabel, { id: item.id })}
        details={[
          { key: "prerequisites", label: copy.prerequisitesLabel, value: item.prerequisites.length === 0 ? copy.none : <PrerequisiteLinks item={item} known={known} /> },
          { key: "size", label: copy.sizeLabel, value: item.size },
          ...item.facts.map((fact) => ({ key: `fact-${fact.label}`, label: fact.label, value: <InlineMarkdown text={fact.text} /> })),
          { key: "change", label: copy.changeLabel, value: item.changeId === null ? null : <code className="break-all text-small">{item.changeId}</code> },
          { key: "mode", label: copy.modeLabel, value: item.mode === null ? null : describeMode(item.mode, copy) },
        ]}
      >
        {item.ownerStep === null ? null : (
          <Alert variant="orange" role="note" className="order-first" data-owner-step>
            <Hand aria-hidden="true" />
            <AlertTitle>{copy.ownerStepLabel}</AlertTitle>
            <AlertDescription>
              <p className="min-w-0 break-words">
                <InlineMarkdown text={item.ownerStep} />
              </p>
            </AlertDescription>
          </Alert>
        )}
        {item.fields.map((field) => (
          <div key={field.label} className="grid gap-1 text-small" data-field={field.label}>
            <p className="font-medium">{field.label}</p>
            {field.text === "" ? null : (
              <p className="min-w-0 break-words text-muted-foreground">
                <InlineMarkdown text={field.text} />
              </p>
            )}
            {field.list.length === 0 ? null : (
              <ul className="grid list-disc gap-0.5 pl-5 text-muted-foreground">
                {field.list.map((entry) => (
                  <li key={entry} className="break-words">
                    <InlineMarkdown text={entry} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
    </StatusActionFoldRow>
  );
}

export function ItemsSection({ view, copy, renderAction }: {
  readonly view: RoadmapView;
  readonly copy: Copy;
  /** A control at the right end of an item's bar (promote to work), or none. */
  readonly renderAction?: (item: RoadmapViewItem) => ReactNode;
}) {
  const known = new Set(view.items.map((item) => item.id));
  return (
    <SectionCard id="roadmap-items" title={copy.itemsTitle} count={view.items.length} description={view.items.length === 0 ? copy.noItems : copy.itemsHint}>
      {view.items.length === 0 ? undefined : (
        <ul aria-label={copy.itemsLabel} className="grid">
          {view.items.map((item) => (
            <ItemRow key={item.id} item={item} copy={copy} known={known} action={renderAction?.(item) ?? null} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function ChecksSection({ view, copy }: { readonly view: RoadmapView; readonly copy: Copy }) {
  if (view.checks.length === 0) {
    return null;
  }
  const open = view.checks.filter((check) => !check.isDone).length;
  return (
    <SectionCard id="roadmap-checks" title={copy.checksTitle} count={open} description={copy.checksHint}>
      <div className="grid gap-4">
        {CHECK_SECTIONS.map((section) => {
          const checks = view.checks.filter((check) => check.section === section);
          return checks.length === 0 ? null : (
            <div key={section} className="grid gap-1.5">
              <h3 className="text-ui-medium text-muted-foreground">{copy.checkSections[section]}</h3>
              <ul aria-label={copy.checkSections[section]} className="grid gap-1.5">
                {checks.map((check) => (
                  <li key={check.text} className="flex min-w-0 items-start gap-2" data-done={check.isDone}>
                    {check.isDone ? (
                      <CircleCheck aria-label={copy.checkDone} className="mt-0.5 size-4 shrink-0 text-green" />
                    ) : (
                      <Circle aria-label={copy.checkOpen} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={check.isDone ? "min-w-0 break-words text-muted-foreground line-through" : "min-w-0 break-words"}>
                      <InlineMarkdown text={check.text} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
