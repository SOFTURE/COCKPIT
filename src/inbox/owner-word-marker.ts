// The marker an issue carries when it answers an owner-queue entry (WORKFLOW §8.6):
// `<!-- cockpit: {"entry": "<id>", "answer": "yes|no|later"} -->` since `@softure-ai/skills` 0.39, and the older
// `<!-- owner-word: … -->` before it. Both are read; the issue's label picks the one written.
import { z } from "zod";

export const OWNER_WORD_ANSWERS = ["yes", "no", "later"] as const;
export type OwnerWordAnswer = (typeof OWNER_WORD_ANSWERS)[number];

export interface OwnerWordMarker {
  readonly entry: string;
  readonly answer: OwnerWordAnswer;
}

/** The marker names, by the label of the issue that carries them. */
export type MarkerName = "cockpit" | "owner-word";

const MARKER_PATTERN = /<!--\s*(?:cockpit|owner-word):\s*(\{[^}]*\})\s*-->/;
const markerSchema = z.object({ entry: z.string().min(1), answer: z.enum(OWNER_WORD_ANSWERS) });

export function parseOwnerWordMarker(body: string): OwnerWordMarker | null {
  const match = MARKER_PATTERN.exec(body);
  if (match?.[1] === undefined) {
    return null;
  }
  let json: unknown;
  try {
    json = JSON.parse(match[1]);
  } catch {
    // A hand-edited marker that is not JSON answers nothing.
    return null;
  }
  const parsed = markerSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

export function formatOwnerWordMarker(marker: OwnerWordMarker, name: MarkerName = "cockpit"): string {
  return `<!-- ${name}: ${JSON.stringify({ entry: marker.entry, answer: marker.answer })} -->`;
}
