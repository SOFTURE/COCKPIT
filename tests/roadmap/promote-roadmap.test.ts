import { beforeEach, describe, expect, it } from "vitest";
import { createForgeClient } from "../../src/forge/client.ts";
import type { RoadmapView, RoadmapViewItem } from "../../src/roadmap/build-roadmap-view.ts";
import { findOpenPromotions, isPromotableItem, promoteRoadmap, type PromoteRoadmapInput } from "../../src/roadmap/promote-roadmap.ts";
import { formatPromotionMarker, parsePromotionMarker } from "../../src/roadmap/promotion-marker.ts";
import { TEST_FORGE_API } from "../support/fake-forge-routes.ts";
import { createMemoryForge, type MemoryForge } from "../support/memory-forge.ts";

const FULL_NAME = "example-org/alpha-app";

function item(id: string, status: string, group: RoadmapViewItem["group"], title: string): RoadmapViewItem {
  return { id, title, outcome: `${title} works`, status, group, statusDetail: null, prerequisites: [], size: "S", changeId: `alpha-${id.toLowerCase()}`, mode: null, ownerStep: null, facts: [], fields: [] };
}

function laterView(overrides: Partial<RoadmapView> = {}): RoadmapView {
  return {
    kind: "queued",
    slug: "later",
    path: "context/foundation/roadmaps/roadmap-later.md",
    title: "Roadmap later",
    heading: null,
    status: "waiting",
    version: "1",
    updated: "2026-11-25",
    startCondition: null,
    done: 1,
    total: 4,
    orders: [],
    items: [
      item("LT-1", "blocked", "blocked", "Customer quotes"),
      item("LT-2", "ready", "ready", "Profile links"),
      item("LT-3", "done", "done", "Old work"),
      item("LT-4", "carried", "other", "Moved away"),
    ],
    checks: [],
    fallback: null,
    ...overrides,
  };
}

describe("promoteRoadmap", () => {
  let forge: MemoryForge;
  let input: PromoteRoadmapInput;

  beforeEach(() => {
    forge = createMemoryForge(FULL_NAME);
    input = {
      client: createForgeClient({ token: "test-token", baseUrl: TEST_FORGE_API, fetch: forge.fetch }),
      fullName: FULL_NAME,
      view: laterView(),
      itemId: "LT-1",
      requestedByName: "ada@example.test",
    };
  });

  it("creates one cockpit issue for one later item with the raise steps and the marker", async () => {
    const result = await promoteRoadmap(input);

    expect(result).toMatchObject({ ok: true, value: { issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyPromoted: false } });
    const [issue] = forge.issues;
    expect(issue?.labels).toEqual(["cockpit"]);
    expect(issue?.title).toBe("COCKPIT command: promote LT-1 to work, Customer quotes");
    expect(issue?.body.startsWith("**ada** promotes **LT-1** of the later roadmap (`context/foundation/roadmaps/roadmap-later.md`) to work now:")).toBe(true);
    expect(issue?.body).toContain("> Customer quotes");
    expect(issue?.body).toContain("- Change ID: `alpha-lt-1`");
    expect(issue?.body).toContain("`git mv context/backlog/roadmap-later/<change-id>/change.md context/changes/<change-id>/backlog-input.md`");
    expect(issue?.body).toContain("`carried (to roadmap.md <new ID>, #<this issue>)`");
    expect(issue?.body).not.toContain("ada@example.test");
    expect(parsePromotionMarker(issue?.body ?? "")).toEqual({ roadmap: "later", item: "LT-1" });
  });

  it("finds the open issue on a second promotion instead of creating another, also when both run at once", async () => {
    const [first, second] = await Promise.all([promoteRoadmap(input), promoteRoadmap(input)]);
    const third = await promoteRoadmap(input);

    expect(first).toMatchObject({ ok: true, value: { issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyPromoted: false } });
    expect(second).toMatchObject({ ok: true, value: { issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyPromoted: true } });
    expect(third).toEqual(second);
    expect(first.ok && first.value.issueTitle).toBe("COCKPIT command: promote LT-1 to work, Customer quotes");
    expect(forge.issues).toHaveLength(1);
  });

  it("creates a new issue once the earlier one is closed", async () => {
    await promoteRoadmap(input);
    forge.close(1);

    const again = await promoteRoadmap(input);

    expect(again).toMatchObject({ ok: true, value: { issueNumber: 2, issueUrl: forge.issueUrl(2), alreadyPromoted: false } });
  });

  it("keeps an item and the whole roadmap apart", async () => {
    await promoteRoadmap(input);
    const whole = await promoteRoadmap({ ...input, itemId: null });

    expect(whole).toMatchObject({ ok: true, value: { issueNumber: 2, issueUrl: forge.issueUrl(2), alreadyPromoted: false } });
    const body = forge.issues[1]?.body ?? "";
    expect(forge.issues[1]?.title).toBe("COCKPIT command: promote the whole later roadmap to work");
    expect(body).toContain("- **LT-1** Customer quotes");
    expect(body).toContain("- **LT-2** Profile links");
    expect(body).not.toContain("LT-3");
    expect(body).not.toContain("LT-4");
    expect(body).toContain("the later roadmap is never promoted as a file (WORKFLOW §5.1)");
    expect(parsePromotionMarker(body)).toEqual({ roadmap: "later", item: null });
  });

  it("promotes another queued roadmap with softure-roadmap --promote", async () => {
    const result = await promoteRoadmap({ ...input, itemId: null, view: laterView({ slug: "payments", path: "context/foundation/roadmaps/roadmap-payments.md" }) });

    expect(result.ok).toBe(true);
    expect(forge.issues[0]?.title).toBe("COCKPIT command: promote the whole roadmap payments to work");
    expect(forge.issues[0]?.body).toContain("Run `softure-roadmap --promote payments`");
    expect(forge.issues[0]?.body).toContain("`context/backlog/roadmap-payments/`");
  });

  it("refuses an active roadmap, a done, carried or unknown item, and a missing forge, creating nothing", async () => {
    expect(await promoteRoadmap({ ...input, view: laterView({ kind: "active" }) })).toEqual({ ok: false, error: "promote.not_queued" });
    for (const itemId of ["LT-3", "LT-4", "LT-9"]) {
      expect(await promoteRoadmap({ ...input, itemId })).toEqual({ ok: false, error: "promote.item_not_open" });
    }
    expect(await promoteRoadmap({ ...input, client: null })).toEqual({ ok: false, error: "promote.forge_not_configured" });
    expect(forge.issues).toHaveLength(0);
  });

  it("refuses a project without the cockpit label, creating nothing", async () => {
    forge.labels = new Set(["bug"]);
    expect(await promoteRoadmap({ ...input, itemId: "LT-2" })).toEqual({ ok: false, error: "promote.label_missing" });
    expect(forge.issues).toHaveLength(0);
  });

  it("adopts the issue a lost answer created, and names a refusal", async () => {
    forge.createFailures.push({ status: 504, created: true });
    expect(await promoteRoadmap(input)).toMatchObject({ ok: true, value: { issueNumber: 1, issueUrl: forge.issueUrl(1), alreadyPromoted: false } });

    forge.createFailures.push({ status: 403 });
    expect(await promoteRoadmap({ ...input, itemId: "LT-2" })).toEqual({ ok: false, error: "promote.forge_refused" });
    expect(forge.issues).toHaveLength(1);
  });
});

describe("promotion markers", () => {
  it("round-trip, ignore closed issues and broken markers", () => {
    const body = `text\n\n${formatPromotionMarker({ roadmap: "later", item: null })}`;
    const issue = { number: 3, title: "t", body, url: "u", createdAt: "2026-11-25T00:00:00Z", closedAt: null };
    expect(findOpenPromotions([{ ...issue, state: "open" }, { ...issue, number: 4, state: "closed" }])).toEqual([{ marker: { roadmap: "later", item: null }, number: 3, title: "t", url: "u" }]);
    expect(parsePromotionMarker("<!-- cockpit-promote: {nope} -->")).toBeNull();
    expect(parsePromotionMarker('<!-- cockpit-promote: {"roadmap":"later"} -->')).toBeNull();
  });

  it("treat done, carried and dropped items as not promotable", () => {
    expect(isPromotableItem(item("A-1", "blocked", "blocked", "x"))).toBe(true);
    expect(isPromotableItem(item("A-2", "done_code", "done", "x"))).toBe(false);
    expect(isPromotableItem(item("A-3", "dropped", "other", "x"))).toBe(false);
  });
});
