// The marker a cockpit issue carries when it answers an owner-queue entry (WORKFLOW §8.6):
// `<!-- cockpit: {"entry": "<id>", "answer": "yes|no|later"} -->`, the only answer marker COCKPIT writes and reads.
import { z } from "zod";

export const ANSWERS = ["yes", "no", "later"] as const;
export type Answer = (typeof ANSWERS)[number];

export interface AnswerMarker {
  readonly entry: string;
  readonly answer: Answer;
}

const MARKER_PATTERN = /<!--\s*cockpit:\s*(\{[^}]*\})\s*-->/;
const markerSchema = z.object({ entry: z.string().min(1), answer: z.enum(ANSWERS) });

export function parseAnswerMarker(body: string): AnswerMarker | null {
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

export function formatAnswerMarker(marker: AnswerMarker): string {
  return `<!-- cockpit: ${JSON.stringify({ entry: marker.entry, answer: marker.answer })} -->`;
}
