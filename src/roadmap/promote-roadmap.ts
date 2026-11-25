// Promoting a queued roadmap, or one of its open items, to work: the owner's word becomes exactly one labelled issue in
// that project (the same single write as an answer, NFR-7). Before creating, COCKPIT looks for an open issue that
// carries the same promotion marker and returns it, so a second click finds the first; a closed one means the project
// acted, and a new promotion is a new word. Clicks for the same promotion are serialised in this process.
import { err, ok, type Result } from "@softure-ai/core";
import type { ForgeClient, ForgeIssue, ForgeReadFailure } from "../forge/client.ts";
import { findIssueLabel } from "../forge/issue-label.ts";
import { formatPromotionIssue, type PromotedItem } from "../forge/issues.ts";
import type { RoadmapView, RoadmapViewItem } from "./build-roadmap-view.ts";
import { isSamePromotion, parsePromotionMarker, type PromotionMarker } from "./promotion-marker.ts";

export type PromoteErrorCode =
  | "promote.forge_not_configured"
  | "promote.not_queued"
  | "promote.item_not_open"
  | "promote.label_missing"
  | "promote.forge_refused"
  | "promote.forge_unauthorized"
  | "promote.forge_rate_limited"
  | "promote.forge_unavailable";

export interface PromoteRoadmapInput {
  readonly client: ForgeClient | null;
  readonly fullName: string;
  /** The roadmap as the view reads it now: the item must still be open in it. */
  readonly view: RoadmapView;
  /** The item to promote; null promotes the whole roadmap. */
  readonly itemId: string | null;
  /** The requester as people read it (display name or email), named in the issue (FR-16). */
  readonly requestedByName: string;
}

export interface Promotion {
  readonly issueNumber: number;
  readonly issueUrl: string;
  /** True when an open issue already promoted it and nothing new was created. */
  readonly alreadyPromoted: boolean;
}

/** An open promotion issue of a project, as the roadmap view shows it. */
export interface OpenPromotion {
  readonly marker: PromotionMarker;
  readonly number: number;
  readonly url: string;
}

const CLOSED_PREFIXES = ["carried", "dropped"];

/** An item can be promoted while it is not done, carried elsewhere or dropped. */
export function isPromotableItem(item: RoadmapViewItem): boolean {
  return item.group !== "done" && !CLOSED_PREFIXES.some((prefix) => item.status.startsWith(prefix));
}

function toPromotedItem(item: RoadmapViewItem): PromotedItem {
  return { id: item.id, title: item.title, outcome: item.outcome, changeId: item.changeId };
}

function toPromoteError(failure: ForgeReadFailure): PromoteErrorCode {
  switch (failure.kind) {
    case "not_found":
    case "refused":
      // A repository the token no longer reaches answers like a missing one.
      return "promote.forge_refused";
    case "unauthorized":
      return "promote.forge_unauthorized";
    case "rate_limited":
      return "promote.forge_rate_limited";
    case "invalid_answer":
    case "unavailable":
      return "promote.forge_unavailable";
  }
}

/** The open promotion issues of a project, newest first as the forge lists them. */
export function findOpenPromotions(issues: readonly ForgeIssue[]): OpenPromotion[] {
  return issues.flatMap((issue) => {
    const marker = issue.state === "open" ? parsePromotionMarker(issue.body) : null;
    return marker === null ? [] : [{ marker, number: issue.number, url: issue.url }];
  });
}

/** The open promotion of this roadmap and item, or of this whole roadmap when no item's own exists. */
export function findPromotion(promotions: readonly OpenPromotion[], roadmap: string, item: string | null): OpenPromotion | null {
  return promotions.find((promotion) => isSamePromotion(promotion.marker, { roadmap, item })) ?? null;
}

const inFlight = new Map<string, Promise<unknown>>();

/** Runs `task` after every earlier task of the same key: two clicks of one promotion never create two issues. */
async function serialize<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = inFlight.get(key) ?? Promise.resolve();
  const current = previous.then(task, task);
  inFlight.set(key, current);
  try {
    return await current;
  } finally {
    if (inFlight.get(key) === current) {
      inFlight.delete(key);
    }
  }
}

async function findOpen(client: ForgeClient, owner: string, name: string, marker: PromotionMarker): Promise<Result<OpenPromotion | null, PromoteErrorCode>> {
  const issues = await client.listOwnerWordIssues(owner, name);
  if (!issues.ok) {
    return err(toPromoteError(issues));
  }
  return ok(findPromotion(findOpenPromotions(issues.value), marker.roadmap, marker.item));
}

export async function promoteRoadmap(input: PromoteRoadmapInput): Promise<Result<Promotion, PromoteErrorCode>> {
  const { client, view } = input;
  if (client === null) {
    return err("promote.forge_not_configured");
  }
  if (view.kind !== "queued") {
    return err("promote.not_queued");
  }
  const openItems = view.items.filter(isPromotableItem);
  const item = input.itemId === null ? null : openItems.find((candidate) => candidate.id === input.itemId);
  if (item === undefined) {
    return err("promote.item_not_open");
  }
  const [owner = "", name = ""] = input.fullName.split("/");
  const marker: PromotionMarker = { roadmap: view.slug, item: item?.id ?? null };
  return serialize(`${input.fullName}|${marker.roadmap}|${marker.item ?? "*"}`, async () => {
    const existing = await findOpen(client, owner, name, marker);
    if (!existing.ok) {
      return existing;
    }
    if (existing.value !== null) {
      return ok({ issueNumber: existing.value.number, issueUrl: existing.value.url, alreadyPromoted: true });
    }
    const label = await findIssueLabel(client, owner, name);
    if (!label.ok) {
      return err(toPromoteError(label));
    }
    if (label.value === null) {
      // FR-5: never an unlabelled issue.
      return err("promote.label_missing");
    }
    const issue = formatPromotionIssue({
      roadmap: { slug: view.slug, path: view.path, title: view.title },
      item: item === null ? null : toPromotedItem(item),
      openItems: openItems.map(toPromotedItem),
      requestedBy: input.requestedByName,
      label: label.value,
    });
    const created = await client.createIssue(owner, name, issue);
    if (created.ok) {
      return ok({ issueNumber: created.value.number, issueUrl: created.value.url, alreadyPromoted: false });
    }
    if (created.kind === "unavailable" || created.kind === "invalid_answer") {
      // The forge may have created the issue and lost its answer: adopt it rather than invite a second one.
      const adopted = await findOpen(client, owner, name, marker);
      if (adopted.ok && adopted.value !== null) {
        return ok({ issueNumber: adopted.value.number, issueUrl: adopted.value.url, alreadyPromoted: false });
      }
    }
    return err(toPromoteError(created));
  });
}
