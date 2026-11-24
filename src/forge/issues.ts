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

/** A step or a secret is something to do: its yes reads "Done" (the marker still says yes). */
function getAnswerWord(entry: OwnerQueueEntry, answer: OwnerWordAnswer): string {
  return answer === "yes" && (entry.kind === "step" || entry.kind === "secret") ? "Done" : ANSWER_WORDS[answer];
}

/** Where the package-update routine records its owner work (routines/package-updates.md, SOFTURE/SKILLS#86). */
const ROUTINE_OWNER_STEPS_SOURCE = "context/workflow.json#routines.packageUpdates.ownerSteps";
const ROUTINE_HOLD_SOURCE = "context/workflow.json#routines.packageUpdates.hold";

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

/**
 * What the project does with the answer (WORKFLOW §8.6), so any session that picks the issue up closes the loop:
 * COCKPIT lists the entry until the project's `context/state.json` no longer does, and shows it put off while it
 * carries `(later: #N)`.
 */
function getSettleSteps(entry: OwnerQueueEntry): string[] {
  if (entry.source === ROUTINE_OWNER_STEPS_SOURCE) {
    return [
      `For the project: settle entry \`${entry.id}\`, an owner step of a package bump in \`context/workflow.json\` (\`routines.packageUpdates.ownerSteps\`), citing this issue:`,
      "",
      '- done: set `"confirmed": "#<this issue>"` on that `ownerSteps` entry (the next package-update run removes it);',
      "- no: record what follows for the bump, then set `confirmed` with this issue so the step leaves the queue;",
      "- later: leave it without `confirmed`; it stays in the queue.",
      "",
      "Then regenerate `context/state.json` in the same commit, comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
    ];
  }
  if (entry.source === ROUTINE_HOLD_SOURCE) {
    return [
      `For the project: entry \`${entry.id}\` is a package the nightly update holds for the owner's decision (\`routines.packageUpdates.hold\` in \`context/workflow.json\`).`,
      "",
      "- yes or no: record it on the hold's issue named in the entry; the next package-update run applies this answer to the held package and removes the hold;",
      "- later: leave the hold as it is.",
      "",
      "Then comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
    ];
  }
  return [
    `For the project: settle entry \`${entry.id}\` in \`${entry.source}\`, citing this issue:`,
    "",
    "- yes: carry it out and tick it `— done: #<this issue>`;",
    "- no: tick it `— declined: #<this issue>` and record what follows;",
    "- later: leave it open with `(later: #<this issue>)`.",
    "",
    "Then regenerate `context/state.json` in the same commit, comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it, and shows it as put off while it carries `(later: #N)`.",
  ];
}

export function formatOwnerWordIssue({ entry, answer, note, answeredBy }: OwnerWordIssueInput): NewForgeIssue {
  const word = getAnswerWord(entry, answer);
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
  lines.push("", ...getSettleSteps(entry), "", "Sent from COCKPIT.", "", formatOwnerWordMarker({ entry: entry.id, answer }));
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
