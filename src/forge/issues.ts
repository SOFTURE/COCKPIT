// The owner-word issues COCKPIT creates: the one an answer becomes (FR-5, WORKFLOW §8.6) and the one a broadcast
// becomes in each chosen project (CV-1). Each is prose a person reads, plus the marker the project's coordinator and
// COCKPIT read. It names who answered (FR-16) by display name or the part of the email before
// `@`, never a full address: the issue lives in the project's repository, which may be public.
import { formatBroadcastMarker } from "../broadcast/broadcast-marker.ts";
import { getPublicAnswererName } from "../team/answerer-name.ts";
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

/** Quoted text is the project's or the owner's; an HTML comment in it could pass for the issue's own marker. */
function quote(text: string): string {
  return text
    .replaceAll("<!--", "&lt;!--")
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

export interface OwnerWordIssueInput {
  readonly entry: OwnerQueueEntry;
  readonly answer: OwnerWordAnswer;
  readonly note: string | null;
  /** The answerer's stored name (display name or email); null when it is not known. */
  readonly answeredBy: string | null;
}

/** Names in the issue are plain text: no markdown or HTML a name could smuggle in. */
function toPlainName(name: string): string {
  return name.replace(/[<>*_`[\]\\]/g, "").trim();
}

export function formatOwnerWordIssue({ entry, answer, note, answeredBy }: OwnerWordIssueInput): NewForgeIssue {
  const word = ANSWER_WORDS[answer];
  const name = answeredBy === null ? "" : toPlainName(getPublicAnswererName(answeredBy));
  const who = name === "" ? "The owner" : `**${name}**`;
  const lines = [
    `${who} answers **${word}** to this entry of the owner queue:`,
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
  if (name !== "") {
    lines.push(`- Answered by: ${name}`);
  }
  if (note !== null) {
    lines.push("", name === "" ? "Note from the owner:" : `Note from ${name}:`, "", quote(note));
  }
  lines.push("", "Sent from COCKPIT.", "", formatOwnerWordMarker({ entry: entry.id, answer }));
  return {
    title: `Owner word: ${word}, ${shorten(entry.text, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [OWNER_WORD_LABEL],
  };
}

export interface BroadcastIssueInput {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** The sender's stored name (display name or email); null when it is not known. */
  readonly sentBy: string | null;
}

/** One broadcast as an owner-word issue: the owner's word to the whole project, quoted, with the broadcast's marker. */
export function formatBroadcastIssue({ id, title, body, sentBy }: BroadcastIssueInput): NewForgeIssue {
  const name = sentBy === null ? "" : toPlainName(getPublicAnswererName(sentBy));
  const who = name === "" ? "The owner" : `**${name}**`;
  const lines = [
    `${who} sends this word to the project:`,
    "",
    quote(body),
    "",
    `- Broadcast: \`${id}\``,
  ];
  if (name !== "") {
    lines.push(`- Sent by: ${name}`);
  }
  lines.push(
    "",
    "Act on it like any owner-word issue, then close this issue: COCKPIT shows the project as done once it is closed.",
    "",
    "Sent from COCKPIT.",
    "",
    formatBroadcastMarker({ id }),
  );
  return {
    title: `Owner word: ${shorten(title, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [OWNER_WORD_LABEL],
  };
}
