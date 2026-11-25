// The marker a promotion issue carries: `<!-- cockpit-promote: {"roadmap": "<slug>", "item": "<ID>" | null} -->`. A
// null item promotes the whole roadmap. COCKPIT finds the open issue of the same roadmap and item by it, so a second
// click, a retry or a lost answer never creates another.
import { z } from "zod";

const MARKER_PATTERN = /<!--\s*cockpit-promote:\s*(\{[^}]*\})\s*-->/;
const markerSchema = z.object({ roadmap: z.string().min(1), item: z.string().min(1).nullable() });

export interface PromotionMarker {
  readonly roadmap: string;
  /** Null when the whole roadmap is promoted. */
  readonly item: string | null;
}

export function parsePromotionMarker(body: string): PromotionMarker | null {
  const match = MARKER_PATTERN.exec(body);
  if (match?.[1] === undefined) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch {
    // A hand-edited marker that is not JSON promotes nothing.
    return null;
  }
  const parsed = markerSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export function formatPromotionMarker(marker: PromotionMarker): string {
  return `<!-- cockpit-promote: ${JSON.stringify({ roadmap: marker.roadmap, item: marker.item })} -->`;
}

export function isSamePromotion(left: PromotionMarker, right: PromotionMarker): boolean {
  return left.roadmap === right.roadmap && left.item === right.item;
}
