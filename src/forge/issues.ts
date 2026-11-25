// The owner-word issues COCKPIT creates: the one an answer becomes (FR-5, WORKFLOW §8.6) and the one a broadcast
// becomes in each chosen project (CV-1). Each is prose a person reads, plus the marker the project's coordinator and
// COCKPIT read. It names who answered (FR-16) by display name or the part of the email before
// `@`, never a full address: the issue lives in the project's repository, which may be public.
import { formatBroadcastMarker } from "../broadcast/broadcast-marker.ts";
import { getPublicAnswererName } from "../team/answerer-name.ts";
import { formatOwnerWordMarker, type OwnerWordAnswer } from "../inbox/owner-word-marker.ts";
import type { OwnerQueueEntry } from "../state/state-schema.ts";
import type { NewForgeIssue } from "./client.ts";
import { ISSUE_LABEL, type IssueLabel } from "./issue-label.ts";

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
  /** The label the issue gets; its answer marker follows it (`cockpit` unless the project has only `owner-word`). */
  readonly label?: IssueLabel;
}

/** Names in the issue are plain text: no markdown or HTML a name could smuggle in. */
function toPlainName(name: string): string {
  return name.replace(/[<>*_`[\]\\]/g, "").trim();
}

/**
 * What the project does with the answer (WORKFLOW §8.6, SOFTURE/SKILLS 0.37.0), so any session that picks the issue up
 * closes the loop: whatever the answer, the entry leaves the project's owner queue, and COCKPIT lists it until the
 * project's `context/state.json` no longer does. Re-wording the entry instead would show it to the owner again.
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
    `For the project: settle entry \`${entry.id}\` in \`${entry.source}\`, citing this issue, so it leaves the owner queue:`,
    "",
    "- yes: carry it out and tick it `— done: #<this issue>`; what only the owner can still do becomes a new item of `context/foundation/roadmaps/roadmap-later.md`;",
    "- no: tick it `— declined: #<this issue>` and record what follows;",
    "- later: move the item to `context/foundation/roadmaps/roadmap-later.md` as a new item with the next number of that roadmap's own prefix (its backlog entry moves with it), mark the old row `carried (to roadmaps/roadmap-later.md <new ID>, #<this issue>)` and tick the entry `— later: #<this issue> → <new ID>`.",
    "",
    "Never re-word the entry in place: the owner has decided, and a changed entry would be shown to them again.",
    "Then regenerate `context/state.json` in the same commit, comment what was done and close this issue. COCKPIT drops the entry from the owner's list once the project's state no longer lists it.",
  ];
}

export function formatOwnerWordIssue({ entry, answer, note, answeredBy, label = ISSUE_LABEL }: OwnerWordIssueInput): NewForgeIssue {
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
  lines.push("", ...getSettleSteps(entry), "", "Sent from COCKPIT.", "", formatOwnerWordMarker({ entry: entry.id, answer }, label));
  return {
    title: `Owner word: ${word}, ${shorten(entry.text, TITLE_TEXT_LIMIT)}`,
    body: lines.join("\n"),
    labels: [label],
  };
}

export interface BroadcastIssueInput {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  /** The sender's stored name (display name or email); null when it is not known. */
  readonly sentBy: string | null;
  /** The label the issue gets: `cockpit` unless the project has only `owner-word`. */
  readonly label?: IssueLabel;
}

/** One broadcast as an owner-word issue: the owner's word to the whole project, quoted, with the broadcast's marker. */
export function formatBroadcastIssue({ id, title, body, sentBy, label = ISSUE_LABEL }: BroadcastIssueInput): NewForgeIssue {
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
    labels: [label],
  };
}
