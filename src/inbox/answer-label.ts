// How an answer reads for the kind of entry it answers. A step or a secret is something to do, so its `yes` reads
// "Done"; the cockpit answer marker still carries `yes` (WORKFLOW §8.6), so this is wording only.
import type { AppMessages } from "../../messages/index.ts";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import type { Answer } from "./answer-marker.ts";

export type EntryKind = OwnerQueueEntry["kind"];

/** Whether the entry is something to do (a step, or a step that names a secret) rather than a word or a decision. */
export function isStepKind(kind: EntryKind | null): boolean {
  return kind === "step" || kind === "secret";
}

/** The answer's label for an entry of `kind`; null when the kind is not known (reads as for a decision). */
export function getAnswerLabel(copy: AppMessages["inbox"], kind: EntryKind | null, answer: Answer): string {
  return answer === "yes" && isStepKind(kind) ? copy.answerDone : copy.answers[answer];
}
