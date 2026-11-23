// The owner-word issue an answer becomes (FR-5, WORKFLOW §8.6): prose a person reads, plus the marker the project's
// coordinator and COCKPIT's scan read. It names no person: the issue lives in the project's repository.
import { formatOwnerWordMarker, type OwnerWordAnswer } from "../inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import { OWNER_WORD_LABEL, type NewForgeIssue } from "./client.ts";

const ANSWER_WORDS: Readonly<Record<OwnerWordAnswer, string>> = { yes: "Yes", no: "No", later: "Later" };

/** Issue titles stay readable in a list; the full entry text is in the body. */
const TITLE_TEXT_LIMIT = 72;

function shorten(text: string, limit: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length <= limit ? line : `${line.slice(0, limit - 3).trimEnd()}...`;
}

function quote(text: string): string {
  return text
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

export function formatOwnerWordIssue(entry: OwnerQueueEntry, answer: OwnerWordAnswer, note: string | null): NewForgeIssue {
  const word = ANSWER_WORDS[answer];
  const lines = [
    `The owner answers **${word}** to this entry of the owner queue:`,
    "",
    quote(entry.text),
    "",
    `- Entry: \`${entry.id}\``,
    `- Kind: ${entry.kind}`,
    `- Source: \`${entry.source}\``,
  ];
  if (entry.item !== null) {
    lines.push(`- Item: ${entry.item}`);
  }
  lines.push(`- Answer: ${word}`);
  if (note !== null) {
    lines.push("", "Note from the owner:", "", quote(note));
  }
  lines.push("", "Sent from COCKPIT.", "", formatOwnerWordMarker({ entry: entry.id, answer }));
  return {
    title: `Owner word: ${word}, ${shorten(entry.text, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [OWNER_WORD_LABEL],
  };
}
