// CT-25: an item row of the roadmap view is the theme's FoldRow with its status (the pill and the owner-step tag) and
// its action (the promote control) in the row's right column; the local laid-over copy of the action is gone.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { en } from "../../messages/en.ts";
import type { RoadmapView, RoadmapViewItem } from "../../src/roadmap/build-roadmap-view.ts";
import { ItemsSection } from "../../src/roadmap/roadmap-view.tsx";

function buildItem(overrides: Partial<RoadmapViewItem>): RoadmapViewItem {
  return {
    id: "EX-1",
    title: "Notes are stored",
    outcome: "the owner keeps a note",
    status: "ready",
    group: "ready",
    statusDetail: null,
    prerequisites: [],
    size: "S",
    changeId: null,
    mode: null,
    ownerStep: null,
    facts: [],
    fields: [],
    ...overrides,
  };
}

function buildView(items: readonly RoadmapViewItem[]): RoadmapView {
  return {
    kind: "queued",
    slug: "later",
    path: "context/foundation/roadmaps/roadmap-later.md",
    title: "Later",
    heading: null,
    status: null,
    version: null,
    updated: null,
    startCondition: null,
    done: 0,
    total: items.length,
    orders: [],
    items,
    checks: [],
    fallback: null,
  };
}

function renderItems(items: readonly RoadmapViewItem[], withAction: (item: RoadmapViewItem) => boolean): string {
  return renderToStaticMarkup(
    <ItemsSection
      view={buildView(items)}
      copy={en.roadmapView}
      renderAction={(item) => (withAction(item) ? <button type="button">{`Promote ${item.id}`}</button> : null)}
    />,
  );
}

/** The markup of one item's `li`, from its opening tag to the next item or the list's end. */
function rowMarkup(markup: string, id: string): string {
  const start = markup.search(new RegExp(`<li [^>]*data-item="${id}"`));
  expect(start).toBeGreaterThanOrEqual(0);
  const next = markup.slice(start + 1).search(/<li [^>]*data-item=/);
  return markup.slice(start, next === -1 ? markup.lastIndexOf("</ul>") : start + 1 + next);
}

describe("a roadmap item row", () => {
  it("puts the status pill and the owner-step tag in the FoldRow status slot and the control in its action list", () => {
    const row = rowMarkup(renderItems([buildItem({ id: "EX-1", ownerStep: "paste the key" })], () => true), "EX-1");
    const opening = /^<li ([^>]*)><div data-slot="fold-row-with-actions"/.exec(row)?.[1] ?? "";
    for (const attribute of ['id="item-EX-1"', 'class="scroll-mt-16"', 'data-item="EX-1"', 'data-status="ready"']) {
      expect(opening).toContain(attribute);
    }
    // The column beside the details: the status slot (pill, then owner tag) on top, the action list under it.
    const column = /<div data-slot="fold-row-actions"[^>]*><div data-slot="fold-row-status"[^>]*>(.*?)<\/div><div data-slot="fold-row-action-list"[^>]*>(.*?)<\/div><\/div>/.exec(row);
    expect(column).not.toBeNull();
    const [, status = "", actions = ""] = column ?? [];
    expect(status).toMatch(/data-stage="true"[^>]*>.*Ready.*data-owner-step-badge[^>]*>Owner step</);
    expect(actions).toBe('<button type="button">Promote EX-1</button>');
    // One control per row, outside the summary, and nothing of the old laid-over copy.
    expect(row.match(/<button/g)).toHaveLength(1);
    expect(/<summary[^>]*>.*<button.*<\/summary>/.test(row)).toBe(false);
    for (const old of ["data-row-bar", "data-row-side", "data-row-status", "data-action-place", "data-row-action"]) {
      expect(row).not.toContain(old);
    }
  });

  it("draws no action list for an item with nothing to promote and keeps its details in the opened content", () => {
    const row = rowMarkup(renderItems([buildItem({ id: "EX-2", status: "done", group: "done" })], () => false), "EX-2");
    expect(row).toMatch(/<div data-slot="fold-row-status"[^>]*>.*Done.*<\/div><\/div>/);
    expect(row).not.toContain("fold-row-action-list");
    expect(row).not.toContain("data-owner-step-badge");
    expect(row).toMatch(/<div data-slot="fold-row-content"[^>]*>.*aria-label="Details of EX-2"/);
  });
});
