// The marker an owner-word issue carries when it answers an owner-queue entry (WORKFLOW §8.6):
// `<!-- owner-word: {"entry": "<id>", "answer": "yes|no|later"} -->`.
import { z } from "zod";

export const OWNER_WORD_ANSWERS = ["yes", "no", "later"] as const;
export type OwnerWordAnswer = (typeof OWNER_WORD_ANSWERS)[number];

export interface OwnerWordMarker {
  readonly entry: string;
  readonly answer: OwnerWordAnswer;
}

const MARKER_PATTERN = /<!--\s*owner-word:\s*(\{[^}]*\})\s*-->/;
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

export function formatOwnerWordMarker(marker: OwnerWordMarker): string {
  return `<!-- owner-word: ${JSON.stringify({ entry: marker.entry, answer: marker.answer })} -->`;
}
