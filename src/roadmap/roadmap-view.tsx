// The roadmap view's sections: the overview (status, progress, start condition, counts by status), the run-wide
// orders, every item as a folding row (ID, title, status and outcome; opened: prerequisites, size, change and the
// rest of its fields) and the owner's steps and decisions of the roadmap.
import { DetailTable, FoldRow, Status } from "@softure-ai/theme-notion";
import { CircleCheck, Circle, TriangleAlert } from "lucide-react";
import { fillMessage, type AppMessages } from "../../messages/index.ts";
import { describeStatus, RoadmapProgress, StatusPill } from "../project-page/project-page-sections.tsx";
import { InlineMarkdown } from "../shell/inline-markdown.tsx";
import { SectionCard } from "../shell/section-card.tsx";
import type { RoadmapView, RoadmapViewItem, StatusGroup } from "./build-roadmap-view.ts";
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
    <SectionCard id="roadmap-overview" title={copy.overviewTitle}>
      <div className="grid gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <RoadmapProgress done={view.done} total={view.total} copy={pageCopy} />
          <div className="flex flex-wrap gap-x-4 gap-y-1" aria-label={copy.countsLabel}>
            {counts.map(({ group, count }) => (
              <StatusPill key={group} group={group} isCount>
                {fillMessage(copy.groups[group], { count })}
              </StatusPill>
            ))}
          </div>
        </div>
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
      <DetailTable label={copy.ordersTitle} rows={view.orders.map((order, index) => ({ key: String(index), label: order.label, value: <InlineMarkdown text={order.text} /> }))} />
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

function ItemRow({ item, copy, known }: { readonly item: RoadmapViewItem; readonly copy: Copy; readonly known: ReadonlySet<string> }) {
  const status = describeStatus(copy, item.status);
  const groupPrefix = (copy.detailPrefixes as Readonly<Partial<Record<StatusGroup, string>>>)[item.group];
  // A detail that already says "waits for …" needs no "Waits for:" in front of it.
  const prefix = groupPrefix !== undefined && item.statusDetail?.toLowerCase().startsWith(groupPrefix.toLowerCase()) === false ? groupPrefix : undefined;
  return (
    <li id={itemAnchor(item.id)} className="scroll-mt-16" data-item={item.id} data-status={item.status}>
      <FoldRow
        size="touch"
        summary={
          <>
            <span className="w-14 shrink-0 font-mono text-small text-muted-foreground">{item.id}</span>
            <span className="min-w-0 flex-1 break-words text-ui-medium">
              <InlineMarkdown text={item.title ?? item.outcome ?? item.id} />
            </span>
            <StatusPill group={item.group}>{status}</StatusPill>
            {item.statusDetail === null ? null : (
              <span className="basis-full pl-16 text-small" data-status-detail>
                {prefix === undefined ? null : <span className="text-muted-foreground">{`${prefix}: `}</span>}
                <InlineMarkdown text={item.statusDetail} />
              </span>
            )}
            {item.title === null || item.outcome === null ? null : (
              <span className="basis-full pl-16 text-small text-muted-foreground">
                <InlineMarkdown text={item.outcome} />
              </span>
            )}
          </>
        }
        detailsLabel={fillMessage(copy.itemDetailsLabel, { id: item.id })}
        details={[
          { key: "prerequisites", label: copy.prerequisitesLabel, value: item.prerequisites.length === 0 ? copy.none : <PrerequisiteLinks item={item} known={known} /> },
          { key: "size", label: copy.sizeLabel, value: item.size },
          { key: "change", label: copy.changeLabel, value: item.changeId === null ? null : <code className="break-all text-small">{item.changeId}</code> },
          { key: "mode", label: copy.modeLabel, value: item.mode },
        ]}
      >
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
      </FoldRow>
    </li>
  );
}

export function ItemsSection({ view, copy }: { readonly view: RoadmapView; readonly copy: Copy }) {
  const known = new Set(view.items.map((item) => item.id));
  return (
    <SectionCard id="roadmap-items" title={copy.itemsTitle} count={view.items.length} description={view.items.length === 0 ? copy.noItems : copy.itemsHint}>
      {view.items.length === 0 ? undefined : (
        <ul aria-label={copy.itemsLabel} className="grid">
          {view.items.map((item) => (
            <ItemRow key={item.id} item={item} copy={copy} known={known} />
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
