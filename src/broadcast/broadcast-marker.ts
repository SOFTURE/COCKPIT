// The marker a broadcast issue carries (CV-1): `<!-- cockpit-broadcast: {"id": "<broadcast id>"} -->`. COCKPIT finds
// an issue it may have created already by it, so a lost answer or a retry never creates a second one.
import { z } from "zod";

const MARKER_PATTERN = /<!--\s*cockpit-broadcast:\s*(\{[^}]*\})\s*-->/;
const markerSchema = z.object({ id: z.string().min(1) });

export interface BroadcastMarker {
  readonly id: string;
}

export function parseBroadcastMarker(body: string): BroadcastMarker | null {
  const match = MARKER_PATTERN.exec(body);
  if (match?.[1] === undefined) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch {
    // A hand-edited marker that is not JSON names no broadcast.
    return null;
  }
  const parsed = markerSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export function formatBroadcastMarker(marker: BroadcastMarker): string {
  return `<!-- cockpit-broadcast: ${JSON.stringify({ id: marker.id })} -->`;
}
